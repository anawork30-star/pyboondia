import { createServerClient, type CookieOptions } from '@supabase/ssr';
type Cookie = { name: string; value: string; options: CookieOptions };
import { cookies } from 'next/headers';
/** Cliente con la sesión del usuario (clave anon). */
export async function createClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: Cookie[]) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* render de servidor */ } },
    },
  });
}
