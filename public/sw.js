// Service worker de la app "Mis tareas" (instalable en el celular).
// No guarda en caché las tareas ni nada privado: todo se pide siempre a la red. Solo muestra una
// página amable cuando no hay conexión.
const OFFLINE = 'aidu-offline-v1'
const OFFLINE_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · AIDU</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f6f3ee;color:#141218;font:16px/1.5 system-ui,sans-serif;padding:24px;text-align:center}
img{width:72px;height:72px;border-radius:18px}h1{font-size:1.4rem;margin:16px 0 4px}p{color:#5f5a66;margin:0 0 20px}
button{border:0;border-radius:999px;background:#141218;color:#f6f3ee;font:600 15px system-ui;padding:12px 22px}</style></head>
<body><main><img src="/icons/icon-192.png" alt=""><h1>Sin conexión</h1><p>Revisa tu internet para ver y actualizar tus tareas.</p><button onclick="location.reload()">Reintentar</button></main></body></html>`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE)
      .then((c) => Promise.all([c.put('/offline', new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })), c.add('/icons/icon-192.png')]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== OFFLINE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline')))
  } else if (new URL(req.url).pathname === '/icons/icon-192.png') {
    event.respondWith(fetch(req).catch(() => caches.match(req)))
  }
})
