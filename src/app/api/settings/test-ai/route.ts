import { testGemini } from "@/lib/ai";
import { jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await testGemini();
  return jsonOk(result);
}
