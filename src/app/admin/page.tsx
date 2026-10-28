import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { adminDb } from '@/lib/supabase/admin';
import { setStoreOpen } from './actions';
import { btn, btnGhost } from './ui';

export default async function Inicio() {
  await requireAdmin();
  const db = adminDb();
  const [{ data: settings }, { data: products }] = await Promise.all([
    db.from('store_settings').select('store_open').eq('id', 1).single(),
    db.from('products').select('id,sku,name,stock,low_stock_threshold,is_active'),
  ]);
  const list = products ?? [];
  const low = list.filter((p) => p.stock <= p.low_stock_threshold);
  const open = settings?.store_open ?? false;
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-titulo text-3xl font-bold">Inicio</h1>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5">
        <div><p className="font-titulo text-xl font-semibold">Tienda {open ? 'abierta' : 'cerrada'}</p>
          <p className="text-sm">{open ? 'Los clientes pueden comprar.' : 'Los clientes ven el mensaje de mantenimiento y no pueden comprar.'}</p></div>
        <form action={setStoreOpen.bind(null, !open)}><button className={open ? btnGhost : btn}>{open ? 'Cerrar tienda' : 'Abrir tienda'}</button></form>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5"><p className="text-sm">Productos</p><p className="font-titulo text-3xl font-bold">{list.length}</p></div>
        <div className="rounded-2xl bg-white p-5"><p className="text-sm">Activos</p><p className="font-titulo text-3xl font-bold">{list.filter((p) => p.is_active).length}</p></div>
        <div className="rounded-2xl bg-white p-5"><p className="text-sm">Con stock bajo</p><p className="font-titulo text-3xl font-bold">{low.length}</p></div>
      </section>
      {low.length > 0 && (
        <section className="rounded-2xl bg-lima/50 p-5"><h2 className="font-titulo text-lg font-semibold">Stock bajo</h2>
          <ul className="mt-2 space-y-1 text-sm">{low.map((p) => <li key={p.id}><Link className="underline" href={`/admin/productos/${p.id}`}>{p.sku} · {p.name}</Link>: quedan {p.stock}</li>)}</ul></section>
      )}
    </div>
  );
}
