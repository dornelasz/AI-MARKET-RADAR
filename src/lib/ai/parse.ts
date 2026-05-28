import type { AiAnalysisResult } from "../types";
import { aiAnalysisSchema } from "./schema";

export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiResponseError";
  }
}

/**
 * Extracts a JSON object from a raw model response. Tolerates code fences and
 * surrounding prose, but throws AiResponseError when no valid JSON object exists.
 */
export function extractJson(text: string): unknown {
  if (typeof text !== "string" || !text.trim()) {
    throw new AiResponseError("Empty AI response");
  }

  let candidate = text.trim();
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidate = fenced[1].trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AiResponseError("No JSON object found in AI response");
  }

  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    throw new AiResponseError("AI response is not valid JSON");
  }
}

/**
 * Parses and validates a raw AI response into a normalized AiAnalysisResult.
 * Throws AiResponseError on invalid JSON or a non-object payload.
 */
export function parseAiResponse(text: string): AiAnalysisResult {
  const raw = extractJson(text);
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new AiResponseError("AI response JSON is not an object");
  }

  const result = aiAnalysisSchema.safeParse(raw);
  if (!result.success) {
    throw new AiResponseError(
      `AI response failed validation: ${result.error.issues
        .map((i) => i.path.join(".") || "(root)")
        .join(", ")}`,
    );
  }

  return result.data as AiAnalysisResult;
}
