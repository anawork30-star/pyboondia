// Cliente público de Supabase. Usa SOLO la clave anon/publishable: el acceso a los datos está
// limitado por RLS. Nunca pongas aquí la service_role key.
// La librería se carga bajo demanda (al enviar el formulario) para no penalizar la carga inicial.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key)

let clientPromise = null

/** Devuelve el cliente de Supabase, o null si faltan las variables de entorno. */
export function getSupabase() {
  if (!isSupabaseConfigured) return Promise.resolve(null)
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, key, { auth: { persistSession: false } }),
  )
  return clientPromise
}
