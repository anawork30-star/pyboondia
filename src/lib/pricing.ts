export type Line = { unitPrice: number; qty: number };
export type Fulfillment = 'pickup' | 'delivery';

/** Totales en pesos enteros (COP no usa decimales). Solo se usa en el servidor con precios leídos de la BD. */
export function computeTotals(lines: Line[], fulfillment: Fulfillment, deliveryFee: number, discount = 0) {
  if (lines.some((l) => !Number.isInteger(l.qty) || l.qty < 1)) throw new Error('Cantidad inválida');
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const shipping = fulfillment === 'delivery' ? deliveryFee : 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  return { subtotal, discount, shipping, total };
}

/** ¿Está dentro del horario de recogida? `now` debe venir ya en hora de Bogotá (día 0-6, "HH:MM"). */
export function isPickupOpen(day: number, hhmm: string, days: readonly number[], windows: readonly { from: string; to: string }[]) {
  return days.includes(day) && windows.some((w) => hhmm >= w.from && hhmm < w.to);
}
