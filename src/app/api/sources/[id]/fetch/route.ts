import { runSourceFetchById } from "@/lib/collectors/runner";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const result = await runSourceFetchById(params.id);
  if (result.status === "FAILED" && result.error === "Source not found") {
    return jsonError("Fonte não encontrada.", 404);
  }
  return jsonOk(result);
}
