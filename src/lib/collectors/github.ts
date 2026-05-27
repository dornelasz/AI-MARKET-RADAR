import { fetchText } from "./fetcher";
import { parseFeed } from "./rss";
import type { CollectedArticle } from "../types";

/** GitHub publishes releases as a public Atom feed at /owner/repo/releases.atom */
export function isGithubReleasesUrl(url: string): boolean {
  return /github\.com\/[^/]+\/[^/]+\/releases\.atom\/?$/i.test((url ?? "").trim());
}

export async function collectGithubReleases(
  url: string,
  sourceName = "",
): Promise<CollectedArticle[]> {
  const xml = await fetchText(url, {
    accept: "application/atom+xml, application/xml, text/xml, */*",
  });
  return parseFeed(xml, sourceName);
}
