import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  articleFindMany: vi.fn(),
  articleCreate: vi.fn(),
  sourceFindMany: vi.fn(),
  sourceUpdate: vi.fn(),
  fetchLogCreate: vi.fn(),
  collectFromSource: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    article: { findMany: mocks.articleFindMany, create: mocks.articleCreate },
    source: {
      findMany: mocks.sourceFindMany,
      update: mocks.sourceUpdate,
      findUnique: vi.fn(),
    },
    fetchLog: { create: mocks.fetchLogCreate },
  },
}));

vi.mock("@/lib/collectors/index", () => ({
  collectFromSource: mocks.collectFromSource,
}));

import { runAllActiveSources } from "@/lib/collectors/runner";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.articleFindMany.mockResolvedValue([]);
  mocks.articleCreate.mockResolvedValue({});
  mocks.sourceUpdate.mockResolvedValue({});
  mocks.fetchLogCreate.mockResolvedValue({});
  mocks.collectFromSource.mockImplementation(async (source: { name: string }) => {
    if (source.name === "Bad") throw new Error("boom");
    return [
      {
        title: "Good article",
        url: "https://good.com/a",
        publishedAt: null,
        excerpt: "body",
        content: "body",
        sourceName: source.name,
        author: null,
      },
    ];
  });
});

describe("runAllActiveSources resilience", () => {
  it("keeps going when one source fails and logs every source", async () => {
    mocks.sourceFindMany.mockResolvedValue([
      { id: "1", name: "Bad", url: "https://bad", type: "RSS" },
      { id: "2", name: "Good", url: "https://good.com", type: "RSS" },
    ]);

    const results = await runAllActiveSources();

    expect(results).toHaveLength(2);
    const bad = results.find((r) => r.sourceName === "Bad")!;
    const good = results.find((r) => r.sourceName === "Good")!;
    expect(bad.status).toBe("FAILED");
    expect(good.status).toBe("SUCCESS");
    expect(good.created).toBe(1);
    expect(mocks.fetchLogCreate).toHaveBeenCalledTimes(2);
  });

  it("creates collected articles as PENDING_ANALYSIS (works without Gemini)", async () => {
    mocks.sourceFindMany.mockResolvedValue([
      { id: "2", name: "Good", url: "https://good.com", type: "RSS" },
    ]);

    await runAllActiveSources();

    expect(mocks.articleCreate).toHaveBeenCalledTimes(1);
    const arg = mocks.articleCreate.mock.calls[0][0] as {
      data: { status: string };
    };
    expect(arg.data.status).toBe("PENDING_ANALYSIS");
  });
});
