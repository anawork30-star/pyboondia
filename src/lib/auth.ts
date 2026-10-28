import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminDb } from '@/lib/supabase/admin';
/** Autorización en el servidor: sesión válida Y presente en admin_users. Llamar en cada página y acción de /admin. */
export async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data } = await adminDb().from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) redirect('/admin/login?error=credenciales');
  return user;
}
