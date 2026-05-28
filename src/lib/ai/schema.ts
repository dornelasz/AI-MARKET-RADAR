import { z } from "zod";
import { ARTICLE_TYPES, RELEVANCE_LEVELS } from "../types";

function clampScore(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function toStringArray(value: unknown): string[] {
  let raw: unknown[] = [];
  if (Array.isArray(value)) raw = value;
  else if (typeof value === "string" && value.trim()) raw = value.split(/[,;\n]/);
  else return [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const term = String(item ?? "").trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(term);
  }
  return out;
}

function normalizeRelevance(value: unknown): string {
  const s = String(value ?? "").toUpperCase().trim();
  return (RELEVANCE_LEVELS as string[]).includes(s) ? s : "LOW";
}

function normalizeArticleType(value: unknown): string {
  const s = String(value ?? "")
    .toUpperCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  return (ARTICLE_TYPES as string[]).includes(s) ? s : "UNKNOWN";
}

/**
 * Lenient-but-strict schema: it coerces/sanitizes a well-formed object so the
 * model's minor deviations (string instead of array, lowercase enum, out-of-range
 * score) become valid, while anything that is not a JSON object still fails.
 */
export const aiAnalysisSchema = z.object({
  summary: z.preprocess((v) => String(v ?? "").trim(), z.string()),
  impact: z.preprocess((v) => String(v ?? "").trim(), z.string()),
  category: z.preprocess(
    (v) => String(v ?? "").trim() || "unknown",
    z.string(),
  ),
  relevance: z.preprocess(
    normalizeRelevance,
    z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  ),
  relevanceScore: z.preprocess(clampScore, z.number()),
  articleType: z.preprocess(
    normalizeArticleType,
    z.enum([
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
    ]),
  ),
  companies: z.preprocess(toStringArray, z.array(z.string())),
  technologies: z.preprocess(toStringArray, z.array(z.string())),
  keywords: z.preprocess(toStringArray, z.array(z.string())),
  marketSignals: z.preprocess(toStringArray, z.array(z.string())),
  businessOpportunities: z.preprocess(toStringArray, z.array(z.string())),
  riskFlags: z.preprocess(toStringArray, z.array(z.string())),
  confidence: z.preprocess(clampScore, z.number()),
  reasoningShort: z.preprocess(
    (v) => String(v ?? "").trim().slice(0, 500),
    z.string(),
  ),
});
