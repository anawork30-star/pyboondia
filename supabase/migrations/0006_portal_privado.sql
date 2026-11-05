-- Portal privado de planes comerciales.
-- Solo aditivo y re-ejecutable. NO contiene precios ni contraseñas: el contenido se carga aparte con
-- supabase/private/planes_comerciales.sql (archivo excluido de GitHub).
--
-- Seguridad:
--   * El acceso exige sesión de Supabase Auth Y estar en la lista portal_members. Aunque alguien
--     lograra crear una cuenta, no vería nada si no está en esa lista.
--   * RLS activado; anon no tiene ningún privilegio sobre estas tablas.
--   * Solo lectura desde la web: el contenido se administra desde el panel de Supabase (SQL Editor).

create table if not exists public.portal_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_content (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portal_members enable row level security;
alter table public.portal_content enable row level security;

revoke all on public.portal_members from anon, authenticated;
revoke all on public.portal_content from anon, authenticated;
grant select on public.portal_members to authenticated;
grant select on public.portal_content to authenticated;

-- security definer: consulta la lista sin exponerla.
create or replace function public.is_portal_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.portal_members where user_id = auth.uid());
$$;

revoke all on function public.is_portal_member() from public;
grant execute on function public.is_portal_member() to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portal_members' and policyname = 'miembro ve su registro') then
    create policy "miembro ve su registro" on public.portal_members
      for select to authenticated using (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'portal_content' and policyname = 'miembros leen el portal') then
    create policy "miembros leen el portal" on public.portal_content
      for select to authenticated using (public.is_portal_member());
  end if;
end
$$;
