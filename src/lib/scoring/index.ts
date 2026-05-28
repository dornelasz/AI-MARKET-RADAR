const HIGH_VALUE_TERMS = [
  "gpt",
  "llm",
  "large language model",
  "foundation model",
  "transformer",
  "open source",
  "open-source",
  "release",
  "launch",
  "funding",
  "raises",
  "benchmark",
  "state of the art",
  "sota",
  "multimodal",
  "agent",
  "fine-tune",
  "fine-tuning",
  "inference",
  "training",
  "dataset",
  "model",
  "reasoning",
  "diffusion",
  "rag",
  "embedding",
  "quantization",
  "breakthrough",
  "acquisition",
  "partnership",
  "regulation",
  "alignment",
];

const COMPANY_TERMS = [
  "openai",
  "anthropic",
  "google",
  "deepmind",
  "meta",
  "microsoft",
  "nvidia",
  "mistral",
  "hugging face",
  "huggingface",
  "cohere",
  "stability",
  "xai",
  "apple",
  "amazon",
];

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export interface LocalScoreInput {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  publishedAt?: Date | null;
  now?: Date;
}

/**
 * Heuristic 0-100 score computed without any AI. Used to rank articles
 * before (or instead of) analysis. Pure and deterministic given `now`.
 */
export function computeLocalScore(input: LocalScoreInput): number {
  const title = (input.title ?? "").toLowerCase();
  const body = `${input.excerpt ?? ""} ${input.content ?? ""}`.toLowerCase();

  let score = 20;

  for (const term of HIGH_VALUE_TERMS) {
    if (title.includes(term)) score += 6;
    else if (body.includes(term)) score += 2;
  }

  for (const company of COMPANY_TERMS) {
    if (title.includes(company) || body.includes(company)) score += 4;
  }

  const now = input.now ?? new Date();
  if (input.publishedAt instanceof Date && !Number.isNaN(input.publishedAt.getTime())) {
    const ageHours = (now.getTime() - input.publishedAt.getTime()) / 3_600_000;
    if (ageHours <= 24) score += 18;
    else if (ageHours <= 72) score += 12;
    else if (ageHours <= 168) score += 6;
    else if (ageHours <= 720) score += 2;
  }

  if (body.length > 600) score += 4;
  if (body.length > 2000) score += 4;

  return clamp(Math.round(score), 0, 100);
}

/**
 * Blends the local heuristic score with the AI relevance score.
 * Without an AI score it returns the local score unchanged, so the app
 * still ranks articles meaningfully when Gemini is not configured.
 */
export function computeHybridScore(
  localScore: number,
  aiRelevanceScore?: number | null,
): number {
  const local = clamp(localScore, 0, 100);
  if (aiRelevanceScore === undefined || aiRelevanceScore === null) {
    return local;
  }
  const ai = clamp(aiRelevanceScore, 0, 100);
  return clamp(Math.round(local * 0.35 + ai * 0.65), 0, 100);
}
