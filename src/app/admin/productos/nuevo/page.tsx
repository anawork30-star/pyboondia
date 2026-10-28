import { requireAdmin } from '@/lib/auth';
import { adminDb } from '@/lib/supabase/admin';
import { ProductForm } from '../form';
import { createProduct } from '../actions';

export default async function Nuevo({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const { data: cats } = await adminDb().from('categories').select('id,name').order('sort_order');
  return (
    <div className="space-y-4"><h1 className="font-titulo text-3xl font-bold">Nuevo producto</h1>
      {error && <p role="alert" className="max-w-3xl rounded-xl bg-red-100 px-3 py-2 text-red-800">{error}</p>}
      <ProductForm categories={cats ?? []} action={createProduct} isNew /></div>
  );
}
