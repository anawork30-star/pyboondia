import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { adminDb } from '@/lib/supabase/admin';
import { imageUrl } from '@/lib/images';
import { ProductForm } from '../form';
import { updateProduct, uploadImage, setPrimaryImage, deleteImage } from '../actions';
import { input, btn, btnGhost, btnDanger } from '../../ui';

export default async function Editar({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  await requireAdmin();
  const { id } = await params; const { error, ok } = await searchParams;
  const db = adminDb();
  const { data: p } = await db.from('products').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();
  const [{ data: cats }, { data: imgs }] = await Promise.all([
    db.from('categories').select('id,name').order('sort_order'),
    db.from('product_images').select('*').eq('product_id', id).order('sort_order'),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="font-titulo text-3xl font-bold">{p.name} <span className="text-lg font-normal">· {p.sku}</span></h1>
      {error && <p role="alert" className="max-w-3xl rounded-xl bg-red-100 px-3 py-2 text-red-800">{error}</p>}
      {ok && <p role="status" className="max-w-3xl rounded-xl bg-lima/60 px-3 py-2">{ok}</p>}
      <ProductForm product={p} categories={cats ?? []} action={updateProduct.bind(null, id)} />
      <section className="max-w-3xl space-y-4 rounded-2xl bg-white p-6">
        <h2 className="font-titulo text-xl font-semibold">Fotos</h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {(imgs ?? []).map((i) => (
            <li key={i.id} className="space-y-2">
              <img src={imageUrl(i.card_path ?? i.storage_path)} alt={i.alt || p.name} className="aspect-square w-full rounded-xl object-cover" />
              {i.is_primary ? <p className="text-sm font-semibold text-azul-oscuro">Imagen principal</p>
                : <form action={setPrimaryImage.bind(null, id, i.id)}><button className={btnGhost}>Hacer principal</button></form>}
              <form action={deleteImage.bind(null, id, i.id)}><button className={btnDanger}>Eliminar</button></form>
            </li>
          ))}
        </ul>
        {(imgs ?? []).length === 0 && <p className="text-sm">Este producto aún no tiene fotos.</p>}
        <form action={uploadImage.bind(null, id)} className="flex flex-wrap items-center gap-3 border-t border-madera/10 pt-4">
          <input className={input + ' max-w-xs'} type="file" name="file" accept="image/jpeg,image/png,image/webp" required aria-label="Elegir imagen" />
          <button className={btn}>Subir foto</button><span className="text-xs">JPG, PNG o WebP, máximo 4 MB.</span>
        </form>
      </section>
    </div>
  );
}
