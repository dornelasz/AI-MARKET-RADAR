import Link from "next/link";
import { getTodayDigest } from "@/lib/digest";
import type { DigestTopArticle } from "@/lib/digest";
import type { TermCount } from "@/lib/trends";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState, ScorePill, SectionHeading } from "@/components/ui";
import { TrendList } from "@/components/TrendList";
import { GenerateDigestButton } from "@/components/GenerateDigestButton";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DigestPage() {
  const digest = await getTodayDigest();

  if (!digest) {
    return (
      <div>
        <PageHeader
          title="Digest diário"
          description="Resumo das principais notícias, tendências e oportunidades do dia."
          actions={<GenerateDigestButton />}
        />
        <EmptyState
          icon="digest"
          title="Nenhum digest gerado hoje"
          description="Gere o resumo do dia a partir dos artigos já coletados no banco."
          action={<GenerateDigestButton />}
        />
      </div>
    );
  }

  const topArticles =
    (digest.topArticles as unknown as DigestTopArticle[] | null) ?? [];
  const trendsData =
    (digest.trends as unknown as {
      keywords?: TermCount[];
      businessOpportunities?: string[];
    } | null) ?? {};
  const companies = (digest.companies as unknown as TermCount[] | null) ?? [];
  const technologies =
    (digest.technologies as unknown as TermCount[] | null) ?? [];
  const keywords = trendsData.keywords ?? [];
  const opportunities = trendsData.businessOpportunities ?? [];

  return (
    <div>
      <PageHeader
        title={digest.title}
        description={`Gerado para ${formatDate(digest.date)}.`}
        actions={<GenerateDigestButton label="Regerar digest" />}
      />

      <Card className="mb-5 p-5">
        <p className="text-sm leading-relaxed text-ink-muted">{digest.summary}</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section>
            <SectionHeading title="Top notícias do dia" />
            {topArticles.length === 0 ? (
              <p className="text-sm text-ink-faint">Nenhum artigo no período.</p>
            ) : (
              <div className="space-y-2">
                {topArticles.map((article, index) => (
                  <Card
                    key={article.id}
                    className="flex items-center gap-3 p-3"
                  >
                    <span className="text-sm font-semibold tabular-nums text-ink-faint">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/articles/${article.id}`}
                        className="block truncate text-sm font-medium text-ink hover:text-brand"
                      >
                        {article.title}
                      </Link>
                      <span className="text-xs text-ink-faint">
                        {article.sourceName}
                      </span>
                    </div>
                    {article.finalScore > 0 ? (
                      <ScorePill score={article.finalScore} />
                    ) : null}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted transition hover:text-brand"
                      aria-label="Abrir fonte original"
                    >
                      <Icon name="external" className="h-4 w-4" />
                    </a>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeading title="Oportunidades de negócio" />
            {opportunities.length === 0 ? (
              <p className="text-sm text-ink-faint">
                Nenhuma oportunidade identificada (requer análise por IA).
              </p>
            ) : (
              <Card className="p-4">
                <ul className="space-y-2">
                  {opportunities.map((opp, index) => (
                    <li
                      key={index}
                      className="flex gap-2 text-sm text-ink-muted"
                    >
                      <Icon
                        name="sparkles"
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent-green"
                      />
                      {opp}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <Card className="p-4">
            <SectionHeading title="Empresas mais citadas" />
            <TrendList items={companies} accent="violet" />
          </Card>
          <Card className="p-4">
            <SectionHeading title="Tecnologias mais citadas" />
            <TrendList items={technologies} accent="brand" />
          </Card>
          <Card className="p-4">
            <SectionHeading title="Principais tendências" />
            <TrendList items={keywords} accent="green" />
          </Card>
        </aside>
      </div>
    </div>
  );
}
