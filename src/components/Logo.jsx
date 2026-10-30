import { BRAND } from '../config/brand'
import { LOGO_LETTERS, LOGO_VIEWBOX } from './logoPaths'

// Colores por letra para la versión "colorful" (intro animada y momentos de marca).
const COLORFUL = { a: '#c8f04a', i: '#ff5a3c', d: '#f6f3ee', u: '#e6e0ff', acento: '#c8f04a' }

/**
 * Logotipo oficial de AIDU (vectorizado). Cada letra es un grupo animable:
 * - al pasar el mouse por encima, las letras "rebotan" en cascada;
 * - con `intro`, caen y rebotan al aparecer.
 * `tone`: 'dark' (tinta) o 'light' (crema) sobre fondos oscuros.
 */
export default function Logo({ tone = 'dark', colorful = false, intro = false, className = 'h-10 w-auto', label = true }) {
  const fill = tone === 'light' ? '#f6f3ee' : '#141218'
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={`aidu-logo ${intro ? 'logo-intro' : ''} ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label ? `${BRAND.name}, ${BRAND.tagline}` : undefined}
      aria-hidden={label ? undefined : 'true'}
    >
      {LOGO_LETTERS.map((letter, i) => (
        <path
          key={letter.id}
          d={letter.d}
          fillRule="evenodd"
          fill={colorful ? COLORFUL[letter.id] : fill}
          className={`logo-letter logo-${letter.id}`}
          style={{ '--i': i }}
        />
      ))}
    </svg>
  )
}
