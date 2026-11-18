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
