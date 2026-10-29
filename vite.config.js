import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'

// Páginas del sitio: cada una genera un HTML estático con URL limpia (p. ej. /privacidad/).
const PAGES = {
  main: 'index.html',
  privacidad: 'privacidad/index.html',
  terminos: 'terminos/index.html',
  notFound: '404.html',
}
const SITEMAP_PATHS = ['/', '/privacidad/', '/terminos/']

/** Inyecta la URL del sitio en el HTML y genera sitemap.xml y robots.txt en el build. */
function siteMeta(siteUrl) {
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: 'site-meta',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
    generateBundle() {
      const urls = SITEMAP_PATHS.map(
        (p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod></url>`,
      ).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || 'https://www.aiduoficial.com').replace(/\/+$/, '')
  return {
    plugins: [react(), siteMeta(siteUrl)],
    build: {
      rollupOptions: {
        input: Object.fromEntries(Object.entries(PAGES).map(([k, f]) => [k, resolve(import.meta.dirname, f)])),
      },
    },
  }
})
