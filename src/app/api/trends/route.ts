import { getTrends } from "@/lib/db/queries";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trends = await getTrends();
    return jsonOk(trends);
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao calcular tendências.",
      500,
    );
  }
}
