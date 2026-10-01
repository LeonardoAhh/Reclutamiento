-- Expansión compatible: conserva campos de texto y registros históricos.
begin;

create table public.recruiter_directory (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique check (length(trim(canonical_name)) between 1 and 120),
  full_name text not null check (length(trim(full_name)) between 1 and 200),
  short_name text not null check (length(trim(short_name)) between 1 and 120),
  access_card_name text not null check (length(trim(access_card_name)) between 1 and 200),
  job_title text not null default '' check (length(job_title) <= 200),
  badge_role text not null default 'reclutadora' check (badge_role in ('reclutadora', 'coordinador')),
  profile_id uuid unique references public.profiles(id) on delete restrict,
  active boolean not null default true,
  selectable boolean not null default true,
  include_in_metrics boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.recruiter_aliases (
  alias_key text primary key,
  alias text not null check (length(trim(alias)) between 1 and 200),
  member_id uuid not null references public.recruiter_directory(id) on delete restrict
);
create table public.recruiter_directory_audit (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.recruiter_directory(id),
  actor_id uuid not null references public.profiles(id),
  previous_value jsonb,
  next_value jsonb not null,
  created_at timestamptz not null default now()
);
create table public.recruiter_status_operations (
  member_id uuid primary key references public.recruiter_directory(id) on delete restrict,
  operation_id uuid not null,
  expires_at timestamptz not null
);
alter table public.recruiter_status_operations enable row level security;
revoke all on public.recruiter_status_operations from public, anon, authenticated;
grant all on public.recruiter_status_operations to service_role;
alter table public.recruiter_directory enable row level security;
alter table public.recruiter_aliases enable row level security;
alter table public.recruiter_directory_audit enable row level security;
revoke all on public.recruiter_directory, public.recruiter_aliases, public.recruiter_directory_audit from anon, authenticated;
grant select on public.recruiter_directory, public.recruiter_aliases to authenticated;
grant select on public.recruiter_directory_audit to authenticated;
grant all on public.recruiter_directory, public.recruiter_aliases, public.recruiter_directory_audit to service_role;
grant usage, select on sequence public.recruiter_directory_audit_id_seq to service_role;

create function public.recruiter_alias_key(value text) returns text
language sql immutable set search_path = '' as $$
  select upper(regexp_replace(trim(regexp_replace(normalize(value, NFD),
    U&'[\0300-\036F]', '', 'g')), '\s+', ' ', 'g'));
$$;

-- Los nombres provienen del catálogo legado; solo se trasladan aquí una vez.
insert into public.recruiter_directory
  (canonical_name, full_name, short_name, access_card_name, job_title, badge_role, selectable, include_in_metrics)
values
  ('ALEXANDRA', 'Nayeli Alexandra Hernández Hernández', 'Alexandra', 'Lic. Alexandra Hernández', 'Analista de Reclutamiento', 'reclutadora', true, true),
  ('DANIELA', 'Daniela De Santiago Ramírez', 'Daniela', 'Lic. Daniela De Santiago', 'Analista de Reclutamiento', 'reclutadora', true, true),
  ('LEONARDO', 'Leonardo Ahmed Hernández Herrera', 'Leonardo', 'Lic. Leonardo Hernández', 'Coordinador de Reclutamiento', 'coordinador', true, false),
  ('THALIA', 'Thalia', 'Thalia', 'Thalia', '', 'reclutadora', false, false);

update public.recruiter_directory d set profile_id = p.id
from public.profiles p where public.recruiter_alias_key(p.username) = d.canonical_name;
update public.recruiter_directory d set profile_id = p.id
from public.profiles p where d.canonical_name = 'ALEXANDRA' and d.profile_id is null
  and public.recruiter_alias_key(p.username) = 'NAYELI';

insert into public.recruiter_directory
  (canonical_name, full_name, short_name, access_card_name, job_title, profile_id, selectable, include_in_metrics)
select public.recruiter_alias_key(p.username), coalesce(nullif(trim(p.display_name), ''), p.username),
  p.username, coalesce(nullif(trim(p.display_name), ''), p.username),
  case when lower(p.username) = 'noemi' then 'Jefe de Recursos Humanos'
    when p.role = 'admin' then 'Administrador' else 'Analista de Reclutamiento' end,
  p.id, p.role = 'reclutador', p.role = 'reclutador'
from public.profiles p
where not exists (select 1 from public.recruiter_directory d where d.profile_id = p.id)
on conflict (canonical_name) do nothing;

insert into public.recruiter_aliases (alias_key, alias, member_id)
select distinct on (public.recruiter_alias_key(v.alias)) public.recruiter_alias_key(v.alias), v.alias, d.id
from public.recruiter_directory d
cross join lateral unnest(array[d.canonical_name, d.full_name, d.short_name, d.access_card_name]) v(alias);
insert into public.recruiter_aliases (alias_key, alias, member_id)
select 'NAYELI', 'Nayeli', id from public.recruiter_directory where canonical_name = 'ALEXANDRA';

create function public.app_access_enabled() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not exists (
    select 1 from public.recruiter_directory d where d.profile_id = auth.uid() and not d.active
  );
$$;
revoke all on function public.app_access_enabled() from public, anon;
grant execute on function public.app_access_enabled() to authenticated, service_role;
create policy directory_read on public.recruiter_directory for select to authenticated
using ((select public.app_access_enabled()));
create policy aliases_read on public.recruiter_aliases for select to authenticated
using ((select public.app_access_enabled()));
create policy directory_audit_read on public.recruiter_directory_audit for select to authenticated
using ((select public.app_access_enabled()) and (select public.is_admin()));

-- RPC atómica: los alias son globalmente únicos y se conservan los nombres anteriores.
create function public.save_recruiter_member(p_member jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  member_id uuid := nullif(p_member->>'id', '')::uuid;
  linked_profile uuid := nullif(p_member->>'profile_id', '')::uuid;
  previous_row public.recruiter_directory;
  next_row public.recruiter_directory;
  alias_value text;
  alias_member uuid;
begin
  if not public.app_access_enabled() or not public.is_admin() or public.password_change_required() then
    raise sqlstate '42501' using message = 'Solo administradores pueden administrar el equipo.';
  end if;
  if member_id is not null then
    select * into strict previous_row from public.recruiter_directory where id = member_id for update;
    if previous_row.profile_id is distinct from linked_profile and exists (
      select 1 from public.recruiter_status_operations op where op.member_id = previous_row.id and op.expires_at > now()
    ) then raise exception 'Espera a que termine la actualización de estado antes de vincular una cuenta.'; end if;
    if previous_row.profile_id is not null and previous_row.profile_id is distinct from linked_profile then
      raise exception 'La cuenta vinculada no se puede cambiar. Crea otro integrante.';
    end if;
    if not previous_row.active and previous_row.profile_id is distinct from linked_profile then
      raise exception 'Reactiva al integrante antes de vincular una cuenta.';
    end if;
  end if;
  if jsonb_typeof(p_member->'aliases') is distinct from 'array' then raise exception 'Variantes inválidas.'; end if;
  if jsonb_array_length(p_member->'aliases') > 200 then raise exception 'Variantes inválidas.'; end if;
  if member_id is null then
    insert into public.recruiter_directory (canonical_name, full_name, short_name, access_card_name,
      job_title, badge_role, profile_id, selectable, include_in_metrics)
    values (public.recruiter_alias_key(p_member->>'canonical_name'), trim(p_member->>'full_name'),
      trim(p_member->>'short_name'), trim(p_member->>'access_card_name'), trim(p_member->>'job_title'),
      p_member->>'badge_role', linked_profile, (p_member->>'selectable')::boolean,
      (p_member->>'include_in_metrics')::boolean) returning * into next_row;
    member_id := next_row.id;
  else
    update public.recruiter_directory set full_name = trim(p_member->>'full_name'),
      short_name = trim(p_member->>'short_name'), access_card_name = trim(p_member->>'access_card_name'),
      job_title = trim(p_member->>'job_title'), badge_role = p_member->>'badge_role',
      selectable = (p_member->>'selectable')::boolean, include_in_metrics = (p_member->>'include_in_metrics')::boolean,
      profile_id = linked_profile, updated_at = now() where id = member_id returning * into next_row;
  end if;
  for alias_value in
    select jsonb_array_elements_text(p_member->'aliases')
    union select unnest(array[next_row.canonical_name, next_row.full_name, next_row.short_name, next_row.access_card_name])
  loop
    if exists (select 1 from public.recruiter_aliases a where a.alias_key = public.recruiter_alias_key(alias_value)
      and a.member_id <> next_row.id) then raise exception 'Una variante ya pertenece a otra persona: %', alias_value; end if;
    insert into public.recruiter_aliases values (public.recruiter_alias_key(alias_value), trim(alias_value), member_id)
    on conflict (alias_key) do update set alias = public.recruiter_aliases.alias
      where public.recruiter_aliases.member_id = excluded.member_id
      returning public.recruiter_aliases.member_id into alias_member;
    if alias_member is null then raise exception 'Una variante ya pertenece a otra persona: %', alias_value; end if;
  end loop;
  insert into public.recruiter_directory_audit(member_id, actor_id, previous_value, next_value)
  values (member_id, auth.uid(), case when previous_row.id is null then null else to_jsonb(previous_row) end, to_jsonb(next_row));
  return member_id;
end;
$$;
revoke all on function public.save_recruiter_member(jsonb) from public, anon;
grant execute on function public.save_recruiter_member(jsonb) to authenticated;

-- Exclusiva del servicio: la Edge Function verifica actor y coordina Supabase Auth.
create function public.acquire_recruiter_status_operation(p_id uuid, p_actor uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare operation uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = p_actor and p.role = 'admin')
    or exists (select 1 from public.recruiter_directory d where d.profile_id = p_actor and not d.active) then
    raise sqlstate '42501' using message = 'Acceso denegado.';
  end if;
  perform 1 from public.recruiter_directory where id = p_id for update;
  if not found then raise exception 'Integrante no disponible.'; end if;
  insert into public.recruiter_status_operations values (p_id, gen_random_uuid(), now() + interval '5 minutes')
    on conflict (member_id) do update set operation_id = excluded.operation_id, expires_at = excluded.expires_at
    where public.recruiter_status_operations.expires_at <= now()
    returning operation_id into operation;
  if operation is null then raise exception 'Ya se está actualizando este integrante.'; end if;
  return operation;
end;
$$;
create function public.release_recruiter_status_operation(p_id uuid, p_operation uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.recruiter_status_operations where member_id = p_id and operation_id = p_operation;
$$;
revoke all on function public.acquire_recruiter_status_operation(uuid, uuid), public.release_recruiter_status_operation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.acquire_recruiter_status_operation(uuid, uuid), public.release_recruiter_status_operation(uuid, uuid) to service_role;

create function public.set_recruiter_member_status(p_id uuid, p_active boolean, p_actor uuid, p_operation uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare old_row public.recruiter_directory; new_row public.recruiter_directory;
begin
  if not exists (select 1 from public.recruiter_status_operations where member_id = p_id and operation_id = p_operation and expires_at > now()) then
    raise exception 'La operación de estado venció. Vuelve a intentar.';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_actor and p.role = 'admin')
    or exists (select 1 from public.recruiter_directory d where d.profile_id = p_actor and not d.active)
    then raise sqlstate '42501' using message = 'Acceso denegado.'; end if;
  select * into strict old_row from public.recruiter_directory where id = p_id for update;
  if old_row.profile_id = p_actor then raise exception 'No puedes dar de baja tu propia cuenta.'; end if;
  if not p_active and exists (select 1 from public.profiles where id = old_row.profile_id and role = 'admin') then
    raise exception 'Esta acción está limitada a cuentas de reclutadores.';
  end if;
  update public.recruiter_directory set active = p_active, updated_at = now() where id = p_id returning * into new_row;
  if old_row.active is distinct from p_active then
    insert into public.recruiter_directory_audit(member_id, actor_id, previous_value, next_value)
    values (p_id, p_actor, to_jsonb(old_row), to_jsonb(new_row));
  end if;
  return old_row.profile_id;
end;
$$;
revoke all on function public.set_recruiter_member_status(uuid, boolean, uuid, uuid) from public, anon, authenticated;
grant execute on function public.set_recruiter_member_status(uuid, boolean, uuid, uuid) to service_role;

-- Los JWT emitidos antes de la baja tampoco pueden seguir leyendo/escribiendo.
do $$ declare name text; target regclass; begin
  foreach name in array array[
    'activities', 'activity_proofs', 'bajas', 'candidate_notes', 'candidates',
    'comentarios_reclutamiento', 'config', 'custom_positions', 'empleados',
    'incidencias_transporte', 'no_citados', 'position_settings', 'job_descriptions',
    'profile_general_cycles', 'profile_general_evaluations', 'profile_general_templates',
    'profile_general_criteria', 'profile_general_evaluation_items', 'profile_general_audit',
    'speech_templates', 'toulouse_sheets', 'vacancy_requests', 'vacancy_status_history',
    'reportes_diarios', 'ai_chat_sessions', 'data_update_campaigns',
    'data_update_campaign_participants', 'data_update_records', 'data_update_incidents',
    'data_update_audit', 'data_update_transport_options', 'data_update_civil_statuses',
    'data_update_birth_states', 'daily_work_activities', 'daily_work_activity_attachments'
  ]
  loop
    target := to_regclass(format('public.%I', name));
    if target is null then continue; end if;
    if not (select relrowsecurity from pg_class where oid = target) then raise exception 'Revisar RLS antes de aplicar bajas: %', name; end if;
    execute format('create policy team_access_gate on %s as restrictive for all to authenticated
      using ((select public.app_access_enabled())) with check ((select public.app_access_enabled()))', target);
  end loop;
end; $$;
create policy team_profile_read on public.profiles as restrictive for select to authenticated
using (id = (select auth.uid()) or (select public.app_access_enabled()));
create policy team_profile_write on public.profiles as restrictive for all to authenticated
using ((select public.app_access_enabled())) with check ((select public.app_access_enabled()));
create policy team_storage_access on storage.objects as restrictive for all to authenticated
using ((select public.app_access_enabled())) with check ((select public.app_access_enabled()));

-- Conserva asignaciones existentes; verifica solo cambios de responsable.
create function public.guard_active_recruiter_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare new_value text; old_value text; member public.recruiter_directory;
begin
  new_value := to_jsonb(new)->>tg_argv[0];
  if tg_op = 'UPDATE' then old_value := to_jsonb(old)->>tg_argv[0]; end if;
  if new_value is null or trim(new_value) = '' or (tg_op = 'UPDATE' and new_value is not distinct from old_value) then return new; end if;
  if tg_argv[1] = 'name' then
    select d.* into member from public.recruiter_directory d join public.recruiter_aliases a on a.member_id = d.id
      where a.alias_key = public.recruiter_alias_key(new_value) for share of d;
  else
    select * into member from public.recruiter_directory d where d.profile_id = new_value::uuid for share;
  end if;
  if member.id is not null and (not member.active or (tg_argv[2] = 'selectable' and not member.selectable)) then
    raise sqlstate '23514' using message = 'El integrante no está disponible para nuevas asignaciones.';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_active_recruiter_assignment() from public, anon, authenticated;
do $$ declare spec text[]; begin
  foreach spec slice 1 in array array[
    ['candidates', 'reclutador', 'name', 'selectable'],
    ['vacancy_requests', 'reclutador_asignado', 'name', 'selectable'],
    ['activities', 'asignado_a', 'profile', 'selectable'],
    ['data_update_records', 'assigned_to', 'profile', 'active'],
    ['data_update_campaign_participants', 'profile_id', 'profile', 'active']
  ] loop
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = spec[1] and column_name = spec[2]) then
      execute format('create trigger active_recruiter_assignment before insert or update of %I on public.%I
        for each row execute function public.guard_active_recruiter_assignment(%L, %L, %L)', spec[2], spec[1], spec[2], spec[3], spec[4]);
    end if;
  end loop;
end; $$;

create function public.enforce_team_access() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if current_setting('request.path', true) = '/rpc/app_access_enabled' then return; end if;
  if auth.role() = 'authenticated' and not public.app_access_enabled() then
    raise sqlstate 'PT403' using message = 'ACCOUNT_INACTIVE';
  end if;
  perform public.enforce_required_password_change();
end;
$$;
revoke all on function public.enforce_team_access() from public;
grant execute on function public.enforce_team_access() to anon, authenticated, service_role;
do $$ declare hook text; begin
  select split_part(setting, '=', 2) into hook from pg_db_role_setting s
  cross join lateral unnest(s.setconfig) setting where s.setrole = 'authenticator'::regrole
  and s.setdatabase in (0, (select oid from pg_database where datname = current_database()))
  and setting like 'pgrst.db_pre_request=%' and split_part(setting, '=', 2) not in ('', 'public.enforce_required_password_change', 'public.enforce_team_access') limit 1;
  if hook is not null then raise exception 'Integrar el hook existente antes de aplicar: %', hook; end if;
end; $$;
alter role authenticator set pgrst.db_pre_request = 'public.enforce_team_access';
alter publication supabase_realtime add table public.recruiter_directory, public.recruiter_aliases;
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
commit;
