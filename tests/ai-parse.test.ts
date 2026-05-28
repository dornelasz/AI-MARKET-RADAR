import { describe, it, expect } from "vitest";
import { parseAiResponse, extractJson, AiResponseError } from "@/lib/ai/parse";

describe("parseAiResponse (valid JSON)", () => {
  it("normalizes enums, clamps scores and sanitizes arrays", () => {
    const raw = JSON.stringify({
      summary: "s",
      impact: "i",
      category: "LLM",
      relevance: "high",
      relevanceScore: 150,
      articleType: "product update",
      companies: ["OpenAI", "OpenAI"],
      technologies: "single",
      keywords: [],
      marketSignals: [],
      businessOpportunities: [],
      riskFlags: [],
      confidence: -5,
      reasoningShort: "short reason",
    });
    const result = parseAiResponse(raw);
    expect(result.relevance).toBe("HIGH");
    expect(result.relevanceScore).toBe(100);
    expect(result.articleType).toBe("PRODUCT_UPDATE");
    expect(result.companies).toEqual(["OpenAI"]);
    expect(result.technologies).toEqual(["single"]);
    expect(result.confidence).toBe(0);
  });

  it("applies safe defaults for an empty object (unknown => defaults)", () => {
    const result = parseAiResponse("{}");
    expect(result.relevance).toBe("LOW");
    expect(result.articleType).toBe("UNKNOWN");
    expect(result.companies).toEqual([]);
    expect(result.category).toBe("unknown");
  });

  it("extracts JSON from a fenced/surrounded response", () => {
    const fenced = "```json\n{\"summary\":\"x\"}\n```";
    expect((extractJson(fenced) as { summary: string }).summary).toBe("x");
    const surrounded = 'Here is the result: {"summary":"y"} thanks!';
    expect((extractJson(surrounded) as { summary: string }).summary).toBe("y");
  });
});

describe("parseAiResponse (invalid JSON)", () => {
  it("throws AiResponseError for non-JSON text", () => {
    expect(() => parseAiResponse("totally not json")).toThrow(AiResponseError);
  });

  it("throws AiResponseError for an empty response", () => {
    expect(() => parseAiResponse("")).toThrow(AiResponseError);
  });

  it("throws AiResponseError when the JSON is not an object", () => {
    expect(() => parseAiResponse("[1,2,3]")).toThrow(AiResponseError);
  });
});
