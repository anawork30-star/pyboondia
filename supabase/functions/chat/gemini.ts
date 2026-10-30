// Proveedor Google Gemini (API REST generateContent). Sin dependencias de Deno para poder probarlo.
// Docs: https://ai.google.dev/api/generate-content

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; error: "REFUSED" | "EMPTY_REPLY" | "UPSTREAM_BUSY" | "NOT_CONFIGURED" | "UPSTREAM_ERROR" };

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const TIMEOUT_MS = 30000;

export function buildGeminiRequest(system: string, messages: ChatMessage[], { thinking = true } = {}) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      // Tope de costo por respuesta (incluye el razonamiento interno del modelo).
      maxOutputTokens: 2048,
      // Chat de atención: razonamiento bajo = respuestas rápidas (por defecto es "medium").
      ...(thinking && { thinkingConfig: { thinkingLevel: "low" } }),
    },
  };
}

type GeminiResponse = {
  promptFeedback?: { blockReason?: string };
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
};

const BLOCKED_FINISH = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"]);

export function readGeminiReply(data: GeminiResponse): ChatResult {
  if (data.promptFeedback?.blockReason) return { ok: false, error: "REFUSED" };
  const candidate = data.candidates?.[0];
  if (!candidate) return { ok: false, error: "EMPTY_REPLY" };
  if (candidate.finishReason && BLOCKED_FINISH.has(candidate.finishReason)) return { ok: false, error: "REFUSED" };
  const reply = (candidate.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
    .trim();
  return reply ? { ok: true, reply } : { ok: false, error: "EMPTY_REPLY" };
}

export async function askGemini(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[],
  fetchImpl: typeof fetch = fetch,
  { thinking = true } = {},
): Promise<ChatResult> {
  const started = Date.now();
  let res: Response;
  try {
    res = await fetchImpl(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(buildGeminiRequest(system, messages, { thinking })),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`Gemini sin respuesta tras ${Date.now() - started} ms:`, String(error));
    return { ok: false, error: "UPSTREAM_BUSY" };
  }
  console.log(`Gemini ${model}: HTTP ${res.status} en ${Date.now() - started} ms`);
  if (res.status === 429) return { ok: false, error: "UPSTREAM_BUSY" };
  if (res.status === 401 || res.status === 403) return { ok: false, error: "NOT_CONFIGURED" };
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Una clave inválida llega como 400 con este motivo.
    if (detail.includes("API_KEY_INVALID")) return { ok: false, error: "NOT_CONFIGURED" };
    // Si el modelo no admite el ajuste de razonamiento, se reintenta una vez sin él.
    if (res.status === 400 && thinking && /thinking/i.test(detail)) {
      return askGemini(apiKey, model, system, messages, fetchImpl, { thinking: false });
    }
    console.error(`Gemini ${res.status}:`, detail.slice(0, 500));
    return { ok: false, error: "UPSTREAM_ERROR" };
  }
  return readGeminiReply(await res.json());
}
