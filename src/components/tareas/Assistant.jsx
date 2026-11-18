import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, LoaderCircle, RotateCcw } from 'lucide-react'
import { runAssistant } from '../../lib/taskAssistant.js'
import * as api from '../../lib/tasks.js'

const WELCOME = {
  role: 'bot',
  plain: true,
  text:
    'Hola, soy tu asistente de tareas. Cuéntame tus pendientes y los anoto en el tablero.\n\n' +
    'Ej.: "Nueva tarea: enviar propuesta, cliente: Café Aroma, vence viernes, pasos: cotizar; revisar; enviar".\n' +
    'Luego usa el número: "T-1 en progreso", "T-1 obs: pidió descuento", "T-1 lista".\n\nEscribe "ayuda" para ver más ejemplos.',
}
const QUICK = ['pendientes', 'resumen', 'vencidas', 'ayuda']
const MAX = 60

function loadChat(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
    return Array.isArray(saved) && saved.length ? saved : [WELCOME]
  } catch {
    return [WELCOME]
  }
}

/** Convierte "T-12" del texto del asistente en botones que abren la tarea. */
function Linkified({ text, onOpenTask }) {
  const parts = text.split(/(\bT-\d+\b)/g)
  return parts.map((p, i) =>
    /^T-\d+$/.test(p) ? (
      <button key={i} type="button" onClick={() => onOpenTask(Number(p.slice(2)))} className="font-mono font-semibold text-violet underline-offset-2 hover:underline">
        {p}
      </button>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  )
}

export default function Assistant({ userId, tasks, clients, onTasks, onClients, onFocus, onOpenTask, onError }) {
  const storageKey = `aidu-tareas-chat:${userId ?? 'anon'}`
  const [messages, setMessages] = useState(() => loadChat(storageKey))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX)))
    } catch {
      /* sin almacenamiento */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, storageKey])

  async function send(text) {
    const message = text.trim()
    if (!message || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: message }])
    setBusy(true)
    try {
      const res = await runAssistant(message, { tasks, clients, pending: pending.current, api })
      pending.current = res.pending ?? null
      if (res.tasks) onTasks(res.tasks)
      if (res.clients) onClients(res.clients)
      if (res.focus) onFocus(res.focus)
      setMessages((m) => [...m, { role: 'bot', text: res.text }])
    } catch (err) {
      pending.current = null
      if (err?.code === 'EXPIRED') return onError(err)
      setMessages((m) => [...m, { role: 'bot', text: `No pude guardar el cambio: ${err.message}`, error: true }])
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  return (
    <section aria-label="Asistente de tareas" className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_50px_-24px_rgb(20_18_24/0.3)] ring-1 ring-ink/5">
      <header className="flex items-center justify-between gap-3 bg-ink px-4 py-3 text-paper">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-lime text-ink">
            <Bot size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="font-display font-bold leading-tight">Asistente de tareas</p>
            <p className="text-xs text-paper/60">Anota, actualiza y resume tus pendientes</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            pending.current = null
            setMessages([WELCOME])
          }}
          className="grid h-9 w-9 place-items-center rounded-full text-paper/70 hover:bg-paper/10 hover:text-paper"
          aria-label="Limpiar conversación"
          title="Limpiar conversación"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-paper/60 p-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[88%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-md bg-violet text-paper'
                  : m.error
                    ? 'rounded-bl-md bg-coral-soft text-ink'
                    : 'rounded-bl-md bg-white text-ink ring-1 ring-ink/5'
              }`}
            >
              {m.role === 'bot' && !m.plain ? <Linkified text={m.text} onOpenTask={onOpenTask} /> : m.text}
            </p>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start" role="status">
            <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-ink/5">
              <span className="sr-only">Guardando…</span>
              {[0, 1, 2].map((d) => (
                <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full bg-ink" style={{ animationDelay: `${d * 150}ms` }} />
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-ink/5 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={busy}
              className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-muted transition-colors hover:bg-violet-soft hover:text-violet"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="asistente-mensaje" className="sr-only">
            Escribe una tarea o un comando
          </label>
          <textarea
            id="asistente-mensaje"
            ref={inputRef}
            rows={2}
            maxLength={1000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder='Ej.: "T-3 en progreso" o una tarea nueva…'
            className="field min-h-0 resize-none py-2.5 text-sm"
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary h-11 w-11 shrink-0 p-0" aria-label="Enviar">
            {busy ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <ArrowUp size={18} aria-hidden="true" />}
          </button>
        </form>
      </div>
    </section>
  )
}
