// Ejecuta lo que se escribe en el chat del tablero: interpreta el mensaje (taskLogic.parseCommand),
// aplica el cambio con la API inyectada y devuelve la respuesta del asistente.
// `api` tiene la forma de src/lib/tasks.js; se inyecta para poder probarlo sin red.
import { PRIORITY_LABEL, STATUS_LABEL, fold, formatDate, parseCommand, startOfWeek, taskId, toISODate, weekStats } from './taskLogic.js'

export const HELP_TEXT = [
  'Puedes escribirme como hablas. Algunos ejemplos:',
  '• Nueva tarea: Parrilla de diciembre, cliente: Café Aroma, prioridad alta, vence viernes, pasos: brief; bocetos; aprobación, obs: esperan fotos',
  '• Enviar cotización a Dermacol para el lunes (si no indico cliente, queda como tarea propia)',
  '• T-3 en progreso · T-3 en espera · T-3 lista',
  '• T-3 obs: el cliente pidió cambios',
  '• T-3 paso: revisar métricas · T-3 paso 1 listo',
  '• T-3 cliente: Café Aroma · T-3 propia · T-3 vence 25/11 · T-3 prioridad alta',
  '• T-3 (ver detalle) · eliminar T-3',
  '• pendientes · pendientes de Café Aroma · tareas en espera · vencidas',
  '• resumen (avance de la semana) · clientes · nuevo cliente: Dermacol',
].join('\n')

export function findClient(clients, name) {
  const n = fold(name).trim()
  if (!n) return null
  const exact = clients.find((c) => fold(c.name).trim() === n)
  if (exact) return exact
  const partial = clients.filter((c) => fold(c.name).includes(n) || n.includes(fold(c.name)))
  return partial.length === 1 ? partial[0] : null
}

const clientName = (clients, id) => (id ? (clients.find((c) => c.id === id)?.name ?? 'Cliente') : 'Propia')

function describe(t, clients) {
  const bits = [STATUS_LABEL[t.status], clientName(clients, t.client_id), `prioridad ${PRIORITY_LABEL[t.priority].toLowerCase()}`]
  if (t.due_date) bits.push(`vence ${formatDate(t.due_date, { weekday: true })}`)
  if (t.steps?.length) bits.push(`pasos ${t.steps.filter((s) => s.done).length}/${t.steps.length}`)
  return `${taskId(t.number)} · ${t.title}\n${bits.join(' · ')}`
}

function detail(t, clients) {
  const lines = [describe(t, clients)]
  if (t.steps?.length) {
    lines.push('', 'Pasos a seguir:')
    t.steps.forEach((s, i) => lines.push(`${s.done ? '✓' : '○'} ${i + 1}. ${s.text}`))
  }
  if (t.observations?.length) {
    lines.push('', 'Observaciones:')
    t.observations.slice(-5).forEach((o) => lines.push(`– ${o.text} (${formatDate(o.at)})`))
  }
  return lines.join('\n')
}

const reply = (text, extra = {}) => ({ text, ...extra })

/**
 * @param {string} message
 * @param {{ tasks: any[], clients: any[], pending?: any, api: any, today?: Date }} ctx
 * @returns {Promise<{ text: string, tasks?: any[], clients?: any[], pending?: any, focus?: string }>}
 */
