-- Solicitudes comerciales del formulario de contacto del sitio de la agencia.
-- Solo aditivo: no modifica ni borra tablas, datos, políticas ni autenticación existentes.
-- Se puede ejecutar más de una vez sin efectos duplicados.
--
-- Seguridad:
--   * RLS activado y SIN políticas para `anon`: el público no puede leer, editar ni borrar.
--   * El formulario público solo puede INSERTAR a través de la función submit_contact_request,
--     que valida los datos y limita a 5 envíos por correo por hora.
--   * Si existe la función is_admin() (migración 0001), los administradores pueden leer y
--     actualizar el estado de las solicitudes desde una sesión autenticada.

create extension if not exists pgcrypto;

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'),
  company text check (company is null or char_length(company) <= 120),
  service text not null check (service in ('branding', 'social', 'web', 'ai', 'integral')),
  budget text check (budget is null or budget in ('menos-2m', '2-5m', '5-10m', 'mas-10m', 'por-definir')),
  message text not null check (char_length(message) between 20 and 3000),
  consent boolean not null check (consent),
  consent_at timestamptz not null default now(),
  source text not null default 'web',
  status text not null default 'new' check (status in ('new', 'contacted', 'proposal', 'won', 'lost', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists contact_requests_created_at_idx on public.contact_requests (created_at desc);
create index if not exists contact_requests_email_idx on public.contact_requests (lower(email), created_at desc);

alter table public.contact_requests enable row level security;

-- Supabase concede privilegios por defecto a anon/authenticated en tablas nuevas: se retiran.
revoke all on public.contact_requests from anon, authenticated;

create or replace function public.submit_contact_request(
  p_name text,
  p_email text,
  p_company text,
  p_service text,
  p_budget text,
  p_message text,
  p_consent boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id uuid;
begin
  if not coalesce(p_consent, false) then
    raise exception 'CONSENT_REQUIRED';
  end if;

  if (select count(*) from contact_requests
      where lower(email) = v_email and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  begin
    insert into contact_requests (name, email, company, service, budget, message, consent)
    values (
      regexp_replace(trim(p_name), '\s+', ' ', 'g'),
      v_email,
      nullif(trim(p_company), ''),
      trim(p_service),
      nullif(trim(p_budget), ''),
      trim(p_message),
      true
    )
    returning id into v_id;
  exception
    when check_violation or not_null_violation then
      raise exception 'INVALID_INPUT';
  end;

  return v_id;
end;
$$;

revoke all on function public.submit_contact_request(text, text, text, text, text, text, boolean) from public;
grant execute on function public.submit_contact_request(text, text, text, text, text, text, boolean) to anon, authenticated;

-- Acceso de administradores (solo si el esquema de administración ya existe).
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    grant select, update (status) on public.contact_requests to authenticated;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'contact_requests' and policyname = 'admin lee solicitudes') then
      create policy "admin lee solicitudes" on public.contact_requests
        for select to authenticated using (public.is_admin());
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'contact_requests' and policyname = 'admin actualiza solicitudes') then
      create policy "admin actualiza solicitudes" on public.contact_requests
        for update to authenticated using (public.is_admin()) with check (public.is_admin());
    end if;
  end if;
end
$$;
