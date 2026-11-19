import { describe, it, expect, vi } from 'vitest';
import { parseCommand, parseDue, startOfWeek, toISODate, weekStats } from '../../src/lib/taskLogic.js';
import { findClient, runAssistant } from '../../src/lib/taskAssistant.js';

const today = new Date(2026, 10, 18); // miércoles 18 nov 2026

describe('intérprete del asistente de tareas', () => {
  it('crea una tarea con cliente, prioridad, fecha, pasos y observación', () => {
    expect(
      parseCommand('Nueva tarea: Parrilla de diciembre, cliente: Café Aroma, prioridad alta, vence viernes, pasos: brief; bocetos; aprobación, obs: esperan fotos', { today }),
    ).toEqual({
      type: 'create',
      title: 'Parrilla de diciembre',
      client: 'Café Aroma',
      priority: 'alta',
      due: '2026-11-20',
      steps: ['brief', 'bocetos', 'aprobación'],
      observation: 'esperan fotos',
    });
  });
  it('anota texto libre como tarea y entiende fechas al final', () => {
    expect(parseCommand('Enviar cotización a Dermacol para el viernes', { today })).toEqual({ type: 'create', title: 'Enviar cotización a Dermacol', due: '2026-11-20' });
    expect(parseCommand('anota renovar dominio propia urgente', { today })).toMatchObject({ title: 'Renovar dominio', own: true, priority: 'alta' });
  });
  it('cambia el estado según el número de tarea', () => {
    expect(parseCommand('T-12 en progreso')).toEqual({ type: 'update', number: 12, status: 'en_progreso' });
    expect(parseCommand('la 3 está lista')).toEqual({ type: 'update', number: 3, status: 'completada' });
    expect(parseCommand('Tarea 9 terminada')).toMatchObject({ number: 9, status: 'completada' });
    expect(parseCommand('#8 en espera')).toMatchObject({ number: 8, status: 'en_espera' });
  });
  it('agrega observaciones, pasos y cliente a una tarea existente', () => {
    expect(parseCommand('T-4 en espera, obs: no han enviado el logo')).toEqual({ type: 'update', number: 4, status: 'en_espera', observation: 'no han enviado el logo' });
    expect(parseCommand('T-4 llamé al cliente y confirmó')).toEqual({ type: 'update', number: 4, observation: 'llamé al cliente y confirmó' });
    expect(parseCommand('T-2 paso: revisar métricas')).toEqual({ type: 'update', number: 2, steps: ['revisar métricas'] });
    expect(parseCommand('T-2 paso 1 y 3 listos')).toEqual({ type: 'update', number: 2, doneSteps: [1, 3] });
    expect(parseCommand('T-5 cliente: Café Aroma')).toEqual({ type: 'update', number: 5, client: 'Café Aroma' });
    expect(parseCommand('T-5 propia')).toEqual({ type: 'update', number: 5, own: true });
  });
  it('reconoce consultas y comandos', () => {
    expect(parseCommand('T-7')).toEqual({ type: 'show', number: 7 });
    expect(parseCommand('eliminar T-7')).toEqual({ type: 'delete', number: 7 });
    expect(parseCommand('pendientes')).toEqual({ type: 'list' });
    expect(parseCommand('pendientes de Café Aroma')).toEqual({ type: 'list', client: 'Café Aroma' });
    expect(parseCommand('resumen')).toEqual({ type: 'summary' });
    expect(parseCommand('nuevo cliente: Dermacol')).toEqual({ type: 'addClient', name: 'Dermacol' });
    expect(parseCommand('¿qué hago?')).toMatchObject({ type: 'help' });
  });
});

describe('fechas', () => {
  it('entiende fechas relativas y absolutas', () => {
    expect(parseDue('hoy', today)).toBe('2026-11-18');
    expect(parseDue('mañana', today)).toBe('2026-11-19');
    expect(parseDue('lunes', today)).toBe('2026-11-23');
    expect(parseDue('25/11', today)).toBe('2026-11-25');
    expect(parseDue('2/1', today)).toBe('2027-01-02');
    expect(parseDue('31/02', today)).toBeNull();
  });
  it('la semana empieza el lunes', () => {
    expect(toISODate(startOfWeek(today))).toBe('2026-11-16');
    expect(toISODate(startOfWeek(new Date(2026, 10, 22)))).toBe('2026-11-16');
  });
});

