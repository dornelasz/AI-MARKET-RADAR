import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJson, zodErrorResponse } from "@/lib/http";
import { updateSourceSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await readJson(req);
    const data = updateSourceSchema.parse(body);
    const source = await prisma.source.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.fetchIntervalMinutes !== undefined
          ? { fetchIntervalMinutes: data.fetchIntervalMinutes }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
    return jsonOk(source);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return jsonError("Fonte não encontrada.", 404);
    }
    return jsonError(
      err instanceof Error ? err.message : "Erro ao atualizar fonte.",
      500,
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.source.delete({ where: { id: params.id } });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return jsonError("Fonte não encontrada.", 404);
    }
    return jsonError(
      err instanceof Error ? err.message : "Erro ao remover fonte.",
      500,
    );
  }
}
