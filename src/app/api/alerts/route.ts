import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { listAlerts } from "@/lib/db/queries";
import { jsonError, jsonOk, readJson, zodErrorResponse } from "@/lib/http";
import { createAlertSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await listAlerts());
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Erro ao listar alertas.",
      500,
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const data = createAlertSchema.parse(body);
    const alert = await prisma.alert.create({
      data: {
        name: data.name,
        keyword: data.keyword ?? null,
        company: data.company ?? null,
        category: data.category ?? null,
        minRelevance: data.minRelevance ?? null,
        isActive: data.isActive ?? true,
      },
    });
    return jsonOk(alert, 201);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    return jsonError(
      err instanceof Error ? err.message : "Erro ao criar alerta.",
      500,
    );
  }
}
