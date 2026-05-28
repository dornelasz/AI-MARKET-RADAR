/** Known tracking query parameters that never change article identity. */
export const TRACKING_PARAMS = new Set([
  "gclid",
  "gclsrc",
  "fbclid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "_hsenc",
  "_hsmi",
  "mkt_tok",
  "yclid",
  "msclkid",
  "twclid",
  "ref_src",
  "ref_url",
  "spm",
  "vero_id",
  "oly_anon_id",
  "oly_enc_id",
  "__s",
  "wickedid",
  "cmpid",
  "icid",
]);

/** Parameters starting with these prefixes are tracking noise. */
export const TRACKING_PREFIXES = ["utm_"];

export function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  if (TRACKING_PARAMS.has(lower)) return true;
  return TRACKING_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function safeParse(input: string): URL | null {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

/** Returns the URL with tracking params removed but otherwise untouched. */
export function removeTrackingParams(input: string): string {
  const url = safeParse(input);
  if (!url) return (input ?? "").trim();

  const kept: Array<[string, string]> = [];
  url.searchParams.forEach((value, key) => {
    if (!isTrackingParam(key)) kept.push([key, value]);
  });

  url.search = "";
  for (const [key, value] of kept) url.searchParams.append(key, value);
  return url.toString();
}

/**
 * Full normalization for deduplication:
 * lowercases host/protocol, drops default ports and fragments,
 * removes tracking params, sorts the remaining params, trims trailing slash.
 */
export function normalizeUrl(input: string): string {
  const url = safeParse(input);
  if (!url) return (input ?? "").trim();

  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  if (
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443")
  ) {
    url.port = "";
  }

  const entries: Array<[string, string]> = [];
  url.searchParams.forEach((value, key) => {
    if (!isTrackingParam(key)) entries.push([key, value]);
  });
  entries.sort((a, b) =>
    a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0]),
  );
  url.search = "";
  for (const [key, value] of entries) url.searchParams.append(key, value);

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

/** Canonical URL used as the primary dedup key. */
export function canonicalizeUrl(input: string): string {
  return normalizeUrl(input);
}
