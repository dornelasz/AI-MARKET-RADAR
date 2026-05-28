import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  removeTrackingParams,
  isTrackingParam,
} from "@/lib/dedup/url";

describe("normalizeUrl", () => {
  it("lowercases host, drops default port and fragment, sorts params", () => {
    expect(normalizeUrl("https://Example.com:443/Path/?b=2&a=1#section")).toBe(
      "https://example.com/Path?a=1&b=2",
    );
  });

  it("removes tracking params during normalization", () => {
    expect(normalizeUrl("https://x.com/a?utm_source=tw&id=5")).toBe(
      "https://x.com/a?id=5",
    );
  });

  it("keeps the root slash but trims trailing slashes elsewhere", () => {
    expect(normalizeUrl("https://x.com/")).toBe("https://x.com/");
    expect(normalizeUrl("https://x.com/a/b/")).toBe("https://x.com/a/b");
  });

  it("treats tracking-only variants as the same canonical URL", () => {
    expect(normalizeUrl("https://s.com/p?utm_source=a")).toBe(
      normalizeUrl("https://s.com/p?utm_medium=b"),
    );
  });

  it("returns the trimmed input for unparseable URLs instead of throwing", () => {
    expect(normalizeUrl("   ")).toBe("");
    expect(normalizeUrl("not a url")).toBe("not a url");
  });
});

describe("removeTrackingParams", () => {
  it("strips known trackers but preserves functional params and order", () => {
    expect(
      removeTrackingParams("https://x.com/a?id=5&utm_source=tw&fbclid=z&page=2"),
    ).toBe("https://x.com/a?id=5&page=2");
  });

  it("identifies tracking params", () => {
    expect(isTrackingParam("utm_campaign")).toBe(true);
    expect(isTrackingParam("gclid")).toBe(true);
    expect(isTrackingParam("id")).toBe(false);
  });
});
