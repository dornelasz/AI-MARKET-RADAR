import { getDashboardData } from "@/lib/db/queries";
import { isAiConfigured } from "@/lib/config";
import { timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState, SectionHeading, StatCard } from "@/components/ui";
import { ArticleCard } from "@/components/ArticleCard";
import { TrendList } from "@/components/TrendList";
import { GeminiWarning } from "@/components/GeminiWarning";
import { CollectNowButton } from "@/components/CollectNowButton";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const aiOk = isAiConfigured();
  const { statusCounts, lastLog } = data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do mercado de IA em tempo real."
        actions={<CollectNowButton />}
      />

      {!aiOk ? <GeminiWarning className="mb-6" /> : null}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total de artigos"
          value={statusCounts.total}
          icon="articles"
          tone="blue"
        />
        <StatCard
          label="Pendentes de análise"
          value={statusCounts.PENDING_ANALYSIS}
          icon="clock"
          tone="amber"
        />
        <StatCard
          label="Analisados"
          value={statusCounts.ANALYZED}
          icon="sparkles"
          tone="green"
        />
        <StatCard
          label="Fontes ativas"
          value={`${data.activeSourceCount}/${data.sourceCount}`}
          icon="sources"
          tone="violet"
        />
      </div>

      <Card className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-ink-muted">
          <Icon name="clock" className="h-4 w-4 text-ink-faint" />
          Última coleta:
        </span>
        {lastLog ? (
          <span className="text-ink">
            {timeAgo(lastLog.startedAt)} · {lastLog.source?.name ?? "—"} ·{" "}
            <span className="text-ink-muted">
              {lastLog.articlesCreated} novo(s), {lastLog.duplicatesFound} duplicado(s)
            </span>{" "}
            ·{" "}
            <span
              className={
                lastLog.status === "FAILED" ? "text-accent-red" : "text-accent-green"
              }
            >
              {lastLog.status}
            </span>
          </span>
        ) : (
          <span className="text-ink-faint">nenhuma coleta ainda</span>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section>
            <SectionHeading
              title="Principais notícias"
              hint="Ordenadas pelo score (heurística + IA quando disponível)."
            />
            {data.topArticles.length === 0 ? (
              <EmptyState
                title="Nenhum artigo ainda"
                description="Cadastre fontes e clique em “Coletar agora” para buscar notícias reais."
                action={<CollectNowButton />}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.topArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>

          {data.recentArticles.length > 0 ? (
            <section>
              <SectionHeading title="Coletados recentemente" />
              <div className="grid gap-3 sm:grid-cols-2">
                {data.recentArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card className="p-4">
            <SectionHeading title="Empresas mais citadas" />
            <TrendList
              items={data.trends.companies}
              accent="violet"
              emptyLabel="Sem análises de IA ainda."
            />
          </Card>
          <Card className="p-4">
            <SectionHeading title="Tecnologias mais citadas" />
            <TrendList
              items={data.trends.technologies}
              accent="brand"
              emptyLabel="Sem análises de IA ainda."
            />
          </Card>
          <Card className="p-4">
            <SectionHeading title="Tendências em alta" />
            <TrendList
              items={data.trends.keywords}
              accent="green"
              emptyLabel="Sem análises de IA ainda."
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
