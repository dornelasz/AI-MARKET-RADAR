import "dotenv/config";
import { analyzePending } from "../lib/ai/service";
import { isAiConfigured } from "../lib/config";
import { prisma } from "../lib/db";

async function main(): Promise<void> {
  if (!isAiConfigured()) {
    console.log(
      "[analyze] GEMINI_API_KEY não configurada. Nada a fazer — artigos permanecem pendentes.",
    );
    return;
  }

  const limitArg = Number(process.argv[2]);
  const limit =
    Number.isFinite(limitArg) && limitArg > 0 ? Math.floor(limitArg) : undefined;

  const result = await analyzePending(limit);
  console.log(
    `[analyze] ${result.analyzed} analisado(s), ${result.failed} falha(s) de ${result.attempted} tentativa(s).`,
  );
}

main()
  .catch((err) => {
    console.error("[analyze] erro:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
