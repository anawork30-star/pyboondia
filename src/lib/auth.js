// Autenticación del portal privado con Supabase Auth.
// Los usuarios ingresan con un nombre de usuario (p. ej. "ana.diaz"); internamente se convierte en el
// correo de acceso creado en Supabase (ana.diaz@aiduoficial.com). Las contraseñas solo existen en
// Supabase Auth: este código nunca las conoce ni las guarda.
import { getSupabase } from './supabase.js'

export const AUTH_EMAIL_DOMAIN = 'aiduoficial.com'
export const LOGIN_PATH = '/login/'
export const PORTAL_PATH = '/planes-comerciales/'

const USERNAME_RE = /^[a-z0-9._-]{3,64}$/

/** "Ana.Diaz" -> "ana.diaz@aiduoficial.com". Si escriben un correo completo, se usa tal cual. */
export function usernameToEmail(username) {
  const u = String(username ?? '').trim().toLowerCase()
  if (!u) return null
  if (u.includes('@')) return u
  return USERNAME_RE.test(u) ? `${u}@${AUTH_EMAIL_DOMAIN}` : null
}

/** Solo acepta rutas internas para evitar redirecciones abiertas (?next=https://otro-sitio). */
export function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : PORTAL_PATH
}

const ERRORS = {
  invalid: 'Usuario o contraseña incorrectos.',
  rate: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  config: 'El acceso no está disponible en este momento.',
  network: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
}

export async function signIn(username, password) {
  const email = usernameToEmail(username)
  if (!email || !password) throw new Error(ERRORS.invalid)
  const supabase = await getSupabase()
  if (!supabase) throw new Error(ERRORS.config)
  let result
  try {
    result = await supabase.auth.signInWithPassword({ email, password })
  } catch {
    throw new Error(ERRORS.network)
  }
  const { data, error } = result
  if (error) {
    if (error.status === 429) throw new Error(ERRORS.rate)
    if (error.status === 400 || error.code === 'invalid_credentials') throw new Error(ERRORS.invalid)
    throw new Error(ERRORS.network)
  }
  return data.session
}

export async function getSession() {
  const supabase = await getSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export async function signOut() {
  const supabase = await getSupabase()
  // scope local: cierra la sesión en este navegador aunque el servidor no responda.
  await supabase?.auth.signOut({ scope: 'local' })
}

/** Llama a `onSignedOut` si la sesión termina (expiró, se cerró en otra pestaña, etc.). */
export async function watchSession(onSignedOut) {
  const supabase = await getSupabase()
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') onSignedOut()
  })
  return () => data.subscription.unsubscribe()
}

/**
 * Trae el contenido del portal. La base de datos solo lo entrega a usuarios autenticados que
 * estén en la lista portal_members (RLS); a cualquier otro le devuelve vacío.
 */
export async function fetchPortalContent() {
  const supabase = await getSupabase()
  if (!supabase) throw new Error(ERRORS.config)
  const { data, error } = await supabase.from('portal_content').select('data').eq('key', 'planes').maybeSingle()
  if (error) {
    if (error.code === 'PGRST301' || error.status === 401) throw Object.assign(new Error('expired'), { code: 'EXPIRED' })
    throw new Error(ERRORS.network)
  }
  if (!data) throw Object.assign(new Error('Tu usuario no tiene acceso a este portal.'), { code: 'NO_ACCESS' })
  return data.data
}
