// Asistente de tareas con IA: envía el mensaje (escrito o dictado) a la Edge Function "tareas-ia",
// que devuelve acciones (crear, actualizar…) con un paso a paso propuesto. Las acciones se aplican
// aquí con la sesión de la usuaria (RLS). Si la IA no está disponible, se usa el intérprete local.
import { fold, parseCommand, toISODate } from './taskLogic.js'
import { executeCommand } from './taskAssistant.js'
import { getSupabase } from './supabase.js'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
// Peticiones de plan o paso a paso: siempre van a la IA.
const STEPS_RE = /\b(paso a paso|pasos para|plan (de|para)|como (hago|hacer|abordo|empiezo)|dame (los |unos )?pasos|arma(me)? (los )?pasos|desglosa)\b/

export function buildContext(tasks, clients, today = new Date()) {
  const name = (id) => clients.find((c) => c.id === id)?.name ?? null
  return {
    today: toISODate(today),
    weekday: WEEKDAYS[today.getDay()],
    clients: clients.map((c) => c.name),
    tasks: tasks
      .filter((t) => t.status !== 'completada')
      .map((t) => ({ number: t.number, title: t.title, status: t.status, client: name(t.client_id), steps: t.steps?.length ?? 0 })),
  }
}

export async function askTasksAI(message, { tasks, clients, today }) {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('NOT_CONFIGURED')
  const { data, error } = await supabase.functions.invoke('tareas-ia', {
    body: { message, context: buildContext(tasks, clients, today) },
    timeout: 35000,
  })
  if (error || !Array.isArray(data?.actions) || !data.actions.length) throw new Error('AI_UNAVAILABLE')
  return data
}

/** ¿Conviene usar la IA para este mensaje? Los comandos claros se resuelven localmente (más rápido). */
export function wantsAI(message, cmd, { voice = false } = {}) {
  if (['yes', 'no', 'greet', 'empty'].includes(cmd.type)) return false
  if (voice) return true
  if (STEPS_RE.test(fold(message))) return true
  return cmd.type === 'create' || (cmd.type === 'help' && cmd.hint === 'unknown')
}

/**
 * Procesa un mensaje del chat. Devuelve lo mismo que runAssistant: { text, tasks?, clients?, pending?, focus? }
 * y además `ai: true|false` para saber qué motor respondió.
 */
export async function runSmartAssistant(message, ctx, { voice = false, ai = askTasksAI } = {}) {
  const today = ctx.today ?? new Date()
  const cmd = parseCommand(message, { today })
  if (ctx.pending && (cmd.type === 'yes' || cmd.type === 'no')) return { ...(await executeCommand(cmd, ctx)), ai: false }
  if (!wantsAI(message, cmd, { voice })) return { ...(await executeCommand(cmd, ctx)), ai: false }

  let result
  try {
    result = await ai(message, { tasks: ctx.tasks, clients: ctx.clients, today })
  } catch {
    // Sin IA: el intérprete local hace lo que puede y se avisa.
    const local = await executeCommand(cmd, ctx)
    const warn =
      cmd.type === 'help'
        ? 'No pude conectar con la IA para entender ese mensaje. Prueba de nuevo o escríbelo con el formato de los ejemplos.'
        : 'Nota: no pude conectar con la IA, así que lo anoté con el intérprete básico y sin proponer pasos.'
    return { ...local, text: cmd.type === 'help' ? `${warn}\n\n${local.text}` : `${local.text}\n\n${warn}`, ai: false }
  }

  let { tasks, clients } = ctx
  let focus
  let pending = null
  const texts = []
  for (const action of result.actions) {
    try {
      const r = await executeCommand(action, { ...ctx, tasks, clients, pending: null })
      if (r.tasks) tasks = r.tasks
      if (r.clients) clients = r.clients
      if (r.focus) focus = r.focus
      if (r.pending) pending = r.pending
      texts.push(r.text)
    } catch (err) {
      if (err?.code === 'EXPIRED') throw err
      const what = action.type === 'create' ? `"${action.title}"` : action.number ? `T-${action.number}` : 'esa acción'
      texts.push(`No pude guardar ${what}: ${err.message}`)
    }
  }
  if (result.note) texts.push(result.note)
  return {
    text: texts.join('\n\n———\n\n'),
    tasks: tasks !== ctx.tasks ? tasks : undefined,
    clients: clients !== ctx.clients ? clients : undefined,
    focus,
    pending,
    ai: true,
  }
}

