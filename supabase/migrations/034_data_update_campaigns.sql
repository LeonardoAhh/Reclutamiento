-- Campañas independientes para validar y actualizar datos generales.
-- No modifica public.empleados ni sus contratos.

create table if not exists public.data_update_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  year integer not null,
  status text not null default 'activa'
    check (status in ('activa', 'completada', 'archivada')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.data_update_campaign_participants (
  campaign_id uuid not null references public.data_update_campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (campaign_id, profile_id)
);

create table if not exists public.data_update_records (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.data_update_campaigns(id) on delete cascade,
  employee_number text not null,
  employee_name text not null,
  area text not null,
  section text not null,
  position text not null,
  shift text not null,
  hire_date text not null,
  birth_date text not null,
  curp text not null,
  rfc text not null,
  social_security_number text not null,
  original_data jsonb not null check (jsonb_typeof(original_data) = 'object'),
  current_data jsonb not null check (jsonb_typeof(current_data) = 'object'),
  assigned_to uuid not null references public.profiles(id),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_proceso', 'completado')),
  identity_review text not null default 'pendiente'
    check (identity_review in ('pendiente', 'confirmado', 'incidencia')),
  current_step smallint not null default 0 check (current_step between 0 and 5),
  photo_path text,
  version integer not null default 1 check (version > 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, employee_number)
);

create index if not exists data_update_records_assignment_idx
  on public.data_update_records (assigned_to, status, updated_at desc);
create index if not exists data_update_records_campaign_idx
  on public.data_update_records (campaign_id, status);

create table if not exists public.data_update_incidents (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.data_update_records(id) on delete cascade,
  field_name text not null,
  note text not null check (length(trim(note)) > 0),
  reported_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Compatibilidad con una ejecución parcial de la primera revisión de esta
-- migración: las incidencias pasan a ser historial y no se sobrescriben.
alter table public.data_update_incidents
  drop constraint if exists data_update_incidents_record_id_field_name_key;

create table if not exists public.data_update_audit (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.data_update_records(id) on delete cascade,
  field_name text not null,
  previous_value text,
  next_value text,
  changed_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists data_update_audit_record_idx
  on public.data_update_audit (record_id, created_at);

create table if not exists public.data_update_transport_options (
  campaign_id uuid not null references public.data_update_campaigns(id) on delete cascade,
  route text not null,
  stop text not null,
  location text not null,
  primary key (campaign_id, route, stop, location)
);

create table if not exists public.data_update_civil_statuses (
  campaign_id uuid not null references public.data_update_campaigns(id) on delete cascade,
  value text not null,
  primary key (campaign_id, value)
);

create table if not exists public.data_update_birth_states (
  value text primary key
);

insert into public.data_update_birth_states (value) values
  ('Aguascalientes'), ('Baja California'), ('Baja California Sur'),
  ('Campeche'), ('Chiapas'), ('Chihuahua'), ('Ciudad de México'),
  ('Coahuila'), ('Colima'), ('Durango'), ('Estado de México'),
  ('Guanajuato'), ('Guerrero'), ('Hidalgo'), ('Jalisco'),
  ('Michoacán'), ('Morelos'), ('Nayarit'), ('Nuevo León'), ('Oaxaca'),
  ('Puebla'), ('Querétaro'), ('Quintana Roo'), ('San Luis Potosí'),
  ('Sinaloa'), ('Sonora'), ('Tabasco'), ('Tamaulipas'), ('Tlaxcala'),
  ('Veracruz'), ('Yucatán'), ('Zacatecas')
on conflict (value) do nothing;

alter table public.data_update_campaigns enable row level security;
alter table public.data_update_campaign_participants enable row level security;
alter table public.data_update_records enable row level security;
alter table public.data_update_incidents enable row level security;
alter table public.data_update_audit enable row level security;
alter table public.data_update_transport_options enable row level security;
alter table public.data_update_civil_statuses enable row level security;
alter table public.data_update_birth_states enable row level security;

drop policy if exists data_update_campaigns_select on public.data_update_campaigns;
create policy data_update_campaigns_select on public.data_update_campaigns
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.data_update_campaign_participants participant
    where participant.campaign_id = id and participant.profile_id = auth.uid()
  )
);

drop policy if exists data_update_participants_select on public.data_update_campaign_participants;
create policy data_update_participants_select on public.data_update_campaign_participants
for select to authenticated using (
  public.is_admin() or profile_id = auth.uid()
);

drop policy if exists data_update_records_select on public.data_update_records;
create policy data_update_records_select on public.data_update_records
for select to authenticated using (
  public.is_admin() or assigned_to = auth.uid()
);

drop policy if exists data_update_incidents_select on public.data_update_incidents;
create policy data_update_incidents_select on public.data_update_incidents
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.data_update_records record
    where record.id = data_update_incidents.record_id
      and record.assigned_to = auth.uid()
  )
);

