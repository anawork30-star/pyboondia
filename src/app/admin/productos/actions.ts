'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { adminDb } from '@/lib/supabase/admin';
import { parseProductForm } from '@/lib/validation';

const back = (path: string, msg: string, kind: 'error' | 'ok' = 'error') => redirect(`${path}?${kind}=${encodeURIComponent(msg)}`);
const dupe = (e: { code?: string }) => (e.code === '23505' ? 'Ese SKU ya existe. Usa otro.' : 'No se pudo guardar. Intenta de nuevo.');

export async function createProduct(fd: FormData) {
  const user = await requireAdmin();
  const p = parseProductForm(fd);
  if (!p.ok) back('/admin/productos/nuevo', p.error);
  else {
    const db = adminDb();
    const { data, error } = await db.from('products').insert({ ...p.row, stock: p.initialStock }).select('id').single();
    if (error || !data) back('/admin/productos/nuevo', dupe(error ?? {}));
    else {
      if (p.initialStock > 0) await db.from('inventory_movements').insert({ product_id: data.id, kind: 'entry', delta: p.initialStock, stock_after: p.initialStock, reason: 'Stock inicial', actor: user.id });
      await db.from('audit_log').insert({ actor: user.id, action: 'product_create', entity: 'product', entity_id: data.id, detail: { sku: p.row.sku } });
      revalidatePath('/admin/productos');
      redirect(`/admin/productos/${data.id}?ok=${encodeURIComponent('Producto creado. Ahora sube sus fotos.')}`);
    }
  }
}

export async function updateProduct(id: string, fd: FormData) {
  const user = await requireAdmin();
  const path = `/admin/productos/${id}`;
  const p = parseProductForm(fd);
  if (!p.ok) return back(path, p.error);
  const db = adminDb();
  const { error } = await db.from('products').update({ ...p.row, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return back(path, dupe(error));
  await db.from('audit_log').insert({ actor: user.id, action: 'product_update', entity: 'product', entity_id: id });
  revalidatePath('/admin/productos'); revalidatePath('/');
  back(path, 'Cambios guardados.', 'ok');
}

export async function toggleProduct(id: string, active: boolean) {
  const user = await requireAdmin();
  const db = adminDb();
  await db.from('products').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id);
  await db.from('audit_log').insert({ actor: user.id, action: active ? 'product_activate' : 'product_deactivate', entity: 'product', entity_id: id });
  revalidatePath('/admin/productos'); revalidatePath(`/admin/productos/${id}`); revalidatePath('/');
}

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export async function uploadImage(productId: string, fd: FormData) {
  const user = await requireAdmin();
  const path = `/admin/productos/${productId}`;
  const file = fd.get('file');
  if (!(file instanceof File) || file.size === 0) return back(path, 'Elige una imagen.');
  const ext = TYPES[file.type];
  if (!ext) return back(path, 'Formato no permitido. Usa JPG, PNG o WebP.');
  if (file.size > 4 * 1024 * 1024) return back(path, 'La imagen pesa más de 4 MB. Redúcela e intenta de nuevo.');
  const db = adminDb();
  const key = `${productId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from('product-images').upload(key, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return back(path, 'No se pudo subir la imagen. Revisa que el bucket product-images exista.');
  const { data: existing } = await db.from('product_images').select('id,sort_order').eq('product_id', productId);
  const next = (existing ?? []).reduce((m, i) => Math.max(m, i.sort_order), -1) + 1;
  await db.from('product_images').insert({ product_id: productId, storage_path: key, alt: '', sort_order: next, is_primary: (existing ?? []).length === 0 });
  await db.from('audit_log').insert({ actor: user.id, action: 'image_upload', entity: 'product', entity_id: productId });
  revalidatePath(path); revalidatePath('/');
  back(path, 'Imagen subida.', 'ok');
}

export async function setPrimaryImage(productId: string, imageId: string) {
  await requireAdmin();
  const db = adminDb();
  await db.from('product_images').update({ is_primary: false }).eq('product_id', productId);
  await db.from('product_images').update({ is_primary: true }).eq('id', imageId).eq('product_id', productId);
  revalidatePath(`/admin/productos/${productId}`); revalidatePath('/');
}

export async function deleteImage(productId: string, imageId: string) {
  const user = await requireAdmin();
  const db = adminDb();
  const { data: img } = await db.from('product_images').select('storage_path,is_primary').eq('id', imageId).eq('product_id', productId).maybeSingle();
  if (!img) return;
  if (!img.storage_path.startsWith('/')) await db.storage.from('product-images').remove([img.storage_path]);
  await db.from('product_images').delete().eq('id', imageId);
  if (img.is_primary) {
    const { data: rest } = await db.from('product_images').select('id').eq('product_id', productId).order('sort_order').limit(1);
    if (rest?.[0]) await db.from('product_images').update({ is_primary: true }).eq('id', rest[0].id);
  }
  await db.from('audit_log').insert({ actor: user.id, action: 'image_delete', entity: 'product', entity_id: productId });
  revalidatePath(`/admin/productos/${productId}`); revalidatePath('/');
}
