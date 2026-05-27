import { getTodayDigest } from "@/lib/digest";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const digest = await getTodayDigest();
    return jsonOk({ digest });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao buscar digest.",
      500,
    );
  }
}
