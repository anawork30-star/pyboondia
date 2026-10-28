import { input, label, btn } from '../ui';
type P = Record<string, any>;
export function ProductForm({ product, categories, action, isNew }: { product?: P; categories: { id: string; name: string }[]; action: (fd: FormData) => void; isNew?: boolean }) {
  const v = (k: string, d: string | number = '') => product?.[k] ?? d;
  return (
    <form action={action} className="grid max-w-3xl gap-4 rounded-2xl bg-white p-6 sm:grid-cols-2">
      <div><label className={label} htmlFor="sku">SKU</label><input className={input} id="sku" name="sku" required defaultValue={v('sku')} placeholder="LCP006" /></div>
      <div><label className={label} htmlFor="name">Nombre</label><input className={input} id="name" name="name" required defaultValue={v('name')} /></div>
      <div className="sm:col-span-2"><label className={label} htmlFor="short_description">Descripción corta</label><input className={input} id="short_description" name="short_description" defaultValue={v('short_description')} /></div>
      <div className="sm:col-span-2"><label className={label} htmlFor="long_description">Descripción larga</label><textarea className={input} id="long_description" name="long_description" rows={4} defaultValue={v('long_description')} /></div>
      <div><label className={label} htmlFor="price">Precio (COP)</label><input className={input} id="price" name="price" type="number" min={0} step={1} required defaultValue={v('price', 0)} /></div>
      <div><label className={label} htmlFor="promo_price">Precio promocional (opcional)</label><input className={input} id="promo_price" name="promo_price" type="number" min={0} step={1} defaultValue={v('promo_price')} /></div>
      <div><label className={label} htmlFor="category_id">Categoría</label>
        <select className={input} id="category_id" name="category_id" defaultValue={v('category_id')}><option value="">Sin categoría</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label className={label} htmlFor="sale_unit">Unidad de venta</label><input className={input} id="sale_unit" name="sale_unit" defaultValue={v('sale_unit', 'unidad')} /></div>
      {isNew
        ? <div><label className={label} htmlFor="stock">Stock inicial</label><input className={input} id="stock" name="stock" type="number" min={0} step={1} defaultValue={0} /></div>
        : <div><p className={label}>Stock actual</p><p className="rounded-xl bg-crema px-3 py-2">{v('stock', 0)} <span className="text-xs">(se cambia desde Inventario)</span></p></div>}
      <div><label className={label} htmlFor="low_stock_threshold">Alerta de stock bajo</label><input className={input} id="low_stock_threshold" name="low_stock_threshold" type="number" min={0} step={1} defaultValue={v('low_stock_threshold', 2)} /></div>
      <div><label className={label} htmlFor="availability">Disponibilidad</label>
        <select className={input} id="availability" name="availability" defaultValue={v('availability', 'available')}><option value="available">Disponible</option><option value="sold_out">Agotado</option><option value="coming_soon">Próximamente</option></select></div>
      <div><label className={label} htmlFor="featured_order">Orden en destacados</label><input className={input} id="featured_order" name="featured_order" type="number" min={0} defaultValue={v('featured_order', 0)} /></div>
      <div><label className={label} htmlFor="weight">Peso</label><input className={input} id="weight" name="weight" defaultValue={v('weight')} /></div>
      <div><label className={label} htmlFor="storage">Conservación</label><input className={input} id="storage" name="storage" defaultValue={v('storage')} /></div>
      <div><label className={label} htmlFor="ingredients">Ingredientes</label><input className={input} id="ingredients" name="ingredients" defaultValue={v('ingredients')} /></div>
      <div><label className={label} htmlFor="allergens">Alérgenos</label><input className={input} id="allergens" name="allergens" defaultValue={v('allergens')} /></div>
      <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? false} /> Activo (se puede comprar)</label>
      <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> Mostrar en la página principal</label>
      <div className="sm:col-span-2"><button className={btn}>{isNew ? 'Crear producto' : 'Guardar cambios'}</button></div>
    </form>
  );
}
