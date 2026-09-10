-- Añade un paso independiente para tallas y fechas de nacimiento de hijos.
-- Los pasos persistidos son base cero: 0..7. Los registros abiertos que ya habían
-- llegado a Fotografía vuelven al paso nuevo para que no omitan la captura.

alter table public.data_update_records
  drop constraint if exists data_update_records_current_step_check;

update public.data_update_records
set
  current_step = case
    when status = 'completado' then 7
    when current_step >= 5 then 5
    else current_step
  end,
  current_data = current_data || jsonb_build_object(
    'shirtSize', case
      when jsonb_typeof(current_data->'shirtSize') = 'string' then current_data->'shirtSize'
      else '""'::jsonb
    end,
    'shoeSize', case
      when jsonb_typeof(current_data->'shoeSize') = 'string' then current_data->'shoeSize'
      else '""'::jsonb
    end,
    'childrenBirthDates', case
      when jsonb_typeof(current_data->'childrenBirthDates') = 'array' then current_data->'childrenBirthDates'
      else '[]'::jsonb
    end
  ),
  version = version + 1,
  updated_at = now();

alter table public.data_update_records
  add constraint data_update_records_current_step_check
  check (current_step between 0 and 7);

create or replace function public.create_data_update_campaign(
  p_name text,
  p_year integer,
  p_participant_ids uuid[],
  p_records jsonb,
  p_transport_options jsonb,
  p_civil_statuses jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id uuid;
  v_participants uuid[];
  v_item jsonb;
  v_ordinality bigint;
  v_assigned_to uuid;
  v_current_data jsonb;
  v_identity_fields text[] := array[
    'employeeNumber', 'name', 'area', 'section', 'position', 'shift',
    'hireDate', 'birthDate', 'curp', 'rfc', 'socialSecurityNumber'
  ];
  v_editable_fields text[] := array[
    'route', 'stop', 'location', 'birthState', 'civilStatus', 'email',
    'mobilePhone', 'emergencyContact', 'emergencyPhone', 'street',
    'fullAddress', 'municipality', 'educationLevel', 'bloodType',
    'allergies', 'locker'
  ];
begin
  if not public.is_admin() then raise exception 'DATA_UPDATE_FORBIDDEN'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'DATA_UPDATE_NAME_REQUIRED'; end if;
  if p_records is null or jsonb_typeof(p_records) <> 'array' or jsonb_array_length(p_records) = 0 then
    raise exception 'DATA_UPDATE_RECORDS_REQUIRED';
  end if;
  if coalesce(array_length(p_participant_ids, 1), 0) = 0 then
    raise exception 'DATA_UPDATE_PARTICIPANTS_REQUIRED';
  end if;

  select array_agg(profile_id order by input_order)
  into v_participants
  from (
    select distinct on (profile_id) profile_id, input_order
    from unnest(p_participant_ids) with ordinality input(profile_id, input_order)
    join public.profiles profile on profile.id = input.profile_id
    where profile.role in ('admin', 'reclutador')
    order by profile_id, input_order
  ) valid;

  if coalesce(array_length(v_participants, 1), 0) <> coalesce(array_length(p_participant_ids, 1), 0) then
    raise exception 'DATA_UPDATE_INVALID_PARTICIPANT';
  end if;

  insert into public.data_update_campaigns (name, year, created_by)
  values (trim(p_name), p_year, auth.uid())
  returning id into v_campaign_id;

  insert into public.data_update_campaign_participants (campaign_id, profile_id)
  select v_campaign_id, participant from unnest(v_participants) participant;

  for v_item, v_ordinality in
    select value, ordinality from jsonb_array_elements(p_records) with ordinality
  loop
    v_assigned_to := v_participants[((v_ordinality - 1) % array_length(v_participants, 1)) + 1];
    if jsonb_typeof(v_item->'identity') <> 'object'
      or jsonb_typeof(v_item->'originalData') <> 'object'
      or jsonb_typeof(v_item->'data') <> 'object' then
      raise exception 'DATA_UPDATE_INVALID_RECORD';
    end if;
    if exists (
      select 1 from unnest(v_identity_fields) key
      where length(trim(coalesce(v_item->'identity'->>key, ''))) = 0
    ) or exists (
      select 1 from unnest(v_editable_fields) key
      where not ((v_item->'data') ? key)
        or jsonb_typeof(v_item->'data'->key) <> 'string'
    ) or (
      (v_item->'data') ? 'emergencyRelationship'
      and jsonb_typeof(v_item->'data'->'emergencyRelationship') <> 'string'
    ) or (
      (v_item->'data') ? 'shirtSize'
      and jsonb_typeof(v_item->'data'->'shirtSize') <> 'string'
    ) or (
      (v_item->'data') ? 'shoeSize'
      and jsonb_typeof(v_item->'data'->'shoeSize') <> 'string'
    ) or (
      (v_item->'data') ? 'childrenBirthDates'
      and jsonb_typeof(v_item->'data'->'childrenBirthDates') <> 'array'
    ) or exists (
      select 1
      from jsonb_array_elements(
        case
          when jsonb_typeof(v_item->'data'->'childrenBirthDates') = 'array'
            then v_item->'data'->'childrenBirthDates'
          else '[]'::jsonb
        end
      ) child(value)
      where jsonb_typeof(value) <> 'string'
    ) then raise exception 'DATA_UPDATE_INVALID_RECORD'; end if;

    v_current_data := (v_item->'data') || jsonb_build_object(
      'emergencyRelationship', coalesce(v_item->'data'->>'emergencyRelationship', ''),
      'shirtSize', coalesce(v_item->'data'->>'shirtSize', ''),
      'shoeSize', coalesce(v_item->'data'->>'shoeSize', ''),
      'childrenBirthDates', coalesce(v_item->'data'->'childrenBirthDates', '[]'::jsonb)
    );

    insert into public.data_update_records (
      campaign_id, employee_number, employee_name, area, section, position,
      shift, hire_date, birth_date, curp, rfc, social_security_number,
      original_data, current_data, assigned_to
    ) values (
      v_campaign_id,
      trim(v_item->'identity'->>'employeeNumber'),
      trim(v_item->'identity'->>'name'),
      trim(v_item->'identity'->>'area'),
      trim(v_item->'identity'->>'section'),
      trim(v_item->'identity'->>'position'),
      trim(v_item->'identity'->>'shift'),
      trim(v_item->'identity'->>'hireDate'),
      trim(v_item->'identity'->>'birthDate'),
      trim(v_item->'identity'->>'curp'),
      trim(v_item->'identity'->>'rfc'),
      trim(v_item->'identity'->>'socialSecurityNumber'),
      v_item->'originalData',
      v_current_data,
      v_assigned_to
    );
  end loop;

  if jsonb_typeof(p_transport_options) = 'array' then
    insert into public.data_update_transport_options (campaign_id, route, stop, location)
    select distinct v_campaign_id, trim(value->>'route'), trim(value->>'stop'), trim(value->>'location')
    from jsonb_array_elements(p_transport_options)
    where length(trim(value->>'route')) > 0
      and length(trim(value->>'stop')) > 0
      and length(trim(value->>'location')) > 0
    on conflict do nothing;
  end if;

  if jsonb_typeof(p_civil_statuses) = 'array' then
    insert into public.data_update_civil_statuses (campaign_id, value)
    select distinct v_campaign_id, trim(value #>> '{}')
    from jsonb_array_elements(p_civil_statuses)
    where length(trim(value #>> '{}')) > 0
    on conflict do nothing;
  end if;

  return v_campaign_id;
end;
$$;

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
  v_current_data jsonb;
  v_key text;
  v_required text[] := array[
    'route', 'stop', 'location', 'birthState', 'civilStatus', 'email',
    'mobilePhone', 'emergencyContact', 'emergencyPhone', 'street',
    'fullAddress', 'municipality', 'educationLevel', 'bloodType',
    'allergies', 'locker'
  ];
  v_allowed text[] := array[
    'route', 'stop', 'location', 'birthState', 'civilStatus', 'email',
    'mobilePhone', 'emergencyContact', 'emergencyRelationship',
    'emergencyPhone', 'street', 'fullAddress', 'municipality',
    'educationLevel', 'bloodType', 'allergies', 'locker', 'shirtSize',
    'shoeSize', 'childrenBirthDates'
  ];
begin
  select * into v_record from public.data_update_records where id = p_record_id for update;
  if not found then raise exception 'DATA_UPDATE_NOT_FOUND'; end if;
  if not public.is_admin() and v_record.assigned_to <> auth.uid() then raise exception 'DATA_UPDATE_FORBIDDEN'; end if;
  if v_record.status = 'completado' then raise exception 'DATA_UPDATE_COMPLETED'; end if;
  if v_record.version <> p_expected_version then raise exception 'DATA_UPDATE_CONFLICT'; end if;
  if p_current_data is null or jsonb_typeof(p_current_data) <> 'object'
    or p_current_step is null or p_current_step not between 0 and 7 then
    raise exception 'DATA_UPDATE_INVALID_DRAFT';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_current_data) key where not (key = any(v_allowed))
  ) or exists (
    select 1 from unnest(v_required) key
    where not (p_current_data ? key) or jsonb_typeof(p_current_data->key) <> 'string'
  ) or (
    p_current_data ? 'emergencyRelationship'
    and jsonb_typeof(p_current_data->'emergencyRelationship') <> 'string'
  ) or (
    p_current_data ? 'shirtSize'
    and jsonb_typeof(p_current_data->'shirtSize') <> 'string'
  ) or (
    p_current_data ? 'shoeSize'
    and jsonb_typeof(p_current_data->'shoeSize') <> 'string'
  ) or (
    p_current_data ? 'childrenBirthDates'
    and jsonb_typeof(p_current_data->'childrenBirthDates') <> 'array'
  ) or exists (
    select 1
    from jsonb_array_elements(
      case
        when jsonb_typeof(p_current_data->'childrenBirthDates') = 'array'
          then p_current_data->'childrenBirthDates'
        else '[]'::jsonb
      end
    ) child(value)
    where jsonb_typeof(value) <> 'string'
  ) then raise exception 'DATA_UPDATE_INVALID_FIELDS'; end if;
  if p_photo_path is not null and (
    p_photo_path not like v_record.campaign_id::text || '/' || v_record.id::text || '/%'
  ) then raise exception 'DATA_UPDATE_INVALID_PHOTO'; end if;

  v_current_data := p_current_data || jsonb_build_object(
    'emergencyRelationship', coalesce(
      p_current_data->>'emergencyRelationship',
      v_record.current_data->>'emergencyRelationship',
      ''
    ),
    'shirtSize', coalesce(
      p_current_data->>'shirtSize',
      v_record.current_data->>'shirtSize',
      ''
    ),
    'shoeSize', coalesce(
      p_current_data->>'shoeSize',
      v_record.current_data->>'shoeSize',
      ''
    ),
    'childrenBirthDates', coalesce(
      p_current_data->'childrenBirthDates',
      v_record.current_data->'childrenBirthDates',
      '[]'::jsonb
    )
  );

  for v_key in select jsonb_object_keys(v_current_data)
  loop
    if v_record.current_data->>v_key is distinct from v_current_data->>v_key then
      insert into public.data_update_audit (
        record_id, field_name, previous_value, next_value, changed_by
      ) values (
        p_record_id, v_key, v_record.current_data->>v_key, v_current_data->>v_key, auth.uid()
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
    current_data = v_current_data,
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
    'allergies', 'locker', 'shirtSize', 'shoeSize'
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
  if jsonb_typeof(v_record.current_data->'childrenBirthDates') is distinct from 'array' then
    raise exception 'DATA_UPDATE_INVALID_CHILD_BIRTH_DATES';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_record.current_data->'childrenBirthDates') child(value)
    where jsonb_typeof(value) <> 'string'
  ) then
    raise exception 'DATA_UPDATE_INVALID_CHILD_BIRTH_DATES';
  end if;
  if exists (
    select 1
    from jsonb_array_elements_text(v_record.current_data->'childrenBirthDates') child(value)
    where case
      when value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then true
      when substring(value from 1 for 4)::integer not between 1 and 9999 then true
      when substring(value from 6 for 2)::integer not between 1 and 12 then true
      when substring(value from 9 for 2)::integer not between 1 and 31 then true
      else to_char(to_date(value, 'YYYY-MM-DD'), 'YYYY-MM-DD') <> value
        or to_date(value, 'YYYY-MM-DD') > (now() at time zone 'America/Mexico_City')::date
    end
  ) then
    raise exception 'DATA_UPDATE_INVALID_CHILD_BIRTH_DATES';
  end if;
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
    status = 'completado', current_step = 7, completed_at = now(),
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

create or replace function public.reopen_data_update_record(p_record_id uuid)
returns public.data_update_records
language plpgsql
security definer
set search_path = public
as $$
declare v_record public.data_update_records;
begin
  if not public.is_admin() then raise exception 'DATA_UPDATE_FORBIDDEN'; end if;
  select * into v_record from public.data_update_records where id = p_record_id for update;
  if not found then raise exception 'DATA_UPDATE_NOT_FOUND'; end if;
  if v_record.status <> 'completado' then raise exception 'DATA_UPDATE_REOPEN_INVALID'; end if;
  insert into public.data_update_audit (record_id, field_name, previous_value, next_value, changed_by)
  values (p_record_id, 'status', v_record.status, 'en_proceso', auth.uid());
  update public.data_update_records set
    status = 'en_proceso',
    current_step = case
      when length(trim(coalesce(current_data->>'shirtSize', ''))) = 0
        or length(trim(coalesce(current_data->>'shoeSize', ''))) = 0
        or jsonb_typeof(current_data->'childrenBirthDates') is distinct from 'array'
      then 5
      else current_step
    end,
    completed_at = null,
    version = version + 1,
    updated_at = now()
  where id = p_record_id returning * into v_record;
  update public.data_update_campaigns set status = 'activa', updated_at = now()
  where id = v_record.campaign_id;
  return v_record;
end;
$$;

revoke all on function public.create_data_update_campaign(text, integer, uuid[], jsonb, jsonb, jsonb) from public;
revoke all on function public.save_data_update_record(uuid, integer, jsonb, smallint, text) from public;
revoke all on function public.complete_data_update_record(uuid, integer) from public;
revoke all on function public.reopen_data_update_record(uuid) from public;
grant execute on function public.create_data_update_campaign(text, integer, uuid[], jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.save_data_update_record(uuid, integer, jsonb, smallint, text) to authenticated;
grant execute on function public.complete_data_update_record(uuid, integer) to authenticated;
grant execute on function public.reopen_data_update_record(uuid) to authenticated;

-- Rollback compatible: desplegar primero el cliente de siete pasos, decrementar
-- current_step en registros con valor >= 6, restaurar el constraint 0..6 y las
-- funciones de 036/037 (y reopen_data_update_record desde 034). Las claves JSON
-- nuevas pueden permanecer sin perder datos.
