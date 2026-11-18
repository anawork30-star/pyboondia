// Edge Function "tareas-ia": convierte lo que la usuaria escribe o dicta en acciones del tablero de
// tareas (crear, actualizar, listar…) y propone el paso a paso de cada tarea.
//
// - Solo responde a sesiones del portal privado (verifica is_portal_member con el token de la usuaria).
// - NO escribe en la base de datos: devuelve acciones y el navegador las aplica con la sesión de la
//   usuaria, así que RLS sigue protegiendo los datos.
// - Usa el mismo secreto GEMINI_API_KEY del chat del sitio (y GEMINI_MODEL / ALLOWED_ORIGINS si existen).
//
// Archivo autocontenido (sin imports locales) para poder pegarlo tal cual en el editor de
// Edge Functions del panel de Supabase. Despliegue por CLI: npx supabase functions deploy tareas-ia

const MAX_MESSAGE = 2000;
const MAX_ACTIONS = 10;
const MAX_STEPS = 12;
const RATE_LIMIT = { max: 40, windowMs: 10 * 60 * 1000 }; // por usuaria y por instancia
const TIMEOUT_MS = 30000;

const TYPES = new Set(["create", "update", "show", "delete", "list", "summary", "help", "addClient", "clients"]);
const STATUSES = new Set(["pendiente", "en_progreso", "en_espera", "completada"]);
const PRIORITIES = new Set(["alta", "media", "baja"]);

export type TaskContext = {
  today: string; // YYYY-MM-DD (hora local de la usuaria)
  weekday: string; // "miércoles"
  clients: string[];
  tasks: { number: number; title: string; status: string; client: string | null; steps: number }[];
};

export const SYSTEM_PROMPT = `Eres el asistente de tareas de una agencia de marketing digital (AIDU). La usuaria te escribe o te DICTA POR VOZ sus pendientes en español de Colombia. El dictado llega sin puntuación y con muletillas ("eh", "este", "o sea"); interprétalo con sentido común.

Tu trabajo: convertir el mensaje en acciones para su tablero kanban y, sobre todo, proponer un PASO A PASO útil para cada tarea.

Responde SOLO con JSON válido, con esta forma:
{"actions":[ ... ],"note":"comentario breve opcional"}

Cada acción es un objeto con "type" y los campos que apliquen:
- "create": nueva tarea. Campos: "title" (corto, empieza con verbo en infinitivo, máx. 90 caracteres), "client" (solo si lo menciona), "own": true (si dice que es propia/personal/interna), "priority" ("alta"|"media"|"baja", solo si se deduce: urgente/importante = alta), "due" (YYYY-MM-DD), "steps" (lista de pasos), "observation" (contexto o detalles útiles que dijo y no caben en el título).
- "update": cambia una tarea existente. Campos: "number" (número de la tarea), y los que cambien: "status" ("pendiente"|"en_progreso"|"en_espera"|"completada"), "title", "client", "own", "priority", "due", "steps" (pasos nuevos a agregar), "replaceSteps": true (solo si pide rehacer o reemplazar los pasos), "doneSteps" (números de pasos que ya hizo, empezando en 1), "observation".
- "show" (ver detalle, con "number"), "delete" (con "number"), "list" (filtros opcionales: "status", "client", "own": true, "overdue": true), "summary" (avance de la semana), "clients", "addClient" (con "name"), "help".

Reglas:
- Si dicta varios pendientes, crea una acción "create" por cada uno.
- PASO A PASO: en cada "create" incluye SIEMPRE de 3 a 7 pasos concretos, ordenados y accionables (verbo en infinitivo, máx. 100 caracteres cada uno), adaptados a lo que contó y al trabajo de una agencia (estrategia, contenido, pauta, web, chatbots, clientes). Si ella dictó pasos, úsalos y complétalos solo si faltan pasos obvios. No inventes datos (cifras, nombres, fechas) que no dijo.
- Si pide el paso a paso, un plan o "cómo hago" una tarea existente, usa "update" con "steps" para esa tarea (con "replaceSteps": true si ya tenía pasos y pide rehacerlos).
- Las tareas se identifican por número: "T-3", "tarea 3", "la tres", "la número tres" = number 3. Usa la lista TAREAS para reconocer a cuál se refiere si la nombra por su título.
- Estados: "ya la terminé/lista/hecha" = completada; "empecé/estoy en eso" = en_progreso; "esperando al cliente/bloqueada" = en_espera.
- Clientes: si el nombre se parece a uno de CLIENTES, usa exactamente ese nombre. No inventes clientes. Si no menciona cliente, no pongas "client".
- Fechas: calcúlalas desde HOY. "el viernes" = el próximo viernes (o hoy si hoy es viernes y lo dice así). Sin fecha mencionada, no pongas "due".
- Si el mensaje no pide nada sobre tareas, responde {"actions":[{"type":"help"}]}.
- No incluyas texto fuera del JSON.`;

