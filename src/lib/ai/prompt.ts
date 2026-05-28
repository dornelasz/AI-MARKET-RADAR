export interface AnalysisPromptInput {
  title: string;
  sourceName: string;
  url: string;
  publishedAt?: Date | null;
  excerpt?: string | null;
  content?: string | null;
}

/** Builds a strict, JSON-only analysis prompt grounded ONLY in the collected content. */
export function buildAnalysisPrompt(input: AnalysisPromptInput): string {
  const body = (input.content || input.excerpt || "").slice(0, 6000);

  return `You are an analyst for "AI Market Radar". Analyze ONLY the article content provided below.

STRICT RULES:
- Use ONLY the provided content. Never invent facts, sources, links, companies, technologies, or dates.
- If something is unknown, use "unknown" (for strings) or an empty array. Do not guess.
- "reasoningShort" must be ONE short justification (max ~240 chars), NOT a chain of thought. Do not include step-by-step reasoning.
- Respond with a SINGLE valid JSON object and NOTHING else. No prose, no markdown, no code fences.

Return exactly this JSON shape:
{
  "summary": "string",
  "impact": "string",
  "category": "string",
  "relevance": "LOW | MEDIUM | HIGH | CRITICAL",
  "relevanceScore": 0-100,
  "articleType": "NEWS | LAUNCH | RESEARCH | TOOL | FUNDING | REGULATION | PRODUCT_UPDATE | TREND | OPINION | UNKNOWN",
  "companies": ["string"],
  "technologies": ["string"],
  "keywords": ["string"],
  "marketSignals": ["string"],
  "businessOpportunities": ["string"],
  "riskFlags": ["string"],
  "confidence": 0-100,
  "reasoningShort": "string"
}

ARTICLE METADATA (context only; do not fabricate beyond this):
- Title: ${input.title}
- Source: ${input.sourceName || "unknown"}
- URL: ${input.url}
- Published: ${input.publishedAt ? input.publishedAt.toISOString() : "unknown"}

ARTICLE CONTENT:
"""
${body}
"""`;
}
