import { z } from 'zod';
const int = (min = 0) => z.coerce.number().int('Debe ser un número entero').min(min, `Mínimo ${min}`);
const opt = z.string().trim().transform((v) => (v === '' ? null : v));
const schema = z.object({
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/, 'SKU: solo letras, números y guiones (3 a 30 caracteres)'),
  name: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  short_description: z.string().trim().max(300).default(''),
  long_description: z.string().trim().max(3000).default(''),
  price: int(0),
  promo_price: z.string().trim().transform((v) => (v === '' ? null : Number(v))).pipe(z.number().int().min(0).nullable()),
  category_id: opt.nullable().default(null),
  low_stock_threshold: int(0),
  sale_unit: z.string().trim().min(1).max(30).default('unidad'),
  availability: z.enum(['available', 'sold_out', 'coming_soon']),
  featured_order: int(0),
  ingredients: opt, allergens: opt, weight: opt, storage: opt,
});
export type ProductRow = z.infer<typeof schema> & { is_active: boolean; featured: boolean };

export function parseProductForm(fd: FormData):
  | { ok: true; row: ProductRow; initialStock: number }
  | { ok: false; error: string } {
  const g = (k: string) => (fd.get(k) ?? '').toString();
  const r = schema.safeParse({
    sku: g('sku'), name: g('name'), short_description: g('short_description'), long_description: g('long_description'),
    price: g('price') || '0', promo_price: g('promo_price'), category_id: g('category_id'),
    low_stock_threshold: g('low_stock_threshold') || '2', sale_unit: g('sale_unit') || 'unidad',
    availability: g('availability') || 'available', featured_order: g('featured_order') || '0',
    ingredients: g('ingredients'), allergens: g('allergens'), weight: g('weight'), storage: g('storage'),
  });
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  if (r.data.promo_price !== null && r.data.promo_price >= r.data.price) return { ok: false, error: 'El precio promocional debe ser menor al precio normal' };
  const stock = int(0).safeParse(g('stock') || '0');
  if (!stock.success) return { ok: false, error: 'Stock inicial inválido' };
  return { ok: true, row: { ...r.data, is_active: fd.get('is_active') === 'on', featured: fd.get('featured') === 'on' }, initialStock: stock.data };
}
