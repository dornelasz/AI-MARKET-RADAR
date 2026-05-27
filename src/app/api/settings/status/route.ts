import { aiStatus, config } from "@/lib/config";
import { prisma } from "@/lib/db";
import { getArticleStatusCounts } from "@/lib/db/queries";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [counts, sourceCount, activeSourceCount, lastLog] = await Promise.all([
      getArticleStatusCounts(),
      prisma.source.count(),
      prisma.source.count({ where: { isActive: true } }),
      prisma.fetchLog.findFirst({
        orderBy: { startedAt: "desc" },
        include: { source: true },
      }),
    ]);

    return jsonOk({
      ai: aiStatus(),
      fetchIntervalMinutes: config.fetchIntervalMinutes,
      aiBatchSize: config.aiBatchSize,
      aiAnalysisDailyLimit: config.aiAnalysisDailyLimit,
      counts,
      sources: { total: sourceCount, active: activeSourceCount },
      lastFetch: lastLog,
    });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao obter status.",
      500,
    );
  }
}
