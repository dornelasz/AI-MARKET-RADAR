import type { Source } from "@prisma/client";
import { prisma } from "../db";
import { collectFromSource, type CollectableSource } from "./index";
import {
  buildArticleKey,
  createDedupIndex,
  isDuplicate,
  addToIndex,
} from "../dedup";
import { computeLocalScore, computeHybridScore } from "../scoring";

export interface FetchRunResult {
  sourceId: string;
  sourceName: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  found: number;
  created: number;
  duplicates: number;
  error?: string;
}

/**
 * Collects one source, deduplicates against the DB, persists new articles,
 * and records a FetchLog. Catches all collection errors so a single failing
 * source is logged but never throws out of the pipeline.
 */
export async function runSourceFetch(source: Source): Promise<FetchRunResult> {
  const startedAt = new Date();
  let found = 0;
  let created = 0;
  let duplicates = 0;
  let status: FetchRunResult["status"] = "SUCCESS";
  let errorMessage: string | undefined;

  try {
    const collected = await collectFromSource({
      url: source.url,
      type: source.type as CollectableSource["type"],
      name: source.name,
    });
    found = collected.length;

    const keys = collected.map((article) => buildArticleKey(article));
    const canonicalUrls = keys.map((key) => key.canonicalUrl);
    const hashes = keys.map((key) => key.contentHash);

    const existing = canonicalUrls.length
      ? await prisma.article.findMany({
          where: {
            OR: [
              { canonicalUrl: { in: canonicalUrls } },
              { contentHash: { in: hashes } },
            ],
          },
          select: { canonicalUrl: true, contentHash: true },
        })
      : [];
    const index = createDedupIndex(existing);

    for (let i = 0; i < collected.length; i++) {
      const article = collected[i];
      const key = keys[i];

      if (isDuplicate(key, index)) {
        duplicates++;
        continue;
      }

      const localScore = computeLocalScore({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        publishedAt: article.publishedAt,
      });

      try {
        await prisma.article.create({
          data: {
            sourceId: source.id,
            title: article.title.slice(0, 500),
            url: article.url,
            canonicalUrl: key.canonicalUrl,
            contentHash: key.contentHash,
            author: article.author ?? null,
            publishedAt: article.publishedAt,
            rawExcerpt: article.excerpt || null,
            rawContent: article.content || null,
            localScore,
            finalScore: computeHybridScore(localScore, null),
            status: "PENDING_ANALYSIS",
          },
        });
        created++;
        addToIndex(key, index);
      } catch (err) {
        // Unique-constraint race => treat as duplicate, never crash.
        if (
          err &&
          typeof err === "object" &&
          (err as { code?: string }).code === "P2002"
        ) {
          duplicates++;
          addToIndex(key, index);
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    status = "FAILED";
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  const finishedAt = new Date();
  try {
    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: finishedAt,
        lastError: status === "FAILED" ? (errorMessage ?? "unknown error").slice(0, 1000) : null,
      },
    });
    await prisma.fetchLog.create({
      data: {
        sourceId: source.id,
        status,
        message: errorMessage ? errorMessage.slice(0, 1000) : null,
        startedAt,
        finishedAt,
        articlesFound: found,
        articlesCreated: created,
        duplicatesFound: duplicates,
      },
    });
  } catch {
    // Logging must never break a fetch run.
  }

  return {
    sourceId: source.id,
    sourceName: source.name,
    status,
    found,
    created,
    duplicates,
    error: errorMessage,
  };
}

export async function runSourceFetchById(sourceId: string): Promise<FetchRunResult> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) {
    return {
      sourceId,
      sourceName: "(unknown)",
      status: "FAILED",
      found: 0,
      created: 0,
      duplicates: 0,
      error: "Source not found",
    };
  }
  return runSourceFetch(source);
}

/** Runs every active source sequentially; one failure never stops the rest. */
export async function runAllActiveSources(): Promise<FetchRunResult[]> {
  const sources = await prisma.source.findMany({ where: { isActive: true } });
  const results: FetchRunResult[] = [];
  for (const source of sources) {
    const result = await runSourceFetch(source).catch(
      (err): FetchRunResult => ({
        sourceId: source.id,
        sourceName: source.name,
        status: "FAILED",
        found: 0,
        created: 0,
        duplicates: 0,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    results.push(result);
  }
  return results;
}
