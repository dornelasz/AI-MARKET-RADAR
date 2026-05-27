import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { computeTrends, type TrendsResult } from "../trends";

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export interface DigestTopArticle {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  finalScore: number;
  relevance: string | null;
  publishedAt: string | null;
}

export interface GeneratedDigest {
  date: Date;
  title: string;
  summary: string;
  topArticles: DigestTopArticle[];
  trends: TrendsResult;
  companies: TrendsResult["companies"];
  technologies: TrendsResult["technologies"];
  businessOpportunities: string[];
}

/** Builds a digest strictly from articles stored for the given day. No invented data. */
export async function buildDigestForDate(forDate = new Date()): Promise<GeneratedDigest> {
  const dayStart = startOfUtcDay(forDate);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { publishedAt: { gte: dayStart, lt: dayEnd } },
        { publishedAt: null, collectedAt: { gte: dayStart, lt: dayEnd } },
      ],
    },
    include: { source: true, analysis: true },
    orderBy: { finalScore: "desc" },
    take: 100,
  });

  const trendInputs = articles
    .filter((article) => article.analysis)
    .map((article) => ({
      publishedAt: article.publishedAt,
      collectedAt: article.collectedAt,
      relevanceScore: article.analysis?.relevanceScore ?? null,
      companies: article.analysis?.companies ?? [],
      technologies: article.analysis?.technologies ?? [],
      keywords: article.analysis?.keywords ?? [],
    }));

  const trends = computeTrends(trendInputs);

  const topArticles: DigestTopArticle[] = articles.slice(0, 10).map((article) => ({
    id: article.id,
    title: article.title,
    url: article.url,
    sourceName: article.source?.name ?? "",
    finalScore: article.finalScore,
    relevance: article.analysis?.relevance ?? null,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
  }));

  const opportunities = new Set<string>();
  for (const article of articles) {
    for (const opp of article.analysis?.businessOpportunities ?? []) {
      const value = opp.trim();
      if (value) opportunities.add(value);
    }
  }

  const dateLabel = dayStart.toISOString().slice(0, 10);
  const analyzedCount = trendInputs.length;
  const title = `AI Market Radar — Resumo de ${dateLabel}`;
  const summary =
    articles.length === 0
      ? `Nenhum artigo coletado em ${dateLabel}.`
      : [
          `${articles.length} artigo(s) no período, ${analyzedCount} analisado(s) por IA.`,
          trends.companies[0] ? `Empresa em destaque: ${trends.companies[0].term}.` : "",
          trends.technologies[0] ? `Tecnologia em destaque: ${trends.technologies[0].term}.` : "",
        ]
          .filter(Boolean)
          .join(" ");

  return {
    date: dayStart,
    title,
    summary,
    topArticles,
    trends,
    companies: trends.companies,
    technologies: trends.technologies,
    businessOpportunities: [...opportunities].slice(0, 12),
  };
}

/** Generates and persists the digest for a day (idempotent per date). */
export async function generateAndSaveDigest(forDate = new Date()) {
  const digest = await buildDigestForDate(forDate);
  const payload = {
    title: digest.title,
    summary: digest.summary,
    topArticles: digest.topArticles as unknown as Prisma.InputJsonValue,
    trends: digest.trends as unknown as Prisma.InputJsonValue,
    companies: digest.companies as unknown as Prisma.InputJsonValue,
    technologies: digest.technologies as unknown as Prisma.InputJsonValue,
  };

  const saved = await prisma.dailyDigest.upsert({
    where: { date: digest.date },
    create: { date: digest.date, ...payload },
    update: payload,
  });

  return { digest, saved };
}

export async function getTodayDigest() {
  return prisma.dailyDigest.findUnique({ where: { date: startOfUtcDay(new Date()) } });
}
