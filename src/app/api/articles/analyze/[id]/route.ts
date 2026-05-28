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
  if (outcome.reason === "RATE_LIMITED") {
    // Transient: the article stays PENDING; signal a retryable status.
    return NextResponse.json(outcome, { status: 429 });
  }
  // NOT_CONFIGURED is an expected, non-error state (missing key). ERROR is a failure.
  return NextResponse.json(outcome, {
    status: outcome.reason === "NOT_CONFIGURED" ? 200 : 502,
  });
}
