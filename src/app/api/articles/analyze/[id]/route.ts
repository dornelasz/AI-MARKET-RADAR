import { NextResponse } from "next/server";
import { analyzeArticleById } from "@/lib/ai";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const outcome = await analyzeArticleById(params.id);

  if (outcome.ok) {
    return NextResponse.json(outcome, { status: 200 });
  }
  if (outcome.reason === "NOT_FOUND") {
    return jsonError(outcome.message, 404, { reason: outcome.reason });
  }
  // NOT_CONFIGURED is an expected, non-error state (missing key). ERROR is a failure.
  return NextResponse.json(outcome, {
    status: outcome.reason === "NOT_CONFIGURED" ? 200 : 502,
  });
}