export function buildUserPrompt(message: string, ctx: TaskContext): string {
  const tasks = ctx.tasks
    .slice(0, 80)
    .map((t) => `T-${t.number} | ${t.title} | ${t.status} | ${t.client ?? "propia"} | ${t.steps} pasos`)
    .join("\n");
  return [
    `HOY: ${ctx.weekday} ${ctx.today}`,
    `CLIENTES: ${ctx.clients.length ? ctx.clients.join(", ") : "(ninguno)"}`,
    `TAREAS ABIERTAS:\n${tasks || "(ninguna)"}`,
    `MENSAJE DE LA USUARIA:\n${message}`,
  ].join("\n\n");
}

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const num = (v: unknown) => (Number.isInteger(v) && (v as number) > 0 && (v as number) < 100000 ? (v as number) : undefined);

/** Valida y recorta lo que devuelve el modelo: solo pasan campos y valores conocidos. */
export function sanitizeActions(raw: unknown): { actions: Record<string, unknown>[]; note?: string } {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const list = Array.isArray(obj.actions) ? obj.actions : [];
  const actions: Record<string, unknown>[] = [];
  for (const a of list.slice(0, MAX_ACTIONS)) {
    if (!a || typeof a !== "object") continue;
    const r = a as Record<string, unknown>;
    if (typeof r.type !== "string" || !TYPES.has(r.type)) continue;
    const out: Record<string, unknown> = { type: r.type };
    const number = num(r.number);
    if (number) out.number = number;
    const title = str(r.title, 200);
    if (title) out.title = title;
    const client = str(r.client, 80);
    if (client) out.client = client;
    const name = str(r.name, 80);
    if (name) out.name = name;
    if (r.own === true) out.own = true;
    if (r.overdue === true) out.overdue = true;
    if (r.replaceSteps === true) out.replaceSteps = true;
    if (typeof r.priority === "string" && PRIORITIES.has(r.priority)) out.priority = r.priority;
    if (typeof r.status === "string" && STATUSES.has(r.status)) out.status = r.status;
    if (typeof r.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.due)) out.due = r.due;
    const observation = str(r.observation, 1000);
    if (observation) out.observation = observation;
    if (Array.isArray(r.steps)) {
      const steps = r.steps.map((s) => str(s, 200)).filter(Boolean).slice(0, MAX_STEPS);
      if (steps.length) out.steps = steps;
    }
    if (Array.isArray(r.doneSteps)) {
      const done = r.doneSteps.map(num).filter(Boolean).slice(0, MAX_STEPS);
      if (done.length) out.doneSteps = done;
    }
    // Acciones que necesitan número de tarea o título.
    if (["update", "show", "delete"].includes(r.type) && !out.number) continue;
    if (r.type === "create" && !out.title) continue;
    if (r.type === "addClient" && !out.name) continue;
    actions.push(out);
  }
  return { actions, note: str(obj.note, 300) };
}

/** Extrae el JSON de la respuesta del modelo (tolera ```json … ```). */
export function parseModelJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

