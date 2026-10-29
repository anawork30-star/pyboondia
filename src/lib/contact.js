// Validación y envío del formulario de contacto. La validación es pura (sin dependencias del
// navegador) para poder probarla y la base de datos repite las mismas reglas en la función
// submit_contact_request, así que el cliente nunca es la única barrera.

export const SERVICE_VALUES = ['branding', 'social', 'web', 'ai', 'integral']
export const BUDGET_VALUES = ['menos-2m', '2-5m', '5-10m', 'mas-10m', 'por-definir']

export const LIMITS = { name: [2, 120], company: [0, 120], message: [20, 3000], email: 254 }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const EMPTY_FORM = {
  name: '',
  email: '',
  company: '',
  service: '',
  budget: '',
  message: '',
  consent: false,
  website: '', // honeypot: los humanos no lo ven ni lo llenan
}

export function normalize(values) {
  const t = (v) => (typeof v === 'string' ? v.trim() : '')
  return {
    name: t(values.name).replace(/\s+/g, ' '),
    email: t(values.email).toLowerCase(),
    company: t(values.company) || null,
    service: t(values.service),
    budget: t(values.budget) || null,
    message: t(values.message),
    consent: values.consent === true,
  }
}

/** Devuelve un objeto { campo: mensaje } con los errores; vacío si todo es válido. */
export function validateContact(values) {
  const v = normalize(values)
  const errors = {}
  if (v.name.length < LIMITS.name[0]) errors.name = 'Escribe tu nombre.'
  else if (v.name.length > LIMITS.name[1]) errors.name = `Máximo ${LIMITS.name[1]} caracteres.`

  if (!v.email) errors.email = 'Escribe tu correo electrónico.'
  else if (v.email.length > LIMITS.email || !EMAIL_RE.test(v.email)) errors.email = 'Revisa el formato del correo.'

  if (v.company && v.company.length > LIMITS.company[1]) errors.company = `Máximo ${LIMITS.company[1]} caracteres.`

  if (!SERVICE_VALUES.includes(v.service)) errors.service = 'Elige el servicio que te interesa.'

  if (v.budget && !BUDGET_VALUES.includes(v.budget)) errors.budget = 'Elige una opción válida.'

  if (v.message.length < LIMITS.message[0])
    errors.message = `Cuéntanos un poco más (mínimo ${LIMITS.message[0]} caracteres).`
  else if (v.message.length > LIMITS.message[1]) errors.message = `Máximo ${LIMITS.message[1]} caracteres.`

  if (!v.consent) errors.consent = 'Debes aceptar la política de tratamiento de datos.'
  return errors
}

const SERVER_ERRORS = {
  RATE_LIMITED: 'Recibimos varias solicitudes seguidas desde este correo. Intenta de nuevo en una hora.',
  CONSENT_REQUIRED: 'Debes aceptar la política de tratamiento de datos.',
  INVALID_INPUT: 'Algunos datos no son válidos. Revísalos e intenta de nuevo.',
}

/**
 * Envía la solicitud mediante la función RPC segura de Supabase.
 * Lanza un Error con un mensaje para el usuario si no se guardó.
 */
export async function submitContact(client, values) {
  if (values.website) return { ok: true } // bot: se descarta en silencio
  if (!client) {
    throw new Error('El formulario todavía no está conectado. Escríbenos por los canales de contacto mientras lo activamos.')
  }
  const v = normalize(values)
  const { data, error } = await client.rpc('submit_contact_request', {
    p_name: v.name,
    p_email: v.email,
    p_company: v.company,
    p_service: v.service,
    p_budget: v.budget,
    p_message: v.message,
    p_consent: v.consent,
  })
  if (error) {
    const code = Object.keys(SERVER_ERRORS).find((k) => error.message?.includes(k))
    throw new Error(code ? SERVER_ERRORS[code] : 'No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.')
  }
  if (!data) throw new Error('No pudimos confirmar el envío. Intenta de nuevo en unos minutos.')
  return { ok: true, id: data }
}