describe('estadísticas semanales', () => {
  const at = (d: number, h = 10) => new Date(2026, 10, d, h).toISOString();
  const base = { priority: 'media', steps: [], observations: [], client_id: null };
  const tasks = [
    { ...base, id: 'a', number: 1, status: 'completada', created_at: at(10), completed_at: at(17), due_date: '2026-11-17' },
    { ...base, id: 'b', number: 2, status: 'en_progreso', created_at: at(16), completed_at: null, due_date: null, client_id: 'c1', client_name: 'Café' },
    { ...base, id: 'c', number: 3, status: 'pendiente', created_at: at(2), completed_at: null, due_date: '2026-11-12' },
    { ...base, id: 'd', number: 4, status: 'completada', created_at: at(2), completed_at: at(5), due_date: null },
    { ...base, id: 'e', number: 5, status: 'pendiente', created_at: at(1), completed_at: null, due_date: '2026-12-20' },
  ];
  it('calcula avance, vencidas y agrupación por cliente', () => {
    const s = weekStats(tasks, today, new Date(2026, 10, 18, 12));
    expect(s.commitments.map((t) => t.id).sort()).toEqual(['a', 'b', 'c']);
    expect(s.done).toBe(1);
    expect(s.progress).toBe(33);
    expect(s.overdue.map((t) => t.id)).toEqual(['c']);
    expect(s.byDay[1].completed).toBe(1);
    expect(s.byClient.find((g) => g.key === 'c1')).toMatchObject({ name: 'Café', total: 1, done: 0 });
  });
});

describe('ejecución del asistente', () => {
  const t1 = { id: 'x1', number: 1, title: 'Propuesta', status: 'pendiente', priority: 'media', client_id: null, due_date: null, steps: [{ text: 'a', done: false }], observations: [] };
  const api = {
    createTask: vi.fn(async (f) => ({ id: 'n', number: 2, created_at: new Date().toISOString(), ...f })),
    updateTask: vi.fn(async (id, patch) => ({ ...t1, ...patch })),
    deleteTask: vi.fn(async () => {}),
    createClient: vi.fn(async (name) => ({ id: 'cnew', name })),
  };
  it('crea el cliente si no existe y anota la tarea', async () => {
    const r = await runAssistant('Nueva tarea: Logo, cliente: Dermacol', { tasks: [t1], clients: [], api, today });
    expect(api.createClient).toHaveBeenCalledWith('Dermacol');
    expect(r.tasks).toHaveLength(2);
    expect(r.text).toContain('T-2');
  });
  it('actualiza estado y observación por número', async () => {
    const r = await runAssistant('T-1 en progreso, obs: enviada al cliente', { tasks: [t1], clients: [], api, today });
    expect(api.updateTask).toHaveBeenCalledWith('x1', expect.objectContaining({ status: 'en_progreso' }));
    expect(r.tasks?.[0].observations[0].text).toBe('enviada al cliente');
  });
  it('pide confirmación antes de eliminar', async () => {
    const ask = await runAssistant('eliminar T-1', { tasks: [t1], clients: [], api, today });
    expect(api.deleteTask).not.toHaveBeenCalled();
    const ok = await runAssistant('sí', { tasks: [t1], clients: [], api, today, pending: ask.pending });
    expect(api.deleteTask).toHaveBeenCalledWith('x1');
    expect(ok.tasks).toHaveLength(0);
  });
  it('avisa si la tarea no existe', async () => {
    const r = await runAssistant('T-99 lista', { tasks: [t1], clients: [], api, today });
    expect(r.text).toContain('No encuentro la tarea T-99');
  });
  it('busca clientes sin importar tildes ni mayúsculas', () => {
    expect(findClient([{ id: '1', name: 'Café Aroma' }], 'cafe aroma')?.id).toBe('1');
    expect(findClient([{ id: '1', name: 'Café Aroma' }], 'aroma')?.id).toBe('1');
  });
});

import { runSmartAssistant, wantsAI } from '../../src/lib/tasksAI.js';
import { parseCommand as parse } from '../../src/lib/taskLogic.js';
import { parseModelJson, sanitizeActions } from '../../supabase/functions/tareas-ia/index.ts';

