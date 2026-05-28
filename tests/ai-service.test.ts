import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  articleFindUnique: vi.fn(),
  articleUpdate: vi.fn(),
  articleCount: vi.fn(),
  articleFindMany: vi.fn(),
  analysisUpsert: vi.fn(),
  analysisCount: vi.fn(),
  transaction: vi.fn(),
  callGemini: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    article: {
      findUnique: mocks.articleFindUnique,
      update: mocks.articleUpdate,
      count: mocks.articleCount,
      findMany: mocks.articleFindMany,
    },
    articleAnalysis: {
      upsert: mocks.analysisUpsert,
      count: mocks.analysisCount,
    },
    $transaction: mocks.transaction,
  },
}));

// Keep redactSecrets / classifyRateLimitError / AiNotConfiguredError real; only stub the network call.
vi.mock("@/lib/ai/gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/gemini")>();
  return { ...actual, callGemini: mocks.callGemini };
});

import { analyzeArticleById, analyzePending } from "@/lib/ai/service";
import { clearRateLimit, getLastRateLimit } from "@/lib/ai/rateLimitState";

const VALID_JSON = JSON.stringify({
  summary: "Resumo do conteúdo real",
  impact: "Alto",
  category: "LLM",
  relevance: "HIGH",
  relevanceScore: 80,
  articleType: "LAUNCH",
  companies: ["OpenAI"],
  technologies: ["GPT"],
  keywords: ["release"],
  marketSignals: ["growth"],
  businessOpportunities: ["tooling"],
  riskFlags: [],
  confidence: 90,
  reasoningShort: "menciona um lançamento relevante",
});

const ARTICLE = {
  id: "a1",
  title: "Release v1.0",
  url: "https://example.com/a1",
  localScore: 40,
  rawExcerpt: "trecho real",
  rawContent: "conteúdo real coletado",
  source: { name: "Fonte Real" },
};

function failedUpdateCall() {
  return mocks.articleUpdate.mock.calls.find(
    (c) => (c[0] as { data?: { status?: string } })?.data?.status === "ANALYSIS_FAILED",
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.callGemini.mockReset();
  clearRateLimit();
  process.env.AI_ANALYSIS_ENABLED = "true";
  process.env.GEMINI_API_KEY = "test-key-123456";
  mocks.transaction.mockResolvedValue([{}, {}]);
  mocks.articleUpdate.mockResolvedValue({});
  mocks.analysisUpsert.mockResolvedValue({});
});

describe("analyzeArticleById", () => {
  it("salva a análise e marca o artigo como ANALYZED no sucesso", async () => {
    mocks.articleFindUnique.mockResolvedValue(ARTICLE);
    mocks.callGemini.mockResolvedValue(VALID_JSON);

    const outcome = await analyzeArticleById("a1");

    expect(outcome.ok).toBe(true);
    expect(mocks.analysisUpsert).toHaveBeenCalledTimes(1);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    const analyzedCall = mocks.articleUpdate.mock.calls.find(
      (c) => (c[0] as { data?: { status?: string } })?.data?.status === "ANALYZED",
    );
    expect(analyzedCall).toBeTruthy();
  });

  it("marca ANALYSIS_FAILED e nunca expõe a chave em erro NÃO transitório", async () => {
    mocks.articleFindUnique.mockResolvedValue(ARTICLE);
    mocks.callGemini.mockRejectedValue(
      new Error("fetch https://x?key=test-key-123456 failed (test-key-123456)"),
    );

    const outcome = await analyzeArticleById("a1");

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe("ERROR");
      expect(outcome.message).not.toContain("test-key-123456");
    }
    expect(failedUpdateCall()).toBeTruthy();
  });

  it("NÃO marca ANALYSIS_FAILED em rate limit (429) — mantém PENDING", async () => {
    mocks.articleFindUnique.mockResolvedValue(ARTICLE);
    mocks.callGemini.mockRejectedValue(
      new Error("[429 Too Many Requests] rate limit exceeded for this model"),
    );

    const outcome = await analyzeArticleById("a1");

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe("RATE_LIMITED");
      if (outcome.reason === "RATE_LIMITED") expect(outcome.limit).toBe("RATE_LIMIT");
    }
    expect(failedUpdateCall()).toBeUndefined();
    expect(getLastRateLimit()?.kind).toBe("RATE_LIMIT");
  });

  it("classifica quota excedida como QUOTA_LIMIT (sem marcar FAILED)", async () => {
    mocks.articleFindUnique.mockResolvedValue(ARTICLE);
    mocks.callGemini.mockRejectedValue(
      new Error("[429] You exceeded your current quota, please check billing"),
    );

    const outcome = await analyzeArticleById("a1");

    expect(outcome.ok).toBe(false);
    if (!outcome.ok && outcome.reason === "RATE_LIMITED") {
      expect(outcome.limit).toBe("QUOTA_LIMIT");
    }
    expect(failedUpdateCall()).toBeUndefined();
  });

  it("retorna NOT_FOUND para artigo inexistente", async () => {
    mocks.articleFindUnique.mockResolvedValue(null);
    mocks.callGemini.mockResolvedValue(VALID_JSON);
    const outcome = await analyzeArticleById("missing");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("NOT_FOUND");
  });
});

describe("analyzePending", () => {
  it("respeita o limite diário (ignora quando atingido)", async () => {
    mocks.articleCount.mockResolvedValue(7);
    mocks.analysisCount.mockResolvedValue(9999);

    const result = await analyzePending();

    expect(result.configured).toBe(true);
    expect(result.attempted).toBe(0);
    expect(result.skipped).toBe(7);
    expect(result.stoppedBecause).toBeNull();
    expect(result.message).toMatch(/[Ll]imite diário/);
    expect(mocks.articleFindMany).not.toHaveBeenCalled();
  });

  it("interrompe o lote com segurança ao bater rate limit", async () => {
    mocks.articleCount.mockResolvedValue(10);
    mocks.analysisCount.mockResolvedValue(0);
    mocks.articleFindMany.mockResolvedValue([
      { ...ARTICLE, id: "a1" },
      { ...ARTICLE, id: "a2" },
      { ...ARTICLE, id: "a3" },
    ]);
    mocks.articleFindUnique.mockResolvedValue(ARTICLE);
    mocks.callGemini
      .mockResolvedValueOnce(VALID_JSON)
      .mockRejectedValueOnce(new Error("[429] resource exhausted"));

    const result = await analyzePending(5);

    expect(result.analyzed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.stoppedBecause).toBe("RATE_LIMIT");
    expect(mocks.callGemini).toHaveBeenCalledTimes(2); // parou antes do 3º
    expect(failedUpdateCall()).toBeUndefined();
  });

  it("análise normal continua funcionando e reporta ignorados", async () => {
    mocks.articleCount.mockResolvedValue(10);
    mocks.analysisCount.mockResolvedValue(0);
    mocks.articleFindMany.mockResolvedValue([
      { ...ARTICLE, id: "a1" },
      { ...ARTICLE, id: "a2" },
    ]);
    mocks.articleFindUnique.mockResolvedValue(ARTICLE);
    mocks.callGemini.mockResolvedValue(VALID_JSON);

    const result = await analyzePending(2);

    expect((mocks.articleFindMany.mock.calls[0][0] as { take: number }).take).toBe(2);
    expect(result.analyzed).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(8);
    expect(result.stoppedBecause).toBeNull();
  });
});
