import { XMLParser } from "fast-xml-parser";
import type { CollectedArticle } from "../types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  textNodeName: "#text",
  parseTagValue: false,
  parseAttributeValue: false,
  cdataPropName: "__cdata",
});

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(node: unknown): string {
  if (node === undefined || node === null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj.__cdata === "string") return obj.__cdata;
    const text = obj["#text"];
    if (typeof text === "string") return text;
    if (typeof text === "number") return String(text);
  }
  return "";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&#x27;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseDate(value: unknown): Date | null {
  const str = textValue(value).trim();
  if (!str) return null;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickAtomLink(link: unknown): string {
  const links = toArray(link);
  let fallback = "";
  for (const item of links) {
    if (typeof item === "string") {
      if (!fallback) fallback = item;
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const href = typeof obj["@_href"] === "string" ? (obj["@_href"] as string) : "";
      if (!href) continue;
      const rel = (obj["@_rel"] as string) ?? "alternate";
      if (rel === "alternate") return href;
      if (!fallback) fallback = href;
    }
  }
  return fallback;
}

function clip(text: string, max = 500): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/**
 * Parses an RSS 2.0, RDF/RSS 1.0, or Atom feed into the universal article shape.
 * Returns [] for empty/invalid input instead of throwing, so one bad feed
 * never crashes a collection run.
 */
export function parseFeed(xml: string, sourceName = ""): CollectedArticle[] {
  if (!xml || typeof xml !== "string") return [];

  let data: Record<string, any>;
  try {
    data = parser.parse(xml) as Record<string, any>;
  } catch {
    return [];
  }
  if (!data || typeof data !== "object") return [];

  // RSS 2.0 and RDF/RSS 1.0
  const rssChannel = data?.rss?.channel ?? data?.["rdf:RDF"]?.channel;
  if (rssChannel) {
    const feedTitle = textValue(rssChannel.title) || sourceName;
    const items = toArray(rssChannel.item ?? data?.["rdf:RDF"]?.item);
    return items
      .map((item: any): CollectedArticle => {
        const description = stripHtml(textValue(item.description));
        const encoded = stripHtml(textValue(item["content:encoded"]));
        const content = encoded || description;
        return {
          title: textValue(item.title).trim(),
          url: textValue(item.link).trim() || textValue(item.guid).trim(),
          publishedAt: parseDate(item.pubDate ?? item["dc:date"] ?? item.date),
          excerpt: clip(description || content),
          content,
          sourceName: sourceName || feedTitle,
          author: textValue(item.author ?? item["dc:creator"]).trim() || null,
        };
      })
      .filter((article) => article.title && article.url);
  }

  // Atom
  if (data?.feed) {
    const feedTitle = textValue(data.feed.title) || sourceName;
    const entries = toArray(data.feed.entry);
    return entries
      .map((entry: any): CollectedArticle => {
        const summary = stripHtml(textValue(entry.summary));
        const body = stripHtml(textValue(entry.content));
        const content = body || summary;
        return {
          title: textValue(entry.title).trim(),
          url: pickAtomLink(entry.link).trim() || textValue(entry.id).trim(),
          publishedAt: parseDate(entry.published ?? entry.updated),
          excerpt: clip(summary || content),
          content,
          sourceName: sourceName || feedTitle,
          author: textValue(entry?.author?.name).trim() || null,
        };
      })
      .filter((article) => article.title && article.url);
  }

  return [];
}
