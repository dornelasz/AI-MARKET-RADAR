import type { ArticleType, Relevance } from "@prisma/client";
import { prisma } from "../db";
import { config, getGeminiModel, isAiConfigured } from "../config";
import { computeHybridScore } from "../scoring";
import type { AiAnalysisResult } from "../types";
import {
  AiNotConfiguredError,
  callGemini,
  classifyRateLimitError,
  redactSecrets,
  type GeminiLimitKind,
} from "./gemini";
import { recordRateLimit } from "./rateLimitState";
import { buildAnalysisPrompt } from "./prompt";
import { parseAiResponse } from "./parse";

function toAnalysisData(analysis: AiAnalysisResult, aiModel: string) {
  return {
    summary: analysis.summary || null,
    impact: analysis.impact || null,
    category: analysis.category || null,
    relevance: analysis.relevance as Relevance,
    relevanceScore: analysis.relevanceScore,
    articleType: analysis.articleType as ArticleType,
    companies: analysis.companies,
    technologies: analysis.technologies,
    keywords: analysis.keywords,
    marketSignals: analysis.marketSignals,
    businessOpportunities: analysis.businessOpportunities,
    riskFlags: analysis.riskFlags,
    confidence: analysis.confidence,
    reasoningShort: analysis.reasoningShort || null,
    aiModel,
  };
}

export type AnalyzeArticleOutcome =
  | { ok: true; analysis: AiAnalysisResult }
  | {
      ok: false;
      reason: "NOT_CONFIGURED" | "NOT_FOUND" | "ERROR";
      message: string;
    }
  | { ok: false; reason: "RATE_LIMITED"; limit: GeminiLimitKind; message: string };

/**
 * Analyzes a single article with Gemini and persists the result.
 * When AI is not configured it returns a clear message and changes nothing.
 */
export async function analyzeArticleById(
  articleId: string,
): Promise<AnalyzeArticleOutcome> {
  if (!isAiConfigured()) {
    return {
      ok: false,
      reason: "NOT_CONFIGURED",
      message:
        "GEMINI_API_KEY não configurada. A análise por IA está indisponível; o artigo permanece pendente.",
    };
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { source: true },
  });
  if (!article) {
    return { ok: false, reason: "NOT_FOUND", message: "Artigo não encontrado." };
  }

  try {
    const prompt = buildAnalysisPrompt({
      title: article.title,
      sourceName: article.source?.name ?? "",
      url: article.url,
      publishedAt: article.publishedAt,
      excerpt: article.rawExcerpt,
      content: article.rawContent,
    });

    const raw = await callGemini(prompt);
    const analysis = parseAiResponse(raw);
    const aiModel = getGeminiModel();
    const finalScore = computeHybridScore(article.localScore, analysis.relevanceScore);

    await prisma.$transaction([
      prisma.articleAnalysis.upsert({
        where: { articleId: article.id },
        create: { articleId: article.id, ...toAnalysisData(analysis, aiModel) },
        update: toAnalysisData(analysis, aiModel),
      }),
      prisma.article.update({
        where: { id: article.id },
        data: { status: "ANALYZED", finalScore },
      }),
    ]);

    return { ok: true, analysis };
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return {
        ok: false,
        reason: "NOT_CONFIGURED",
        message: "GEMINI_API_KEY não configurada.",
      };
    }
    const limit = classifyRateLimitError(err);
    if (limit) {
      // Transient quota/rate limit: keep the article PENDING for a later retry.
      recordRateLimit(limit);
      return {
        ok: false,
        reason: "RATE_LIMITED",
        limit,
        message: redactSecrets(err instanceof Error ? err.message : String(err)),
      };
    }
    await prisma.article
      .update({ where: { id: article.id }, data: { status: "ANALYSIS_FAILED" } })
      .catch(() => undefined);
    return {
      ok: false,
      reason: "ERROR",
      message: redactSecrets(err instanceof Error ? err.message : String(err)),
    };
  }
}

export interface AnalyzePendingResult {
  configured: boolean;
  attempted: number;
  analyzed: number;
  failed: number;
  skipped: number;
  stoppedBecause: GeminiLimitKind | null;
  message?: string;
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Analyzes a small batch of pending articles, highest-scored first.
 * Respects AI_BATCH_SIZE (per run) and AI_ANALYSIS_DAILY_LIMIT (per UTC day),
 * never re-analyzes ANALYZED articles, and never throws if one article fails.
 */
export async function analyzePending(limit?: number): Promise<AnalyzePendingResult> {
  if (!isAiConfigured()) {
    const pending = await prisma.article.count({
      where: { status: "PENDING_ANALYSIS" },
    });
    return {
      configured: false,
      attempted: 0,
      analyzed: 0,
      failed: 0,
      skipped: pending,
      stoppedBecause: null,
      message: `GEMINI_API_KEY não configurada. ${pending} artigo(s) permanecem pendentes.`,
    };
  }

  const totalPending = await prisma.article.count({
    where: { status: "PENDING_ANALYSIS" },
  });

  // Daily budget (cost protection): count analyses created today.
  const analyzedToday = await prisma.articleAnalysis.count({
    where: { createdAt: { gte: startOfTodayUtc() } },
  });
  const remainingToday = Math.max(0, config.aiAnalysisDailyLimit - analyzedToday);
  if (remainingToday <= 0) {
    return {
      configured: true,
      attempted: 0,
      analyzed: 0,
      failed: 0,
      skipped: totalPending,
      stoppedBecause: null,
      message: `Limite diário de análises atingido (${analyzedToday}/${config.aiAnalysisDailyLimit}).`,
    };
  }

  const batch = limit && limit > 0 ? limit : config.aiBatchSize;
  const take = Math.min(batch, remainingToday);

  const pendingArticles = await prisma.article.findMany({
    where: { status: "PENDING_ANALYSIS" },
    orderBy: [{ finalScore: "desc" }, { collectedAt: "desc" }],
    take,
  });

  let analyzed = 0;
  let failed = 0;
  let stoppedBecause: GeminiLimitKind | null = null;
  for (const article of pendingArticles) {
    const outcome = await analyzeArticleById(article.id);
    if (outcome.ok) {
      analyzed++;
      continue;
    }
    if (outcome.reason === "RATE_LIMITED") {
      // Stop the batch safely; this article stays PENDING for a later retry.
      stoppedBecause = outcome.limit;
      if (config.aiStopOnRateLimit) break;
      continue;
    }
    failed++;
  }

  const attempted = analyzed + failed;
  const skipped = Math.max(0, totalPending - attempted);
  const message = stoppedBecause
    ? `${stoppedBecause === "QUOTA_LIMIT" ? "Quota" : "Rate limit"} da Gemini atingido. ` +
      `${analyzed} analisado(s); ${skipped} artigo(s) seguem pendentes. ` +
      `Tente novamente em ~${config.aiRetryCooldownMinutes} min.`
    : `${analyzed} analisado(s), ${failed} falha(s); ${skipped} pendente(s).`;

  return {
    configured: true,
    attempted,
    analyzed,
    failed,
    skipped,
    stoppedBecause,
    message,
  };
}
