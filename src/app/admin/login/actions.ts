'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminDb } from '@/lib/supabase/admin';

export async function signIn(fd: FormData) {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  const sb = await createClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect('/admin/login?error=credenciales');
  const { data: adm } = await adminDb().from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!adm) { await sb.auth.signOut(); redirect('/admin/login?error=credenciales'); }
  await adminDb().from('audit_log').insert({ actor: data.user.id, action: 'login' });
  redirect('/admin');
}

export async function signOut() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect('/admin/login');
}
