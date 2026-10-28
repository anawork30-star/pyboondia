'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { adminDb } from '@/lib/supabase/admin';

export async function setStoreOpen(open: boolean) {
  const user = await requireAdmin();
  const db = adminDb();
  await db.from('store_settings').update({ store_open: open, updated_at: new Date().toISOString() }).eq('id', 1);
  await db.from('audit_log').insert({ actor: user.id, action: open ? 'store_open' : 'store_close' });
  revalidatePath('/admin');
}
