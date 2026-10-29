import { IMAGES } from './images.js'

// Servicios principales. Cada uno define su "personalidad" visual (tema) y el valor que se
// preselecciona en el formulario al pulsar su CTA. `id` coincide con la restricción de la tabla
// contact_requests en Supabase (migraciones 0004 y 0005): si añades un servicio, actualízala.

export const SERVICES = [
  {
    id: 'estrategia',
    number: '01',
    title: 'Estrategia digital basada en datos',
    short: 'Estrategia',
    pitch: 'Primero entendemos, luego decidimos. Nunca al revés.',
    description:
      'Es el punto de partida de todo lo que hacemos. Analizamos tu negocio, tu audiencia y tu competencia, validamos los datos disponibles y, con esa evidencia, definimos qué hacer, en qué canal y cómo medirlo.',
    deliverables: [
      'Diagnóstico digital y de competencia',
      'Definición de audiencias y propuesta de valor',
      'Objetivos y KPIs medibles',
      'Validación de datos y medición',
      'Plan de acción por canal',
      'Reportes con decisiones, no solo cifras',
    ],
    benefits: [
      'Inviertes en lo que los datos respaldan, no en suposiciones.',
      'Cada acción tiene un objetivo y una forma clara de medirse.',
    ],
    theme: 'ink',
    image: IMAGES.strategyBoard,
  },
  {
    id: 'social',
    number: '02',
    title: 'Redes sociales y contenido',
    short: 'Redes sociales',
    pitch: 'Contenido con intención, publicado con constancia.',
    description:
      'Convertimos la estrategia en un plan de contenidos: planificamos, diseñamos y producimos piezas que conectan con tu audiencia y sostienen la conversación de tu marca en el tiempo.',
    deliverables: [
      'Estrategia y pilares de contenido',
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
    id: 'ugc',
    number: '03',
    title: 'Conexión con creadores UGC',
    short: 'Creadores UGC',
    pitch: 'Personas reales hablando de tu marca, con método.',
    description:
      'Te conectamos con creadores de contenido UGC (contenido generado por usuarios) que encajan con tu público. Nos encargamos del perfil, el brief, la coordinación y la revisión, para que el contenido se sienta auténtico y cumpla su objetivo.',
    deliverables: [
      'Perfil y selección de creadores',
      'Brief creativo y guiones',
      'Coordinación de producción y entregas',
      'Revisión de calidad y ajustes',
      'Acuerdo de derechos de uso del contenido',
      'Uso del contenido en redes y anuncios',
    ],
    benefits: [
      'Contenido que genera confianza porque viene de personas como tus clientes.',
      'Más variedad de piezas para probar y ver cuál funciona mejor.',
    ],
    theme: 'coral',
    image: IMAGES.ugcCreator,
  },
  {
    id: 'web',
    number: '04',
    title: 'Diseño y desarrollo web',
    short: 'Páginas web',
    pitch: 'Sitios rápidos, claros y pensados para convertir.',
    description:
      'Diseñamos y desarrollamos sitios que comunican tu propuesta de valor y guían a cada visitante hacia la acción, con analítica configurada para saber qué funciona.',
    deliverables: [
      'Landing pages',
      'Sitios corporativos',
      'Tiendas online',
      'Diseño responsive',
      'Optimización SEO y rendimiento',
      'Analítica y medición de conversiones',
    ],
    benefits: [
      'Una vitrina digital disponible 24/7 que trabaja por tu negocio.',
      'Datos de cada visita para mejorar con evidencia.',
    ],
    theme: 'blue',
    image: IMAGES.serviceWeb,
  },
  {
    id: 'ai',
    number: '05',
    title: 'Chatbots e inteligencia artificial',
    short: 'Chatbots e IA',
    pitch: 'Atención inmediata y procesos que se mueven solos.',
    description:
      'Diseñamos asistentes conversacionales y automatizaciones que responden, califican y derivan a tu equipo en el momento justo, sin perder el tono de tu marca. Como el asistente de esta página.',
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
      'Cada conversación deja datos para entender mejor a tus clientes.',
    ],
    theme: 'lime',
    image: IMAGES.serviceAi,
  },
]

// Servicios complementarios que coordinamos con aliados especializados (no los hacemos en casa).
export const ADDITIONAL_SERVICES = [
  {
    id: 'branding',
    title: 'Branding y diseño gráfico',
    description:
      'Identidad visual, logotipo, manual de marca y piezas impresas. Lo realizamos con aliados especializados y lo coordinamos nosotros para que quede alineado con tu estrategia.',
    items: ['Identidad visual', 'Diseño de logotipo', 'Manual de marca', 'Piezas impresas'],
  },
]

// Opciones del formulario. Los valores (`value`) deben coincidir con la migración SQL.
export const SERVICE_OPTIONS = [
  ...SERVICES.map((s) => ({ value: s.id, label: s.title })),
  ...ADDITIONAL_SERVICES.map((s) => ({ value: s.id, label: `${s.title} (servicio adicional)` })),
  { value: 'integral', label: 'Varios servicios / plan integral' },
]

export const BUDGET_OPTIONS = [
  { value: 'menos-2m', label: 'Menos de $2 millones COP' },
  { value: '2-5m', label: '$2 a $5 millones COP' },
  { value: '5-10m', label: '$5 a $10 millones COP' },
  { value: 'mas-10m', label: 'Más de $10 millones COP' },
  { value: 'por-definir', label: 'Aún no lo tengo definido' },
]
