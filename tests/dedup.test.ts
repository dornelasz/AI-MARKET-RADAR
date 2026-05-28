import { describe, it, expect } from "vitest";
import {
  buildArticleKey,
  createDedupIndex,
  isDuplicate,
  dedupeBatch,
} from "@/lib/dedup";
import { contentHash } from "@/lib/dedup/hash";

describe("contentHash", () => {
  it("is deterministic and ignores casing/whitespace", () => {
    expect(contentHash(["Hello  World"])).toBe(contentHash(["hello world"]));
  });

  it("differs for different content", () => {
    expect(contentHash(["a"])).not.toBe(contentHash(["b"]));
  });
});

describe("buildArticleKey", () => {
  it("produces the same canonical URL for tracking variants", () => {
    const a = buildArticleKey({
      title: "GPT-5 released",
      url: "https://site.com/gpt5?utm_source=x",
      excerpt: "same body",
    });
    const b = buildArticleKey({
      title: "GPT-5 released",
      url: "https://site.com/gpt5?utm_medium=y",
      excerpt: "same body",
    });
    expect(a.canonicalUrl).toBe("https://site.com/gpt5");
    expect(a.canonicalUrl).toBe(b.canonicalUrl);
    expect(a.contentHash).toBe(b.contentHash);
  });
});

describe("isDuplicate / dedupeBatch", () => {
  it("detects duplicates by canonical URL and by content hash", () => {
    const key = buildArticleKey({ title: "T", url: "https://s.com/x", excerpt: "b" });
    const index = createDedupIndex([key]);
    expect(isDuplicate(key, index)).toBe(true);
    expect(
      isDuplicate(
        buildArticleKey({ title: "T2", url: "https://s.com/other", excerpt: "z" }),
        index,
      ),
    ).toBe(false);
  });

  it("removes duplicates within a batch (repeated collection is safe)", () => {
    const items = [
      { title: "A", url: "https://s.com/a?utm_source=1", excerpt: "body-a" },
      { title: "A", url: "https://s.com/a?utm_source=2", excerpt: "body-a" },
      { title: "B", url: "https://s.com/b", excerpt: "body-b" },
    ];
    const { unique, duplicates } = dedupeBatch(items);
    expect(unique).toHaveLength(2);
    expect(duplicates).toHaveLength(1);
  });

  it("deduplicates against an existing index", () => {
    const existing = createDedupIndex([
      buildArticleKey({ title: "B", url: "https://s.com/b", excerpt: "body-b" }),
    ]);
    const { unique, duplicates } = dedupeBatch(
      [{ title: "B", url: "https://s.com/b", excerpt: "body-b" }],
      existing,
    );
    expect(unique).toHaveLength(0);
    expect(duplicates).toHaveLength(1);
  });
});
