import { IMAGES } from './images'

// Cada servicio define su propia "personalidad" visual (tema) y el valor que se preselecciona
// en el formulario de contacto al pulsar su CTA. `id` coincide con la restricción de la tabla
// contact_requests en Supabase: si añades un servicio, actualiza también la migración.

export const SERVICES = [
  {
    id: 'branding',
    number: '01',
    title: 'Diseño gráfico y branding',
    short: 'Branding',
    pitch: 'Marcas con carácter, coherentes en cada punto de contacto.',
    description:
      'Construimos identidades que se reconocen a primera vista: desde la estrategia y el concepto hasta el sistema visual completo y las piezas que lo ponen a trabajar.',
    deliverables: [
      'Identidad visual',
      'Diseño de logotipos',
      'Manual de marca',
      'Piezas publicitarias',
      'Material digital e impreso',
    ],
    benefits: [
      'Una imagen profesional que transmite confianza desde el primer contacto.',
      'Reglas claras para que tu marca se vea igual en todos los canales.',
    ],
    theme: 'coral',
    image: IMAGES.serviceBranding,
  },
  {
    id: 'social',
    number: '02',
    title: 'Redes sociales y contenido',
    short: 'Redes sociales',
    pitch: 'Contenido con intención, publicado con constancia.',
    description:
      'Planificamos, diseñamos y producimos contenido que conecta con tu audiencia y sostiene una conversación de marca en el tiempo.',
    deliverables: [
      'Estrategia de contenidos',
      'Diseño de publicaciones',
      'Reels y contenido audiovisual',
      'Calendarios editoriales',
      'Gestión de comunidades y campañas, cuando aplique',
    ],
    benefits: [
      'Presencia constante sin improvisar cada semana.',
      'Mensajes alineados con tus objetivos comerciales.',
    ],
    theme: 'violet',
    image: IMAGES.serviceSocial,
  },
  {
    id: 'web',
    number: '03',
    title: 'Diseño y desarrollo web',
    short: 'Páginas web',
    pitch: 'Sitios rápidos, claros y pensados para convertir.',
    description:
      'Diseñamos y desarrollamos sitios que comunican tu propuesta de valor y guían a cada visitante hacia la acción, en cualquier dispositivo.',
    deliverables: [
      'Landing pages',
      'Sitios corporativos',
      'Tiendas online',
      'Diseño responsive',
      'Optimización SEO y rendimiento',
    ],
    benefits: [
      'Una vitrina digital disponible 24/7 que trabaja por tu negocio.',
      'Base técnica sólida para posicionarte en buscadores.',
    ],
    theme: 'ink',
    image: IMAGES.serviceWeb,
  },
  {
    id: 'ai',
    number: '04',
    title: 'Chatbots e inteligencia artificial',
    short: 'Chatbots e IA',
    pitch: 'Atención inmediata y procesos que se mueven solos.',
    description:
      'Diseñamos asistentes conversacionales y automatizaciones que responden, califican y derivan a tu equipo en el momento justo, sin perder el tono de tu marca.',
    deliverables: [
      'Bots para WhatsApp y web',
      'Automatización de preguntas frecuentes',
      'Captación de leads',
      'Integración con sistemas y canales',
      'Derivación a asesores humanos',
      'Automatización de procesos comerciales y de servicio',
    ],
    benefits: [
      'Respuestas a cualquier hora sin aumentar la carga del equipo.',
      'Más tiempo para las conversaciones que realmente cierran ventas.',
    ],
    theme: 'lime',
    image: IMAGES.serviceAi,
  },
]

// Opciones del formulario. Los valores (`value`) deben coincidir con la migración SQL.
export const SERVICE_OPTIONS = [
  ...SERVICES.map((s) => ({ value: s.id, label: s.title })),
  { value: 'integral', label: 'Varios servicios / plan integral' },
]

export const BUDGET_OPTIONS = [
  { value: 'menos-2m', label: 'Menos de $2 millones COP' },
  { value: '2-5m', label: '$2 a $5 millones COP' },
  { value: '5-10m', label: '$5 a $10 millones COP' },
  { value: 'mas-10m', label: 'Más de $10 millones COP' },
  { value: 'por-definir', label: 'Aún no lo tengo definido' },
]
