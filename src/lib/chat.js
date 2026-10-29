// Cliente del asistente. Intenta primero la IA (Edge Function "chat" de Supabase) y, si no está
// disponible, responde con el respaldo local basado en el contenido de la página.
import { localReply } from './chatLocal.js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const TIMEOUT_MS = 45000
// Si la función no responde (no desplegada o sin red), no se reintenta durante esta visita.
let aiUnavailable = false

/**
 * @param {{ role: 'user' | 'assistant', content: string }[]} history  conversación completa
 * @returns {Promise<{ text: string, source: 'ai' | 'local' }>}
 */
export async function askAssistant(history) {
  const question = history[history.length - 1]?.content ?? ''
  if (url && key && !aiUnavailable) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${url}/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.reply) return { text: data.reply, source: 'ai' }
      if (res.status === 429 && data?.error === 'RATE_LIMITED') {
        return {
          text: 'Recibí muchas preguntas seguidas. Dame unos minutos o escríbenos por el formulario de contacto y te respondemos personalmente.',
          source: 'local',
        }
      }
    } catch {
      // Sin conexión, tiempo agotado o función no desplegada: usamos el respaldo local.
      aiUnavailable = true
    } finally {
      clearTimeout(timer)
    }
  }
  return { text: localReply(question), source: 'local' }
}
