import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

const env: Record<string, string> = {
  SUPABASE_URL: 'https://proj.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  GEMINI_API_KEY: 'k',
  ALLOWED_ORIGINS: 'https://www.aiduoficial.com',
};
let handler: (req: Request) => Promise<Response>;

beforeAll(async () => {
  (globalThis as any).Deno = { env: { get: (k: string) => env[k] }, serve: () => {} };
  ({ handler } = await import('../../supabase/functions/tareas-ia/index.ts'));
});
afterEach(() => vi.unstubAllGlobals());

const req = (body: unknown, auth = 'Bearer user-token') =>
  new Request('https://proj.supabase.co/functions/v1/tareas-ia', {
    method: 'POST',
    headers: { origin: 'https://www.aiduoficial.com', authorization: auth, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const context = { today: '2026-11-18', weekday: 'miércoles', clients: ['Café Aroma'], tasks: [] };

function mockFetch(member: boolean, modelText: string) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    if (url.includes('/rpc/is_portal_member')) return new Response(JSON.stringify(member), { status: 200 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: modelText }] } }] }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('Edge Function tareas-ia', () => {
  it('devuelve acciones limpias para un miembro del portal', async () => {
    const f = mockFetch(true, '{"actions":[{"type":"create","title":"Preparar propuesta","client":"Café Aroma","steps":["Revisar brief","Enviar"]}]}');
    const res = await handler(req({ message: 'tengo que preparar la propuesta de café aroma', context }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ actions: [{ type: 'create', title: 'Preparar propuesta', client: 'Café Aroma', steps: ['Revisar brief', 'Enviar'] }] });
    const gemini = JSON.parse(f.mock.calls[1][1].body as string);
    expect(gemini.generationConfig.responseMimeType).toBe('application/json');
    expect(gemini.contents[0].parts[0].text).toContain('HOY: miércoles 2026-11-18');
  });
  it('rechaza a quien no es miembro o no tiene sesión', async () => {
    mockFetch(false, '{}');
    expect((await handler(req({ message: 'x', context }))).status).toBe(401);
    expect((await handler(req({ message: 'x', context }, ''))).status).toBe(401);
  });
  it('valida la entrada', async () => {
    mockFetch(true, '{}');
    expect((await handler(req({ message: '', context }))).status).toBe(400);
    expect((await handler(req({ message: 'hola', context: { today: 'ayer' } }))).status).toBe(400);
  });
});
