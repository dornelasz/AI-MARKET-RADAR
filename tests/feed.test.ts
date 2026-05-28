import { describe, it, expect } from "vitest";
import { parseFeed, decodeEntities, stripHtml } from "@/lib/collectors/rss";

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <item>
      <title>Hello World</title>
      <link>https://ex.com/1</link>
      <pubDate>Tue, 10 Jun 2025 09:00:00 GMT</pubDate>
      <description><![CDATA[<p>Some <b>html</b> desc</p>]]></description>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://ex.com/2</link>
      <description>Plain description</description>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Repo Releases</title>
  <entry>
    <title>v1.2.0</title>
    <link rel="alternate" href="https://github.com/o/r/releases/tag/v1.2.0"/>
    <updated>2025-06-10T09:00:00Z</updated>
    <content type="html">Release notes &lt;b&gt;bold&lt;/b&gt;</content>
  </entry>
</feed>`;

describe("parseFeed (RSS)", () => {
  it("parses items, strips HTML and reads dates", () => {
    const items = parseFeed(RSS, "Example Feed");
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Hello World");
    expect(items[0].url).toBe("https://ex.com/1");
    expect(items[0].excerpt).toContain("Some html desc");
    expect(items[0].excerpt).not.toContain("<");
    expect(items[0].publishedAt).toBeInstanceOf(Date);
    expect(items[1].title).toBe("Second Post");
  });
});

describe("parseFeed (Atom)", () => {
  it("parses entries and resolves the alternate link", () => {
    const items = parseFeed(ATOM, "Repo Releases");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("v1.2.0");
    expect(items[0].url).toBe("https://github.com/o/r/releases/tag/v1.2.0");
    expect(items[0].content).toContain("Release notes bold");
    expect(items[0].publishedAt).toBeInstanceOf(Date);
  });
});

describe("entity handling", () => {
  it("decodes named, numeric and hex entities (&amp; last)", () => {
    expect(decodeEntities("Tom &amp; Jerry &lt;b&gt;x&lt;/b&gt; &#39;q&#39; &#x27;r&#x27;")).toBe(
      "Tom & Jerry <b>x</b> 'q' 'r'",
    );
  });

  it("decodes then strips HTML", () => {
    expect(stripHtml("&lt;p&gt;Hello &amp; welcome&lt;/p&gt;")).toBe("Hello & welcome");
  });

  it("parses feeds whose content has many escaped entities (no expansion-limit crash)", () => {
    const entries = Array.from({ length: 3 })
      .map(
        (_, i) =>
          `<entry><title>Item ${i}</title><link rel="alternate" href="https://e.com/${i}"/><content type="html">${"&lt;b&gt;tag&lt;/b&gt; &amp; more ".repeat(800)}</content></entry>`,
      )
      .join("");
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Big</title>${entries}</feed>`;
    const parsed = parseFeed(xml, "Big");
    expect(parsed).toHaveLength(3);
    expect(parsed[0].content).toContain("tag & more");
    expect(parsed[0].content).not.toContain("<b>");
  });
});

describe("parseFeed (malformed)", () => {
  it("returns an empty array instead of throwing", () => {
    expect(parseFeed("")).toEqual([]);
    expect(parseFeed("not xml <<<")).toEqual([]);
    expect(parseFeed("<html><body>no feed</body></html>")).toEqual([]);
  });
});
