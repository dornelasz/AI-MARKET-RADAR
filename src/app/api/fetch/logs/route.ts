import { listFetchLogs } from "@/lib/db/queries";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
  try {
    return jsonOk(await listFetchLogs(Number.isFinite(limit) ? limit : 50));
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao listar logs.",
      500,
    );
  }
}
