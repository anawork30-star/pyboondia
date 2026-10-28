import { describe, it, expect } from 'vitest';
import { computeTotals, isPickupOpen } from '@/lib/pricing';
import { BUSINESS } from '@/lib/config';

describe('computeTotals', () => {
  it('recogida no cobra envío', () => {
    expect(computeTotals([{ unitPrice: 10000, qty: 2 }], 'pickup', 6000).total).toBe(20000);
  });
  it('domicilio suma $6.000', () => {
    expect(computeTotals([{ unitPrice: 10000, qty: 2 }], 'delivery', BUSINESS.deliveryFee).total).toBe(26000);
  });
  it('rechaza cantidades inválidas', () => {
    expect(() => computeTotals([{ unitPrice: 1, qty: 0 }], 'pickup', 0)).toThrow();
    expect(() => computeTotals([{ unitPrice: 1, qty: 1.5 }], 'pickup', 0)).toThrow();
  });
});

describe('isPickupOpen', () => {
  const { days, windows } = BUSINESS.pickup;
  it('abierto lunes 9:00 y 15:00', () => {
    expect(isPickupOpen(1, '09:00', days, windows)).toBe(true);
    expect(isPickupOpen(1, '15:00', days, windows)).toBe(true);
  });
  it('cerrado a mediodía, tarde y fin de semana', () => {
    expect(isPickupOpen(1, '12:30', days, windows)).toBe(false);
    expect(isPickupOpen(1, '17:00', days, windows)).toBe(false);
    expect(isPickupOpen(6, '09:00', days, windows)).toBe(false);
  });
});
