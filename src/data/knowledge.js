// Base de conocimiento del asistente, generada a partir de los mismos datos que muestra la web.
// La usan: (1) el respaldo local del chat en el navegador y (2) el script
// scripts/build-chat-knowledge.mjs, que la copia a la Edge Function de Supabase.
// Es JS puro (sin import.meta.env) para poder ejecutarse también en Node.
import { CATEGORIES, PROJECTS } from './portfolio.js'
import { DATA_METHOD, DATA_PRINCIPLES, PROCESS } from './content.js'
import { ADDITIONAL_SERVICES, BUDGET_OPTIONS, SERVICES } from './services.js'

/**
 * @param {{ name: string, tagline: string, siteUrl: string, email?: string, whatsapp?: string, city?: string }} info
 */
export function buildKnowledge(info) {
  const category = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
  const lines = []
  lines.push(`# ${info.name}: ${info.tagline}`)
  lines.push(`Sitio web: ${info.siteUrl}`)
  lines.push(
    'Enfoque: primero la estrategia. Validamos que los datos sean confiables y tomamos las decisiones de marketing con base en ellos; después las ejecutamos con contenido, creadores UGC, páginas web y chatbots con IA.',
  )

  lines.push('\n## Método de decisión basado en datos')
  DATA_METHOD.forEach((s, i) => lines.push(`${i + 1}. ${s.title}: ${s.text}`))
  DATA_PRINCIPLES.forEach((p) => lines.push(`- ${p}`))

  lines.push('\n## Servicios principales')
  SERVICES.forEach((s) => {
    lines.push(`\n### ${s.title}`)
    lines.push(s.pitch)
    lines.push(s.description)
    lines.push(`Incluye: ${s.deliverables.join('; ')}.`)
    lines.push(`Beneficios: ${s.benefits.join(' ')}`)
  })

  lines.push('\n## Servicios adicionales (con aliados especializados, no se hacen internamente)')
  ADDITIONAL_SERVICES.forEach((s) => lines.push(`- ${s.title}: ${s.description}`))

  lines.push('\n## Proceso de trabajo')
  PROCESS.forEach((p, i) => lines.push(`${i + 1}. ${p.title}: ${p.text} Resultado: ${p.output}.`))

  lines.push('\n## Portafolio')
  lines.push(
    'Todos los proyectos publicados son CONCEPTOS DEMOSTRATIVOS que ilustran el enfoque; no son clientes reales ni resultados medidos.',
  )
  PROJECTS.forEach((p) => lines.push(`- [${category[p.category]}] ${p.title}: ${p.summary}`))

  lines.push('\n## Presupuestos y precios')
  lines.push(
    'No hay precios fijos publicados: cada propuesta depende del alcance. En el formulario se puede indicar un rango de presupuesto opcional:',
  )
  BUDGET_OPTIONS.forEach((b) => lines.push(`- ${b.label}`))

  lines.push('\n## Contacto')
  lines.push('Formulario de contacto en la sección "Contacto" de la página (#contacto). Responden con los siguientes pasos y, si aplica, una propuesta.')
  if (info.email) lines.push(`Correo: ${info.email}`)
  if (info.whatsapp) lines.push(`WhatsApp: +${info.whatsapp}`)
  if (info.city) lines.push(`Ciudad: ${info.city}`)
  if (!info.email && !info.whatsapp) lines.push('Por ahora el canal oficial es el formulario de contacto.')

  return lines.join('\n')
}
