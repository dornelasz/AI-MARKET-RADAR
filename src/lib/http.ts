import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...(extra ?? {}) }, { status });
}

/** Reads a JSON body, returning {} for empty/invalid bodies instead of throwing. */
export async function readJson<T = Record<string, unknown>>(
  req: Request,
): Promise<T> {
  try {
    const text = await req.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export function zodErrorResponse(err: ZodError) {
  return jsonError("Dados inválidos.", 422, {
    issues: err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}
