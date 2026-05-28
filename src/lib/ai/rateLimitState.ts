import type { GeminiLimitKind } from "./gemini";

/**
 * Minimal in-memory record of the last Gemini quota/rate-limit event.
 * Process-local and intentionally simple — no table, no extra dependency.
 * Used by /api/settings/status to surface a "recent limit" hint.
 */
let last: { kind: GeminiLimitKind; at: number } | null = null;

export function recordRateLimit(kind: GeminiLimitKind): void {
  last = { kind, at: Date.now() };
}

export function getLastRateLimit(): { kind: GeminiLimitKind; at: number } | null {
  return last;
}

export function clearRateLimit(): void {
  last = null;
}
