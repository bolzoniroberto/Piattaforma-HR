import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import { checkBudget, recordInvocation } from "./aiBudget";

const MODEL_FAST = "gemini-2.5-flash";
const MODEL_SMART = "gemini-2.5-pro";

function getClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY non configurata");
  return new GoogleGenAI({ apiKey: key });
}

export interface AiCallParams {
  userId: string;
  scope: string;
  prompt: string;
  systemInstruction?: string;
  model?: "fast" | "smart";
  responseSchema?: object;
}

export interface AiCallResult {
  text: string;
  parsed?: unknown;
  tokensIn: number;
  tokensOut: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = [1000, 3000, 8000];

function isRetryable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('"code":503') || msg.includes("UNAVAILABLE") || msg.includes("503");
}

function classifyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.startsWith("budget_exceeded")) return msg;
  if (msg.includes('"code":503') || msg.includes("UNAVAILABLE"))
    return "ai_unavailable:Il modello AI è temporaneamente sovraccarico. Riprova tra qualche secondo.";
  if (msg.includes('"code":429') || msg.includes("RESOURCE_EXHAUSTED"))
    return "ai_rate_limit:Limite richieste AI raggiunto. Riprova tra un minuto.";
  if (msg.includes('"code":400') || msg.includes("INVALID_ARGUMENT"))
    return "ai_invalid:Richiesta non valida. Controlla il testo e riprova.";
  return `ai_error:${msg}`;
}

export async function callAI(params: AiCallParams): Promise<AiCallResult> {
  await checkBudget();

  const modelId = params.model === "smart" ? MODEL_SMART : MODEL_FAST;
  const client = getClient();
  const start = Date.now();

  const genParams: GenerateContentParameters = {
    model: modelId,
    contents: params.prompt,
    config: {
      systemInstruction:
        params.systemInstruction ??
        "Sei un assistente HR specializzato. Rispondi sempre in italiano. Sii preciso, conciso e professionale.",
      temperature: 0.3,
      ...(params.responseSchema
        ? {
            responseMimeType: "application/json",
            responseSchema: params.responseSchema as any,
          }
        : {}),
    },
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS[attempt - 1] ?? 8000));
    }

    try {
      const response = await client.models.generateContent(genParams);
      const latency = Date.now() - start;

      const tokensIn = response.usageMetadata?.promptTokenCount ?? 0;
      const tokensOut = response.usageMetadata?.candidatesTokenCount ?? 0;
      const text = response.text ?? "";

      await recordInvocation({
        userId: params.userId,
        scope: params.scope,
        model: modelId,
        tokensIn,
        tokensOut,
        latencyMs: latency,
        ok: true,
      });

      let parsed: unknown = undefined;
      if (params.responseSchema) {
        try {
          parsed = JSON.parse(text);
        } catch {
          // testo grezzo se JSON non parsabile
        }
      }

      return { text, parsed, tokensIn, tokensOut };
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === MAX_RETRIES) break;
    }
  }

  const latency = Date.now() - start;
  const classified = classifyError(lastError);

  if (!classified.startsWith("budget_exceeded")) {
    await recordInvocation({
      userId: params.userId,
      scope: params.scope,
      model: modelId,
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: latency,
      ok: false,
      errorMsg: classified,
    });
  }

  throw new Error(classified);
}

export async function pingAI(): Promise<{ ok: boolean; model: string }> {
  try {
    const client = getClient();
    const response = await client.models.generateContent({
      model: MODEL_FAST,
      contents: "Rispondi solo con: ok",
      config: { temperature: 0 },
    });
    return { ok: (response.text ?? "").toLowerCase().includes("ok"), model: MODEL_FAST };
  } catch (error) {
    return { ok: false, model: MODEL_FAST };
  }
}
