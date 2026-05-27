import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  articleFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { article: { findMany: mocks.articleFindMany } },
}));

import { buildDigestForDate } from "@/lib/digest";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildDigestForDate", () => {
  it("builds a digest strictly from stored articles", async () => {
    const now = new Date();
    mocks.articleFindMany.mockResolvedValue([
      {
        id: "1",
        title: "OpenAI launches GPT",
        url: "https://x/1",
        finalScore: 80,
        publishedAt: now,
        collectedAt: now,
        source: { name: "Src" },
        analysis: {
          relevance: "HIGH",
          relevanceScore: 80,
          companies: ["OpenAI"],
          technologies: ["LLM"],
          keywords: ["gpt"],
          businessOpportunities: ["Build internal tooling"],
        },
      },
      {
        id: "2",
        title: "Other news",
        url: "https://x/2",
        finalScore: 40,
        publishedAt: now,
        collectedAt: now,
        source: { name: "Src2" },
        analysis: null,
      },
    ]);

    const digest = await buildDigestForDate(now);

    expect(digest.topArticles).toHaveLength(2);
    expect(digest.topArticles[0].id).toBe("1");
    expect(digest.companies[0].term).toBe("OpenAI");
    expect(digest.technologies[0].term).toBe("LLM");
    expect(digest.businessOpportunities).toContain("Build internal tooling");
    expect(digest.summary).toContain("2 artigo");
    expect(digest.summary).toContain("1 analisado");
  });

  it("produces an empty-state summary when there are no articles", async () => {
    mocks.articleFindMany.mockResolvedValue([]);
    const digest = await buildDigestForDate(new Date());
    expect(digest.topArticles).toEqual([]);
    expect(digest.summary).toContain("Nenhum artigo");
  });
});
