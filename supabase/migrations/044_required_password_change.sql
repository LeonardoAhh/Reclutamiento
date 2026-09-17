-- Preparación compatible: no marca usuarios ni activa la campaña.
begin;

create schema if not exists account_security;
revoke all on schema account_security from public, anon, authenticated;

create table account_security.password_change_campaign (
  singleton boolean primary key default true check (singleton),
  activated_at timestamptz not null default now(),
  enabled boolean not null default true
);

create table account_security.password_change_requirements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  required_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table account_security.password_change_campaign enable row level security;
alter table account_security.password_change_requirements enable row level security;
revoke all on all tables in schema account_security from public, anon, authenticated;

create or replace function public.password_change_required()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from account_security.password_change_requirements r
    join account_security.password_change_campaign c on c.singleton and c.enabled
    where r.user_id = auth.uid() and r.completed_at is null
  );
$$;
revoke all on function public.password_change_required() from public, anon;
grant execute on function public.password_change_required() to authenticated, service_role;

-- Únicamente la Edge Function confirma después de que Auth guarde la contraseña.
create or replace function public.complete_required_password_change(
  p_user_id uuid, p_change_started_at timestamptz
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update account_security.password_change_requirements
  set completed_at = clock_timestamp()
  where user_id = p_user_id and completed_at is null
    and required_at <= p_change_started_at;
  return not exists (
    select 1 from account_security.password_change_requirements r
    join account_security.password_change_campaign c on c.singleton and c.enabled
    where r.user_id = p_user_id and r.completed_at is null
  );
end;
$$;
revoke all on function public.complete_required_password_change(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.complete_required_password_change(uuid, timestamptz) to service_role;

-- Cubre también RPC SECURITY DEFINER, que no quedan limitadas por RLS.
create or replace function public.enforce_required_password_change()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'authenticated'
     or not public.password_change_required() then return; end if;
  if current_setting('request.path', true) = '/rpc/password_change_required' then return; end if;
  if current_setting('request.path', true) = '/profiles'
     and current_setting('request.method', true) in ('GET', 'HEAD') then return; end if;
  raise sqlstate 'PT403' using message = 'PASSWORD_CHANGE_REQUIRED';
end;
$$;
revoke all on function public.enforce_required_password_change() from public;
grant execute on function public.enforce_required_password_change() to anon, authenticated, service_role;

-- Lista explícita del dominio de reclutamiento; no incorpora tablas de rutas.
do $$
declare
  table_name text;
  target regclass;
begin
  foreach table_name in array array[
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
  ] loop
    target := to_regclass(format('public.%I', table_name));
    if target is null then continue; end if;
    if not (select relrowsecurity from pg_class where oid = target) then
      raise exception 'Revisar RLS antes de activar cambio de contraseña: %', table_name;
    end if;
    execute format(
      'create policy password_change_gate on %s as restrictive for all to authenticated
       using (not (select public.password_change_required()))
       with check (not (select public.password_change_required()))', target
    );
  end loop;
end;
$$;

create policy password_change_read_profile on public.profiles as restrictive
for select to authenticated
using (id = (select auth.uid()) or not (select public.password_change_required()));
create policy password_change_insert_profile on public.profiles as restrictive
for insert to authenticated with check (not (select public.password_change_required()));
create policy password_change_update_profile on public.profiles as restrictive
for update to authenticated using (not (select public.password_change_required()))
with check (not (select public.password_change_required()));
create policy password_change_delete_profile on public.profiles as restrictive
for delete to authenticated using (not (select public.password_change_required()));

create policy password_change_storage_gate on storage.objects as restrictive
for all to authenticated
using (
  bucket_id not in ('avatars', 'activity-proofs', 'transport-incident-images', 'data-update-photos', 'daily-work-log-files')
  or not (select public.password_change_required())
)
with check (
  bucket_id not in ('avatars', 'activity-proofs', 'transport-incident-images', 'data-update-photos', 'daily-work-log-files')
  or not (select public.password_change_required())
);

notify pgrst, 'reload schema';
commit;
