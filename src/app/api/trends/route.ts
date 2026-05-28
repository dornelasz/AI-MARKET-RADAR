import { getTopAnalyzedArticles, getTrends } from "@/lib/db/queries";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [trends, topArticles] = await Promise.all([
      getTrends(),
      getTopAnalyzedArticles(10),
    ]);
    return jsonOk({
      topCompanies: trends.companies,
      topTechnologies: trends.technologies,
      topKeywords: trends.keywords,
      topCategories: trends.categories,
      marketSignals: trends.marketSignals,
      topArticles: topArticles.map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        sourceName: a.source?.name ?? "",
        finalScore: a.finalScore,
        relevance: a.analysis?.relevance ?? null,
      })),
      totalArticles: trends.totalArticles,
    });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao calcular tendências.",
      500,
    );
  }
}
