import type { CollectedArticle } from "../types";
import { fetchText } from "./fetcher";
import { parseFeed } from "./rss";
import { collectGithubReleases } from "./github";
import { collectArxiv } from "./arxiv";
import { collectWebpage } from "./webpage";

export type SourceTypeValue =
  | "RSS"
  | "ATOM"
  | "BLOG"
  | "GITHUB_RELEASES"
  | "ARXIV"
  | "WEBPAGE"
  | "OTHER";

export interface CollectableSource {
  url: string;
  type: SourceTypeValue;
  name: string;
}

/** Dispatches to the correct collector based on the source type. */
export async function collectFromSource(
  source: CollectableSource,
): Promise<CollectedArticle[]> {
  switch (source.type) {
    case "GITHUB_RELEASES":
      return collectGithubReleases(source.url, source.name);
    case "ARXIV":
      return collectArxiv(source.url, source.name);
    case "WEBPAGE":
      return collectWebpage(source.url, source.name);
    case "RSS":
    case "ATOM":
    case "BLOG":
    case "OTHER":
    default: {
      const xml = await fetchText(source.url);
      return parseFeed(xml, source.name);
    }
  }
}

export { fetchText } from "./fetcher";
export { parseFeed, stripHtml, parseDate } from "./rss";
export { collectGithubReleases, isGithubReleasesUrl } from "./github";
export { collectArxiv } from "./arxiv";
export { collectWebpage, extractFromHtml } from "./webpage";
