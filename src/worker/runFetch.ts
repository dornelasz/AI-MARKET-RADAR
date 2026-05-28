import "dotenv/config";
import { runAllActiveSources } from "../lib/collectors/runner";
import { prisma } from "../lib/db";

async function main(): Promise<void> {
  console.log("[fetch] coletando todas as fontes ativas…");
  const results = await runAllActiveSources();

  for (const r of results) {
    const detail =
      r.status === "FAILED"
        ? `ERRO: ${r.error ?? "desconhecido"}`
        : `${r.created} novo(s), ${r.duplicates} duplicado(s) (de ${r.found})`;
    console.log(` - ${r.sourceName}: ${detail}`);
  }

  const created = results.reduce((sum, r) => sum + r.created, 0);
  const failed = results.filter((r) => r.status === "FAILED").length;
  console.log(
    `[fetch] concluído: ${results.length} fonte(s), ${created} artigo(s) novo(s), ${failed} com erro.`,
  );
}

main()
  .catch((err) => {
    console.error("[fetch] erro:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
