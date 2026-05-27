import { generateAndSaveDigest } from "@/lib/digest";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { saved } = await generateAndSaveDigest();
    return jsonOk({ digest: saved });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao gerar digest.",
      500,
    );
  }
}
