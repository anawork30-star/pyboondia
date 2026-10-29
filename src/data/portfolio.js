import { IMAGES } from './images'

// Proyectos de muestra. IMPORTANTE: son conceptos demostrativos creados para ilustrar el tipo de
// trabajo de la agencia; no representan clientes reales ni resultados medidos. Cuando tengas
// casos reales, reemplaza estos objetos (y pon `concept: false`).

export const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'branding', label: 'Branding' },
  { id: 'social', label: 'Redes sociales' },
  { id: 'web', label: 'Diseño web' },
  { id: 'ai', label: 'Chatbots e IA' },
]

export const PROJECTS = [
  {
    id: 'cafe-origen',
    category: 'branding',
    title: 'Identidad para un café de especialidad',
    summary: 'Concepto de marca artesanal: del boceto del símbolo al sistema de empaques.',
    challenge:
      'Una marca de café que necesita diferenciarse en anaquel y transmitir su origen sin caer en los clichés del sector.',
    approach:
      'Exploración de símbolos a mano alzada, paleta inspirada en el proceso de tostión y un sistema tipográfico flexible para empaques y redes.',
    deliverables: ['Logotipo y variaciones', 'Paleta y tipografías', 'Plantillas de empaque', 'Mini manual de marca'],
    image: IMAGES.workLogoSketch,
    concept: true,
    size: 'tall',
  },
  {
    id: 'ruta-andina',
    category: 'social',
    title: 'Contenido para una marca de turismo de aventura',
    summary: 'Concepto de calendario editorial con fotografía y reels de destinos.',
    challenge:
      'Mostrar experiencias de viaje de forma aspiracional y, a la vez, resolver dudas prácticas que frenan la reserva.',
    approach:
      'Pilares de contenido (inspirar, educar, convertir), guion de reels por destino y plantillas para historias con preguntas frecuentes.',
    deliverables: ['Estrategia de pilares', 'Calendario mensual', 'Guiones de reels', 'Plantillas de historias'],
    image: IMAGES.workFeed,
    concept: true,
    size: 'wide',
  },
  {
    id: 'lanzamiento-app',
    category: 'web',
    title: 'Landing page de lanzamiento',
    summary: 'Concepto de landing orientada a registro, adaptada a escritorio, tableta y móvil.',
    challenge:
      'Explicar un producto digital en segundos y llevar al visitante a registrarse sin distracciones.',
    approach:
      'Arquitectura de una sola acción, jerarquía editorial, prueba de producto visible y formulario corto.',
    deliverables: ['Wireframes', 'Diseño UI responsive', 'Desarrollo frontend', 'Configuración SEO básica'],
    image: IMAGES.workLanding,
    concept: true,
    size: 'regular',
  },
  {
    id: 'asistente-clinica',
    category: 'ai',
    title: 'Asistente virtual para agendar citas',
    summary: 'Concepto de chatbot que resuelve preguntas frecuentes y deriva a recepción.',
    challenge:
      'Un equipo de recepción saturado por preguntas repetidas sobre horarios, servicios y requisitos.',
    approach:
      'Mapa de intenciones, flujo conversacional con tono cercano, captura de datos de contacto y traspaso a un asesor humano.',
    deliverables: ['Mapa de intenciones', 'Flujos conversacionales', 'Integración web y WhatsApp', 'Reglas de derivación'],
    image: IMAGES.workRobot,
    concept: true,
    size: 'regular',
  },
  {
    id: 'sistema-cromatico',
    category: 'branding',
    title: 'Sistema cromático para una marca de bienestar',
    summary: 'Concepto de paleta y piezas gráficas para un estudio de yoga y bienestar.',
    challenge: 'Una marca que se veía distinta en cada pieza y no transmitía la calma de su experiencia.',
    approach: 'Paleta principal y secundaria con reglas de uso, retícula para piezas y set de iconografía.',
    deliverables: ['Paleta de color', 'Iconografía', 'Piezas publicitarias', 'Guía de aplicación'],
    image: IMAGES.serviceBranding,
    concept: true,
    size: 'wide',
  },
  {
    id: 'kit-interfaz',
    category: 'web',
    title: 'Sistema de diseño para plataforma educativa',
    summary: 'Concepto de librería de componentes para acelerar nuevas páginas.',
    challenge: 'Cada nueva sección se diseñaba desde cero y la experiencia se volvía inconsistente.',
    approach: 'Inventario de interfaces, tokens de diseño y componentes reutilizables documentados.',
    deliverables: ['Tokens de diseño', 'Librería de componentes', 'Plantillas de página', 'Documentación'],
    image: IMAGES.workUiKit,
    concept: true,
    size: 'tall',
  },
  {
    id: 'reels-producto',
    category: 'social',
    title: 'Serie de reels de producto',
    summary: 'Concepto de piezas audiovisuales cortas para presentar novedades.',
    challenge: 'Productos con buenos atributos que se perdían en publicaciones estáticas.',
    approach: 'Formato serial reconocible, ganchos en los primeros segundos y edición con identidad propia.',
    deliverables: ['Formato de serie', 'Guiones', 'Edición de video', 'Portadas'],
    image: IMAGES.serviceSocial,
    concept: true,
    size: 'regular',
  },
  {
    id: 'leads-automatizados',
    category: 'ai',
    title: 'Captación y calificación de leads',
    summary: 'Concepto de automatización que registra y clasifica oportunidades comerciales.',
    challenge: 'Solicitudes dispersas entre canales y sin seguimiento ordenado.',
    approach:
      'Bot de preguntas de calificación, registro automático en el CRM y alertas para el equipo comercial.',
    deliverables: ['Preguntas de calificación', 'Integración con CRM', 'Alertas internas', 'Tablero de seguimiento'],
    image: IMAGES.workDashboard,
    concept: true,
    size: 'regular',
  },
]
