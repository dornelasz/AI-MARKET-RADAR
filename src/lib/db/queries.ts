import { Prisma, type ArticleStatus, type Relevance } from "@prisma/client";
import { prisma } from "./index";
import { computeTrends } from "../trends";
import { RELEVANCE_LEVELS } from "../types";

export interface ArticleFilters {
  q?: string;
  category?: string;
  relevance?: string;
  sourceId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function buildArticleWhere(filters: ArticleFilters): Prisma.ArticleWhereInput {
  const and: Prisma.ArticleWhereInput[] = [];

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { rawExcerpt: { contains: q, mode: "insensitive" } },
        { rawContent: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (filters.sourceId) and.push({ sourceId: filters.sourceId });

  if (filters.relevance && (RELEVANCE_LEVELS as string[]).includes(filters.relevance)) {
    and.push({ analysis: { is: { relevance: filters.relevance as Relevance } } });
  }

  if (filters.category && filters.category.trim()) {
    and.push({
      analysis: { is: { category: { contains: filters.category.trim(), mode: "insensitive" } } },
    });
  }

  const publishedAt: Prisma.DateTimeNullableFilter = {};
  if (filters.from) {
    const d = new Date(filters.from);
    if (!Number.isNaN(d.getTime())) publishedAt.gte = d;
  }
  if (filters.to) {
    const d = new Date(filters.to);
    if (!Number.isNaN(d.getTime())) publishedAt.lte = d;
  }
  if (publishedAt.gte || publishedAt.lte) and.push({ publishedAt });

  return and.length ? { AND: and } : {};
}

export async function listArticles(filters: ArticleFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const where = buildArticleWhere(filters);

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { source: true, analysis: true },
      orderBy: [{ finalScore: "desc" }, { collectedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getArticle(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: { source: true, analysis: true },
  });
}

export type ArticleStatusCounts = Record<ArticleStatus, number> & { total: number };

export async function getArticleStatusCounts(): Promise<ArticleStatusCounts> {
  const grouped = await prisma.article.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: ArticleStatusCounts = {
    PENDING_ANALYSIS: 0,
    ANALYZED: 0,
    ANALYSIS_FAILED: 0,
    SKIPPED_NO_AI_KEY: 0,
    total: 0,
  };
  for (const row of grouped) {
    counts[row.status] = row._count._all;
    counts.total += row._count._all;
  }
  return counts;
}

export async function getTrends(limitArticles = 300) {
  const analyses = await prisma.articleAnalysis.findMany({
    take: limitArticles,
    orderBy: { createdAt: "desc" },
  });
  return computeTrends(
    analyses.map((a) => ({
      companies: a.companies,
      technologies: a.technologies,
      keywords: a.keywords,
      category: a.category,
      marketSignals: a.marketSignals,
      relevanceScore: a.relevanceScore,
    })),
  );
}

export async function getTopAnalyzedArticles(limit = 10) {
  return prisma.article.findMany({
    where: { status: "ANALYZED" },
    include: { source: true, analysis: true },
    orderBy: { finalScore: "desc" },
    take: Math.min(50, Math.max(1, limit)),
  });
}

export async function getDashboardData() {
  const [
    statusCounts,
    topArticles,
    recentArticles,
    lastLog,
    sourceCount,
    activeSourceCount,
    trends,
  ] = await Promise.all([
    getArticleStatusCounts(),
    prisma.article.findMany({
      where: { finalScore: { gt: 0 } },
      include: { source: true, analysis: true },
      orderBy: { finalScore: "desc" },
      take: 6,
    }),
    prisma.article.findMany({
      include: { source: true, analysis: true },
      orderBy: { collectedAt: "desc" },
      take: 6,
    }),
    prisma.fetchLog.findFirst({
      orderBy: { startedAt: "desc" },
      include: { source: true },
    }),
    prisma.source.count(),
    prisma.source.count({ where: { isActive: true } }),
    getTrends(200),
  ]);

  return {
    statusCounts,
    topArticles,
    recentArticles,
    lastLog,
    sourceCount,
    activeSourceCount,
    trends,
  };
}

export async function listSources() {
  return prisma.source.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
  });
}

export async function listFetchLogs(limit = 50) {
  return prisma.fetchLog.findMany({
    orderBy: { startedAt: "desc" },
    take: Math.min(200, Math.max(1, limit)),
    include: { source: true },
  });
}

export async function listAlerts() {
  return prisma.alert.findMany({ orderBy: { createdAt: "desc" } });
}
