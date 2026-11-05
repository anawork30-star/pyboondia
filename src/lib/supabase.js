// Cliente público de Supabase. Usa SOLO la clave anon/publishable: el acceso a los datos está
// limitado por RLS. Nunca pongas aquí la service_role key.
// La librería se carga bajo demanda (formulario, login, portal) para no penalizar la carga inicial.
// La sesión del portal privado la guarda Supabase Auth (tokens firmados, nunca contraseñas) y se
// renueva sola; las páginas públicas no la necesitan.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key)

let clientPromise = null

/** Devuelve el cliente de Supabase, o null si faltan las variables de entorno. */
export function getSupabase() {
  if (!isSupabaseConfigured) return Promise.resolve(null)
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'aidu-portal-auth' } }),
  )
  return clientPromise
}
