-- Amplía el progreso para separar Fotografía (paso 6) de Revisión (paso 7).
-- Los índices persistidos siguen siendo base cero: 0..6.

alter table public.data_update_records
  drop constraint if exists data_update_records_current_step_check;

alter table public.data_update_records
  add constraint data_update_records_current_step_check
  check (current_step between 0 and 6);

create or replace function public.save_data_update_record(
  p_record_id uuid,
  p_expected_version integer,
  p_current_data jsonb,
  p_current_step smallint,
  p_photo_path text
)
returns public.data_update_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record public.data_update_records;
  v_key text;
  v_allowed text[] := array[
    'route', 'stop', 'location', 'birthState', 'civilStatus', 'email',
    'mobilePhone', 'emergencyContact', 'emergencyPhone', 'street',
    'fullAddress', 'municipality', 'educationLevel', 'bloodType',
    'allergies', 'locker'
  ];
begin
  select * into v_record from public.data_update_records where id = p_record_id for update;
  if not found then raise exception 'DATA_UPDATE_NOT_FOUND'; end if;
  if not public.is_admin() and v_record.assigned_to <> auth.uid() then raise exception 'DATA_UPDATE_FORBIDDEN'; end if;
  if v_record.status = 'completado' then raise exception 'DATA_UPDATE_COMPLETED'; end if;
  if v_record.version <> p_expected_version then raise exception 'DATA_UPDATE_CONFLICT'; end if;
  if p_current_data is null or jsonb_typeof(p_current_data) <> 'object'
    or p_current_step is null or p_current_step not between 0 and 6 then
    raise exception 'DATA_UPDATE_INVALID_DRAFT';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_current_data) key where not (key = any(v_allowed))
   ) or exists (
    select 1 from unnest(v_allowed) key
    where not (p_current_data ? key) or jsonb_typeof(p_current_data->key) <> 'string'
  ) then raise exception 'DATA_UPDATE_INVALID_FIELDS'; end if;
  if p_photo_path is not null and (
    p_photo_path not like v_record.campaign_id::text || '/' || v_record.id::text || '/%'
  ) then raise exception 'DATA_UPDATE_INVALID_PHOTO'; end if;

  for v_key in select jsonb_object_keys(p_current_data)
  loop
    if v_record.current_data->>v_key is distinct from p_current_data->>v_key then
      insert into public.data_update_audit (
        record_id, field_name, previous_value, next_value, changed_by
      ) values (
        p_record_id, v_key, v_record.current_data->>v_key, p_current_data->>v_key, auth.uid()
      );
    end if;
  end loop;

  if v_record.photo_path is distinct from nullif(trim(p_photo_path), '') then
    insert into public.data_update_audit (
      record_id, field_name, previous_value, next_value, changed_by
    ) values (
      p_record_id, 'photoPath', v_record.photo_path,
      nullif(trim(p_photo_path), ''), auth.uid()
    );
  end if;
  if v_record.status = 'pendiente' then
    insert into public.data_update_audit (
      record_id, field_name, previous_value, next_value, changed_by
    ) values (p_record_id, 'status', 'pendiente', 'en_proceso', auth.uid());
  end if;

  update public.data_update_records set
    current_data = p_current_data,
    current_step = p_current_step,
    photo_path = nullif(trim(p_photo_path), ''),
    status = case when status = 'pendiente' then 'en_proceso' else status end,
    started_at = coalesce(started_at, now()),
    version = version + 1,
    updated_at = now()
  where id = p_record_id
  returning * into v_record;
  return v_record;
end;
$$;

create or replace function public.complete_data_update_record(
  p_record_id uuid,
  p_expected_version integer
)
returns public.data_update_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record public.data_update_records;
  v_required text[] := array[
    'route', 'stop', 'location', 'birthState', 'civilStatus', 'email',
    'mobilePhone', 'emergencyContact', 'emergencyPhone', 'street',
    'fullAddress', 'municipality', 'educationLevel', 'bloodType',
    'allergies', 'locker'
  ];
begin
  select * into v_record from public.data_update_records where id = p_record_id for update;
  if not found then raise exception 'DATA_UPDATE_NOT_FOUND'; end if;
  if not public.is_admin() and v_record.assigned_to <> auth.uid() then raise exception 'DATA_UPDATE_FORBIDDEN'; end if;
  if v_record.status = 'completado' then raise exception 'DATA_UPDATE_COMPLETED'; end if;
  if v_record.version <> p_expected_version then raise exception 'DATA_UPDATE_CONFLICT'; end if;
  if v_record.identity_review = 'pendiente' then raise exception 'DATA_UPDATE_IDENTITY_PENDING'; end if;
  if v_record.photo_path is null then raise exception 'DATA_UPDATE_PHOTO_REQUIRED'; end if;
  if v_record.photo_path not like v_record.campaign_id::text || '/' || v_record.id::text || '/%'
    or not exists (
      select 1 from storage.objects object
      where object.bucket_id = 'data-update-photos' and object.name = v_record.photo_path
    ) then raise exception 'DATA_UPDATE_INVALID_PHOTO'; end if;
  if exists (
    select 1 from unnest(v_required) key
    where length(trim(coalesce(v_record.current_data->>key, ''))) = 0
  ) then raise exception 'DATA_UPDATE_REQUIRED_FIELDS'; end if;
  if not exists (
    select 1 from public.data_update_transport_options option
    where option.campaign_id = v_record.campaign_id
      and option.route = v_record.current_data->>'route'
      and option.stop = v_record.current_data->>'stop'
      and option.location = v_record.current_data->>'location'
  ) then raise exception 'DATA_UPDATE_INVALID_TRANSPORT'; end if;
  if not exists (
    select 1 from public.data_update_civil_statuses civil
    where civil.campaign_id = v_record.campaign_id
      and civil.value = v_record.current_data->>'civilStatus'
  ) then raise exception 'DATA_UPDATE_INVALID_CIVIL_STATUS'; end if;
  if not exists (
    select 1 from public.data_update_birth_states state
    where state.value = v_record.current_data->>'birthState'
  ) then raise exception 'DATA_UPDATE_INVALID_BIRTH_STATE'; end if;
  if upper(replace(v_record.current_data->>'email', '.', '')) not in ('N/A', 'NA')
    and v_record.current_data->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'DATA_UPDATE_INVALID_EMAIL';
  end if;

  insert into public.data_update_audit (
    record_id, field_name, previous_value, next_value, changed_by
  ) values (p_record_id, 'status', v_record.status, 'completado', auth.uid());

  update public.data_update_records set
    status = 'completado', current_step = 6, completed_at = now(),
    version = version + 1, updated_at = now()
  where id = p_record_id returning * into v_record;

  if not exists (
    select 1 from public.data_update_records record
    where record.campaign_id = v_record.campaign_id and record.status <> 'completado'
  ) then
    update public.data_update_campaigns
    set status = 'completada', updated_at = now()
    where id = v_record.campaign_id;
  end if;
  return v_record;
end;
$$;

revoke all on function public.save_data_update_record(uuid, integer, jsonb, smallint, text) from public;
revoke all on function public.complete_data_update_record(uuid, integer) from public;
grant execute on function public.save_data_update_record(uuid, integer, jsonb, smallint, text) to authenticated;
grant execute on function public.complete_data_update_record(uuid, integer) to authenticated;

-- Rollback compatible: primero desplegar un cliente que vuelva a usar 0..5,
-- convertir cualquier current_step = 6 a 5 y restaurar ambas funciones desde 034.
