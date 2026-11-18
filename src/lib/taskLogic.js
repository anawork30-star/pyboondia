// Lógica pura del tablero de tareas: estados, intérprete de mensajes del asistente, fechas y
// estadísticas semanales. Sin red ni React, para poder probarla con Vitest.

export const STATUSES = [
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'en_espera', label: 'En espera' },
  { id: 'completada', label: 'Completada' },
]
export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]))
export const PRIORITIES = [
  { id: 'alta', label: 'Alta' },
  { id: 'media', label: 'Media' },
  { id: 'baja', label: 'Baja' },
]
export const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map((p) => [p.id, p.label]))

export const taskId = (n) => `T-${n}`

/** Minúsculas y sin tildes, conservando la longitud (cada carácter se reemplaza por uno). */
export function fold(s) {
  return String(s ?? '')
    .split('')
    .map((c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()[0] ?? c)
    .join('')
}

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').replace(/^[\s,;:.\-–—]+|[\s,;:.\-–—]+$/g, '')

// ---------------------------------------------------------------- Fechas (hora local)

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function fromISODate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** Lunes 00:00 (hora local) de la semana de `date`. */
export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return addDays(d, -((d.getDay() + 6) % 7))
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function formatDate(iso, { weekday = false } = {}) {
  if (!iso) return ''
  const d = typeof iso === 'string' ? fromISODate(iso.slice(0, 10)) : iso
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`
  return weekday ? `${WEEKDAYS[d.getDay()].replace('miercoles', 'miércoles').replace('sabado', 'sábado')} ${base}` : base
}

/**
 * Convierte "hoy", "mañana", "viernes", "el 25/11", "2026-11-25", "en 3 días", "próxima semana"
 * en una fecha ISO. Devuelve null si no la reconoce.
 */
export function parseDue(text, today = new Date()) {
  const t = fold(clean(text)).replace(/^(para|el|la|hasta|antes del?|vence)\s+/g, '').replace(/^el\s+/, '')
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (/^(hoy)$/.test(t)) return toISODate(base)
  if (/^pasado\s*manana$/.test(t)) return toISODate(addDays(base, 2))
  if (/^manana$/.test(t)) return toISODate(addDays(base, 1))
  if (/^(fin de semana|este fin de semana)$/.test(t)) return toISODate(addDays(base, (6 - base.getDay() + 7) % 7))
  if (/^(la )?(proxima|siguiente) semana$/.test(t)) return toISODate(addDays(startOfWeek(base), 7))
  let m = t.match(/^en (\d{1,3}) dias?$/)
  if (m) return toISODate(addDays(base, Number(m[1])))
  m = t.match(/^(este |el |proximo )?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)( proximo| que viene)?$/)
  if (m) {
    const target = WEEKDAYS.indexOf(m[2])
    let diff = (target - base.getDay() + 7) % 7
    if (diff === 0 || m[1] === 'proximo ' || m[3]) diff = diff === 0 ? 7 : diff
    return toISODate(addDays(base, diff))
  }
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return validDate(+m[1], +m[2], +m[3])
  m = t.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/)
  if (m) {
    let y = m[3] ? Number(m[3]) : base.getFullYear()
    if (y < 100) y += 2000
    const iso = validDate(y, +m[2], +m[1])
    // Sin año y ya pasó: se entiende el próximo año.
    if (iso && !m[3] && iso < toISODate(base)) return validDate(y + 1, +m[2], +m[1])
    return iso
  }
  m = t.match(/^(\d{1,2}) de (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*(?: de (\d{4}))?$/)
  if (m) {
    const mo = MONTHS.indexOf(m[2]) + 1
    const y = m[3] ? Number(m[3]) : base.getFullYear()
    const iso = validDate(y, mo, +m[1])
    if (iso && !m[3] && iso < toISODate(base)) return validDate(y + 1, mo, +m[1])
    return iso
  }
  return null
}
function validDate(y, m, d) {
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? toISODate(dt) : null
}

// ---------------------------------------------------------------- Intérprete de mensajes

const STATUS_PATTERNS = [
  ['completada', /\b(completad[ao]s?|complete|terminad[ao]s?|termine|list[ao]s?|hech[ao]s?|finalizad[ao]s?|finalice|cerrad[ao]s?|done|resuelt[ao]s?|entregad[ao]s?)\b/],
  ['en_espera', /\b(en espera|esperando|bloquead[ao]s?|pausad[ao]s?|en pausa|detenid[ao]s?|stand ?by|frenad[ao]s?)\b/],
  ['en_progreso', /\b(en progreso|en proceso|en curso|haciendo(la)?|trabajando|empezad[ao]s?|iniciad[ao]s?|comence|empece|arranque|avanzando|en marcha|activa)\b/],
  ['pendiente', /\b(pendientes?|por hacer|reabrir|reabiert[ao]|to ?do|sin empezar)\b/],
]

export function detectStatus(folded) {
  for (const [id, re] of STATUS_PATTERNS) if (re.test(folded)) return id
  return null
}

const OWN_RE = /^(propi[ao]s?|mi[ao]s?|personal(es)?|interna?s?|ningun[ao]?|sin cliente|yo)$/
const LABELS = {
  cliente: 'client', client: 'client', empresa: 'client', marca: 'client',
  prioridad: 'priority',
  vence: 'due', vencimiento: 'due', fecha: 'due', entrega: 'due', plazo: 'due', limite: 'due',
  pasos: 'steps', paso: 'steps', 'siguientes pasos': 'steps', 'pasos a seguir': 'steps',
  obs: 'obs', observacion: 'obs', observaciones: 'obs', nota: 'obs', notas: 'obs', comentario: 'obs',
  estado: 'status',
  titulo: 'title', nombre: 'title',
}
const LABEL_ALT = Object.keys(LABELS).sort((a, b) => b.length - a.length).join('|')
// Etiqueta con dos puntos en cualquier parte, o sin dos puntos justo después de un separador.
const LABEL_COLON_RE = new RegExp(`(?:^|[\\s,;(])(${LABEL_ALT})\\s*:\\s*`, 'g')
const LABEL_SEP_RE = new RegExp(`(?:^|[,;\\n]|\\.\\s|\\s+y\\s+)\\s*(${LABEL_ALT})\\b\\s*`, 'g')

/** Separa "título, cliente: X, prioridad alta, pasos: a; b" en { head, fields[] }. */
function splitFields(original) {
  const f = fold(original)
  const hits = []
  for (const re of [LABEL_COLON_RE, LABEL_SEP_RE]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(f))) {
      hits.push({ start: m.index, valueStart: m.index + m[0].length, key: LABELS[m[1]] })
    }
  }
  hits.sort((a, b) => a.start - b.start)
  const chosen = []
  for (const h of hits) if (!chosen.length || h.start >= chosen[chosen.length - 1].valueStart) chosen.push(h)
  const head = chosen.length ? original.slice(0, chosen[0].start) : original
  const fields = chosen.map((h, i) => ({
    key: h.key,
    value: clean(original.slice(h.valueStart, i + 1 < chosen.length ? chosen[i + 1].start : undefined)),
  }))
  return { head, fields }
}

function parsePriority(v) {
  const t = fold(v)
  if (/\b(alta|urgente|importante|maxima|critica)\b/.test(t)) return 'alta'
  if (/\b(baja|minima|cuando se pueda|sin afan)\b/.test(t)) return 'baja'
  if (/\b(media|normal|regular)\b/.test(t)) return 'media'
  return null
}

function splitList(v) {
  return v
    .split(/\s*(?:[;\n]|,|\s\/\s|\s+(?:y luego|luego|despues)\s+|\s*\d+[.)]\s+)\s*/)
    .map(clean)
    .filter(Boolean)
}

/** Aplica los campos etiquetados a `out`. */
function applyFields(out, fields, today) {
  for (const { key, value } of fields) {
    if (!value && key !== 'client') continue
    if (key === 'client') {
      if (!value || OWN_RE.test(fold(value))) out.own = true
      else out.client = value
    } else if (key === 'priority') {
      out.priority = parsePriority(value) ?? out.priority
    } else if (key === 'due') {
      const due = parseDue(value, today)
      if (due) out.due = due
      else if (/^(sin fecha|ninguna|quitar|no)$/.test(fold(value))) out.due = ''
      else out.invalidDue = value
    } else if (key === 'steps') {
      const fv = fold(value)
      const done = fv.match(/^(\d+(?:\s*(?:,|y)\s*\d+)*)\s*(?:esta[n]?\s+)?(list|hech|complet|ok\b|termin|done)/)
      const undone = fv.match(/^(\d+(?:\s*(?:,|y)\s*\d+)*)\s*(?:esta[n]?\s+)?(pendiente|sin hacer|desmarc)/)
      const del = fv.match(/^(?:quitar|borrar|eliminar)\s+(\d+(?:\s*(?:,|y)\s*\d+)*)/)
      const nums = (s) => s.split(/\s*(?:,|y)\s*/).map(Number).filter((n) => n > 0)
      if (done) out.doneSteps = [...(out.doneSteps ?? []), ...nums(done[1])]
      else if (undone) out.undoneSteps = [...(out.undoneSteps ?? []), ...nums(undone[1])]
      else if (del) out.removeSteps = [...(out.removeSteps ?? []), ...nums(del[1])]
      else out.steps = [...(out.steps ?? []), ...splitList(value)]
    } else if (key === 'obs') {
      out.observation = out.observation ? `${out.observation} ${value}` : value
    } else if (key === 'status') {
      out.status = detectStatus(fold(value)) ?? out.status
    } else if (key === 'title') {
      out.title = value
    }
  }
  return out
}

const REF_RE = /(?:^|[^\w])(?:t\s*-?\s*|tarea\s*(?:n(?:o|umero|°|º)?\.?\s*)?#?\s*|#)(\d{1,5})\b/i
const LEAD_NUM_RE = /^\s*(?:la|el|tarea)?\s*(\d{1,5})(?![\d/-])\b/

export function findRef(text) {
  const f = fold(text)
  const m = f.match(REF_RE)
  if (m) return { number: Number(m[1]), index: f.indexOf(m[0]) + (m[0].length - m[0].trimStart().length), length: m[0].trimStart().length }
  const l = f.match(LEAD_NUM_RE)
  if (l) return { number: Number(l[1]), index: 0, length: l[0].length }
  return null
}

const CREATE_RE = /^\s*(nueva tarea|tarea nueva|nueva|nuevo pendiente|anotame|anota(?:r)?|agrega(?:r)?|anade|anadir|crea(?:r)?(?: tarea)?|apunta(?:r)?|recuerdame|recordar|tengo que|debo|hay que|pendiente)\b\s*:?\s*/
const LIST_RE = /^\s*(pendientes|lista(?:r)?|mis tareas|tareas|que tengo|que me falta|ver tareas|ver pendientes|muestrame|mostrar tareas|tablero|en que voy)\b/
const HELP_RE = /^\s*(ayuda|help|comandos|como funciona|que puedes hacer|como te uso|\?)\s*\??\s*$/
const GREET_RE = /^\s*(hola|holi|buen[oa]s?(?: dias| tardes| noches)?|hey|gracias|mil gracias|ok|okay|vale|perfecto|genial|listo gracias)\s*[!.]*\s*$/
const SUMMARY_RE = /^\s*(resumen|avance|semana|dashboard|como voy|como va la semana|reporte|informe|balance)\b/
const CLIENTS_RE = /^\s*(clientes|mis clientes|lista de clientes|ver clientes)\s*\??\s*$/
const ADD_CLIENT_RE = /^\s*(?:nuevo cliente|cliente nuevo|agrega(?:r)? (?:el |un )?cliente|crea(?:r)? (?:el |un )?cliente|anade (?:el )?cliente)\s*:?\s*/
const DELETE_RE = /^\s*(eliminar|elimina|borrar|borra|quitar|quita|descartar|descarta)\b/
const SHOW_RE = /^\s*(ver|mostrar|muestrame|detalle|detalles|info|abre|abrir|como va|como esta|estado de)\b/
const YES_RE = /^\s*(si|sí|confirmo|confirmar|dale|hazlo|de una|claro|correcto)\s*[!.]*\s*$/
const NO_RE = /^\s*(no|cancela(?:r)?|mejor no|olvidalo|deja asi)\s*[!.]*\s*$/

function parseCreate(text, today) {
  const { head, fields } = splitFields(text)
  const out = applyFields({ type: 'create' }, fields, today)
  let title = head
  let f = fold(title)
  // "urgente" o "prioridad alta" en el título
  const pr = f.match(/\b(urgente|prioridad (alta|media|baja))\b/)
  if (pr && !out.priority) {
    out.priority = parsePriority(pr[0])
    title = title.slice(0, pr.index) + title.slice(pr.index + pr[0].length)
    f = fold(title)
  }
  // "(propia)" o "propia" al final
  const own = f.match(/\s*\(?\b(propia|personal|interna)\)?\s*$/)
  if (own && !out.client) {
    out.own = true
    title = title.slice(0, own.index)
    f = fold(title)
  }
  // Fecha al final: "para el viernes", "para mañana", "antes del 25/11"
  if (!out.due) {
    const due = f.match(
      /\s+(?:para|antes del?|hasta|vence)\s+((?:el |este |el proximo )?(?:hoy|manana|pasado manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{1,2} de [a-z]+|la proxima semana|en \d+ dias?))\s*[.!]?\s*$/,
    )
    const due2 = due ?? f.match(/\s+((?:el |este |el proximo )(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo|\d{1,2}[/-]\d{1,2}))\s*[.!]?\s*$/)
    if (due2) {
      const iso = parseDue(due2[1], today)
      if (iso) {
        out.due = iso
        title = title.slice(0, due2.index)
      }
    }
  }
  const t = out.title ?? clean(title)
  out.title = t.charAt(0).toUpperCase() + t.slice(1)
  return out
}

function parseUpdate(text, ref, today) {
  const rest = text.slice(0, ref.index) + ' ' + text.slice(ref.index + ref.length)
  const { head, fields } = splitFields(rest.trim())
  const out = applyFields({ type: 'update', number: ref.number }, fields, today)
  let f = fold(head)
  const status = detectStatus(f)
  if (status && !out.status) out.status = status
  const pr = parsePriority(f.match(/\b(urgente|prioridad \w+)\b/)?.[0] ?? '')
  if (pr && !out.priority) out.priority = pr
  // Lo que sobra (sin verbos de relleno ni la frase de estado) se toma como observación.
  let leftover = head
  for (const [, re] of STATUS_PATTERNS) leftover = leftover.replace(new RegExp(re.source, 'gi'), (m) => (detectStatus(fold(m)) ? ' ' : m))
  f = fold(leftover)
    .replace(/\b(urgente|prioridad \w+)\b/g, ' ')
    .replace(/\b(mover|mueve|moverla|pasar|pasa|pasala|cambiar|cambia|marcar|marca|marcala|poner|pon|ponla|dejar|deja|dejala|a|al|la|el|ya|esta|quedo|queda|como|en|estado|tarea|ahora|por favor|porfa|y|se|de|lo|es)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (OWN_RE.test(f) && !out.client) {
    out.own = true
  } else if (f.length > 2 && !out.observation) {
    // Recupera el texto original equivalente (sin la referencia ni el estado).
    out.observation = clean(leftover.replace(/^\s*(?:y|,)\s*/i, ''))
    if (status) {
      // Si había una frase de estado, quita conectores sueltos al inicio.
      out.observation = clean(out.observation.replace(/^(ya|esta|está|quedó|quedo|como|en|a|y)\s+/i, ''))
    }
  }
  const keys = Object.keys(out).filter((k) => !['type', 'number'].includes(k))
  return keys.length ? out : { type: 'show', number: ref.number }
}

/**
 * Interpreta un mensaje escrito en el chat. Devuelve una acción, por ejemplo:
 *   { type: 'create', title, client?, own?, priority?, due?, steps?, observation? }
 *   { type: 'update', number, status?, client?, own?, priority?, due?, steps?, doneSteps?, observation? }
 *   { type: 'show' | 'delete', number } · { type: 'list', status?, client?, overdue? }
 *   { type: 'help' | 'greet' | 'summary' | 'clients' | 'yes' | 'no' } · { type: 'addClient', name }
 */
export function parseCommand(input, { today = new Date() } = {}) {
  const text = String(input ?? '').trim()
  if (!text) return { type: 'empty' }
  const f = fold(text)

  if (YES_RE.test(f)) return { type: 'yes' }
  if (NO_RE.test(f)) return { type: 'no' }
  if (HELP_RE.test(f)) return { type: 'help' }
  if (GREET_RE.test(f)) return { type: 'greet' }

  // "pendientes" (plural) no coincide aquí: es listar. "pendiente: …" sí es crear.
  const create = f.match(CREATE_RE)
  if (create) {
    const body = text.slice(create[0].length)
    if (!clean(body)) return { type: 'help', hint: 'create' }
    return parseCreate(body, today)
  }

  const addClient = f.match(ADD_CLIENT_RE)
  if (addClient) {
    const name = clean(text.slice(addClient[0].length))
    return name ? { type: 'addClient', name } : { type: 'clients' }
  }
  if (CLIENTS_RE.test(f)) return { type: 'clients' }
  if (SUMMARY_RE.test(f)) return { type: 'summary' }

  const ref = findRef(text)
  if (ref) {
    if (DELETE_RE.test(f)) return { type: 'delete', number: ref.number }
    const rest = fold(text.slice(0, ref.index) + text.slice(ref.index + ref.length)).replace(/[^a-z0-9]+/g, ' ').trim()
    if (!rest || (SHOW_RE.test(f) && !/:/.test(text) && !detectStatus(rest.replace(SHOW_RE, '')))) return { type: 'show', number: ref.number }
    return parseUpdate(text, ref, today)
  }

  if (LIST_RE.test(f)) {
    const out = { type: 'list' }
    const st = detectStatus(f.replace(LIST_RE, ''))
    if (st) out.status = st
    if (/\b(vencid[ao]s|atrasad[ao]s|retrasad[ao]s)\b/.test(f)) out.overdue = true
    if (/\b(propias|mias|personales|internas)\b/.test(f)) out.own = true
    if (/\b(hoy)\b/.test(f)) out.dueToday = true
    const cl = text.match(/\b(?:de|del cliente|cliente|para)\s+(.+?)\s*\??$/i)
    if (cl && !/^(hoy|la semana|esta semana)$/i.test(cl[1]) && !detectStatus(fold(cl[1]))) out.client = clean(cl[1])
    return out
  }
  if (/\b(vencid[ao]s|atrasad[ao]s)\b/.test(f) && f.length < 40) return { type: 'list', overdue: true }

  // Pregunta suelta: mejor orientar que crear una tarea por error.
  if (/\?\s*$/.test(text) || f.length < 4) return { type: 'help', hint: 'unknown' }
  // Cualquier otro texto se anota como tarea nueva.
  return parseCreate(text, today)
}

// ---------------------------------------------------------------- Estadísticas semanales

/**
 * Resumen de la semana que empieza en `weekStart` (lunes local).
 * "Compromisos" = tareas que vencen esa semana, se crearon en ella, se completaron en ella o
 * siguen abiertas desde antes y ya estaban vencidas o en progreso. Avance = completadas / compromisos.
 */
export function weekStats(tasks, weekStart, now = new Date()) {
  const start = startOfWeek(weekStart)
  const end = addDays(start, 7)
  const startISO = toISODate(start)
  const endISO = toISODate(end)
  const todayISO = toISODate(now)
  const inWeek = (ts) => ts && new Date(ts) >= start && new Date(ts) < end
  const isCurrentWeek = now >= start && now < end
  const isPastWeek = now >= end

  const doneInWeek = (t) => t.status === 'completada' && inWeek(t.completed_at)
  const commitments = tasks.filter((t) => {
    if (new Date(t.created_at) >= end) return false
    if (doneInWeek(t)) return true
    if (t.status === 'completada' && new Date(t.completed_at) < start) return false
    if (t.due_date && t.due_date < endISO) return true
    if (inWeek(t.created_at)) return true
    return isCurrentWeek && (t.status === 'en_progreso' || t.status === 'en_espera')
  })
  const completed = tasks.filter((t) => t.status === 'completada' && inWeek(t.completed_at))
  const open = commitments.filter((t) => !doneInWeek(t))
  const overdue = open.filter((t) => t.due_date && t.due_date < (isPastWeek ? endISO : todayISO))
  const created = tasks.filter((t) => inWeek(t.created_at))
  const done = commitments.length - open.length

  const byDay = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i)
    const iso = toISODate(day)
    return {
      iso,
      label: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
      completed: completed.filter((t) => toISODate(new Date(t.completed_at)) === iso).length,
      created: created.filter((t) => toISODate(new Date(t.created_at)) === iso).length,
    }
  })

  const groups = new Map()
  for (const t of commitments) {
    const key = t.client_id ?? 'propias'
    const g = groups.get(key) ?? { key, name: t.client_name ?? 'Tareas propias', total: 0, done: 0 }
    g.total += 1
    if (doneInWeek(t)) g.done += 1
    groups.set(key, g)
  }
  const byClient = [...groups.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

  let stepsTotal = 0
  let stepsDone = 0
  for (const t of commitments) {
    stepsTotal += t.steps?.length ?? 0
    stepsDone += t.steps?.filter((s) => s.done).length ?? 0
  }

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s.id, open.filter((t) => t.status === s.id).length]))
  byStatus.completada = done

  return {
    start: startISO,
    end: toISODate(addDays(start, 6)),
    isCurrentWeek,
    commitments,
    total: commitments.length,
    done,
    progress: commitments.length ? Math.round((done / commitments.length) * 100) : 0,
    completed,
    created,
    open,
    overdue,
    byDay,
    byClient,
    byStatus,
    stepsTotal,
    stepsDone,
  }
}
