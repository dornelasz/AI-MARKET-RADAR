import { getArticle } from "@/lib/db/queries";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const article = await getArticle(params.id);
    if (!article) return jsonError("Artigo não encontrado.", 404);
    return jsonOk(article);
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao buscar artigo.",
      500,
    );
  }
}
