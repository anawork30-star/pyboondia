import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
type Cookie = { name: string; value: string; options: CookieOptions };
// Primera barrera: exige sesión. La autorización real (admin_users) se verifica en requireAdmin().
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: Cookie[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user && !req.nextUrl.pathname.startsWith('/admin/login')) return NextResponse.redirect(new URL('/admin/login', req.url));
  return res;
}
export const config = { matcher: ['/admin/:path*'] };
