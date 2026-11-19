import { Tag, User } from 'lucide-react'
import { clientColor } from './styles.js'

// Etiqueta de cliente (Colsanitas, EPS Sanitas…) con su color fijo.

export default function ClientTag({ name, size = 'sm', className = '' }) {
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
  if (!name) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-ink/5 font-medium text-muted ${pad} ${className}`}>
        <User size={11} aria-hidden="true" /> Propia
      </span>
    )
  }
  const c = clientColor(name)
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full font-semibold ${pad} ${className}`}
      style={{ backgroundColor: c.bg, color: c.fg }}
      title={`Cliente: ${name}`}
    >
      <Tag size={11} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  )
}
