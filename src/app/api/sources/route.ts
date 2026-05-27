import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { listSources } from "@/lib/db/queries";
import { jsonError, jsonOk, readJson, zodErrorResponse } from "@/lib/http";
import { createSourceSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await listSources());
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao listar fontes.",
      500,
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const data = createSourceSchema.parse(body);
    const source = await prisma.source.create({
      data: {
        name: data.name,
        url: data.url,
        type: data.type,
        category: data.category ?? null,
        isActive: data.isActive ?? true,
        fetchIntervalMinutes: data.fetchIntervalMinutes ?? 15,
        notes: data.notes ?? null,
      },
    });
    return jsonOk(source, 201);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    return jsonError(
      err instanceof Error ? err.message : "Erro ao criar fonte.",
      500,
    );
  }
}
