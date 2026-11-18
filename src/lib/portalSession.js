// Sesión del portal privado compartida por sus páginas (planes, tareas).
import { useEffect, useState } from 'react'
import { LOGIN_PATH, getSession, signOut, watchSession } from './auth.js'

// Evita que el aviso de "sesión expirada" aparezca cuando la persona cierra sesión a propósito.
let loggingOut = false

export const toLogin = (reason, next) =>
  window.location.replace(`${LOGIN_PATH}?${reason}&next=${encodeURIComponent(next ?? window.location.pathname)}`)

/** Exige sesión: si no hay, redirige al login. Devuelve { session, email, logout, leaving }. */
export function usePortalSession() {
  const [session, setSession] = useState(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let stop = () => {}
    let alive = true
    ;(async () => {
      const s = await getSession().catch(() => null)
      if (!s) return toLogin('acceso')
      const unwatch = await watchSession(() => !loggingOut && toLogin('expirada'))
      if (!alive) return unwatch()
      stop = unwatch
      setSession(s)
    })()
    return () => {
      alive = false
      stop()
    }
  }, [])

  async function logout() {
    setLeaving(true)
    loggingOut = true
    await signOut().catch(() => {})
    window.location.replace(`${LOGIN_PATH}?salida`)
  }

  return { session, email: session?.user?.email ?? '', logout, leaving }
}
