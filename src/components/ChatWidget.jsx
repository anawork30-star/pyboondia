import { useEffect, useId, useRef, useState } from 'react'
import { ArrowUp, Sparkles, X } from 'lucide-react'
import { askAssistant } from '../lib/chat.js'

const STORAGE_KEY = 'aidu-chat'
const GREETING = {
  role: 'assistant',
  greeting: true,
  content:
    '¡Hola! Soy Aidu, el asistente con IA de la agencia. Pregúntame por nuestros servicios, cómo decidimos con datos o pídeme ideas creativas para tu marca.',
}
const SUGGESTIONS = [
  '¿Qué servicios ofrecen?',
  '¿Cómo usan los datos para decidir?',
  '¿Qué es el contenido UGC?',
  'Dame ideas de contenido para mi marca',
  'Quiero cotizar un proyecto',
]

function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    if (Array.isArray(saved) && saved.length) return saved
  } catch {
    // almacenamiento no disponible: empezamos de cero
  }
  return [GREETING]
}

/** Botón flotante + panel de conversación. Visible en todas las páginas, siempre abajo a la derecha. */
export default function ChatWidget({ onHome = true }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const buttonRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      // sin almacenamiento: la conversación solo vive en esta pestaña
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function send(text) {
    const content = text.trim()
    if (!content || busy) return
    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setInput('')
    setBusy(true)
    // El saludo y las respuestas del respaldo local no se envían al modelo.
    const forModel = history.filter((m) => !m.greeting && !m.local).map(({ role, content }) => ({ role, content }))
    const { text: reply, source } = await askAssistant(forModel)
    setMessages((m) => [...m, { role: 'assistant', content: reply, ...(source === 'local' && { local: true }) }])
    setBusy(false)
  }

  const showSuggestions = messages.length <= 1 && !busy
  const contactHref = onHome ? '#contacto' : '/#contacto'

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-labelledby={titleId}
          className="flex h-[min(36rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[1.75rem] bg-paper text-ink shadow-[0_30px_80px_-20px_rgb(20_18_24/0.45)] ring-1 ring-ink/10 sm:w-[24rem]"
        >
          <header className="flex items-center gap-3 bg-ink px-5 py-4 text-paper">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 id={titleId} className="font-display text-lg font-bold leading-tight">
                Aidu
              </h2>
              <p className="text-xs text-paper/70">Asistente con IA · responde al instante</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper/10"
              aria-label="Cerrar asistente"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite" aria-busy={busy}>
            {messages.map((m, i) => (
              <p
                key={i}
                className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  m.role === 'user' ? 'ml-auto rounded-br-sm bg-violet text-paper' : 'rounded-bl-sm bg-white shadow-sm'
                }`}
              >
                <span className="sr-only">{m.role === 'user' ? 'Tú: ' : 'Aidu: '}</span>
                {m.content}
              </p>
            ))}
            {busy && (
              <div className="flex w-fit gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3.5 shadow-sm">
                <span className="sr-only">Aidu está escribiendo…</span>
                {[0, 1, 2].map((d) => (
                  <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full bg-violet" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            )}
            {showSuggestions && (
              <ul className="flex flex-wrap gap-2 pt-1" aria-label="Preguntas sugeridas">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-left text-sm font-medium transition-colors hover:border-violet hover:text-violet"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-ink/10 bg-white px-3 pb-3 pt-2">
            <a href={contactHref} onClick={() => setOpen(false)} className="mb-2 block text-center text-xs font-semibold text-violet hover:underline">
              ¿Prefieres hablar con el equipo? Ir al formulario
            </a>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor={`${titleId}-input`} className="sr-only">
                Escribe tu pregunta
              </label>
              <textarea
                id={`${titleId}-input`}
                ref={inputRef}
                rows={1}
                maxLength={1200}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                placeholder="Escribe tu pregunta…"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-ink/15 bg-paper px-4 py-2.5 text-[15px] focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/15"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition-colors hover:bg-violet disabled:opacity-40"
                aria-label="Enviar pregunta"
              >
                <ArrowUp size={18} aria-hidden="true" />
              </button>
            </form>
            <p className="mt-2 text-center text-[11px] text-muted">Respuestas generadas con IA; pueden contener errores. No compartas datos sensibles.</p>
          </div>
        </section>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente con IA'}
        className="group flex h-14 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-paper shadow-[0_15px_40px_-10px_rgb(20_18_24/0.6)] transition-transform hover:-translate-y-0.5 hover:bg-violet"
      >
        <span className="relative grid h-8 w-8 place-items-center rounded-full bg-lime text-ink">
          {open ? <X size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
          {!open && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-ink" />}
        </span>
        <span className="text-sm font-semibold">{open ? 'Cerrar' : '¿Hablamos?'}</span>
      </button>
    </div>
  )
}
