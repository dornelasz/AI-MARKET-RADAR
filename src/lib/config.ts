function toInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  const v = value.toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/**
 * Snapshot of configuration read at process start. Safe for server runtime.
 * AI gating uses the live helpers below so it can react to env in tests/scripts.
 */
export const config = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  aiBatchSize: toInt(process.env.AI_BATCH_SIZE, 5),
  aiAnalysisDailyLimit: toInt(process.env.AI_ANALYSIS_DAILY_LIMIT, 50),
  fetchIntervalMinutes: toInt(process.env.FETCH_INTERVAL_MINUTES, 15),
  aiStopOnRateLimit: toBool(process.env.AI_ANALYSIS_STOP_ON_RATE_LIMIT, true),
  aiRetryCooldownMinutes: toInt(process.env.AI_ANALYSIS_RETRY_COOLDOWN_MINUTES, 60),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

export function getGeminiApiKey(): string {
  return (process.env.GEMINI_API_KEY ?? "").trim();
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export function isAiEnabled(): boolean {
  return toBool(process.env.AI_ANALYSIS_ENABLED, true);
}

/** True only when AI is enabled AND a key is present. The whole app must work when false. */
export function isAiConfigured(): boolean {
  return isAiEnabled() && getGeminiApiKey().length > 0;
}

export interface AiStatus {
  configured: boolean;
  enabled: boolean;
  hasKey: boolean;
  model: string;
}

export function aiStatus(): AiStatus {
  return {
    configured: isAiConfigured(),
    enabled: isAiEnabled(),
    hasKey: getGeminiApiKey().length > 0,
    model: getGeminiModel(),
  };
}
