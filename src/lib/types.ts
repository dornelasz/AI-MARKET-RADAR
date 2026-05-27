export type RelevanceLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ArticleTypeValue =
  | "NEWS"
  | "LAUNCH"
  | "RESEARCH"
  | "TOOL"
  | "FUNDING"
  | "REGULATION"
  | "PRODUCT_UPDATE"
  | "TREND"
  | "OPINION"
  | "UNKNOWN";

export const RELEVANCE_LEVELS: RelevanceLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const ARTICLE_TYPES: ArticleTypeValue[] = [
  "NEWS",
  "LAUNCH",
  "RESEARCH",
  "TOOL",
  "FUNDING",
  "REGULATION",
  "PRODUCT_UPDATE",
  "TREND",
  "OPINION",
  "UNKNOWN",
];

/** Universal shape every collector must return. */
export interface CollectedArticle {
  title: string;
  url: string;
  publishedAt: Date | null;
  excerpt: string;
  content: string;
  sourceName: string;
  author?: string | null;
}

/** Strict shape the AI must respond with (post-validation). */
export interface AiAnalysisResult {
  summary: string;
  impact: string;
  category: string;
  relevance: RelevanceLevel;
  relevanceScore: number;
  articleType: ArticleTypeValue;
  companies: string[];
  technologies: string[];
  keywords: string[];
  marketSignals: string[];
  businessOpportunities: string[];
  riskFlags: string[];
  confidence: number;
  reasoningShort: string;
}
