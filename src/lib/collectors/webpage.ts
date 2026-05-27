import * as cheerio from "cheerio";
import { fetchText } from "./fetcher";
import type { CollectedArticle } from "../types";

function safeDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Best-effort extraction of title, description and main text from a simple
 * public webpage. Does not bypass paywalls, logins, or captchas.
 */
export function extractFromHtml(
  html: string,
  url: string,
  sourceName = "",
): CollectedArticle | null {
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").first().text().trim() ||
    $("h1").first().text().trim();

  if (!title) return null;

  const description =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    "";

  const publishedAt =
    safeDate($('meta[property="article:published_time"]').attr("content")) ??
    safeDate($('meta[name="date"]').attr("content")) ??
    safeDate($("time[datetime]").first().attr("datetime"));

  const author =
    $('meta[name="author"]').attr("content")?.trim() ||
    $('meta[property="article:author"]').attr("content")?.trim() ||
    null;

  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || url;

  $("script, style, nav, header, footer, aside, form, noscript").remove();
  const article = $("article").first();
  const main = $("main").first();
  const container = article.length ? article : main.length ? main : $("body");
  const content = container.text().replace(/\s+/g, " ").trim().slice(0, 8000);

  return {
    title,
    url: canonical,
    publishedAt,
    excerpt: (description || content).slice(0, 500),
    content: content || description,
    sourceName,
    author,
  };
}

export async function collectWebpage(
  url: string,
  sourceName = "",
): Promise<CollectedArticle[]> {
  const html = await fetchText(url, {
    accept: "text/html,application/xhtml+xml,*/*",
  });
  const article = extractFromHtml(html, url, sourceName);
  return article ? [article] : [];
}
