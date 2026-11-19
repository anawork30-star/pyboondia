import { useEffect, useState } from 'react'
import { Download, Share, SquarePlus, X } from 'lucide-react'

// Botón "Instalar en el celular": deja la app de tareas como acceso directo en la pantalla de inicio.
// - Android / Chrome / Edge: usa el aviso de instalación del navegador.
// - iPhone / iPad (Safari): Apple no permite instalar con un botón, así que se muestran los pasos.
// Se oculta cuando la app ya está abierta como aplicación instalada.

// El aviso (beforeinstallprompt) lo guarda un script en el HTML en window.__aiduInstall, porque
// puede llegar antes de que cargue esta página.
let deferredPrompt = typeof window !== 'undefined' ? (window.__aiduInstall ?? null) : null
const listeners = new Set()
if (typeof window !== 'undefined') {
  window.addEventListener('aidu-installable', () => {
    deferredPrompt = window.__aiduInstall
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.__aiduInstall = null
    listeners.forEach((fn) => fn())
  })
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
  }
}

const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export default function InstallApp() {
  const [, force] = useState(0)
  const [help, setHelp] = useState(false)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const fn = () => force((n) => n + 1)
    listeners.add(fn)
    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onMode = () => setInstalled(isStandalone())
    mq?.addEventListener?.('change', onMode)
    return () => {
      listeners.delete(fn)
      mq?.removeEventListener?.('change', onMode)
    }
  }, [])

  if (installed) return null

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }))
      // El aviso solo se puede usar una vez.
      deferredPrompt = null
      window.__aiduInstall = null
      if (outcome === 'accepted') setInstalled(true)
      force((n) => n + 1)
      return
    }
    setHelp(true)
  }

  const ios = isIOS()

  return (
    <>
      <button type="button" onClick={install} className="btn btn-outline px-4 py-2 text-sm">
        <Download size={16} aria-hidden="true" /> Instalar en el celular
      </button>

      {help && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="instalar-titulo">
          <div className="w-full max-w-md rounded-[2rem] bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-2xl" />
                <h2 id="instalar-titulo" className="text-xl font-bold leading-tight">
                  Lleva tus tareas en el celular
                </h2>
              </div>
              <button type="button" onClick={() => setHelp(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white ring-1 ring-ink/10" aria-label="Cerrar">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {ios ? (
              <ol className="mt-5 space-y-3 text-sm">
                <li className="flex gap-3">
                  <Step n={1} />
                  <span>
                    Abre esta página en <strong>Safari</strong> (en otros navegadores del iPhone puede no aparecer la opción).
                  </span>
                </li>
                <li className="flex gap-3">
                  <Step n={2} />
                  <span>
                    Toca <strong>Compartir</strong> <Share size={15} className="inline align-[-2px] text-blue" aria-label="(ícono de compartir)" /> en la barra de abajo.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Step n={3} />
                  <span>
                    Elige <strong>Agregar a inicio</strong> <SquarePlus size={15} className="inline align-[-2px]" aria-hidden="true" /> y luego <strong>Agregar</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-5 space-y-3 text-sm">
                <li className="flex gap-3">
                  <Step n={1} />
                  <span>
                    Abre esta página en <strong>Chrome</strong> en tu celular.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Step n={2} />
                  <span>
                    Toca el menú <strong>⋮</strong> (arriba a la derecha).
                  </span>
                </li>
                <li className="flex gap-3">
                  <Step n={3} />
                  <span>
                    Elige <strong>Instalar aplicación</strong> o <strong>Agregar a la pantalla principal</strong>.
                  </span>
                </li>
              </ol>
            )}
            <p className="mt-5 rounded-2xl bg-white p-3 text-xs text-muted ring-1 ring-ink/5">
              Quedará el ícono de AIDU en tu pantalla de inicio y se abrirá directo en <strong>Mis tareas</strong>, como una app. Inicias sesión
              una vez y la sesión se mantiene.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function Step({ n }) {
  return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet text-xs font-bold text-paper">{n}</span>
}
