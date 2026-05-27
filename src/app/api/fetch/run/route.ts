import { runAllActiveSources } from "@/lib/collectors/runner";
import { jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const results = await runAllActiveSources();
  const totals = results.reduce(
    (acc, r) => {
      acc.found += r.found;
      acc.created += r.created;
      acc.duplicates += r.duplicates;
      if (r.status === "FAILED") acc.failedSources += 1;
      return acc;
    },
    { found: 0, created: 0, duplicates: 0, failedSources: 0 },
  );
  return jsonOk({ totals, results });
}
