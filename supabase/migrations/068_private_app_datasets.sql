-- Sustitutos privados de rutas y tabuladores antes servidos desde public/.
-- Aplica esta migración e importa los cinco conjuntos antes de desplegar el cliente.
create table if not exists public.private_app_datasets (
  id text primary key check (id in (
    'routes_current', 'routes_previous', 'routes_info',
    'salary_union', 'salary_non_union'
  )),
  payload jsonb not null
);

alter table public.private_app_datasets enable row level security;
revoke all on public.private_app_datasets from public, anon, authenticated;
grant select on public.private_app_datasets to authenticated;
grant select, insert, update on public.private_app_datasets to service_role;

drop policy if exists private_app_datasets_read on public.private_app_datasets;
create policy private_app_datasets_read on public.private_app_datasets
  for select to authenticated
  using (
    (select public.app_access_enabled())
    and not (select public.password_change_required())
  );
