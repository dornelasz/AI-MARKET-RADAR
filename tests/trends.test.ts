import { describe, it, expect } from "vitest";
import { computeTrends } from "@/lib/trends";

describe("computeTrends", () => {
  it("aggregates companies, technologies and keywords from real article analyses", () => {
    const trends = computeTrends([
      {
        companies: ["OpenAI", "Google"],
        technologies: ["LLM"],
        keywords: ["gpt", "release"],
      },
      {
        companies: ["openai"],
        technologies: ["LLM", "RAG"],
        keywords: ["gpt"],
      },
    ]);

    expect(trends.totalArticles).toBe(2);
    expect(trends.companies[0].term.toLowerCase()).toBe("openai");
    expect(trends.companies[0].count).toBe(2);
    expect(trends.technologies.find((t) => t.term === "LLM")?.count).toBe(2);
    expect(trends.keywords.find((k) => k.term === "gpt")?.count).toBe(2);
  });

  it("returns empty arrays when there is nothing to aggregate", () => {
    const trends = computeTrends([]);
    expect(trends.companies).toEqual([]);
    expect(trends.technologies).toEqual([]);
    expect(trends.keywords).toEqual([]);
    expect(trends.totalArticles).toBe(0);
  });
});
