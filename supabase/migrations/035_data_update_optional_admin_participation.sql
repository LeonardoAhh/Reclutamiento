-- Separa la administración de la participación en el reparto.
-- Conserva la firma pública para que clientes anteriores sigan funcionando.

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
    ) then raise exception 'DATA_UPDATE_INVALID_RECORD'; end if;

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
      v_item->'data',
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

revoke all on function public.create_data_update_campaign(text, integer, uuid[], jsonb, jsonb, jsonb) from public;
grant execute on function public.create_data_update_campaign(text, integer, uuid[], jsonb, jsonb, jsonb) to authenticated;

-- Rollback: restaurar la definición de create_data_update_campaign de 034,
-- incluida la validación DATA_UPDATE_ADMIN_PARTICIPATION_REQUIRED.
