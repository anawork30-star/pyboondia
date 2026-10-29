import { IMAGES } from './images.js'

// Proyectos de muestra. IMPORTANTE: son conceptos demostrativos creados para ilustrar el tipo de
// trabajo de la agencia; no representan clientes reales ni resultados medidos. Cuando tengas
// casos reales, reemplaza estos objetos (y pon `concept: false`).

export const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'estrategia', label: 'Estrategia y datos' },
  { id: 'social', label: 'Redes sociales' },
  { id: 'ugc', label: 'Creadores UGC' },
  { id: 'web', label: 'Diseño web' },
  { id: 'ai', label: 'Chatbots e IA' },
]

export const PROJECTS = [
  {
    id: 'plan-ecommerce',
    category: 'estrategia',
    title: 'Plan de crecimiento para una tienda online',
    summary: 'Concepto de estrategia digital: del diagnóstico de datos al plan por canal.',
    challenge:
      'Una tienda con ventas irregulares que invertía en varios canales sin saber cuál aportaba resultados.',
    approach:
      'Auditoría de la medición, validación de los datos de ventas y tráfico, definición de audiencias y un plan de acción priorizado con KPIs por canal.',
    deliverables: ['Auditoría de medición', 'Mapa de audiencias', 'KPIs por canal', 'Plan de acción priorizado'],
    image: IMAGES.strategyBoard,
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
    id: 'ugc-cuidado-personal',
    category: 'ugc',
    title: 'Campaña UGC para una marca de cuidado personal',
    summary: 'Concepto de selección de creadores y piezas auténticas para redes y anuncios.',
    challenge:
      'Anuncios con producción de estudio que se sentían lejanos y no generaban confianza en nuevos clientes.',
    approach:
      'Perfil de creadores afines al público, brief con mensajes clave, guiones flexibles, revisión de calidad y acuerdo de derechos de uso para pauta.',
    deliverables: ['Perfil y selección de creadores', 'Brief y guiones', 'Revisión de piezas', 'Acuerdo de derechos de uso'],
    image: IMAGES.ugcCasting,
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
  {
    id: 'tablero-decisiones',
    category: 'estrategia',
    title: 'Tablero de medición para decidir con datos',
    summary: 'Concepto de tablero que une ventas, redes y web en un solo lugar.',
    challenge: 'Datos repartidos en varias plataformas, con cifras que no coincidían entre sí.',
    approach:
      'Limpieza y validación de fuentes, definición de métricas comunes y un tablero con preguntas de negocio, no solo gráficos.',
    deliverables: ['Validación de fuentes', 'Diccionario de métricas', 'Tablero de seguimiento', 'Rutina de revisión mensual'],
    image: IMAGES.dataAnalytics,
    concept: true,
    size: 'regular',
  },
]
