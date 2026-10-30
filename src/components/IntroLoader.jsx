import { useEffect, useState } from 'react'
import Logo from './Logo'

const KEY = 'aidu-intro-visto'

function shouldShow() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    return !sessionStorage.getItem(KEY)
  } catch {
    return false
  }
}

/** Animación de entrada con el logo: una vez por visita, breve y se puede saltar con un clic. */
export default function IntroLoader() {
  const [visible, setVisible] = useState(shouldShow)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      // sin almacenamiento: se mostrará de nuevo en la próxima carga
    }
    const out = setTimeout(() => setLeaving(true), 1500)
    const done = setTimeout(() => setVisible(false), 2200)
    return () => {
      clearTimeout(out)
      clearTimeout(done)
    }
  }, [visible])

  if (!visible) return null
  return (
    <div
      aria-hidden="true"
      onClick={() => setVisible(false)}
      className={`fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-ink transition-transform duration-700 ease-out-soft ${
        leaving ? '-translate-y-full' : ''
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <Logo colorful intro label={false} className="h-40 w-auto sm:h-52" />
        <p className="intro-tagline text-xs font-medium uppercase tracking-[0.3em] text-paper/60">Estrategia · Datos · IA</p>
      </div>
    </div>
  )
}
