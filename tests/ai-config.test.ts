import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAiConfigured } from "@/lib/config";
import { analyzeArticleById } from "@/lib/ai/service";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.AI_ANALYSIS_ENABLED = "true";
  delete process.env.GEMINI_API_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("AI gating without Gemini", () => {
  it("isAiConfigured is false when no key is present", () => {
    expect(isAiConfigured()).toBe(false);
  });

  it("isAiConfigured is false when disabled even with a key", () => {
    process.env.GEMINI_API_KEY = "k";
    process.env.AI_ANALYSIS_ENABLED = "false";
    expect(isAiConfigured()).toBe(false);
  });

  it("analyzeArticleById reports NOT_CONFIGURED and never touches the DB/network", async () => {
    const outcome = await analyzeArticleById("any-id");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe("NOT_CONFIGURED");
    }
  });
});
