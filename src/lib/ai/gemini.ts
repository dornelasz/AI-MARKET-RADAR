import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey, getGeminiModel, isAiConfigured } from "../config";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured");
    this.name = "AiNotConfiguredError";
  }
}

/** Strips the API key (and any key= query param) from a message before it reaches logs or the UI. */
export function redactSecrets(message: string): string {
  let out = message ?? "";
  const key = getGeminiApiKey();
  if (key && key.length >= 8) out = out.split(key).join("[REDACTED]");
  return out.replace(/([?&]key=)[^\s&"']+/gi, "$1[REDACTED]");
}

/** Low-level call. Throws AiNotConfiguredError when no key is present. */
export async function callGemini(prompt: string): Promise<string> {
  if (!isAiConfigured()) throw new AiNotConfiguredError();

  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  const model = genAI.getGenerativeModel({
    model: getGeminiModel(),
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export interface GeminiTestResult {
  ok: boolean;
  message: string;
  model: string;
}

/** Verifies the configured key/model with a tiny request. Never throws. */
export async function testGemini(): Promise<GeminiTestResult> {
  const model = getGeminiModel();
  if (!isAiConfigured()) {
    return {
      ok: false,
      message: "GEMINI_API_KEY não configurada ou análise de IA desabilitada.",
      model,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(getGeminiApiKey());
    const m = genAI.getGenerativeModel({ model });
    const res = await m.generateContent("Reply with the single word: OK");
    const text = res.response.text().trim();
    return {
      ok: true,
      message: `Conexão bem-sucedida. Resposta do modelo: "${text.slice(0, 60)}"`,
      model,
    };
  } catch (err) {
    return {
      ok: false,
      message: redactSecrets(err instanceof Error ? err.message : String(err)),
      model,
    };
  }
}
