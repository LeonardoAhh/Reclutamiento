-- Sistema: configuración global de mantenimiento y permisos.
-- Idempotente: puede ejecutarse aunque public.config ya exista.

create table if not exists public.config (
  id text primary key,
  maintenance_mode boolean not null default false
);

insert into public.config (id, maintenance_mode)
values ('main', false)
on conflict (id) do nothing;

alter table public.config enable row level security;

drop policy if exists "config_select_authenticated" on public.config;
create policy "config_select_authenticated"
on public.config
for select
to authenticated
using (true);

drop policy if exists "config_update_admin" on public.config;
create policy "config_update_admin"
on public.config
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

grant select, update on public.config to authenticated;

-- Realtime para propagar el cambio a sesiones ya abiertas.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'config'
  ) then
    alter publication supabase_realtime add table public.config;
  end if;
end
$$;
