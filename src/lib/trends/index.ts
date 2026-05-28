export interface TermCount {
  term: string;
  count: number;
}

export interface TrendInput {
  publishedAt?: Date | null;
  collectedAt?: Date | null;
  relevanceScore?: number | null;
  companies?: string[];
  technologies?: string[];
  keywords?: string[];
}

function tally(lists: Array<string[] | undefined>, limit: number): TermCount[] {
  const counts = new Map<string, TermCount>();
  for (const list of lists) {
    if (!list) continue;
    for (const raw of list) {
      const term = (raw ?? "").trim();
      if (!term) continue;
      const key = term.toLowerCase();
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { term, count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, limit);
}

export function topCompanies(items: TrendInput[], limit = 10): TermCount[] {
  return tally(
    items.map((i) => i.companies),
    limit,
  );
}

export function topTechnologies(items: TrendInput[], limit = 10): TermCount[] {
  return tally(
    items.map((i) => i.technologies),
    limit,
  );
}

export function trendingKeywords(items: TrendInput[], limit = 12): TermCount[] {
  return tally(
    items.map((i) => i.keywords),
    limit,
  );
}

export interface TrendsResult {
  companies: TermCount[];
  technologies: TermCount[];
  keywords: TermCount[];
  totalArticles: number;
}

/** Aggregate trends strictly from the analyzed articles passed in (no invented data). */
export function computeTrends(items: TrendInput[]): TrendsResult {
  return {
    companies: topCompanies(items),
    technologies: topTechnologies(items),
    keywords: trendingKeywords(items),
    totalArticles: items.length,
  };
}
