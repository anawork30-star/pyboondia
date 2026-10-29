# AIDU · Sitio web de la agencia

Sitio de **AIDU, estudio creativo de marketing digital** (branding, redes sociales, páginas web y
chatbots con IA). Construido con **React 19 + Vite 8 + Tailwind CSS 4**, publicado como sitio
estático en **GitHub Pages** (dominio `www.aiduoficial.com`, archivo `public/CNAME`) y con el
formulario de contacto conectado a **Supabase**.

## Estructura

```
index.html, privacidad/, terminos/, 404.html   Páginas HTML (cada una con su título y metadatos)
src/main.jsx              Punto de entrada: elige la página según <body data-page="...">
src/config/brand.js       Nombre, textos de marca, navegación y canales de contacto (desde .env)
src/data/                 Contenido centralizado: servicios, portafolio, proceso, imágenes
src/components/           Header, Footer, Logo, Reveal (animaciones), Picture, SectionHeading
src/sections/             Secciones de la portada (Hero, Services, Portfolio, About, Process, CtaBand, Contact)
src/pages/                Home, Legal (privacidad y términos), NotFound
src/lib/contact.js        Validación y envío del formulario (RPC segura de Supabase)
src/lib/supabase.js       Cliente público de Supabase (carga bajo demanda)
src/index.css             Tokens de diseño (colores, tipografías) y estilos base
public/images/            Fotografías optimizadas (WebP, 640 y 1280 px)
supabase/migrations/      Migraciones SQL (0004 = solicitudes de contacto)
tests/unit/               Pruebas con Vitest
```

> **Código heredado:** `src/app`, `src/lib/*.ts`, `src/middleware.ts`, `next.config.mjs` y
> `src/App.jsx` pertenecen a la tienda anterior (Next.js / maqueta "Parfit"). El build actual de Vite
> **no** los usa; se conservan sin cambios para no perder trabajo. Puedes eliminarlos cuando lo decidas.

## Requisitos

- Node.js 20.19+ o 22.12+ (requisito de Vite 8)
- npm

## Instalación y desarrollo

```bash
npm install
cp .env.example .env.local   # completa los valores (ver abajo)
npm run dev                  # http://localhost:5173
```

| Comando           | Qué hace                                               |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Servidor de desarrollo                                 |
| `npm run build`   | Build de producción en `dist/` (incluye sitemap y robots) |
| `npm run preview` | Sirve `dist/` localmente para revisarlo                |
| `npm run lint`    | ESLint                                                 |
| `npm test`        | Pruebas unitarias (Vitest)                             |
| `npm run deploy`  | Compila y publica `dist/` en la rama `gh-pages`        |

## Variables de entorno

Todas las `VITE_*` terminan dentro del JavaScript público: **solo datos públicos**.

| Variable | Uso |
| --- | --- |
| `VITE_SITE_URL` | URL canónica (SEO, Open Graph, sitemap). Por defecto `https://www.aiduoficial.com` |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave **anon/publishable** (nunca la `service_role`) |
| `VITE_CONTACT_EMAIL` | Correo visible en contacto y pie de página |
| `VITE_WHATSAPP_NUMBER` | Número para el botón de WhatsApp (formato `57300XXXXXXX`) |
| `VITE_LEGAL_NAME`, `VITE_CITY` | Razón social y ciudad para el pie y la política de datos |
| `VITE_INSTAGRAM_URL`, `VITE_LINKEDIN_URL`, `VITE_TIKTOK_URL`, `VITE_BEHANCE_URL` | Redes sociales |

Si un canal no está configurado, el sitio lo oculta (no se muestran datos inventados). Si Supabase
no está configurado, el formulario muestra un aviso de error y **nunca** un falso mensaje de éxito.

## Supabase: formulario de contacto

La migración `supabase/migrations/0004_contact_requests.sql` es **solo aditiva** y re-ejecutable:

- Crea la tabla `contact_requests` con RLS activado y sin acceso para usuarios anónimos.
- Crea la función `submit_contact_request(...)` (`security definer`), la única vía de escritura
  pública: valida los datos, exige consentimiento y limita a 5 envíos por correo por hora.
- Si existe `is_admin()` (migración 0001), los administradores autenticados pueden leer las
  solicitudes y cambiar solo su `status`.

Aplicarla (elige una opción):

1. **Panel de Supabase** → SQL Editor → pega el contenido del archivo → *Run*.
2. **CLI**: `supabase link --project-ref <ref>` y luego `supabase db push`.

Revisar solicitudes: Supabase → Table Editor → `contact_requests` (o con una sesión de administrador).

## Publicación

### 1. Subir a GitHub

```bash
git add -A
git commit -m "Rediseño del sitio de la agencia"
git push origin main
```

El workflow `.github/workflows/ci.yml` ejecuta lint, pruebas y build en cada push y pull request.

### 2. Desplegar en GitHub Pages

El proyecto ya usa `gh-pages` y un dominio propio (`public/CNAME`):

```bash
npm run deploy
```

Esto compila con las variables de tu `.env.local` y publica `dist/` en la rama `gh-pages`. En GitHub →
Settings → Pages, la fuente debe ser **Deploy from a branch → `gh-pages` / root**, con el dominio
`www.aiduoficial.com` y *Enforce HTTPS* activado.

GitHub Pages solo sirve archivos estáticos: no ejecuta servidores. Por eso el formulario escribe en
Supabase directamente desde el navegador con la clave pública y la seguridad vive en RLS y en la
función SQL. Nunca pongas secretos (como la `service_role`) en variables `VITE_*`.

## Imágenes

Las fotos provienen de [Unsplash](https://unsplash.com/license) (uso comercial permitido) y están
descargadas en `public/images`. El origen de cada una está en `src/data/images.js`. Para cambiar una,
reemplaza `nombre-640.webp` y `nombre-1280.webp` y actualiza su texto alternativo.

Los proyectos del portafolio son **conceptos demostrativos** (así se indica en el sitio). Sustitúyelos
por casos reales en `src/data/portfolio.js` cuando los tengas.

## Textos legales

`src/pages/Legal.jsx` contiene una política de datos base pensada para Colombia (Ley 1581 de 2012).
Debe revisarla un asesor legal y completarse con la razón social, NIT y canal de atención reales.
