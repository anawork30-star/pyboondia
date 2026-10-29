// Catálogo central de imágenes. Todas son fotos de Unsplash (licencia Unsplash: uso comercial
// permitido sin atribución obligatoria), descargadas y optimizadas en /public/images en dos anchos.
// Para reemplazar una imagen: sube `nombre-640.webp` y `nombre-1280.webp` a /public/images y
// actualiza el texto alternativo aquí. `source` guarda el origen para auditoría de licencias.

const img = (name, alt, photoId) => ({
  src: `/images/${name}-1280.webp`,
  srcSet: `/images/${name}-640.webp 640w, /images/${name}-1280.webp 1280w`,
  alt,
  source: `https://images.unsplash.com/photo-${photoId}`,
})

export const IMAGES = {
  heroDesigner: img(
    'hero-designer',
    'Persona diseñando en un portátil con tableta gráfica, junto a muestras de color',
    '1572044162444-ad60f128bdea',
  ),
  heroPhone: img(
    'hero-phone',
    'Teléfono móvil sobre un escritorio mostrando un feed de fotografías',
    '1586953208448-b95a79798f07',
  ),
  abstractGradient: img(
    'abstract-gradient',
    'Composición abstracta de ondas en violeta, azul y rosa',
    '1618005182384-a83a8bd57fbe',
  ),
  abstractWaves: img(
    'abstract-waves',
    'Líneas azules ondulantes sobre fondo oscuro',
    '1634017839464-5c339ebe3cb4',
  ),
  serviceBranding: img(
    'service-branding',
    'Paletas de color impresas y tableta con piezas gráficas sobre una mesa de diseño',
    '1561070791-2526d30994b5',
  ),
  serviceSocial: img(
    'service-social',
    'Línea de tiempo de edición de video con clips de colores',
    '1574717024653-61fd2cf4d44d',
  ),
  serviceWeb: img(
    'service-web',
    'Monitor mostrando el diseño de interfaces de una aplicación móvil',
    '1609921212029-bb5a28e60960',
  ),
  serviceAi: img(
    'service-ai',
    'Mano robótica blanca extendida en un espacio luminoso',
    '1531746790731-6c087fecd65a',
  ),
  workLogoSketch: img(
    'work-logo-sketch',
    'Manos bocetando ideas de logotipo en un cuaderno junto a una cámara',
    '1493421419110-74f4e85ba126',
  ),
  workFeed: img(
    'work-feed',
    'Fotógrafo capturando un paisaje de montañas entre nubes',
    '1492691527719-9d1e07e534b4',
  ),
  workLanding: img(
    'work-landing',
    'Escritorio con monitor, tableta y teléfono mostrando una landing page',
    '1547658719-da2b51169166',
  ),
  workUiKit: img(
    'work-ui-kit',
    'Pantalla con una librería de componentes de interfaz y plantas al fondo',
    '1558655146-d09347e92766',
  ),
  workWireframes: img(
    'work-wireframes',
    'Persona dibujando wireframes en una tableta con lápiz digital',
    '1586717791821-3f44a563fa4c',
  ),
  workRobot: img(
    'work-robot',
    'Robot humanoide de atención al cliente con pantalla en el pecho',
    '1485827404703-89b55fcc595e',
  ),
  workDashboard: img(
    'work-dashboard',
    'Tablero analítico con gráficos de usuarios y métricas',
    '1551288049-bebda4e38f71',
  ),
  workAi: img(
    'work-ai',
    'Letras tridimensionales "AI" sobre una red de nodos azules',
    '1677442136019-21780ecad995',
  ),
  teamWorkshop: img(
    'team-workshop',
    'Equipo creativo en un taller organizando ideas con notas adhesivas',
    '1552664730-d307ca884978',
  ),
  teamStudio: img(
    'team-studio',
    'Equipo trabajando con portátiles alrededor de una mesa de madera',
    '1522071820081-009f0129c71c',
  ),
}
