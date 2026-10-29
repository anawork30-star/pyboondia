// Genera supabase/functions/chat/knowledge.js a partir de los datos del sitio (src/data).
// Se ejecuta automáticamente antes de cada build (npm run build) y con `npm run chat:knowledge`.
// Así el asistente con IA siempre responde con la misma información que muestra la web.
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'
import { buildKnowledge } from '../src/data/knowledge.js'

const root = resolve(import.meta.dirname, '..')
const env = loadEnv(process.env.NODE_ENV === 'development' ? 'development' : 'production', root, 'VITE_')

const knowledge = buildKnowledge({
  name: 'AIDU',
  tagline: 'Agencia de marketing digital estratégico',
  siteUrl: env.VITE_SITE_URL || 'https://www.aiduoficial.com',
  email: env.VITE_CONTACT_EMAIL?.trim(),
  whatsapp: env.VITE_WHATSAPP_NUMBER?.replace(/\D/g, ''),
  city: env.VITE_CITY?.trim(),
})

const out = resolve(root, 'supabase/functions/chat/knowledge.js')
writeFileSync(
  out,
  `// ARCHIVO GENERADO por scripts/build-chat-knowledge.mjs. No lo edites a mano: cambia src/data.\nexport const KNOWLEDGE = ${JSON.stringify(knowledge)}\n`,
)
console.log(`Conocimiento del chat actualizado (${knowledge.length} caracteres) -> ${out}`)