drop policy if exists data_update_audit_select_admin on public.data_update_audit;
create policy data_update_audit_select_admin on public.data_update_audit
for select to authenticated using (public.is_admin());

drop policy if exists data_update_transport_options_select on public.data_update_transport_options;
create policy data_update_transport_options_select on public.data_update_transport_options
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.data_update_records record
    where record.campaign_id = data_update_transport_options.campaign_id
      and record.assigned_to = auth.uid()
  )
);

drop policy if exists data_update_civil_statuses_select on public.data_update_civil_statuses;
create policy data_update_civil_statuses_select on public.data_update_civil_statuses
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.data_update_records record
    where record.campaign_id = data_update_civil_statuses.campaign_id
      and record.assigned_to = auth.uid()
  )
);

drop policy if exists data_update_birth_states_select on public.data_update_birth_states;
create policy data_update_birth_states_select on public.data_update_birth_states
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.data_update_records record
    where record.assigned_to = auth.uid()
  )
);

grant select on public.data_update_campaigns,
  public.data_update_campaign_participants,
  public.data_update_records,
  public.data_update_incidents,
  public.data_update_audit,
  public.data_update_transport_options,
  public.data_update_civil_statuses,
  public.data_update_birth_states
to authenticated;

revoke insert, update, delete, truncate, references, trigger
on public.data_update_campaigns,
  public.data_update_campaign_participants,
  public.data_update_records,
  public.data_update_incidents,
  public.data_update_audit,
  public.data_update_transport_options,
  public.data_update_civil_statuses,
  public.data_update_birth_states
from anon, authenticated;

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
  if not (auth.uid() = any(v_participants)) then
    raise exception 'DATA_UPDATE_ADMIN_PARTICIPATION_REQUIRED';
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
    ) then
      raise exception 'DATA_UPDATE_INVALID_RECORD';
    end if;

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
    or p_current_step is null or p_current_step not between 0 and 5 then
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

create or replace function public.review_data_update_identity(
  p_record_id uuid,
  p_expected_version integer,
  p_status text,
  p_incidents jsonb
)
returns public.data_update_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record public.data_update_records;
  v_item jsonb;
  v_allowed text[] := array[
    'employeeNumber', 'name', 'area', 'section', 'position', 'shift',
    'hireDate', 'birthDate', 'curp', 'rfc', 'socialSecurityNumber'
  ];
begin
  select * into v_record from public.data_update_records where id = p_record_id for update;
  if not found then raise exception 'DATA_UPDATE_NOT_FOUND'; end if;
  if not public.is_admin() and v_record.assigned_to <> auth.uid() then raise exception 'DATA_UPDATE_FORBIDDEN'; end if;
  if v_record.status = 'completado' then raise exception 'DATA_UPDATE_COMPLETED'; end if;
  if v_record.version <> p_expected_version then raise exception 'DATA_UPDATE_CONFLICT'; end if;
  if p_status is null or p_status not in ('confirmado', 'incidencia')
    or p_incidents is null or jsonb_typeof(p_incidents) <> 'array' then
    raise exception 'DATA_UPDATE_INVALID_REVIEW';
  end if;
  if p_status = 'incidencia' and jsonb_array_length(p_incidents) = 0 then
    raise exception 'DATA_UPDATE_INCIDENT_REQUIRED';
  end if;

  if p_status = 'incidencia' then
    for v_item in select value from jsonb_array_elements(p_incidents)
    loop
      if not ((v_item->>'fieldName') = any(v_allowed))
        or length(trim(coalesce(v_item->>'note', ''))) = 0 then
        raise exception 'DATA_UPDATE_INVALID_INCIDENT';
      end if;
      insert into public.data_update_incidents (record_id, field_name, note, reported_by)
      values (p_record_id, v_item->>'fieldName', trim(v_item->>'note'), auth.uid());
    end loop;
  end if;

  insert into public.data_update_audit (
    record_id, field_name, previous_value, next_value, changed_by
  ) values (
    p_record_id, 'identityReview', v_record.identity_review, p_status, auth.uid()
  );
  if v_record.status = 'pendiente' then
    insert into public.data_update_audit (
      record_id, field_name, previous_value, next_value, changed_by
    ) values (p_record_id, 'status', 'pendiente', 'en_proceso', auth.uid());
  end if;

  update public.data_update_records set
    identity_review = p_status,
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
    status = 'completado', current_step = 5, completed_at = now(),
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
    status = 'en_proceso', completed_at = null, version = version + 1, updated_at = now()
  where id = p_record_id returning * into v_record;
  update public.data_update_campaigns set status = 'activa', updated_at = now()
  where id = v_record.campaign_id;
  return v_record;
