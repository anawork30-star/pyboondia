-- Tablero de tareas pendientes (kanban) del portal privado.
-- Solo aditivo y re-ejecutable. Requiere 0006_portal_privado.sql (usa is_portal_member()).
--
-- Seguridad:
--   * Cada persona ve y edita SOLO sus propias tareas y clientes (owner_id = auth.uid()) y además
--     debe estar en portal_members. anon no tiene ningún privilegio.
--   * El número de tarea (T-1, T-2…) es consecutivo por persona y lo asigna la base de datos.
--   * El historial (task_events) lo escriben triggers; desde la web solo se puede leer.

create table if not exists public.task_clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);
create unique index if not exists task_clients_owner_name on public.task_clients (owner_id, lower(btrim(name)));

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number integer not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_progreso', 'en_espera', 'completada')),
  priority text not null default 'media' check (priority in ('alta', 'media', 'baja')),
  client_id uuid references public.task_clients (id) on delete set null, -- null = tarea propia
  due_date date,
  -- [{ "text": "...", "done": false }]
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  -- [{ "text": "...", "at": "2026-11-18T15:00:00Z" }]
  observations jsonb not null default '[]'::jsonb check (jsonb_typeof(observations) = 'array'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, number)
);
create index if not exists tasks_owner_status on public.tasks (owner_id, status);

create table if not exists public.task_events (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  from_status text,
  to_status text not null,
  at timestamptz not null default now()
);
create index if not exists task_events_owner_at on public.task_events (owner_id, at);

-- Número consecutivo por persona, fechas de inicio/cierre y updated_at.
create or replace function public.tasks_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    perform pg_advisory_xact_lock(hashtext('tasks:' || new.owner_id::text));
    select coalesce(max(number), 0) + 1 into new.number from public.tasks where owner_id = new.owner_id;
    new.created_at := now();
  else
    new.owner_id := old.owner_id;
    new.number := old.number;
    new.created_at := old.created_at;
  end if;

  if new.status = 'en_progreso' and new.started_at is null then
    new.started_at := now();
  end if;
  if new.status = 'completada' then
    if tg_op = 'INSERT' or old.status <> 'completada' then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- El cliente asignado debe ser de la misma persona.
create or replace function public.tasks_check_client()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.client_id is not null and not exists (
    select 1 from public.task_clients where id = new.client_id and owner_id = new.owner_id
  ) then
    raise exception 'Cliente no válido';
  end if;
  return new;
end;
$$;

create or replace function public.tasks_log_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_events (task_id, owner_id, from_status, to_status) values (new.id, new.owner_id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.task_events (task_id, owner_id, from_status, to_status) values (new.id, new.owner_id, old.status, new.status);
  end if;
  return null;
end;
$$;
revoke all on function public.tasks_log_status() from public;

drop trigger if exists tasks_before_write on public.tasks;
create trigger tasks_before_write before insert or update on public.tasks
  for each row execute function public.tasks_before_write();
drop trigger if exists tasks_check_client on public.tasks;
create trigger tasks_check_client before insert or update of client_id on public.tasks
  for each row execute function public.tasks_check_client();
drop trigger if exists tasks_log_status on public.tasks;
create trigger tasks_log_status after insert or update of status on public.tasks
  for each row execute function public.tasks_log_status();

alter table public.task_clients enable row level security;
alter table public.tasks enable row level security;
alter table public.task_events enable row level security;

revoke all on public.task_clients, public.tasks, public.task_events from anon, authenticated;
grant select, insert, update, delete on public.task_clients to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select on public.task_events to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'task_clients' and policyname = 'dueña gestiona sus clientes') then
    create policy "dueña gestiona sus clientes" on public.task_clients for all to authenticated
      using (owner_id = auth.uid() and public.is_portal_member())
      with check (owner_id = auth.uid() and public.is_portal_member());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'dueña gestiona sus tareas') then
    create policy "dueña gestiona sus tareas" on public.tasks for all to authenticated
      using (owner_id = auth.uid() and public.is_portal_member())
      with check (owner_id = auth.uid() and public.is_portal_member());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'task_events' and policyname = 'dueña lee su historial') then
    create policy "dueña lee su historial" on public.task_events for select to authenticated
      using (owner_id = auth.uid() and public.is_portal_member());
  end if;
end
$$;
