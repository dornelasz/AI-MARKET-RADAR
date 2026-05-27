import Link from "next/link";
import { listArticles, listSources } from "@/lib/db/queries";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFilters } from "@/components/ArticleFilters";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Number(first(searchParams.page) ?? "1") || 1;
  const filters = {
    q: first(searchParams.q),
    category: first(searchParams.category),
    relevance: first(searchParams.relevance),
    sourceId: first(searchParams.source),
    from: first(searchParams.from),
    to: first(searchParams.to),
    page,
    pageSize: 24,
  };

  const [result, sources] = await Promise.all([
    listArticles(filters),
    listSources(),
  ]);

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      const v = first(value);
      if (v && key !== "page") params.set(key, v);
    }
    params.set("page", String(targetPage));
    return `/articles?${params.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Artigos"
        description={`${result.total} artigo(s) coletado(s) no total.`}
      />

      <div className="mb-5">
        <ArticleFilters
          sources={sources.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon="articles"
          title="Nenhum artigo encontrado"
          description="Ajuste os filtros ou colete novas notícias a partir das suas fontes."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {result.pages > 1 ? (
            <nav className="mt-6 flex items-center justify-center gap-3 text-sm">
              {result.page > 1 ? (
                <Link href={pageHref(result.page - 1)} className="btn-ghost">
                  Anterior
                </Link>
              ) : (
                <span className="btn-ghost pointer-events-none opacity-40">
                  Anterior
                </span>
              )}
              <span className="text-ink-muted">
                Página {result.page} de {result.pages}
              </span>
              {result.page < result.pages ? (
                <Link href={pageHref(result.page + 1)} className="btn-ghost">
                  Próxima
                </Link>
              ) : (
                <span className="btn-ghost pointer-events-none opacity-40">
                  Próxima
                </span>
              )}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