end;
$$;

create or replace function public.reassign_data_update_record(
  p_record_id uuid,
  p_assigned_to uuid
)
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
  if not exists (
    select 1 from public.data_update_campaign_participants participant
    where participant.campaign_id = v_record.campaign_id
      and participant.profile_id = p_assigned_to
  ) then raise exception 'DATA_UPDATE_INVALID_PARTICIPANT'; end if;
  insert into public.data_update_audit (record_id, field_name, previous_value, next_value, changed_by)
  values (p_record_id, 'assignedTo', v_record.assigned_to::text, p_assigned_to::text, auth.uid());
  update public.data_update_records set
    assigned_to = p_assigned_to, version = version + 1, updated_at = now()
  where id = p_record_id returning * into v_record;
  return v_record;
end;
$$;

revoke all on function public.create_data_update_campaign(text, integer, uuid[], jsonb, jsonb, jsonb) from public;
revoke all on function public.save_data_update_record(uuid, integer, jsonb, smallint, text) from public;
revoke all on function public.review_data_update_identity(uuid, integer, text, jsonb) from public;
revoke all on function public.complete_data_update_record(uuid, integer) from public;
revoke all on function public.reopen_data_update_record(uuid) from public;
revoke all on function public.reassign_data_update_record(uuid, uuid) from public;
grant execute on function public.create_data_update_campaign(text, integer, uuid[], jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.save_data_update_record(uuid, integer, jsonb, smallint, text) to authenticated;
grant execute on function public.review_data_update_identity(uuid, integer, text, jsonb) to authenticated;
grant execute on function public.complete_data_update_record(uuid, integer) to authenticated;
grant execute on function public.reopen_data_update_record(uuid) to authenticated;
grant execute on function public.reassign_data_update_record(uuid, uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'data-update-photos', 'data-update-photos', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists data_update_photos_insert on storage.objects;
create policy data_update_photos_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'data-update-photos' and exists (
    select 1 from public.data_update_records record
    where record.campaign_id::text = (storage.foldername(name))[1]
      and record.id::text = (storage.foldername(name))[2]
      and (record.assigned_to = auth.uid() or public.is_admin())
  )
);

drop policy if exists data_update_photos_select on storage.objects;
create policy data_update_photos_select on storage.objects
for select to authenticated using (
  bucket_id = 'data-update-photos' and exists (
    select 1 from public.data_update_records record
    where record.campaign_id::text = (storage.foldername(name))[1]
      and record.id::text = (storage.foldername(name))[2]
      and (record.assigned_to = auth.uid() or public.is_admin())
  )
);

drop policy if exists data_update_photos_delete on storage.objects;
create policy data_update_photos_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'data-update-photos' and exists (
    select 1 from public.data_update_records record
    where record.campaign_id::text = (storage.foldername(name))[1]
      and record.id::text = (storage.foldername(name))[2]
      and (record.assigned_to = auth.uid() or public.is_admin())
  )
);

-- Rollback manual, únicamente después de volver a una versión que no use el
-- módulo y respaldar registros y fotografías:
-- drop policy if exists data_update_photos_delete on storage.objects;
-- drop policy if exists data_update_photos_select on storage.objects;
-- drop policy if exists data_update_photos_insert on storage.objects;
-- delete from storage.objects where bucket_id = 'data-update-photos';
-- delete from storage.buckets where id = 'data-update-photos';
-- drop function if exists public.reassign_data_update_record(uuid, uuid);
-- drop function if exists public.reopen_data_update_record(uuid);
-- drop function if exists public.complete_data_update_record(uuid, integer);
-- drop function if exists public.review_data_update_identity(uuid, integer, text, jsonb);
-- drop function if exists public.save_data_update_record(uuid, integer, jsonb, smallint, text);
-- drop function if exists public.create_data_update_campaign(text, integer, uuid[], jsonb, jsonb, jsonb);
-- drop table if exists public.data_update_audit;
-- drop table if exists public.data_update_incidents;
-- drop table if exists public.data_update_civil_statuses;
-- drop table if exists public.data_update_transport_options;
-- drop table if exists public.data_update_records;
-- drop table if exists public.data_update_campaign_participants;
-- drop table if exists public.data_update_campaigns;
-- drop table if exists public.data_update_birth_states;
