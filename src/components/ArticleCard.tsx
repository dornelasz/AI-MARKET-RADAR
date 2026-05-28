import Link from "next/link";
import { formatDate, hostFromUrl, timeAgo } from "@/lib/format";
import {
  ArticleTypeBadge,
  Card,
  RelevanceBadge,
  ScorePill,
  StatusBadge,
} from "./ui";
import { Icon } from "./icons";

export interface ArticleCardArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: Date | string | null;
  collectedAt: Date | string;
  rawExcerpt: string | null;
  finalScore: number;
  status: string;
  source?: { name: string } | null;
  analysis?: {
    relevance: string | null;
    articleType: string | null;
    summary?: string | null;
  } | null;
}

export function ArticleCard({ article }: { article: ArticleCardArticle }) {
  const summary = article.analysis?.summary || article.rawExcerpt || "";

  return (
    <Card className="group flex flex-col p-4 transition hover:border-brand-muted/50">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <RelevanceBadge relevance={article.analysis?.relevance} />
        <ArticleTypeBadge type={article.analysis?.articleType} />
        <StatusBadge status={article.status} />
        {article.finalScore > 0 ? <ScorePill score={article.finalScore} /> : null}
      </div>

      <Link
        href={`/articles/${article.id}`}
        className="text-[15px] font-semibold leading-snug text-ink transition group-hover:text-brand"
      >
        {article.title}
      </Link>

      {summary ? (
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{summary}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
        <span className="font-medium text-ink-muted">
          {article.source?.name ?? hostFromUrl(article.url)}
        </span>
        <span aria-hidden>•</span>
        <span title={formatDate(article.publishedAt)}>
          {timeAgo(article.publishedAt ?? article.collectedAt)}
        </span>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-ink-muted transition hover:text-brand"
        >
          Fonte
          <Icon name="external" className="h-3.5 w-3.5" />
        </a>
      </div>
    </Card>
  );
}
