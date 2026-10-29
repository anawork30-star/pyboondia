import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import Logo from './Logo'
import { NAV } from '../config/brand'

const hrefFor = (id, onHome) => (onHome ? `#${id}` : `/#${id}`)

export default function Header({ onHome = true }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('inicio')
  const toggleRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Resalta la sección visible en la navegación.
  useEffect(() => {
    if (!onHome || typeof IntersectionObserver === 'undefined') return
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id))
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [onHome])

  // Menú móvil: bloquea el scroll del fondo y se cierra con Escape.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const onChange = () => mq.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const solid = scrolled || open

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-300 ${
          solid ? 'bg-paper/85 py-3 shadow-[0_1px_0_rgb(20_18_24/0.08)] backdrop-blur-xl' : 'bg-transparent py-5'
        }`}
      >
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Saltar al contenido
        </a>
        <div className="container-x flex items-center justify-between gap-6">
          <a href={onHome ? '#inicio' : '/'} aria-label="AIDU, ir al inicio" onClick={() => setOpen(false)}>
            <Logo />
          </a>
  
          <nav aria-label="Principal" className="hidden xl:block">
            <ul className="flex items-center gap-1 rounded-full border border-ink/10 bg-paper/70 p-1.5 backdrop-blur">
              {NAV.map((item) => {
                const isActive = onHome && active === item.id
                return (
                  <li key={item.id}>
                    <a
                      href={hrefFor(item.id, onHome)}
                      aria-current={isActive ? 'location' : undefined}
                      className={`block rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-ink text-paper' : 'text-ink/75 hover:bg-ink/5 hover:text-ink'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
  
          <div className="flex items-center gap-2">
            <a href={hrefFor('contacto', onHome)} className="btn btn-primary hidden sm:inline-flex">
              Solicitar cotización <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper xl:hidden"
              aria-expanded={open}
              aria-controls="menu-movil"
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Fuera del <header>: su backdrop-filter crearía un contenedor que recortaría este panel fijo. */}
      <div
        id="menu-movil"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-paper xl:hidden"
      >
        <nav aria-label="Menú móvil" className="container-x flex min-h-full flex-col justify-between gap-10 py-8">
          <ul className="flex flex-col">
            {NAV.map((item, i) => (
              <li key={item.id} className="border-b border-ink/10">
                <a
                  href={hrefFor(item.id, onHome)}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between py-4 font-display text-4xl font-bold tracking-tight"
                >
                  {item.label}
                  <span className="text-sm font-medium text-muted">0{i + 1}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href={hrefFor('contacto', onHome)} onClick={() => setOpen(false)} className="btn btn-primary w-full py-4 text-base">
            Solicitar cotización <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </>
  )
}
