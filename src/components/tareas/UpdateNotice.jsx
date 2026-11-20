import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

// Avisa cuando hay una versión nueva publicada. Sirve sobre todo cuando la app está instalada en el
// celular: puede quedarse abierta días con la versión anterior.

const scriptOf = (html) => html.match(/src="(\/assets\/main-[^"]+\.js)"/)?.[1] ?? null

export default function UpdateNotice() {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    const current = document.querySelector('script[src*="/assets/main-"]')?.getAttribute('src')
    if (!current) return // en desarrollo no hay paquete con hash
    let last = 0
    async function check() {
      if (document.visibilityState !== 'visible' || Date.now() - last < 60_000) return
      last = Date.now()
      try {
        const res = await fetch(location.pathname, { cache: 'no-store' })
        const latest = scriptOf(await res.text())
        if (latest && latest !== current) setAvailable(true)
      } catch {
        /* sin conexión: se vuelve a intentar luego */
      }
    }
    check()
    const t = setInterval(check, 5 * 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  if (!available) return null
  return (
    <div className="fixed inset-x-0 top-3 z-[90] flex justify-center px-4" role="status">
      <button type="button" onClick={() => location.reload()} className="btn btn-primary shadow-[0_20px_50px_-15px_rgb(20_18_24/0.6)]">
        <RefreshCw size={16} aria-hidden="true" /> Hay una versión nueva · Actualizar
      </button>
    </div>
  )
}
