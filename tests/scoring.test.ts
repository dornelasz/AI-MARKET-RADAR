import { describe, it, expect } from "vitest";
import { computeLocalScore, computeHybridScore } from "@/lib/scoring";

const NOW = new Date("2025-06-10T12:00:00Z");

describe("computeLocalScore", () => {
  it("scores recent, AI-relevant articles higher than old, off-topic ones", () => {
    const relevant = computeLocalScore({
      title: "OpenAI launches a new GPT model",
      excerpt: "A large language model release with benchmarks",
      publishedAt: new Date("2025-06-10T06:00:00Z"),
      now: NOW,
    });
    const offTopic = computeLocalScore({
      title: "Cooking recipes for the weekend",
      excerpt: "Nothing about technology here",
      publishedAt: new Date("2024-01-01T00:00:00Z"),
      now: NOW,
    });
    expect(relevant).toBeGreaterThan(offTopic);
  });

  it("stays within 0-100", () => {
    const score = computeLocalScore({
      title: "GPT LLM model release launch funding benchmark agent rag openai anthropic google",
      excerpt: "x".repeat(3000),
      publishedAt: NOW,
      now: NOW,
    });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("computeHybridScore", () => {
  it("returns the local score when there is no AI score", () => {
    expect(computeHybridScore(40, null)).toBe(40);
    expect(computeHybridScore(40)).toBe(40);
  });

  it("blends local and AI scores (AI weighted higher)", () => {
    expect(computeHybridScore(0, 100)).toBe(65);
    expect(computeHybridScore(100, 0)).toBe(35);
  });

  it("clamps out-of-range inputs", () => {
    expect(computeHybridScore(200, 200)).toBe(100);
    expect(computeHybridScore(-50, -50)).toBe(0);
  });
});
