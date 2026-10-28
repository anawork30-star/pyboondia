import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { adminDb } from '@/lib/supabase/admin';
import { imageUrl } from '@/lib/images';
import { cop } from '@/lib/format';
import { btn, btnGhost } from '../ui';
import { toggleProduct } from './actions';

export default async function Productos() {
  await requireAdmin();
  const { data } = await adminDb().from('products').select('id,sku,name,price,promo_price,stock,is_active,product_images(storage_path,card_path,is_primary)').order('sku');
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-titulo text-3xl font-bold">Productos</h1><Link href="/admin/productos/nuevo" className={btn}>Nuevo producto</Link></div>
      <ul className="space-y-3">
        {(data ?? []).map((p) => {
          const img = (p.product_images ?? []).find((i: any) => i.is_primary) ?? p.product_images?.[0];
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4">
              {img ? <img src={imageUrl(img.card_path ?? img.storage_path)} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-crema text-xs">Sin foto</div>}
              <div className="min-w-0 flex-1"><p className="font-titulo text-lg font-semibold">{p.name} <span className="text-sm font-normal">· {p.sku}</span></p>
                <p className="text-sm">{cop(p.promo_price ?? p.price)} · stock {p.stock} · <span className={p.is_active ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>{p.is_active ? 'Activo' : 'Inactivo'}</span></p></div>
              <form action={toggleProduct.bind(null, p.id, !p.is_active)}><button className={btnGhost}>{p.is_active ? 'Desactivar' : 'Activar'}</button></form>
              <Link href={`/admin/productos/${p.id}`} className={btnGhost}>Editar</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
