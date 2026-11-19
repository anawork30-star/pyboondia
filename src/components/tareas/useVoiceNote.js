import { useCallback, useEffect, useRef, useState } from 'react'

// Notas de voz (como en WhatsApp): graba con el micrófono del celular o del computador y entrega el
// audio para que la IA lo transcriba e interprete. Funciona en Chrome, Edge, Safari/iPhone (también
// cuando la app está instalada en la pantalla de inicio) y Firefox.
const MAX_SECONDS = 180
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

/**
 * onDone({ mimeType, data (base64), seconds }) al terminar la grabación.
 * stop() envía la nota; cancel() la descarta.
 */
export function useVoiceNote({ onDone }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const rec = useRef(null)
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
    stop()
  }, [stop])

  const start = useCallback(async () => {
    if (!voiceNoteSupported || rec.current) return
    setError('')
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch (err) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Permite el uso del micrófono para grabar notas de voz (en el candado de la barra de direcciones o en los ajustes del navegador).'
          : 'No encontré un micrófono disponible.',
      )
      return
    }
    const type = pickType()
    let r
    try {
      r = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    } catch {
      stream.getTracks().forEach((t) => t.stop())
      setError('Este navegador no permite grabar audio.')
      return
    }
    const chunks = []
    discard.current = false
    r.ondataavailable = (e) => e.data?.size && chunks.push(e.data)
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      rec.current = null
      setRecording(false)
      const secs = Math.round((Date.now() - startedAt.current) / 1000)
      if (discard.current) return
      const mimeType = (r.mimeType || type || 'audio/webm').split(';')[0]
      const blob = new Blob(chunks, { type: mimeType })
      if (secs < 1 || blob.size < 1000) return setError('La nota quedó muy corta. Mantén la grabación mientras hablas.')
      try {
        handler.current({ mimeType, data: await toBase64(blob), seconds: secs })
      } catch {
        setError('No pude preparar la nota de voz. Inténtalo de nuevo.')
      }
    }
    rec.current = r
    startedAt.current = Date.now()
    setSeconds(0)
    r.start(1000)
    setRecording(true)
  }, [])

  // Contador y tope de duración.
  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000)
      setSeconds(s)
      if (s >= MAX_SECONDS) stop()
    }, 250)
    return () => clearInterval(t)
  }, [recording, stop])

  useEffect(
    () => () => {
      discard.current = true
      if (rec.current?.state === 'recording') rec.current.stop()
    },
    [],
  )

  return { recording, seconds, error, start, stop, cancel, supported: voiceNoteSupported, maxSeconds: MAX_SECONDS }
}

export const formatSeconds = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
