import { listArticles } from "@/lib/db/queries";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  try {
    const result = await listArticles({
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      relevance: searchParams.get("relevance") ?? undefined,
      sourceId: searchParams.get("source") ?? searchParams.get("sourceId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      pageSize: searchParams.get("pageSize")
        ? Number(searchParams.get("pageSize"))
        : undefined,
    });
    return jsonOk(result);
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao listar artigos.",
      500,
    );
  }
}
