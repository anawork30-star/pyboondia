import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowUp, AudioLines, Bot, LoaderCircle, Mic, RotateCcw, Sparkles, Square, Trash2 } from 'lucide-react'
import { runSmartAssistant, runVoiceNote } from '../../lib/tasksAI.js'
import { useDictation } from './useDictation.js'
import { formatSeconds, useVoiceNote } from './useVoiceNote.js'
import * as api from '../../lib/tasks.js'

const WELCOME = {
  role: 'bot',
  plain: true,
  text:
    'Hola, soy tu asistente de tareas. Escríbeme o mándame una nota de voz (toca el micrófono 🎤) con tus pendientes y los anoto en el tablero con su cliente y un paso a paso sugerido.\n\n' +
    'Ej. nota de voz: "Para Colsanitas tengo que enviar el informe de octubre el viernes, es urgente, y para EPS Sanitas revisar la parrilla de diciembre".\n' +
    'También: "dame el paso a paso de la tarea 3".\n' +
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
  const [busy, setBusy] = useState(false) // false | 'local' | 'ai'
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

  async function send(text, { voice = false } = {}) {
    const message = text.trim()
    if (!message || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: message, voice }])
    setBusy(voice || message.length > 25 ? 'ai' : 'local')
    try {
      const res = await runSmartAssistant(message, { tasks, clients, pending: pending.current, api }, { voice })
      pending.current = res.pending ?? null
      if (res.tasks) onTasks(res.tasks)
      if (res.clients) onClients(res.clients)
      if (res.focus) onFocus(res.focus)
      setMessages((m) => [...m, { role: 'bot', text: res.text, ai: res.ai }])
    } catch (err) {
      pending.current = null
      if (err?.code === 'EXPIRED') return onError(err)
      setMessages((m) => [...m, { role: 'bot', text: `No pude guardar el cambio: ${err.message}`, error: true }])
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  async function sendVoiceNote(audio) {
    if (busy) return
    const id = Date.now()
    setMessages((m) => [...m, { role: 'user', voice: true, id, text: `Nota de voz · ${formatSeconds(audio.seconds)}` }])
    setBusy('voice')
    try {
      const res = await runVoiceNote(audio, { tasks, clients, api })
      pending.current = res.pending ?? null
      if (res.tasks) onTasks(res.tasks)
      if (res.clients) onClients(res.clients)
      if (res.focus) onFocus(res.focus)
      setMessages((m) => [
        ...m.map((x) => (x.id === id && res.transcript ? { ...x, text: `“${res.transcript}”`, seconds: audio.seconds } : x)),
        { role: 'bot', text: res.text, ai: res.ai && !res.failed, error: res.failed },
      ])
    } catch (err) {
      pending.current = null
      if (err?.code === 'EXPIRED') return onError(err)
      setMessages((m) => [...m, { role: 'bot', text: `No pude guardar el cambio: ${err.message}`, error: true }])
    } finally {
      setBusy(false)
    }
  }

  // Notas de voz (grabación) en todos los navegadores modernos; dictado en vivo solo como respaldo.
  const voice = useVoiceNote({ onDone: sendVoiceNote })
  const dictation = useDictation({
    onText: (t) => setInput(t),
    onDone: (t) => send(t, { voice: true }),
  })
  const useDictationFallback = !voice.supported && dictation.supported

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
              {m.voice && <Mic size={12} className="mr-1 inline opacity-70" aria-label="Nota de voz" />}
              {m.seconds ? <span className="mb-1 block text-[11px] font-semibold opacity-75">Nota de voz · {formatSeconds(m.seconds)}</span> : null}
              {m.role === 'bot' && !m.plain ? <Linkified text={m.text} onOpenTask={onOpenTask} /> : m.text}
              {m.ai && (
                <span className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-violet">
                  <Sparkles size={11} aria-hidden="true" /> Organizado con IA · revisa y ajusta si hace falta
                </span>
              )}
            </p>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start" role="status">
            <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-ink/5">
              <span className={busy === 'local' ? 'sr-only' : 'mr-2 text-xs font-medium text-muted'}>
                {busy === 'voice' ? 'Escuchando tu nota de voz…' : busy === 'ai' ? 'Organizando tu pendiente…' : 'Guardando…'}
              </span>
              {[0, 1, 2].map((d) => (
                <span key={d} className="typing-dot h-1.5 w-1.5 self-center rounded-full bg-ink" style={{ animationDelay: `${d * 150}ms` }} />
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
        {voice.error && !voice.recording && (
          <p role="status" className="mb-2 text-xs font-semibold text-[#a52a12]">
            {voice.error}
          </p>
        )}
        {useDictationFallback && (dictation.listening || dictation.error) && (
          <p role="status" className={`mb-2 flex items-center gap-2 text-xs font-semibold ${dictation.error ? 'text-[#a52a12]' : 'text-violet'}`}>
            {dictation.listening && <span className="h-2 w-2 animate-pulse rounded-full bg-coral" aria-hidden="true" />}
            {dictation.error || 'Te escucho… habla con naturalidad. Toca la flecha para enviar.'}
          </p>
        )}
        {voice.active ? (
          <div className="space-y-2" role="group" aria-label="Grabando nota de voz">
            <div className="flex h-12 items-center gap-2.5 rounded-2xl bg-coral-soft px-4 text-sm font-semibold text-[#a52a12]" role="status">
              {voice.phase === 'recording' ? (
                <>
                  <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-coral" aria-hidden="true" />
                  <span className="font-mono text-base tabular-nums">{formatSeconds(voice.seconds)}</span>
                  <AudioLines size={18} className="shrink-0 animate-pulse" aria-hidden="true" />
                  <span className="truncate font-medium">Grabando… cuando termines toca Enviar</span>
                </>
              ) : (
                <>
                  <LoaderCircle size={18} className="shrink-0 animate-spin" aria-hidden="true" />
                  <span className="truncate font-medium">
                    {voice.phase === 'starting' ? 'Activando el micrófono… (si te pregunta, toca Permitir)' : 'Preparando tu nota…'}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={voice.cancel}
                disabled={voice.phase === 'processing'}
                className="btn h-12 flex-1 bg-ink/5 text-muted hover:bg-coral-soft hover:text-[#a52a12]"
              >
                <Trash2 size={18} aria-hidden="true" /> Cancelar
              </button>
              <button type="button" onClick={voice.stop} disabled={voice.phase !== 'recording'} className="btn btn-primary h-12 flex-[2] text-base">
                <ArrowUp size={20} aria-hidden="true" /> Enviar nota de voz
              </button>
            </div>
          </div>
        ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (dictation.listening) return dictation.stop()
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
            maxLength={2000}
            readOnly={dictation.listening}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder={voice.supported || dictation.supported ? 'Escribe o toca 🎤 para mandar una nota de voz…' : 'Ej.: "T-3 en progreso" o una tarea nueva…'}
            className="field min-h-0 resize-none py-2.5 text-sm"
          />
          {voice.supported && (
            <button
              type="button"
              onClick={voice.start}
              disabled={Boolean(busy)}
              className="btn h-11 w-11 shrink-0 bg-violet-soft p-0 text-violet hover:bg-violet hover:text-paper"
              aria-label="Grabar nota de voz"
              title="Grabar nota de voz"
            >
              <Mic size={18} aria-hidden="true" />
            </button>
          )}
          {useDictationFallback && (
            <button
              type="button"
              onClick={dictation.listening ? dictation.stop : dictation.start}
              disabled={Boolean(busy)}
              className={`btn h-11 w-11 shrink-0 p-0 ${dictation.listening ? 'bg-coral text-ink' : 'bg-violet-soft text-violet hover:bg-violet hover:text-paper'}`}
              aria-label={dictation.listening ? 'Terminar dictado' : 'Dictar por voz'}
              aria-pressed={dictation.listening}
              title={dictation.listening ? 'Terminar dictado' : 'Dictar por voz'}
            >
              {dictation.listening ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
            </button>
          )}
          <button type="submit" disabled={Boolean(busy) || (!dictation.listening && !input.trim())} className="btn btn-primary h-11 w-11 shrink-0 p-0" aria-label="Enviar">
            {busy ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <ArrowUp size={18} aria-hidden="true" />}
          </button>
        </form>
        )}
      </div>
    </section>
  )
}
