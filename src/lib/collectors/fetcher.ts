const DEFAULT_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "AI-Market-Radar/0.1 (+https://github.com/dornelasz/ai-market-radar; respects robots and ToS)";

export interface FetchTextOptions {
  timeoutMs?: number;
  accept?: string;
}

/**
 * Fetches text with a hard timeout and a descriptive User-Agent.
 * Throws on network failure or non-2xx so callers can record the error per source.
 */
export async function fetchText(
  url: string,
  options: FetchTextOptions = {},
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          options.accept ??
          "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}
