import { describe, it, expect, vi } from 'vitest';
import { askGemini, buildGeminiRequest, readGeminiReply } from '../../supabase/functions/chat/gemini.ts';

const history = [
  { role: 'user' as const, content: 'Hola' },
  { role: 'assistant' as const, content: '¡Hola! ¿En qué te ayudo?' },
  { role: 'user' as const, content: '¿Qué es UGC?' },
];

describe('Gemini: petición', () => {
  it('convierte roles y envía la instrucción de sistema', () => {
    const body = buildGeminiRequest('SISTEMA', history);
    expect(body.systemInstruction.parts[0].text).toBe('SISTEMA');
    expect(body.contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(body.contents[2].parts[0].text).toBe('¿Qué es UGC?');
  });
  it('llama al endpoint con la clave en la cabecera, no en la URL', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Respuesta' }] } }] }), { status: 200 }),
    );
    await expect(askGemini('clave', 'gemini-3.8-flash', 'S', history, fetchImpl)).resolves.toEqual({ ok: true, reply: 'Respuesta' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
    expect(url).not.toContain('clave');
    expect(init.headers['x-goog-api-key']).toBe('clave');
  });
});

describe('Gemini: respuesta', () => {
  it('ignora las partes de razonamiento interno', () => {
    expect(
      readGeminiReply({ candidates: [{ content: { parts: [{ text: 'pensando…', thought: true }, { text: 'Hola ' }, { text: 'mundo' }] } }] }),
    ).toEqual({ ok: true, reply: 'Hola mundo' });
  });
  it('trata los bloqueos de seguridad como rechazo', () => {
    expect(readGeminiReply({ promptFeedback: { blockReason: 'SAFETY' } })).toEqual({ ok: false, error: 'REFUSED' });
    expect(readGeminiReply({ candidates: [{ finishReason: 'SAFETY' }] })).toEqual({ ok: false, error: 'REFUSED' });
  });
  it('pide razonamiento bajo y reintenta sin él si el modelo no lo admite', async () => {
    expect(buildGeminiRequest('S', history).generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'low' });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"error":{"message":"Unknown field thinking_level"}}', { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }), { status: 200 }));
    await expect(askGemini('k', 'm', 'S', history, fetchImpl)).resolves.toEqual({ ok: true, reply: 'OK' });
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body).generationConfig.thinkingConfig).toBeUndefined();
  });
  it('no se queda colgado si Gemini no responde', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError'));
    await expect(askGemini('k', 'm', 'S', history, fetchImpl)).resolves.toEqual({ ok: false, error: 'UPSTREAM_BUSY' });
  });
  it('distingue límite de uso y clave inválida', async () => {
    const r429 = vi.fn().mockResolvedValue(new Response('{}', { status: 429 }));
    const rBadKey = vi.fn().mockResolvedValue(new Response('{"error":{"details":[{"reason":"API_KEY_INVALID"}]}}', { status: 400 }));
    await expect(askGemini('k', 'm', 'S', history, r429)).resolves.toEqual({ ok: false, error: 'UPSTREAM_BUSY' });
    await expect(askGemini('k', 'm', 'S', history, rBadKey)).resolves.toEqual({ ok: false, error: 'NOT_CONFIGURED' });
  });
});
