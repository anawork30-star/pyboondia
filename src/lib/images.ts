/** Rutas que empiezan con "/" son recursos del repositorio (/public); las demás están en Supabase Storage. */
export function imageUrl(path: string | null | undefined) {
  if (!path) return '';
  if (path.startsWith('/')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}
