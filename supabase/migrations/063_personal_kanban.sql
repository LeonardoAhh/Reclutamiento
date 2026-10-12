-- Tablero personal independiente: cada usuario administra únicamente sus pendientes.
-- Aplicar después de 062. No altera tablas, permisos ni datos existentes.
begin;
create table public.kanban_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 4000),
  kind text not null default 'activity' check (kind in ('activity', 'process', 'interview', 'todo')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kanban_tasks_owner_created_idx on public.kanban_tasks(owner_id, created_at desc, id desc);

-- Versión del servidor impide que una pestaña sobrescriba cambios de otra.
create function public.bump_kanban_task_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.bump_kanban_task_version() from public, anon, authenticated;
create trigger kanban_tasks_version before update on public.kanban_tasks
for each row execute function public.bump_kanban_task_version();

alter table public.kanban_tasks enable row level security;
revoke all on public.kanban_tasks from public, anon, authenticated;
grant select, delete on public.kanban_tasks to authenticated;
grant insert(id, owner_id, title, description, kind, status) on public.kanban_tasks to authenticated;
grant update(title, description, kind, status) on public.kanban_tasks to authenticated;
grant all on public.kanban_tasks to service_role;
create policy kanban_tasks_owner on public.kanban_tasks for all to authenticated
using (owner_id = (select auth.uid())
  and (select public.app_access_enabled()) is true
  and (select public.password_change_required()) is false
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'reclutador')))
with check (owner_id = (select auth.uid())
  and (select public.app_access_enabled()) is true
  and (select public.password_change_required()) is false
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'reclutador')));
notify pgrst, 'reload schema';
commit;
