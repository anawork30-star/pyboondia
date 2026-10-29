// Respaldo del asistente sin IA: responde por palabras clave con el contenido de la página.
// Se usa cuando la Edge Function no está desplegada o falla, para que el chat nunca quede mudo.
import { DATA_METHOD, PROCESS } from '../data/content.js'
import { ADDITIONAL_SERVICES, SERVICES } from '../data/services.js'

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const has = (text, words) => words.some((w) => text.includes(w))
const service = (id) => SERVICES.find((s) => s.id === id)

function describe(id) {
  const s = service(id)
  return `${s.title}: ${s.description}\n\nIncluye:\n${s.deliverables.map((d) => `- ${d}`).join('\n')}`
}

const IDEA_TEMPLATES = [
  (t) => `Serie "Detrás de ${t}": muestra en reels cortos cómo se hace lo que vendes.`,
  (t) => `Tres creadores UGC contando su primera experiencia con ${t}, cada uno con un gancho distinto en los primeros 3 segundos.`,
  (t) => `Un chatbot que recomiende la mejor opción de ${t} con 3 preguntas y deje el contacto listo para tu equipo.`,
  (t) => `Una landing de una sola acción para ${t}, con preguntas frecuentes reales y medición de cada clic.`,
  (t) => `Encuesta en historias para validar qué le importa más a tu audiencia sobre ${t} y usar ese dato en el próximo mes de contenido.`,
  (t) => `Mito vs. realidad sobre ${t}: carrusel educativo que responda las objeciones más comunes antes de la compra.`,
]

function ideas(text) {
  // "ideas para mi cafetería" -> "tu cafetería"
  const match = text.match(/(?:para|sobre)\s+(?:(mis?|tus?|una?|el|la|los|las)\s+)?([a-z0-9áéíóúñ\s]{3,40})/i)
  const OWN = { mi: 'tu', mis: 'tus' }
  const topic = match
    ? `${OWN[match[1]?.toLowerCase()] ?? match[1] ?? 'tu'} ${match[2].trim().replace(/\s+/g, ' ')}`
    : 'tu marca'
  const picked = [...IDEA_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3)
  return `¡Me encanta esa pregunta! Algunas ideas iniciales para ${topic}:\n${picked
    .map((f) => `- ${f(topic)}`)
    .join('\n')}\n\nEn un diagnóstico las validamos con tus datos para quedarnos con las que más aportan. ¿Quieres contarnos más en el formulario de contacto?`
}

export function localReply(question) {
  const q = ` ${norm(question)} ` // espacios para detectar palabras cortas como " ia "

  if (has(q, ['idea', 'creativ', 'inspir', 'propuesta para', 'que publico', 'que puedo publicar'])) return ideas(question)

  if (has(q, ['precio', 'cuesta', 'costo', 'cuanto vale', 'cuanto cobran', 'tarifa', 'presupuesto', 'cotiz']))
    return 'No manejamos precios fijos: cada propuesta depende del alcance y los objetivos. En el formulario de contacto puedes indicar un rango de presupuesto (opcional) y te enviamos una propuesta a tu medida.'

  if (has(q, ['branding', 'logo', 'identidad', 'manual de marca', 'diseno grafico']))
    return `${ADDITIONAL_SERVICES[0].description} Si lo necesitas, elige "Branding" en el formulario de contacto.`

  if (has(q, ['ugc', 'creador', 'influencer', 'resena', 'testimonio en video'])) return describe('ugc')
  if (has(q, ['dato', 'estrategia', 'kpi', 'metrica', 'analitica', 'medir', 'decision', 'diagnostico']))
    return `${describe('estrategia')}\n\nNuestro método: ${DATA_METHOD.map((s) => s.title.toLowerCase()).join(' → ')}.`
  if (has(q, ['chatbot', 'bot', 'whatsapp', 'inteligencia artificial', ' ia', 'automatiz', 'asistente']))
    return describe('ai')
  if (has(q, ['web', 'pagina', 'sitio', 'landing', 'tienda', 'ecommerce', 'seo'])) return describe('web')
  if (has(q, ['redes', 'instagram', 'tiktok', 'contenido', 'reels', 'publicacion', 'community']))
    return describe('social')

  if (has(q, ['proceso', 'como trabajan', 'pasos', 'etapas', 'metodologia', 'cuanto tarda', 'tiempo']))
    return `Trabajamos en 5 etapas:\n${PROCESS.map((p, i) => `${i + 1}. ${p.title}`).join('\n')}\n\nLos tiempos dependen del alcance; los definimos en la propuesta.`

  if (has(q, ['portafolio', 'proyecto', 'cliente', 'casos', 'trabajos']))
    return 'En el portafolio mostramos conceptos demostrativos que ilustran cómo trabajamos en estrategia, redes, UGC, web y chatbots. No son clientes reales. Si quieres ver cómo aplicaría a tu marca, cuéntanos tu caso en el formulario.'

  if (has(q, ['contact', 'hablar', 'asesor', 'humano', 'correo', 'email', 'llamar', 'telefono']))
    return 'Puedes escribirnos en el formulario de la sección Contacto: revisamos cada solicitud y te respondemos con los siguientes pasos.'

  if (has(q, ['servicio', 'que hacen', 'ofrecen', 'que es aidu', 'quienes son']))
    return `Somos una agencia de marketing digital estratégico. Empezamos por la estrategia: validamos tus datos y decidimos con ellos. Nuestros servicios:\n${SERVICES.map((s) => `- ${s.title}`).join('\n')}\n\nAdemás coordinamos branding con aliados especializados.`

  if (has(q, ['hola', 'buenas', 'hey', 'saludos']))
    return '¡Hola! Soy Aidu, el asistente de la agencia. Puedo contarte sobre nuestros servicios, cómo usamos los datos para decidir o darte ideas para tu marca. ¿Por dónde empezamos?'

  return 'Puedo ayudarte con información sobre estrategia y datos, redes sociales, creadores UGC, páginas web y chatbots con IA, o darte ideas para tu marca. Si prefieres hablar con el equipo, usa el formulario de contacto.'
}