export async function runAssistant(message, ctx) {
  const { api, today = new Date() } = ctx
  let { tasks, clients } = ctx
  const cmd = parseCommand(message, { today })
  const byNumber = (n) => tasks.find((t) => t.number === n)
  const notFound = (n) => reply(`No encuentro la tarea ${taskId(n)}. Escribe "pendientes" para ver tus tareas abiertas.`)

  // Confirmación pendiente (eliminar)
  if (ctx.pending?.type === 'delete') {
    if (cmd.type === 'yes') {
      const t = tasks.find((x) => x.id === ctx.pending.id)
      if (!t) return reply('Esa tarea ya no existe.', { pending: null })
      await api.deleteTask(t.id)
      return reply(`Eliminé ${taskId(t.number)} · ${t.title}.`, { tasks: tasks.filter((x) => x.id !== t.id), pending: null })
    }
    if (cmd.type === 'no') return reply('Listo, no eliminé nada.', { pending: null })
  }

  async function resolveClient(name) {
    const found = findClient(clients, name)
    if (found) return { client: found, created: false }
    const created = await api.createClient(name)
    clients = [...clients, created].sort((a, b) => a.name.localeCompare(b.name))
    return { client: created, created: true }
  }

  switch (cmd.type) {
    case 'empty':
      return reply('Escribe una tarea o un comando. Escribe "ayuda" para ver ejemplos.')
    case 'yes':
    case 'no':
    case 'greet':
      return reply('¡Hola! Cuéntame tus pendientes y los anoto en el tablero. Escribe "ayuda" para ver lo que puedo hacer.')
    case 'help':
      return reply(cmd.hint === 'unknown' ? `No estoy seguro de qué hacer con eso.\n\n${HELP_TEXT}` : HELP_TEXT)

    case 'clients':
      return reply(
        clients.length
          ? `Tus clientes:\n${clients.map((c) => `• ${c.name} (${tasks.filter((t) => t.client_id === c.id && t.status !== 'completada').length} abiertas)`).join('\n')}`
          : 'Aún no tienes clientes. Escribe "nuevo cliente: Nombre" o asígnalo al crear una tarea.',
      )
    case 'addClient': {
      const existing = findClient(clients, cmd.name)
      if (existing && fold(existing.name) === fold(cmd.name)) return reply(`${existing.name} ya está en tu lista de clientes.`)
      const created = await api.createClient(cmd.name)
      return reply(`Agregué el cliente ${created.name}.`, { clients: [...clients, created].sort((a, b) => a.name.localeCompare(b.name)) })
    }

    case 'create': {
      if (!cmd.title) return reply('¿Cuál es la tarea? Por ejemplo: "Nueva tarea: enviar propuesta, cliente: Dermacol".')
      const notes = []
      const fields = { title: cmd.title.slice(0, 200), priority: cmd.priority ?? 'media', status: cmd.status ?? 'pendiente' }
      if (cmd.client) {
        const { client, created } = await resolveClient(cmd.client)
        fields.client_id = client.id
        if (created) notes.push(`Creé el cliente ${client.name}.`)
      }
      if (cmd.due) fields.due_date = cmd.due
      if (cmd.invalidDue) notes.push(`No entendí la fecha "${cmd.invalidDue}"; la tarea quedó sin fecha.`)
      fields.steps = (cmd.steps ?? []).map((text) => ({ text, done: false }))
      fields.observations = cmd.observation ? [{ text: cmd.observation, at: new Date().toISOString() }] : []
      const task = await api.createTask(fields)
      return reply([`Anotada ✓\n${describe(task, clients)}`, ...notes].join('\n\n'), {
        tasks: [...tasks, task],
        clients,
        focus: task.id,
      })
    }

    case 'show': {
      const t = byNumber(cmd.number)
      return t ? reply(detail(t, clients), { focus: t.id }) : notFound(cmd.number)
    }

    case 'delete': {
      const t = byNumber(cmd.number)
      if (!t) return notFound(cmd.number)
      return reply(`¿Elimino ${taskId(t.number)} · ${t.title}? Responde "sí" para confirmar o "no" para cancelar.`, {
        pending: { type: 'delete', id: t.id },
      })
    }

    case 'update': {
      const t = byNumber(cmd.number)
      if (!t) return notFound(cmd.number)
      const patch = {}
      const done = []
      const notes = []
      if (cmd.status && cmd.status !== t.status) {
        patch.status = cmd.status
        done.push(`estado → ${STATUS_LABEL[cmd.status]}`)
      } else if (cmd.status) notes.push(`Ya estaba en ${STATUS_LABEL[cmd.status]}.`)
      if (cmd.title) {
        patch.title = cmd.title.slice(0, 200)
        done.push('título actualizado')
      }
      if (cmd.own && t.client_id) {
        patch.client_id = null
        done.push('ahora es tarea propia')
      } else if (cmd.client) {
        const { client, created } = await resolveClient(cmd.client)
        if (client.id !== t.client_id) {
          patch.client_id = client.id
          done.push(`cliente → ${client.name}`)
        }
        if (created) notes.push(`Creé el cliente ${client.name}.`)
      }
      if (cmd.priority && cmd.priority !== t.priority) {
        patch.priority = cmd.priority
        done.push(`prioridad → ${PRIORITY_LABEL[cmd.priority].toLowerCase()}`)
      }
      if (cmd.due !== undefined) {
        patch.due_date = cmd.due || null
        done.push(cmd.due ? `vence ${formatDate(cmd.due, { weekday: true })}` : 'sin fecha límite')
      }
      if (cmd.invalidDue) notes.push(`No entendí la fecha "${cmd.invalidDue}". Prueba con "viernes", "mañana" o "25/11".`)
      let steps = t.steps ?? []
      if (cmd.steps?.length) {
        steps = [...steps, ...cmd.steps.map((text) => ({ text, done: false }))]
        done.push(cmd.steps.length === 1 ? `paso agregado: ${cmd.steps[0]}` : `${cmd.steps.length} pasos agregados`)
      }
      const touch = (list, value, label) => {
        const valid = list.filter((n) => n >= 1 && n <= steps.length)
        const bad = list.filter((n) => n < 1 || n > steps.length)
        if (valid.length) {
          steps = steps.map((s, i) => (valid.includes(i + 1) ? { ...s, done: value } : s))
          done.push(`${valid.length === 1 ? 'paso' : 'pasos'} ${valid.join(', ')} ${label}`)
        }
        if (bad.length) notes.push(`La tarea tiene ${steps.length} paso(s); no existe el ${bad.join(', ')}.`)
      }
      if (cmd.doneSteps?.length) touch(cmd.doneSteps, true, 'completado(s)')
      if (cmd.undoneSteps?.length) touch(cmd.undoneSteps, false, 'pendiente(s)')
      if (cmd.removeSteps?.length) {
        const valid = cmd.removeSteps.filter((n) => n >= 1 && n <= steps.length)
        steps = steps.filter((_, i) => !valid.includes(i + 1))
        if (valid.length) done.push(`paso(s) ${valid.join(', ')} eliminado(s)`)
      }
      if (steps !== (t.steps ?? [])) patch.steps = steps
      if (cmd.observation) {
        patch.observations = [...(t.observations ?? []), { text: cmd.observation, at: new Date().toISOString() }]
        done.push(`observación: "${cmd.observation}"`)
      }
      if (!Object.keys(patch).length) {
        return reply([notes.join(' ') || 'No vi cambios para aplicar.', detail(t, clients)].join('\n\n'), { focus: t.id })
      }
      const updated = await api.updateTask(t.id, patch)
      const allSteps = updated.steps?.length && updated.steps.every((s) => s.done) && updated.status !== 'completada'
      if (allSteps) notes.push(`Todos los pasos están listos. ¿La marco como completada? Escribe "${taskId(t.number)} lista".`)
      return reply([`${taskId(t.number)} actualizada ✓ — ${done.join(' · ')}`, describe(updated, clients), ...notes].join('\n\n'), {
        tasks: tasks.map((x) => (x.id === updated.id ? updated : x)),
        clients,
        focus: updated.id,
      })
    }

    case 'list': {
      const todayISO = toISODate(today)
      let list = tasks.filter((t) => (cmd.status ? t.status === cmd.status : t.status !== 'completada'))
      let title = cmd.status ? `Tareas ${STATUS_LABEL[cmd.status].toLowerCase()}` : 'Tareas abiertas'
      if (cmd.overdue) {
        list = list.filter((t) => t.due_date && t.due_date < todayISO && t.status !== 'completada')
        title = 'Tareas vencidas'
      }
      if (cmd.dueToday) {
        list = list.filter((t) => t.due_date === todayISO)
        title += ' para hoy'
      }
      if (cmd.own) {
        list = list.filter((t) => !t.client_id)
        title += ' propias'
      } else if (cmd.client) {
        const c = findClient(clients, cmd.client)
        if (!c) return reply(`No encuentro el cliente "${cmd.client}". Escribe "clientes" para ver la lista.`)
        list = list.filter((t) => t.client_id === c.id)
        title += ` de ${c.name}`
      }
      if (!list.length) return reply(`${title}: ninguna. 🎉`)
      const order = { alta: 0, media: 1, baja: 2 }
      list = [...list].sort((a, b) => (a.due_date ?? '9999') .localeCompare(b.due_date ?? '9999') || order[a.priority] - order[b.priority] || a.number - b.number)
      const shown = list.slice(0, 15)
      return reply(
        `${title} (${list.length}):\n${shown.map((t) => `• ${taskId(t.number)} ${t.title} — ${STATUS_LABEL[t.status]} · ${clientName(clients, t.client_id)}${t.due_date ? ` · vence ${formatDate(t.due_date)}` : ''}`).join('\n')}${list.length > shown.length ? `\n…y ${list.length - shown.length} más en el tablero.` : ''}`,
      )
    }

    case 'summary': {
      const s = weekStats(
        tasks.map((t) => ({ ...t, client_name: t.client_id ? clientName(clients, t.client_id) : null })),
        startOfWeek(today),
        today,
      )
      const lines = [
        `Semana del ${formatDate(s.start)} al ${formatDate(s.end)}: ${s.progress}% de avance.`,
        `• ${s.done} de ${s.total} compromisos completados`,
        `• ${s.byStatus.en_progreso} en progreso · ${s.byStatus.en_espera} en espera · ${s.byStatus.pendiente} ${s.byStatus.pendiente === 1 ? 'pendiente' : 'pendientes'}`,
        `• ${s.created.length} ${s.created.length === 1 ? 'tarea nueva' : 'tareas nuevas'} esta semana`,
      ]
      if (s.overdue.length) lines.push(`• ⚠ ${s.overdue.length} ${s.overdue.length === 1 ? 'vencida' : 'vencidas'}: ${s.overdue.map((t) => taskId(t.number)).join(', ')}`)
      if (s.byClient.length) lines.push('', 'Por cliente:', ...s.byClient.map((g) => `• ${g.name}: ${g.done}/${g.total}`))
      lines.push('', 'Abre la pestaña "Semana" para ver el dashboard completo.')
      return reply(lines.join('\n'))
    }

    default:
      return reply(HELP_TEXT)
  }
}
