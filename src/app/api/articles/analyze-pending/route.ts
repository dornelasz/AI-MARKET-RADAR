import { analyzePending } from "@/lib/ai";
import { jsonOk, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson<{ limit?: number }>(req);
  const limit =
    typeof body.limit === "number" && body.limit > 0 ? body.limit : undefined;
  const result = await analyzePending(limit);
  return jsonOk(result);
}
