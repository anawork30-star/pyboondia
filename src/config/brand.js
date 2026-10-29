// Configuración central de la marca. Cambia aquí nombre, textos clave y canales de contacto.
// Los datos de contacto vienen de variables de entorno públicas (VITE_*): si no están definidas,
// el sitio oculta el canal en lugar de mostrar un dato inventado.

const env = import.meta.env

const clean = (value) => (typeof value === 'string' ? value.trim() : '')

const whatsappNumber = clean(env.VITE_WHATSAPP_NUMBER).replace(/\D/g, '')

export const BRAND = {
  name: 'AIDU',
  legalName: clean(env.VITE_LEGAL_NAME) || 'AIDU',
  tagline: 'Estudio creativo de marketing digital',
  description:
    'Branding, redes sociales, páginas web y chatbots con inteligencia artificial para marcas que quieren crecer con estrategia.',
  siteUrl: clean(env.VITE_SITE_URL) || 'https://www.aiduoficial.com',
  city: clean(env.VITE_CITY),
}

export const CONTACT = {
  email: clean(env.VITE_CONTACT_EMAIL),
  whatsapp: whatsappNumber,
  whatsappUrl: whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, quiero hablar sobre un proyecto con AIDU.')}`
    : '',
}

export const SOCIALS = [
  { id: 'instagram', label: 'Instagram', url: clean(env.VITE_INSTAGRAM_URL) },
  { id: 'linkedin', label: 'LinkedIn', url: clean(env.VITE_LINKEDIN_URL) },
  { id: 'tiktok', label: 'TikTok', url: clean(env.VITE_TIKTOK_URL) },
  { id: 'behance', label: 'Behance', url: clean(env.VITE_BEHANCE_URL) },
].filter((s) => s.url)

export const NAV = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'portafolio', label: 'Portafolio' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'contacto', label: 'Contacto' },
]

export const LEGAL_LINKS = [
  { href: '/privacidad/', label: 'Política de privacidad' },
  { href: '/terminos/', label: 'Términos de uso' },
]