function sanitizeContext(input: unknown): TaskContext | null {
  if (!input || typeof input !== "object") return null;
  const c = input as Record<string, unknown>;
  if (typeof c.today !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(c.today)) return null;
  return {
    today: c.today,
    weekday: str(c.weekday, 12) ?? "",
    clients: Array.isArray(c.clients) ? c.clients.map((x) => str(x, 80)).filter(Boolean).slice(0, 200) as string[] : [],
    tasks: Array.isArray(c.tasks)
      ? c.tasks
          .slice(0, 200)
          .map((t) => {
            const r = (t ?? {}) as Record<string, unknown>;
            return {
              number: num(r.number) ?? 0,
              title: str(r.title, 200) ?? "",
              status: typeof r.status === "string" && STATUSES.has(r.status) ? r.status : "pendiente",
              client: str(r.client, 80) ?? null,
              steps: Number.isInteger(r.steps) ? (r.steps as number) : 0,
            };
          })
          .filter((t) => t.number && t.title)
      : [],
  };
}

// ------------------------------------------------------------------------------- Servidor (Deno)

declare const Deno: {
  env: { get(k: string): string | undefined };
  serve(h: (req: Request) => Response | Promise<Response>): void;
};

const hits = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE_LIMIT.max;
}

export async function handler(req: Request): Promise<Response> {
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
    "https://www.aiduoficial.com,https://aiduoficial.com,http://localhost:5173,http://localhost:4173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = req.headers.get("origin");
  const cors: HeadersInit = {
    "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  if (origin && !allowedOrigins.includes(origin)) return json({ error: "ORIGIN_NOT_ALLOWED" }, 403);

  // Solo miembros del portal: se consulta is_portal_member() con el token de la usuaria.
  const auth = req.headers.get("authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!auth.startsWith("Bearer ") || !supabaseUrl || !anonKey) return json({ error: "UNAUTHORIZED" }, 401);
  const member = await fetch(`${supabaseUrl}/rest/v1/rpc/is_portal_member`, {
    method: "POST",
    headers: { apikey: anonKey, Authorization: auth, "Content-Type": "application/json" },
    body: "{}",
  }).catch(() => null);
  if (!member || !member.ok || (await member.json().catch(() => false)) !== true) return json({ error: "UNAUTHORIZED" }, 401);
  if (rateLimited(auth.slice(-32))) return json({ error: "RATE_LIMITED" }, 429);

  let message = "";
  let ctx: TaskContext | null = null;
  try {
    const body = await req.json();
    message = typeof body?.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE) : "";
    ctx = sanitizeContext(body?.context);
  } catch {
    // cuerpo inválido
  }
  if (!message || !ctx) return json({ error: "INVALID_INPUT" }, 400);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.8-flash";
  if (!apiKey) return json({ error: "NOT_CONFIGURED" }, 503);

  const request = (thinking: boolean) => ({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(message, ctx!) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
      temperature: 0.4,
      ...(thinking && { thinkingConfig: { thinkingLevel: "low" } }),
    },
  });

  const started = Date.now();
  let res: Response | null = null;
  for (const thinking of [true, false]) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(request(thinking)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => null);
    // Si el modelo no admite el ajuste de razonamiento, se reintenta una vez sin él.
    if (res && res.status === 400 && thinking) {
      const detail = await res.clone().text().catch(() => "");
      if (/thinking/i.test(detail)) continue;
    }
    break;
  }
  console.log(`tareas-ia ${model}: HTTP ${res?.status ?? "sin respuesta"} en ${Date.now() - started} ms`);
  if (!res) return json({ error: "UPSTREAM_BUSY" }, 503);
  if (res.status === 429) return json({ error: "UPSTREAM_BUSY" }, 503);
  if (!res.ok) {
    console.error(`Gemini ${res.status}:`, (await res.text().catch(() => "")).slice(0, 500));
    return json({ error: "UPSTREAM_ERROR" }, 502);
  }
  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .filter((p: { thought?: boolean; text?: string }) => !p.thought && typeof p.text === "string")
    .map((p: { text: string }) => p.text)
    .join("");
  let parsed: unknown = null;
  try {
    parsed = parseModelJson(text);
  } catch {
    parsed = null;
  }
  const result = sanitizeActions(parsed);
  if (!result.actions.length) return json({ error: "EMPTY_REPLY" }, 502);
  return json(result);
}

if (typeof Deno !== "undefined") Deno.serve(handler);
