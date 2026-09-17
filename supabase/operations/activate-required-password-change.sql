-- Ejecutar DESPUÉS de desplegar la migración 044, las Edge Functions y la app.
-- Captura todos los usuarios existentes, incluidos administradores, una sola vez.
begin;
do $$
declare existing_hook text;
begin
  select split_part(setting, '=', 2) into existing_hook
  from pg_db_role_setting s
  cross join lateral unnest(s.setconfig) setting
  where s.setrole = 'authenticator'::regrole
    and s.setdatabase in (0, (select oid from pg_database where datname = current_database()))
    and setting like 'pgrst.db_pre_request=%'
    and split_part(setting, '=', 2) not in ('', 'public.enforce_required_password_change')
  limit 1;
  if existing_hook is not null then
    raise exception 'Existe un db_pre_request (%). Integrarlo antes de activar; no sobrescribirlo.', existing_hook;
  end if;
end;
$$;

alter role authenticator set pgrst.db_pre_request = 'public.enforce_required_password_change';

with activation as (
  insert into account_security.password_change_campaign (singleton)
  values (true) on conflict (singleton) do nothing
  returning activated_at
)
insert into account_security.password_change_requirements (user_id, required_at)
select u.id, a.activated_at from auth.users u cross join activation a
on conflict (user_id) do nothing;

notify pgrst, 'reload config';
commit;

select count(*) as usuarios_pendientes
from account_security.password_change_requirements where completed_at is null;
