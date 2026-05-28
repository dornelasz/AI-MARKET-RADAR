import "dotenv/config";
import cron from "node-cron";
import { config, isAiConfigured } from "../lib/config";
import { runAllActiveSources } from "../lib/collectors/runner";
import { analyzePending } from "../lib/ai/service";
import { prisma } from "../lib/db";

let running = false;

async function cycle(): Promise<void> {
  if (running) {
    console.log("[worker] ciclo anterior ainda em execução — pulando.");
    return;
  }
  running = true;
  try {
    console.log(`[worker] coletando fontes ativas… (${new Date().toISOString()})`);
    const results = await runAllActiveSources();
    const created = results.reduce((sum, r) => sum + r.created, 0);
    const duplicates = results.reduce((sum, r) => sum + r.duplicates, 0);
    const failed = results.filter((r) => r.status === "FAILED").length;
    console.log(
      `[worker] coleta: ${results.length} fonte(s), ${created} novo(s), ${duplicates} duplicado(s), ${failed} com erro.`,
    );

    if (isAiConfigured()) {
      const analysis = await analyzePending(config.aiBatchSize);
      console.log(
        `[worker] análise: ${analysis.analyzed} analisado(s), ${analysis.failed} falha(s) de ${analysis.attempted}.` +
          (analysis.stoppedBecause
            ? ` Interrompido por ${analysis.stoppedBecause} — ${analysis.skipped} pendente(s); nova tentativa no próximo ciclo.`
            : ""),
      );
    } else {
      console.log(
        "[worker] GEMINI_API_KEY ausente — artigos permanecem pendentes (ok).",
      );
    }
  } catch (err) {
    // A failing cycle must never kill the worker.
    console.error(
      "[worker] erro no ciclo:",
      err instanceof Error ? err.message : err,
    );
  } finally {
    running = false;
  }
}

/** Builds a cron expression that runs roughly every N minutes. */
export function intervalToCron(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) return "*/15 * * * *";
  if (minutes >= 60) {
    const hours = Math.min(23, Math.max(1, Math.floor(minutes / 60)));
    return `0 */${hours} * * *`;
  }
  return `*/${Math.floor(minutes)} * * * *`;
}

async function main(): Promise<void> {
  const minutes = config.fetchIntervalMinutes;
  const expression = intervalToCron(minutes);
  console.log(
    `[worker] AI Market Radar iniciado. Intervalo: ${minutes} min (cron "${expression}").`,
  );

  await cycle();
  cron.schedule(expression, () => {
    void cycle();
  });
}

async function shutdown(): Promise<void> {
  await prisma.$disconnect().catch(() => undefined);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("[worker] falha ao iniciar:", err);
  process.exit(1);
});
