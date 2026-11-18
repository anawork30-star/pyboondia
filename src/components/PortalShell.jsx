import { KanbanSquare, LoaderCircle, LogOut, ShieldCheck, Tags } from 'lucide-react'
import Logo from './Logo'

const PORTAL_NAV = [
  { id: 'planes', href: '/planes-comerciales/', label: 'Planes', icon: Tags },
  { id: 'tareas', href: '/tareas/', label: 'Mis tareas', icon: KanbanSquare },
]

export default function PortalBar({ current, email, onLogout, leaving }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 py-3">
      <div className="container-x">
        <div className="flex items-center justify-between gap-2 rounded-full bg-white/85 py-2 pl-4 pr-2 shadow-[0_12px_40px_-12px_rgb(20_18_24/0.25)] ring-1 ring-ink/5 backdrop-blur-xl sm:pl-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <a href="/" aria-label="AIDU, ir al sitio público" className="shrink-0">
              <Logo label={false} className="h-8 w-auto sm:h-9" />
            </a>
            <span className="hidden items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 text-xs font-semibold text-violet lg:inline-flex">
              <ShieldCheck size={14} aria-hidden="true" /> Sección privada
            </span>
            <nav aria-label="Secciones del portal" className="flex items-center gap-1">
              {PORTAL_NAV.map(({ id, href, label, icon: Icon }) => (
                <a
                  key={id}
                  href={href}
                  aria-current={current === id ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                    current === id ? 'bg-ink text-paper' : 'text-muted hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span className={current === id ? '' : 'sr-only sm:not-sr-only'}>{label}</span>
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {email && <span className="hidden text-sm text-muted xl:inline">{email.split('@')[0]}</span>}
            <button
              type="button"
              onClick={onLogout}
              disabled={leaving}
              className="btn btn-outline px-3 py-2.5 sm:px-4"
              aria-label="Cerrar sesión"
            >
              {leaving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
