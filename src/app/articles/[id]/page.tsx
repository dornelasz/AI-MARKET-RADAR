import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/db/queries";
import { isAiConfigured } from "@/lib/config";
import {
  formatDate,
  formatDateTime,
  hostFromUrl,
} from "@/lib/format";
import {
  ArticleTypeBadge,
  Badge,
  Card,
  RelevanceBadge,
  ScorePill,
  StatusBadge,
} from "@/components/ui";
import { AnalyzeArticleButton } from "@/components/AnalyzeArticleButton";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

function TagSection({
  title,
  items,
  tone = "blue",
}: {
  title: string;
  items: string[];
  tone?: "blue" | "violet" | "green" | "amber" | "red" | "gray";
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <Badge key={`${item}-${index}`} tone={tone}>
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line/60 py-2 last:border-0">
      <span className="text-xs text-ink-faint">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const article = await getArticle(params.id);
  if (!article) notFound();

  const analysis = article.analysis;

  return (
    <div>
      <Link
        href="/articles"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
      >
        <span aria-hidden>←</span> Voltar para artigos
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <RelevanceBadge relevance={analysis?.relevance} />
              <ArticleTypeBadge type={analysis?.articleType} />
              <StatusBadge status={article.status} />
              {article.finalScore > 0 ? (
                <ScorePill score={article.finalScore} />
              ) : null}
            </div>
            <h1 className="text-xl font-semibold leading-tight text-ink sm:text-2xl">
              {article.title}
            </h1>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
            >
              <Icon name="external" className="h-4 w-4" />
              {hostFromUrl(article.url)}
            </a>
          </div>

          {analysis ? (
            <Card className="space-y-5 p-5">
              {analysis.summary ? (
                <div>
                  <h2 className="mb-1.5 text-sm font-semibold text-ink">
                    Resumo da IA
                  </h2>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {analysis.summary}
                  </p>
                </div>
              ) : null}

              {analysis.impact ? (
                <div>
                  <h2 className="mb-1.5 text-sm font-semibold text-ink">Impacto</h2>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {analysis.impact}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <TagSection title="Empresas" items={analysis.companies} tone="violet" />
                <TagSection
                  title="Tecnologias"
                  items={analysis.technologies}
                  tone="blue"
                />
                <TagSection
                  title="Palavras-chave"
                  items={analysis.keywords}
                  tone="gray"
                />
                <TagSection
                  title="Sinais de mercado"
                  items={analysis.marketSignals}
                  tone="green"
                />
                <TagSection
                  title="Oportunidades"
                  items={analysis.businessOpportunities}
                  tone="green"
                />
                <TagSection
                  title="Riscos"
                  items={analysis.riskFlags}
                  tone="red"
                />
              </div>

              {analysis.reasoningShort ? (
                <div className="rounded-lg border border-line bg-bg-base/50 p-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Justificativa
                  </h3>
                  <p className="text-sm text-ink-muted">{analysis.reasoningShort}</p>
                </div>
              ) : null}

              <p className="text-xs text-ink-faint">
                Análise por {analysis.aiModel ?? "IA"} · confiança {analysis.confidence}%
              </p>
            </Card>
          ) : (
            <Card className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <Icon name="clock" className="mt-0.5 h-5 w-5 text-accent-amber" />
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    Pendente de análise
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {isAiConfigured()
                      ? "Este artigo ainda não foi analisado pela IA."
                      : "GEMINI_API_KEY não configurada. Configure a IA para gerar resumo, impacto e classificação."}
                  </p>
                </div>
              </div>
              <AnalyzeArticleButton articleId={article.id} />
            </Card>
          )}

          {article.rawExcerpt || article.rawContent ? (
            <Card className="p-5">
              <h2 className="mb-1.5 text-sm font-semibold text-ink">
                Trecho coletado
              </h2>
              <p className="text-sm leading-relaxed text-ink-muted">
                {article.rawExcerpt || article.rawContent?.slice(0, 1200)}
              </p>
            </Card>
          ) : null}
        </div>

        <aside>
          <Card className="p-5">
            <h2 className="mb-2 text-sm font-semibold text-ink">Detalhes</h2>
            <MetaRow label="Fonte" value={article.source?.name ?? "—"} />
            <MetaRow
              label="Categoria"
              value={analysis?.category ?? "—"}
            />
            <MetaRow
              label="Publicado em"
              value={formatDate(article.publishedAt)}
            />
            <MetaRow
              label="Coletado em"
              value={formatDateTime(article.collectedAt)}
            />
            <MetaRow
              label="Score local"
              value={Math.round(article.localScore)}
            />
            <MetaRow
              label="Score final"
              value={Math.round(article.finalScore)}
            />
            <MetaRow
              label="URL original"
              value={
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-brand hover:underline"
                >
                  {article.url}
                </a>
              }
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