describe('asistente con IA', () => {
  const t1 = { id: 'x1', number: 1, title: 'Propuesta', status: 'pendiente', priority: 'media', client_id: null, due_date: null, steps: [{ text: 'a', done: true }], observations: [] };
  const api = {
    createTask: vi.fn(async (f) => ({ id: `n${Math.random()}`, number: 2, created_at: new Date().toISOString(), ...f })),
    updateTask: vi.fn(async (id, patch) => ({ ...t1, ...patch })),
    deleteTask: vi.fn(async () => {}),
    createClient: vi.fn(async (name) => ({ id: 'c1', name })),
  };

  it('usa la IA para dictados, tareas nuevas y pedidos de paso a paso, no para comandos claros', () => {
    expect(wantsAI('T-3 en progreso', parse('T-3 en progreso'))).toBe(false);
    expect(wantsAI('pendientes', parse('pendientes'))).toBe(false);
    expect(wantsAI('la tres ya está lista', parse('la tres ya está lista'), { voice: true })).toBe(true);
    expect(wantsAI('Preparar propuesta para Café', parse('Preparar propuesta para Café'))).toBe(true);
    expect(wantsAI('dame el paso a paso de la T-3', parse('dame el paso a paso de la T-3'))).toBe(true);
  });

  it('crea varias tareas dictadas con su paso a paso', async () => {
    const ai = vi.fn(async () => ({
      actions: [
        { type: 'create', title: 'Preparar propuesta de redes', client: 'Café Aroma', priority: 'alta', steps: ['Revisar brief', 'Definir pilares', 'Enviar'] },
        { type: 'create', title: 'Renovar dominio', own: true, steps: ['Entrar al registrador', 'Pagar'] },
      ],
    }));
    const r = await runSmartAssistant('tengo que preparar la propuesta… y renovar el dominio', { tasks: [], clients: [], api }, { voice: true, ai });
    expect(r.ai).toBe(true);
    expect(r.tasks).toHaveLength(2);
    expect(r.tasks?.[0].steps).toEqual([{ text: 'Revisar brief', done: false }, { text: 'Definir pilares', done: false }, { text: 'Enviar', done: false }]);
    expect(r.text).toContain('Paso a paso:');
  });

  it('reemplaza los pasos de una tarea existente si se pide rehacerlos', async () => {
    const ai = vi.fn(async () => ({ actions: [{ type: 'update', number: 1, steps: ['Uno', 'Dos'], replaceSteps: true }] }));
    const r = await runSmartAssistant('rehaz el paso a paso de la 1', { tasks: [t1], clients: [], api }, { ai });
    expect(api.updateTask).toHaveBeenLastCalledWith('x1', { steps: [{ text: 'Uno', done: false }, { text: 'Dos', done: false }] });
    expect(r.ai).toBe(true);
  });

  it('si la IA falla, anota con el intérprete local y avisa', async () => {
    const ai = vi.fn(async () => {
      throw new Error('AI_UNAVAILABLE');
    });
    const r = await runSmartAssistant('Enviar cotización a Dermacol', { tasks: [], clients: [], api }, { ai });
    expect(r.ai).toBe(false);
    expect(r.tasks).toHaveLength(1);
    expect(r.text).toContain('no pude conectar con la IA');
  });

  it('la función filtra lo que devuelve el modelo', () => {
    const out = sanitizeActions(
      parseModelJson('```json\n{"actions":[{"type":"create","title":"X","steps":["a",3,"b"],"status":"raro","due":"mañana"},{"type":"drop_table"},{"type":"update"}],"note":"ok"}\n```'),
    );
    expect(out).toEqual({ actions: [{ type: 'create', title: 'X', steps: ['a', 'b'] }], note: 'ok' });
  });
});

import { runVoiceNote } from '../../src/lib/tasksAI.js';
import { clientColor } from '../../src/components/tareas/styles.js';

describe('Notas de voz y etiquetas de cliente', () => {
  const clients = [
    { id: 'c1', name: 'Colsanitas' },
    { id: 'c2', name: 'EPS Sanitas' },
  ];
  const api = {
    createTask: vi.fn(async (f) => ({ id: `n${Math.random()}`, number: 1, created_at: new Date().toISOString(), ...f })),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    createClient: vi.fn(async (name) => ({ id: 'cnew', name })),
  };

  it('distingue Colsanitas de EPS Sanitas', () => {
    expect(findClient(clients, 'colsanitas')?.id).toBe('c1');
    expect(findClient(clients, 'eps sanitas')?.id).toBe('c2');
    expect(findClient(clients, 'sanitas')?.id).toBe('c2');
    expect(findClient(clients, 'EPS')?.id).toBe('c2');
  });

  it('cada cliente tiene siempre el mismo color', () => {
    expect(clientColor('EPS Sanitas')).toEqual(clientColor('eps sanitas'));
    expect(clientColor('Colsanitas').bg).toMatch(/^#/);
  });

  it('una nota de voz crea tareas con su cliente y devuelve la transcripción', async () => {
    const ai = vi.fn(async () => ({
      transcript: 'Para EPS Sanitas tengo que revisar la parrilla de diciembre.',
      actions: [{ type: 'create', title: 'Revisar parrilla de diciembre', client: 'EPS Sanitas', steps: ['Abrir parrilla', 'Revisar', 'Enviar ajustes'] }],
    }));
    const audio = { mimeType: 'audio/mp4', data: 'AAAA', seconds: 7 };
    const r = await runVoiceNote(audio, { tasks: [], clients, api }, { ai });
    expect(ai.mock.calls[0][1].audio).toBe(audio);
    expect(r.transcript).toContain('EPS Sanitas');
    expect(r.tasks?.[0].client_id).toBe('c2');
    expect(r.ai).toBe(true);
  });

  it('si la nota no se entiende, solo responde la nota del modelo', async () => {
    const ai = vi.fn(async () => ({ transcript: '', actions: [{ type: 'help' }], note: 'No logré entender la nota de voz.' }));
    const r = await runVoiceNote({ mimeType: 'audio/webm', data: 'AAAA', seconds: 2 }, { tasks: [], clients, api }, { ai });
    expect(r.text).toBe('No logré entender la nota de voz.');
    expect(r.tasks).toBeUndefined();
  });

  it('si la IA falla, avisa sin crear nada', async () => {
    const ai = vi.fn(async () => {
      throw new Error('AI_UNAVAILABLE');
    });
    const r = await runVoiceNote({ mimeType: 'audio/mp4', data: 'AAAA', seconds: 3 }, { tasks: [], clients, api }, { ai });
    expect(r.failed).toBe(true);
    expect(r.text).toContain('nota de voz');
  });
});
