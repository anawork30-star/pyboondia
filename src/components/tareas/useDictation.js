import { useCallback, useEffect, useRef, useState } from 'react'

// Dictado por voz con la Web Speech API del navegador (Chrome, Edge, Safari; no Firefox).
// El audio lo procesa el servicio de voz del navegador (Google o Apple); aquí solo llega el texto.
const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined

export const dictationSupported = Boolean(Recognition)

/**
 * onText(texto parcial) mientras se habla; onDone(texto final) al terminar.
 * Se detiene al tocar de nuevo el botón o tras unos segundos de silencio.
 */
export function useDictation({ onText, onDone, lang = 'es-CO' }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const rec = useRef(null)
  const finalText = useRef('')
  const handlers = useRef({ onText, onDone })
  useEffect(() => {
    handlers.current = { onText, onDone }
  })

  const stop = useCallback(() => rec.current?.stop(), [])

  const start = useCallback(() => {
    if (!Recognition || rec.current) return
    const r = new Recognition()
    r.lang = lang
    r.interimResults = true
    r.continuous = true
    r.maxAlternatives = 1
    finalText.current = ''
    setError('')
    r.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText.current = `${finalText.current} ${t}`.trim()
        else interim += t
      }
      handlers.current.onText(`${finalText.current} ${interim}`.trim())
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Permite el uso del micrófono en tu navegador para dictar.')
      else if (e.error === 'no-speech') setError('No escuché nada. Toca el micrófono e inténtalo de nuevo.')
      else if (e.error !== 'aborted') setError('El dictado se interrumpió. Inténtalo de nuevo.')
    }
    r.onend = () => {
      rec.current = null
      setListening(false)
      const text = finalText.current.trim()
      if (text) handlers.current.onDone(text)
    }
    rec.current = r
    try {
      r.start()
      setListening(true)
    } catch {
      rec.current = null
      setError('No pude activar el micrófono.')
    }
  }, [lang])

  useEffect(() => () => rec.current?.abort(), [])

  return { listening, error, start, stop, supported: dictationSupported }
}
