// Proveedor Google Gemini (API REST generateContent). Sin dependencias de Deno para poder probarlo.
// Docs: https://ai.google.dev/api/generate-content

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; error: "REFUSED" | "EMPTY_REPLY" | "UPSTREAM_BUSY" | "NOT_CONFIGURED" | "UPSTREAM_ERROR" };

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function buildGeminiRequest(system: string, messages: ChatMessage[]) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    // Tope de costo por respuesta (incluye el razonamiento interno del modelo).
    generationConfig: { maxOutputTokens: 2048 },
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
): Promise<ChatResult> {
  const res = await fetchImpl(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(buildGeminiRequest(system, messages)),
  });
  if (res.status === 429) return { ok: false, error: "UPSTREAM_BUSY" };
  if (res.status === 401 || res.status === 403) return { ok: false, error: "NOT_CONFIGURED" };
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Una clave inválida llega como 400 con este motivo.
    if (detail.includes("API_KEY_INVALID")) return { ok: false, error: "NOT_CONFIGURED" };
    console.error(`Gemini ${res.status}:`, detail.slice(0, 500));
    return { ok: false, error: "UPSTREAM_ERROR" };
  }
  return readGeminiReply(await res.json());
}
