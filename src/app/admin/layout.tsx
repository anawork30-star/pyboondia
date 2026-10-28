import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { signOut } from './login/actions';
import { btnGhost } from './ui';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const soon = ['Inventario', 'Pedidos', 'Diseño de la tienda', 'Reportes'];
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-azul p-5 text-white md:w-60 md:shrink-0">
        <p className="font-titulo text-xl font-bold">Administración</p>
        <nav className="mt-5 flex flex-wrap gap-2 md:flex-col" aria-label="Secciones">
          <Link href="/admin" className="rounded-xl px-3 py-2 font-semibold hover:bg-lima hover:text-madera">Inicio</Link>
          <Link href="/admin/productos" className="rounded-xl px-3 py-2 font-semibold hover:bg-lima hover:text-madera">Productos</Link>
          {soon.map((s) => <span key={s} className="rounded-xl px-3 py-2 opacity-50" title="Próximamente">{s}</span>)}
        </nav>
        <form action={signOut} className="mt-6"><p className="mb-2 truncate text-xs opacity-80">{user.email}</p><button className={`${btnGhost} !border-white/60 !text-white hover:!text-madera`}>Cerrar sesión</button></form>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
