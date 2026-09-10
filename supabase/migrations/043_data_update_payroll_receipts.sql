-- Añade la confirmación de recepción de recibos de nómina al paso Contacto.
-- La clave se expande dentro de current_data sin eliminar información existente.

update public.data_update_records
set
  current_data = current_data || jsonb_build_object(
    'receivesPayrollReceipts', case
      when upper(trim(coalesce(current_data->>'receivesPayrollReceipts', ''))) in ('SI', 'SÍ')
        then to_jsonb('SI'::text)
      when upper(trim(coalesce(current_data->>'receivesPayrollReceipts', ''))) = 'NO'
        then to_jsonb('NO'::text)
      else '""'::jsonb
    end
  ),
  version = version + 1,
  updated_at = now();

alter table public.data_update_records
  drop constraint if exists data_update_records_payroll_receipts_check;

alter table public.data_update_records
  add constraint data_update_records_payroll_receipts_check
  check (
    not (current_data ? 'receivesPayrollReceipts')
    or (
      jsonb_typeof(current_data->'receivesPayrollReceipts') = 'string'
      and current_data->>'receivesPayrollReceipts' in ('', 'SI', 'NO')
    )
  );

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
    'receivesPayrollReceipts', 'mobilePhone', 'emergencyContact',
    'emergencyRelationship', 'emergencyPhone', 'street', 'fullAddress',
    'municipality', 'educationLevel', 'bloodType', 'allergies', 'locker',
    'shirtSize', 'shoeSize', 'childrenBirthDates'
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
    p_current_data ? 'receivesPayrollReceipts'
    and jsonb_typeof(p_current_data->'receivesPayrollReceipts') <> 'string'
  ) or (
    p_current_data ? 'receivesPayrollReceipts'
    and p_current_data->>'receivesPayrollReceipts' not in ('', 'SI', 'NO')
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
    'receivesPayrollReceipts', coalesce(
      p_current_data->>'receivesPayrollReceipts',
      v_record.current_data->>'receivesPayrollReceipts',
      ''
    ),
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
    'receivesPayrollReceipts', 'mobilePhone', 'emergencyContact',
    'emergencyPhone', 'street', 'fullAddress', 'municipality',
    'educationLevel', 'bloodType', 'allergies', 'locker', 'shirtSize',
    'shoeSize'
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
  if v_record.current_data->>'receivesPayrollReceipts' not in ('SI', 'NO') then
    raise exception 'DATA_UPDATE_INVALID_PAYROLL_RECEIPTS';
  end if;
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
      when coalesce(current_data->>'receivesPayrollReceipts', '') not in ('SI', 'NO') then 2
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

revoke all on function public.save_data_update_record(uuid, integer, jsonb, smallint, text) from public;
revoke all on function public.complete_data_update_record(uuid, integer) from public;
revoke all on function public.reopen_data_update_record(uuid) from public;
grant execute on function public.save_data_update_record(uuid, integer, jsonb, smallint, text) to authenticated;
grant execute on function public.complete_data_update_record(uuid, integer) to authenticated;
grant execute on function public.reopen_data_update_record(uuid) to authenticated;

-- Rollback compatible: restaurar las tres funciones desde 042. La clave JSON
-- puede permanecer sin pérdida; el cliente anterior la ignorará al leerla.
