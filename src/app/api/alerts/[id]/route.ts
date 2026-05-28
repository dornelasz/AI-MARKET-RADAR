import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJson, zodErrorResponse } from "@/lib/http";
import { updateAlertSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await readJson(req);
    const data = updateAlertSchema.parse(body);
    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.keyword !== undefined ? { keyword: data.keyword } : {}),
        ...(data.company !== undefined ? { company: data.company } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.minRelevance !== undefined ? { minRelevance: data.minRelevance } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return jsonOk(alert);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return jsonError("Alerta não encontrado.", 404);
    }
    return jsonError(
      err instanceof Error ? err.message : "Erro ao atualizar alerta.",
      500,
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.alert.delete({ where: { id: params.id } });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return jsonError("Alerta não encontrado.", 404);
    }
    return jsonError(
      err instanceof Error ? err.message : "Erro ao remover alerta.",
      500,
    );
  }
}
