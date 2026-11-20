import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  CircleAlert,
  KanbanSquare,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  NotebookPen,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import PortalBar from '../components/PortalShell.jsx'
import { toLogin, usePortalSession } from '../lib/portalSession.js'
import Assistant from '../components/tareas/Assistant.jsx'
import WeekDashboard from '../components/tareas/WeekDashboard.jsx'
import ClientTag from '../components/tareas/ClientTag.jsx'
import UpdateNotice from '../components/tareas/UpdateNotice.jsx'
import InstallApp from '../components/tareas/InstallApp.jsx'
import { CLIENT_SUGGESTIONS, COLUMN_STYLE, PRIORITY_STYLE, clientColor } from '../components/tareas/styles.js'
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, formatDate, taskId, toISODate } from '../lib/taskLogic.js'
import * as api from '../lib/tasks.js'

function readPref(key, fallback) {
  try {
    return localStorage.getItem(`aidu-tareas-${key}`) ?? fallback
  } catch {
    return fallback
  }
}
function writePref(key, value) {
  try {
    localStorage.setItem(`aidu-tareas-${key}`, value)
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export default function Tareas() {
  const { session, email, logout, leaving } = usePortalSession()
  const [state, setState] = useState({ status: 'loading' }) // loading | ready | error | no-access
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [view, setView] = useState(() => readPref('vista', 'tablero'))
  const [filter, setFilter] = useState('todos')
  const [dialog, setDialog] = useState(null) // { id } | { create: true }
  const [highlight, setHighlight] = useState(null)
  const [toast, setToast] = useState('')
  // El acceso directo "Nota de voz" de la app instalada abre /tareas/?asistente=1 con el asistente abierto.
  const [chatOpen, setChatOpen] = useState(() => new URLSearchParams(window.location.search).has('asistente'))

  const onError = useCallback((err) => {
    if (err?.code === 'EXPIRED') return toLogin('expirada')
    setToast(err?.message || 'Algo salió mal. Inténtalo de nuevo.')
  }, [])

  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        if (!(await api.isPortalMember())) return setState({ status: 'no-access' })
        const data = await api.loadBoard()
        setTasks(data.tasks)
        setClients(data.clients)
        setState({ status: 'ready' })
      } catch (err) {
        if (err.code === 'EXPIRED') return toLogin('expirada')
        setState({ status: 'error', message: err.message })
      }
    })()
  }, [session])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!highlight) return
    const t = setTimeout(() => setHighlight(null), 2400)
    return () => clearTimeout(t)
  }, [highlight])

  const changeView = (v) => {
    setView(v)
    writePref('vista', v)
  }

  const clientName = useCallback((id) => (id ? (clients.find((c) => c.id === id)?.name ?? 'Cliente') : 'Propia'), [clients])

  const visible = useMemo(
    () =>
      tasks.filter((t) => (filter === 'todos' ? true : filter === 'propias' ? !t.client_id : t.client_id === filter)),
    [tasks, filter],
  )

  async function moveTask(id, status) {
    const prev = tasks.find((t) => t.id === id)
    if (!prev || prev.status === status) return
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)))
    try {
      const updated = await api.updateTask(id, { status })
      setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      setTasks((ts) => ts.map((t) => (t.id === id ? prev : t)))
      onError(err)
    }
  }

  async function saveTask(id, fields) {
    if (id) {
      const updated = await api.updateTask(id, fields)
      setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)))
      return updated
    }
    const created = await api.createTask(fields)
    setTasks((ts) => [...ts, created])
    setHighlight(created.id)
    return created
  }

  async function removeTask(id) {
    await api.deleteTask(id)
    setTasks((ts) => ts.filter((t) => t.id !== id))
  }

  async function addClient(name) {
    const c = await api.createClient(name)
    setClients((cs) => [...cs, c].sort((a, b) => a.name.localeCompare(b.name)))
    return c
  }

  const focusTask = (id) => {
    setHighlight(id)
    if (view !== 'tablero') return
    requestAnimationFrame(() => document.getElementById(`tarea-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }))
  }

  const openByNumber = (n) => {
    const t = tasks.find((x) => x.number === n)
    if (t) setDialog({ id: t.id })
  }

  const dialogTask = dialog?.id ? tasks.find((t) => t.id === dialog.id) : null
  const ready = state.status === 'ready'

  const assistant = ready && (
    <Assistant
      userId={session?.user?.id}
      tasks={tasks}
      clients={clients}
      onTasks={setTasks}
      onClients={setClients}
      onFocus={focusTask}
      onOpenTask={openByNumber}
      onError={onError}
    />
  )

  return (
    <>
      <UpdateNotice />
      <PortalBar current="tareas" email={email} onLogout={logout} leaving={leaving} />
      <main id="contenido" className="pb-24 pt-28 sm:pt-32">
        <div className="container-x">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet shadow-sm ring-1 ring-ink/5">
            <ShieldCheck size={14} aria-hidden="true" /> Solo tú ves estas tareas
          </p>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[clamp(2.2rem,5vw,3.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
                Tareas <span className="text-violet">pendientes</span>
              </h1>
              <p className="mt-3 max-w-xl text-muted">
                Cuéntale tus pendientes al asistente y él los anota. Cambia el estado con el número de tarea (por ejemplo,
                “T-3 en progreso”) o arrastrando la tarjeta.
              </p>
            </div>
            {ready && (
              <button type="button" className="btn btn-primary" onClick={() => setDialog({ create: true })}>
                <Plus size={18} aria-hidden="true" /> Nueva tarea
              </button>
            )}
          </div>

          {state.status === 'loading' && <LoadingBoard />}
          {state.status === 'error' && <Message title="No pudimos cargar tus tareas" text={state.message} retry />}
          {state.status === 'no-access' && (
            <Message title="Sin acceso" text="Tu usuario no tiene acceso al tablero de tareas. Pide que te agreguen al portal." />
          )}

          {ready && (
            <>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <div role="tablist" aria-label="Vista" className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-ink/5">
                  {[
                    { id: 'tablero', label: 'Tablero', icon: KanbanSquare },
                    { id: 'semana', label: 'Semana', icon: TrendingUp },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={view === id}
                      onClick={() => changeView(id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        view === id ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" /> {label}
                    </button>
                  ))}
                </div>
                <InstallApp />
              </div>

              {view === 'tablero' && (
                <ClientFilter tasks={tasks} clients={clients} filter={filter} onFilter={setFilter} onAddClient={addClient} onError={onError} />
              )}

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="min-w-0">
                  {view === 'tablero' ? (
                    <Board
                      tasks={visible}
                      clientName={clientName}
                      highlight={highlight}
                      onMove={moveTask}
                      onOpen={(id) => setDialog({ id })}
                    />
                  ) : (
                    <WeekDashboard tasks={tasks} clientName={clientName} onOpen={(id) => setDialog({ id })} />
                  )}
                </div>
                {/* Asistente: columna fija en escritorio, panel deslizable en móvil */}
                <aside className="hidden lg:block">
                  <div className="sticky top-28 h-[calc(100dvh-8.5rem)]">{assistant}</div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      {ready && (
        <>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="btn btn-primary fixed bottom-5 right-4 z-40 shadow-[0_20px_50px_-15px_rgb(20_18_24/0.6)] lg:hidden"
          >
            <MessageSquareText size={18} aria-hidden="true" /> Asistente
          </button>
          {chatOpen && (
            <div className="fixed inset-0 z-[60] flex flex-col bg-ink/60 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Asistente de tareas">
              <div className="mt-auto flex h-[88dvh] flex-col rounded-t-[2rem] bg-paper p-3">
                <div className="flex justify-end pb-2">
                  <button type="button" onClick={() => setChatOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-ink/10" aria-label="Cerrar asistente">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="min-h-0 flex-1">{assistant}</div>
              </div>
            </div>
          )}
        </>
      )}

      {dialog && (
        <TaskDialog
          key={dialog.id ?? 'nueva'}
          task={dialogTask}
          clients={clients}
          defaultClient={filter !== 'todos' && filter !== 'propias' ? filter : ''}
          onClose={() => setDialog(null)}
          onSave={saveTask}
          onDelete={removeTask}
          onAddClient={addClient}
          onError={onError}
        />
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 lg:bottom-6">
        {toast && (
          <p className="pointer-events-auto flex items-start gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-paper shadow-lg">
            <CircleAlert size={18} className="mt-0.5 shrink-0 text-coral" aria-hidden="true" /> {toast}
          </p>
        )}
      </div>
    </>
  )
}

function LoadingBoard() {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="status">
      <span className="sr-only">Cargando tareas…</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-80 animate-pulse rounded-[1.75rem] bg-white ring-1 ring-ink/5" />
      ))}
    </div>
  )
}

function Message({ title, text, retry }) {
  return (
    <div className="mt-10 max-w-xl rounded-[2rem] bg-white p-8 ring-1 ring-ink/5">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-3 text-muted">{text}</p>
      {retry && (
        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary mt-6">
          Intentar de nuevo
        </button>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Etiquetas de cliente (filtro)

function ClientFilter({ tasks, clients, filter, onFilter, onAddClient, onError }) {
  const [adding, setAdding] = useState(null) // null | string
  const [saving, setSaving] = useState(false)
  const open = (pred) => tasks.filter((t) => t.status !== 'completada' && pred(t)).length
  const chip = (active) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-[box-shadow,background-color] ${
      active ? 'ring-2 ring-ink' : 'ring-1 ring-ink/10 hover:ring-ink/30'
    }`
  const suggestions = CLIENT_SUGGESTIONS.filter((s) => !clients.some((c) => c.name.toLowerCase() === s.toLowerCase()))

  async function save(e) {
    e.preventDefault()
    const name = adding?.trim()
    if (!name || saving) return
    setSaving(true)
    try {
      const c = await onAddClient(name)
      setAdding(null)
      onFilter(c.id)
    } catch (err) {
      onError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4" role="group" aria-label="Filtrar por cliente">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" aria-pressed={filter === 'todos'} onClick={() => onFilter('todos')} className={`${chip(filter === 'todos')} bg-white`}>
          Todas <span className="text-xs text-muted">{open(() => true)}</span>
        </button>
        <button type="button" aria-pressed={filter === 'propias'} onClick={() => onFilter('propias')} className={`${chip(filter === 'propias')} bg-white text-muted`}>
          Propias <span className="text-xs">{open((t) => !t.client_id)}</span>
        </button>
        {clients.map((c) => {
          const col = clientColor(c.name)
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => onFilter(filter === c.id ? 'todos' : c.id)}
              className={chip(filter === c.id)}
              style={{ backgroundColor: col.bg, color: col.fg }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.dot }} aria-hidden="true" />
              {c.name} <span className="text-xs opacity-75">{open((t) => t.client_id === c.id)}</span>
            </button>
          )
        })}
        {adding === null && (
          <button type="button" onClick={() => setAdding('')} className={`${chip(false)} border border-dashed border-ink/25 text-muted ring-0`}>
            <Plus size={14} aria-hidden="true" /> Etiqueta de cliente
          </button>
        )}
      </div>
      {adding !== null && (
        <form onSubmit={save} className="mt-3 flex max-w-md flex-wrap items-center gap-2">
          <label htmlFor="nueva-etiqueta" className="sr-only">
            Nombre del cliente
          </label>
          <input
            id="nueva-etiqueta"
            className="field min-w-0 flex-1 py-2 text-sm"
            placeholder="Ej.: Colsanitas"
            maxLength={80}
            autoFocus
            list="clientes-sugeridos"
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
          />
          <datalist id="clientes-sugeridos">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button type="submit" disabled={!adding.trim() || saving} className="btn btn-primary px-4 py-2 text-sm">
            {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : 'Crear'}
          </button>
          <button type="button" onClick={() => setAdding(null)} className="btn btn-outline h-10 w-10 p-0" aria-label="Cancelar">
            <X size={16} aria-hidden="true" />
          </button>
          {suggestions.length > 0 && (
            <div className="flex w-full flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => setAdding(s)} className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-muted hover:bg-violet-soft hover:text-violet">
                  + {s}
                </button>
              ))}
            </div>
          )}
        </form>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Tablero kanban

function Board({ tasks, clientName, highlight, onMove, onOpen }) {
  const [over, setOver] = useState(null)
  const order = { alta: 0, media: 1, baja: 2 }
  return (
    // contain:paint evita que el carrusel horizontal agrande la página en móviles.
    // En móvil es un carrusel deslizable de columnas; desde tablet, una cuadrícula de 2 o 4 columnas.
    <div className="-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-4 [contain:paint] md:mx-0 md:overflow-visible md:px-0 md:[contain:none]">
      <div className="grid auto-cols-[85%] grid-flow-col gap-4 sm:auto-cols-[46%] md:grid-flow-row md:grid-cols-2 2xl:grid-cols-4">
        {STATUSES.map((s) => {
          const col = tasks
            .filter((t) => t.status === s.id)
            .sort((a, b) =>
              s.id === 'completada'
                ? (b.completed_at ?? '').localeCompare(a.completed_at ?? '')
                : order[a.priority] - order[b.priority] || (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || a.number - b.number,
            )
          const st = COLUMN_STYLE[s.id]
          return (
            <section
              key={s.id}
              aria-labelledby={`col-${s.id}`}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(s.id)
              }}
              onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                setOver(null)
                const id = e.dataTransfer.getData('text/plain')
                if (id) onMove(id, s.id)
              }}
              className={`flex min-h-[16rem] snap-start flex-col rounded-[1.75rem] p-3 transition-colors ${over === s.id ? 'bg-violet-soft ring-2 ring-violet' : 'bg-cream/60'}`}
            >
              <h2 id={`col-${s.id}`} className="flex items-center justify-between px-2 pb-3 pt-1 font-sans text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} aria-hidden="true" />
                  {s.label}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-muted">{col.length}</span>
              </h2>
              <ul className="flex flex-1 flex-col gap-2.5">
                {col.map((t) => (
                  <li key={t.id}>
                    <TaskCard task={t} clientName={clientName(t.client_id)} highlight={highlight === t.id} onOpen={() => onOpen(t.id)} />
                  </li>
                ))}
                {!col.length && (
                  <li className="grid flex-1 place-items-center rounded-2xl border border-dashed border-ink/15 p-4 text-center text-sm text-muted">
                    {s.id === 'pendiente' ? 'Sin pendientes. Dile al asistente qué tienes por hacer.' : 'Arrastra tarjetas aquí'}
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function TaskCard({ task: t, clientName, highlight, onOpen }) {
  const today = toISODate(new Date())
  const overdue = t.due_date && t.due_date < today && t.status !== 'completada'
  const steps = t.steps ?? []
  const stepsDone = steps.filter((s) => s.done).length
  return (
    <button
      id={`tarea-${t.id}`}
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', t.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={onOpen}
      className={`group block w-full cursor-grab rounded-2xl bg-white p-3.5 text-left shadow-[0_8px_24px_-16px_rgb(20_18_24/0.35)] ring-1 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-18px_rgb(20_18_24/0.45)] active:cursor-grabbing ${
        highlight ? 'ring-2 ring-violet' : 'ring-ink/5'
      } ${t.status === 'completada' ? 'opacity-75' : ''}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-violet">{taskId(t.number)}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
      </span>
      <span className={`mt-1.5 block font-semibold leading-snug ${t.status === 'completada' ? 'line-through decoration-ink/30' : ''}`}>{t.title}</span>
      <span className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
        <ClientTag name={t.client_id ? clientName : null} size="xs" />
        {t.due_date && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${overdue ? 'bg-coral-soft text-[#a52a12]' : 'bg-ink/5 text-muted'}`}>
            <CalendarDays size={12} aria-hidden="true" /> {overdue ? 'Venció ' : ''}
            {formatDate(t.due_date)}
          </span>
        )}
        {t.observations?.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 font-medium text-muted" title="Observaciones">
            <NotebookPen size={12} aria-hidden="true" /> {t.observations.length}
          </span>
        )}
      </span>
      {steps.length > 0 && (
        <span className="mt-3 flex items-center gap-2 text-xs text-muted">
          <ListChecks size={14} aria-hidden="true" />
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
            <span className="block h-full rounded-full bg-violet" style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
          </span>
          {stepsDone}/{steps.length}
        </span>
      )}
    </button>
  )
}

// ------------------------------------------------------------------ Detalle / edición

function TaskDialog({ task, clients, defaultClient, onClose, onSave, onDelete, onAddClient, onError }) {
  const ref = useRef(null)
  const isNew = !task
  const [draft, setDraft] = useState(() => ({
    title: task?.title ?? '',
    status: task?.status ?? 'pendiente',
    priority: task?.priority ?? 'media',
    client_id: task ? (task.client_id ?? '') : defaultClient,
    due_date: task?.due_date ?? '',
    steps: task?.steps ?? [],
    observations: task?.observations ?? [],
  }))
  const [newStep, setNewStep] = useState('')
  const [newObs, setNewObs] = useState('')
  const [newClient, setNewClient] = useState(null) // null | string
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [history, setHistory] = useState(null)
  const [titleError, setTitleError] = useState('')

  useEffect(() => {
    const d = ref.current
    d?.showModal()
    return () => d?.close()
  }, [])

  useEffect(() => {
    if (!task) return
    api.loadHistory(task.id).then(setHistory).catch(() => setHistory([]))
  }, [task])

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))

  function addStep() {
    const text = newStep.trim()
    if (!text) return
    set('steps', [...draft.steps, { text, done: false }])
    setNewStep('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!draft.title.trim()) {
      setTitleError('Escribe un título para la tarea.')
      return
    }
    setBusy(true)
    try {
      let clientId = draft.client_id || null
      if (newClient !== null && newClient.trim()) clientId = (await onAddClient(newClient.trim())).id
      const observations = newObs.trim() ? [...draft.observations, { text: newObs.trim(), at: new Date().toISOString() }] : draft.observations
      const steps = newStep.trim() ? [...draft.steps, { text: newStep.trim(), done: false }] : draft.steps
      await onSave(task?.id, {
        title: draft.title.trim().slice(0, 200),
        status: draft.status,
        priority: draft.priority,
        client_id: clientId,
        due_date: draft.due_date || null,
        steps,
        observations,
      })
      onClose()
    } catch (err) {
      onError(err)
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await onDelete(task.id)
      onClose()
    } catch (err) {
      onError(err)
      setBusy(false)
    }
  }

  const uid = task?.id ?? 'nueva'

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={`dlg-${uid}`}
      className="m-auto max-h-[92dvh] w-[min(44rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[2rem] bg-paper p-0 text-ink shadow-2xl"
    >
      <form onSubmit={submit} className="p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm font-semibold text-violet">{isNew ? 'Nueva tarea' : taskId(task.number)}</p>
            <h2 id={`dlg-${uid}`} className="sr-only">
              {isNew ? 'Nueva tarea' : `Detalle de ${taskId(task.number)}`}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white ring-1 ring-ink/10 hover:bg-ink/5" aria-label="Cerrar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <label htmlFor={`${uid}-title`} className="field-label mt-3">
          Tarea
        </label>
        <input
          id={`${uid}-title`}
          className="field font-semibold"
          value={draft.title}
          maxLength={200}
          autoFocus={isNew}
          placeholder="¿Qué hay que hacer?"
          aria-invalid={Boolean(titleError)}
          onChange={(e) => {
            set('title', e.target.value)
            setTitleError('')
          }}
        />
        {titleError && <p className="field-error">{titleError}</p>}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-status`} className="field-label">
              Estado
            </label>
            <select id={`${uid}-status`} className="field" value={draft.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-priority`} className="field-label">
              Prioridad
            </label>
            <select id={`${uid}-priority`} className="field" value={draft.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-client`} className="field-label">
              Cliente
            </label>
            {newClient === null ? (
              <select
                id={`${uid}-client`}
                className="field"
                value={draft.client_id}
                onChange={(e) => (e.target.value === '__nuevo' ? setNewClient('') : set('client_id', e.target.value))}
              >
                <option value="">Tarea propia (sin cliente)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__nuevo">+ Nueva etiqueta de cliente…</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  id={`${uid}-client`}
                  className="field"
                  placeholder="Ej.: Colsanitas, EPS Sanitas…"
                  maxLength={80}
                  autoFocus
                  list={`${uid}-client-suggest`}
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                />
                <datalist id={`${uid}-client-suggest`}>
                  {CLIENT_SUGGESTIONS.filter((s) => !clients.some((c) => c.name.toLowerCase() === s.toLowerCase())).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <button type="button" onClick={() => setNewClient(null)} className="btn btn-outline px-4" aria-label="Cancelar cliente nuevo">
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="mt-2">
              <ClientTag
                name={newClient !== null ? newClient.trim() || null : draft.client_id ? (clients.find((c) => c.id === draft.client_id)?.name ?? null) : null}
                size="xs"
              />
            </div>
          </div>
          <div>
            <label htmlFor={`${uid}-due`} className="field-label">
              Fecha límite
            </label>
            <input id={`${uid}-due`} type="date" className="field" value={draft.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </div>
        </div>

        {/* Pasos a seguir */}
        <fieldset className="mt-7">
          <legend className="flex items-center gap-2 font-display text-lg font-bold">
            <ListChecks size={18} className="text-violet" aria-hidden="true" /> Pasos a seguir
          </legend>
          {draft.steps.length > 0 && (
            <ol className="mt-3 space-y-2">
              {draft.steps.map((s, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-ink/5">
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-violet"
                    checked={s.done}
                    aria-label={`Paso ${i + 1} completado`}
                    onChange={(e) => set('steps', draft.steps.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))}
                  />
                  <span className="w-5 shrink-0 text-xs font-semibold text-muted">{i + 1}.</span>
                  <span className={`flex-1 ${s.done ? 'text-muted line-through' : ''}`}>{s.text}</span>
                  <button
                    type="button"
                    onClick={() => set('steps', draft.steps.filter((_, j) => j !== i))}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-coral-soft hover:text-[#a52a12]"
                    aria-label={`Quitar paso ${i + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-3 flex gap-2">
            <input
              className="field py-2.5"
              placeholder="Agregar un paso…"
              aria-label="Nuevo paso"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addStep()
                }
              }}
            />
            <button type="button" onClick={addStep} className="btn btn-outline px-4" aria-label="Agregar paso">
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
        </fieldset>

        {/* Observaciones */}
        <fieldset className="mt-7">
          <legend className="flex items-center gap-2 font-display text-lg font-bold">
            <NotebookPen size={18} className="text-violet" aria-hidden="true" /> Observaciones
          </legend>
          {draft.observations.length > 0 && (
            <ul className="mt-3 space-y-2">
              {[...draft.observations].reverse().map((o, i) => (
                <li key={i} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/5">
                  <p className="whitespace-pre-line">{o.text}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(o.at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <textarea
            className="field mt-3 min-h-20 py-2.5"
            placeholder="Escribe una observación (se guarda con fecha)…"
            aria-label="Nueva observación"
            value={newObs}
            onChange={(e) => setNewObs(e.target.value)}
          />
        </fieldset>

        {history && history.length > 0 && (
          <details className="mt-6 text-sm">
            <summary className="cursor-pointer font-semibold text-muted">Historial de estados</summary>
            <ol className="mt-2 space-y-1 text-muted">
              {history.map((h, i) => (
                <li key={i}>
                  {new Date(h.at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} ·{' '}
                  {h.from_status ? `${STATUS_LABEL[h.from_status]} → ` : 'Creada en '}
                  {STATUS_LABEL[h.to_status]}
                </li>
              ))}
            </ol>
          </details>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!isNew ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">¿Eliminar?</span>
                <button type="button" onClick={remove} disabled={busy} className="btn bg-coral px-4 py-2.5 text-ink">
                  Sí, eliminar
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-outline px-4 py-2.5">
                  No
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="btn px-0 text-[#a52a12] hover:underline">
                <Trash2 size={16} aria-hidden="true" /> Eliminar tarea
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1 sm:flex-none">
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="btn btn-primary flex-1 sm:flex-none">
              {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {isNew ? 'Crear tarea' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
