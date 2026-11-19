import { fold } from '../../lib/taskLogic.js'

// Colores por estado y prioridad del tablero (clases de Tailwind; este archivo está dentro de
// src/components para que Tailwind las detecte).
export const COLUMN_STYLE = {
  pendiente: { dot: 'bg-ink/40', bar: 'bg-ink/40', soft: 'bg-ink/5', text: 'text-ink' },
  en_progreso: { dot: 'bg-violet', bar: 'bg-violet', soft: 'bg-violet-soft', text: 'text-violet' },
  en_espera: { dot: 'bg-coral', bar: 'bg-coral', soft: 'bg-coral-soft', text: 'text-[#c2341a]' },
  completada: { dot: 'bg-lime', bar: 'bg-lime', soft: 'bg-lime/25', text: 'text-[#4d6400]' },
}
export const PRIORITY_STYLE = {
  alta: 'bg-coral-soft text-[#a52a12]',
  media: 'bg-violet-soft text-violet',
  baja: 'bg-ink/5 text-muted',
}

// Etiqueta de cliente (Colsanitas, EPS Sanitas…): cada cliente tiene siempre el mismo color, calculado
// a partir de su nombre, para reconocerlo de un vistazo en el tablero, el asistente y el resumen.
const PALETTE = [
  { bg: '#e6e0ff', fg: '#3d24c9', dot: '#5b3df5' }, // violeta
  { bg: '#d8ecff', fg: '#0b4f9c', dot: '#2f6bff' }, // azul
  { bg: '#d6f5e8', fg: '#0d6b45', dot: '#1fa971' }, // verde
  { bg: '#ffe1d9', fg: '#a52a12', dot: '#ff5a3c' }, // coral
  { bg: '#fff0c2', fg: '#7a5300', dot: '#e3a400' }, // ámbar
  { bg: '#fde0f1', fg: '#9c1c66', dot: '#e0459d' }, // rosa
  { bg: '#d4f3f6', fg: '#0b636b', dot: '#13a3b0' }, // turquesa
  { bg: '#ecf8c8', fg: '#4d6400', dot: '#8db51a' }, // lima
]

export function clientColor(name = '') {
  const key = fold(name).trim()
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** Clientes sugeridos al crear una etiqueta nueva. */
export const CLIENT_SUGGESTIONS = ['Colsanitas', 'EPS Sanitas', 'Medisanitas', 'Clínica Colsanitas']
