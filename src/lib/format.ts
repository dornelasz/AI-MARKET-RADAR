import type { ArticleTypeValue, RelevanceLevel } from "./types";

export function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} d`;
  return formatDate(d);
}

export const RELEVANCE_LABELS: Record<RelevanceLevel, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const ARTICLE_TYPE_LABELS: Record<ArticleTypeValue, string> = {
  NEWS: "Notícia",
  LAUNCH: "Lançamento",
  RESEARCH: "Pesquisa",
  TOOL: "Ferramenta",
  FUNDING: "Investimento",
  REGULATION: "Regulação",
  PRODUCT_UPDATE: "Atualização",
  TREND: "Tendência",
  OPINION: "Opinião",
  UNKNOWN: "Indefinido",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING_ANALYSIS: "Pendente de análise",
  ANALYZED: "Analisado",
  ANALYSIS_FAILED: "Falha na análise",
  SKIPPED_NO_AI_KEY: "Sem chave de IA",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  RSS: "RSS",
  ATOM: "Atom",
  BLOG: "Blog",
  GITHUB_RELEASES: "GitHub Releases",
  ARXIV: "arXiv",
  WEBPAGE: "Página web",
  OTHER: "Outro",
};

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
