import { useCallback, useEffect, useRef, useState } from 'react'

// Notas de voz (como en WhatsApp): graba con el micrófono del celular o del computador y entrega el
// audio para que la IA lo transcriba e interprete. Funciona en Chrome, Edge, Safari/iPhone (también
// cuando la app está instalada en la pantalla de inicio) y Firefox.
//
// El audio se convierte a WAV (mono, 16 kHz) antes de enviarlo: es el formato que Gemini acepta
// siempre, mientras que mp4 (iPhone) o webm (Chrome) a veces los rechaza.
const MAX_SECONDS = 150
const WAV_RATE = 16000
// Primero mp4 (iPhone y Chrome reciente), luego ogg (Firefox) y webm (Chrome anterior).
const TYPES = ['audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm']

export const voiceNoteSupported =
  typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

function pickType() {
  return TYPES.find((t) => window.MediaRecorder.isTypeSupported?.(t)) ?? ''
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Decodifica la grabación y la pasa a WAV PCM 16 bits, mono, 16 kHz. Devuelve null si no se puede.
export async function toWav(blob) {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  const ctx = new AC()
  try {
    const raw = await blob.arrayBuffer()
    const audio = await new Promise((resolve, reject) => {
      const p = ctx.decodeAudioData(raw, resolve, reject)
      p?.then?.(resolve, reject)
    })
    // Mezcla a mono.
    const len = audio.length
    const mono = new Float32Array(len)
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const ch = audio.getChannelData(c)
      for (let i = 0; i < len; i++) mono[i] += ch[i] / audio.numberOfChannels
    }
    // Remuestreo lineal a 16 kHz.
    const ratio = audio.sampleRate / WAV_RATE
    const outLen = Math.max(1, Math.floor(len / ratio))
    const pcm = new Int16Array(outLen)
    for (let i = 0; i < outLen; i++) {
      const pos = i * ratio
      const j = Math.floor(pos)
      const a = mono[j] ?? 0
      const b = mono[j + 1] ?? a
      const v = Math.max(-1, Math.min(1, a + (b - a) * (pos - j)))
      pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff
    }
    const header = new DataView(new ArrayBuffer(44))
    const str = (o, s) => [...s].forEach((ch, k) => header.setUint8(o + k, ch.charCodeAt(0)))
    str(0, 'RIFF')
    header.setUint32(4, 36 + pcm.byteLength, true)
    str(8, 'WAVE')
    str(12, 'fmt ')
    header.setUint32(16, 16, true)
    header.setUint16(20, 1, true)
    header.setUint16(22, 1, true)
    header.setUint32(24, WAV_RATE, true)
    header.setUint32(28, WAV_RATE * 2, true)
    header.setUint16(32, 2, true)
    header.setUint16(34, 16, true)
    str(36, 'data')
    header.setUint32(40, pcm.byteLength, true)
    return new Blob([header.buffer, pcm.buffer], { type: 'audio/wav' })
  } catch {
    return null
  } finally {
    ctx.close?.().catch?.(() => {})
  }
}

/**
 * phase: 'idle' | 'starting' (pidiendo el micrófono) | 'recording' | 'processing' (preparando el audio).
 * onDone({ mimeType, data (base64), seconds }) al terminar la grabación.
 * stop() envía la nota; cancel() la descarta.
 */
export function useVoiceNote({ onDone }) {
  const [phase, setPhase] = useState('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const rec = useRef(null)
  const stream = useRef(null)
  const discard = useRef(false)
  const startedAt = useRef(0)
  const handler = useRef(onDone)
  useEffect(() => {
    handler.current = onDone
  })

  const stop = useCallback(() => {
    if (rec.current?.state === 'recording') rec.current.stop()
  }, [])

  const cancel = useCallback(() => {
    discard.current = true
    if (rec.current?.state === 'recording') rec.current.stop()
    else {
      // Todavía pidiendo el micrófono: se descarta en cuanto responda.
      stream.current?.getTracks().forEach((t) => t.stop())
      setPhase('idle')
    }
  }, [])

  const start = useCallback(async () => {
    if (!voiceNoteSupported || rec.current) return
    setError('')
    discard.current = false
    setPhase('starting')
    let s
    try {
      s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch (err) {
      setPhase('idle')
      setError(
        err?.name === 'NotAllowedError'
          ? 'Permite el uso del micrófono para grabar notas de voz. En iPhone: Ajustes › Safari › Micrófono › Permitir. En Android: toca el candado junto a la dirección › Permisos › Micrófono.'
          : 'No encontré un micrófono disponible.',
      )
      return
    }
    if (discard.current) {
      s.getTracks().forEach((t) => t.stop())
      return
    }
    stream.current = s
    const type = pickType()
    let r
    try {
      r = new MediaRecorder(s, type ? { mimeType: type } : undefined)
    } catch {
      s.getTracks().forEach((t) => t.stop())
      setPhase('idle')
      setError('Este navegador no permite grabar audio. Escribe tu tarea en el cuadro de texto.')
      return
    }
    const chunks = []
    r.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data)
    }
    r.onstop = async () => {
      s.getTracks().forEach((t) => t.stop())
      stream.current = null
      rec.current = null
      const secs = Math.round((Date.now() - startedAt.current) / 1000)
      if (discard.current) return setPhase('idle')
      setPhase('processing')
      const original = new Blob(chunks, { type: (r.mimeType || type || 'audio/webm').split(';')[0] })
      if (secs < 1 || original.size < 1000) {
        setPhase('idle')
        return setError('La nota quedó muy corta. Habla un poco más antes de tocar Enviar.')
      }
      try {
        const wav = await toWav(original)
        const blob = wav ?? original
        setPhase('idle')
        handler.current({ mimeType: blob.type, data: await toBase64(blob), seconds: secs })
      } catch {
        setPhase('idle')
        setError('No pude preparar la nota de voz. Inténtalo de nuevo.')
      }
    }
    rec.current = r
    startedAt.current = Date.now()
    setSeconds(0)
    r.start()
    setPhase('recording')
  }, [])

  // Contador y tope de duración.
  useEffect(() => {
    if (phase !== 'recording') return
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000)
      setSeconds(s)
      if (s >= MAX_SECONDS) stop()
    }, 250)
    return () => clearInterval(t)
  }, [phase, stop])

  useEffect(
    () => () => {
      discard.current = true
      if (rec.current?.state === 'recording') rec.current.stop()
      stream.current?.getTracks().forEach((t) => t.stop())
    },
    [],
  )

  return {
    phase,
    active: phase !== 'idle',
    recording: phase === 'recording',
    seconds,
    error,
    start,
    stop,
    cancel,
    supported: voiceNoteSupported,
    maxSeconds: MAX_SECONDS,
  }
}

export const formatSeconds = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
