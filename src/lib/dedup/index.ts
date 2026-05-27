import { canonicalizeUrl } from "./url";
import { contentHash } from "./hash";

export * from "./url";
export * from "./hash";

export interface ArticleKey {
  canonicalUrl: string;
  contentHash: string;
}

export interface KeyableArticle {
  title: string;
  url: string;
  excerpt?: string | null;
  content?: string | null;
}

/** Build the canonical URL + content hash that together identify an article. */
export function buildArticleKey(article: KeyableArticle): ArticleKey {
  const canonicalUrl = canonicalizeUrl(article.url);
  const body = article.content?.trim() || article.excerpt?.trim() || "";
  const hash = contentHash([article.title, body || canonicalUrl]);
  return { canonicalUrl, contentHash: hash };
}

export interface DedupIndex {
  canonicalUrls: Set<string>;
  contentHashes: Set<string>;
}

export function createDedupIndex(existing: ArticleKey[] = []): DedupIndex {
  const index: DedupIndex = {
    canonicalUrls: new Set(),
    contentHashes: new Set(),
  };
  for (const key of existing) addToIndex(key, index);
  return index;
}

export function isDuplicate(key: ArticleKey, index: DedupIndex): boolean {
  return (
    index.canonicalUrls.has(key.canonicalUrl) ||
    index.contentHashes.has(key.contentHash)
  );
}

export function addToIndex(key: ArticleKey, index: DedupIndex): void {
  index.canonicalUrls.add(key.canonicalUrl);
  index.contentHashes.add(key.contentHash);
}

export interface DedupeResult<T> {
  unique: Array<T & { key: ArticleKey }>;
  duplicates: Array<T & { key: ArticleKey }>;
}

/**
 * Removes duplicates within a batch and against an optional existing index.
 * Repeated collections of the same feed therefore never create duplicates.
 */
export function dedupeBatch<T extends KeyableArticle>(
  items: T[],
  existing?: DedupIndex,
): DedupeResult<T> {
  const index = existing ?? createDedupIndex();
  const unique: Array<T & { key: ArticleKey }> = [];
  const duplicates: Array<T & { key: ArticleKey }> = [];

  for (const item of items) {
    const key = buildArticleKey(item);
    if (isDuplicate(key, index)) {
      duplicates.push({ ...item, key });
    } else {
      addToIndex(key, index);
      unique.push({ ...item, key });
    }
  }

  return { unique, duplicates };
}
