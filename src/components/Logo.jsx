import { BRAND } from '../config/brand'

/** Logotipo tipográfico: wordmark + símbolo de chispa. `tone` cambia el color en fondos oscuros. */
export default function Logo({ tone = 'dark', className = '' }) {
  const text = tone === 'light' ? 'text-paper' : 'text-ink'
  return (
    <span className={`inline-flex items-center gap-2 ${text} ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill="#5b3df5" />
        <path d="M16 6.5l2.6 6.9 6.9 2.6-6.9 2.6L16 25.5l-2.6-6.9L6.5 16l6.9-2.6z" fill="#c8f04a" />
        <circle cx="24.5" cy="7.5" r="2.5" fill="#ff5a3c" />
      </svg>
      <span className="font-display text-2xl font-extrabold lowercase tracking-tight">{BRAND.name}</span>
      <span className="sr-only">, {BRAND.tagline}</span>
    </span>
  )
}
