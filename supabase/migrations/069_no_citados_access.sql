-- La política anterior permite a clientes anónimos acceder a datos de contacto.
do $$
begin
  if to_regclass('public.no_citados') is null then
    raise exception 'public.no_citados no existe; revisa el esquema antes de restringir el acceso';
  end if;
end;
$$;

alter table public.no_citados enable row level security;
drop policy if exists "Public access no_citados" on public.no_citados;
drop policy if exists no_citados_authenticated on public.no_citados;
revoke all on public.no_citados from public, anon, authenticated;
grant select, insert, update, delete on public.no_citados to authenticated;
create policy no_citados_authenticated on public.no_citados
  for all to authenticated
  using ((select public.app_access_enabled()) and not (select public.password_change_required()))
  with check ((select public.app_access_enabled()) and not (select public.password_change_required()));
