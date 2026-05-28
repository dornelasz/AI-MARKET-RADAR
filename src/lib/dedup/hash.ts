import { createHash } from "node:crypto";

export function normalizeForHash(text: string | null | undefined): string {
  return (text ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Stable SHA-256 over normalized parts, used to detect the same article via different URLs. */
export function contentHash(parts: Array<string | null | undefined>): string {
  const normalized = parts.map((part) => normalizeForHash(part)).join("\n");
  return createHash("sha256").update(normalized).digest("hex");
}
