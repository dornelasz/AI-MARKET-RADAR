import { fetchText } from "./fetcher";
import { parseFeed } from "./rss";
import type { CollectedArticle } from "../types";

/**
 * arXiv exposes stable public feeds:
 * - Atom API: http://export.arxiv.org/api/query?search_query=cat:cs.AI&...
 * - RSS: https://rss.arxiv.org/rss/cs.AI
 * Both are handled by the shared feed parser.
 */
export async function collectArxiv(
  url: string,
  sourceName = "",
): Promise<CollectedArticle[]> {
  const xml = await fetchText(url, {
    accept: "application/atom+xml, application/xml, text/xml, */*",
  });
  return parseFeed(xml, sourceName || "arXiv");
}
