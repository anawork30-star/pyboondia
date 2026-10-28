import { describe, it, expect } from 'vitest';
import { parseProductForm } from '@/lib/validation';
const form = (o: Record<string, string>) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; };
const base = { sku: 'lcp001', name: 'Boondía', price: '12000' };
describe('parseProductForm', () => {
  it('normaliza el SKU a mayúsculas', () => {
    const r = parseProductForm(form(base)); expect(r.ok && r.row.sku).toBe('LCP001');
  });
  it('rechaza SKU con caracteres inválidos', () => { expect(parseProductForm(form({ ...base, sku: 'lcp 001!' })).ok).toBe(false); });
  it('rechaza promo mayor o igual al precio', () => { expect(parseProductForm(form({ ...base, promo_price: '12000' })).ok).toBe(false); });
  it('acepta promo menor y checkbox activo', () => {
    const r = parseProductForm(form({ ...base, promo_price: '9000', is_active: 'on' })); expect(r.ok && r.row.promo_price).toBe(9000); expect(r.ok && r.row.is_active).toBe(true);
  });
  it('rechaza precio decimal o negativo', () => {
    expect(parseProductForm(form({ ...base, price: '10.5' })).ok).toBe(false);
    expect(parseProductForm(form({ ...base, price: '-1' })).ok).toBe(false);
  });
});
