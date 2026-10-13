begin;

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

revoke all on function public.complete_data_update_record(uuid, integer) from public;
grant execute on function public.complete_data_update_record(uuid, integer) to authenticated;

create or replace function public.sync_data_update_operation(
  p_operation_id uuid,
  p_record_id uuid,
  p_expected_version integer,
  p_kind text,
  p_payload jsonb
)
returns public.data_update_records
language plpgsql security definer set search_path = '' as $$
declare
  v_record public.data_update_records;
  v_receipt public.data_update_sync_receipts;
  v_hash text;
begin
  if auth.uid() is null then raise exception 'DATA_UPDATE_FORBIDDEN'; end if;
  perform public.enforce_required_password_change();
  if p_operation_id is null or p_expected_version is null or p_kind is null
    or p_kind not in ('save', 'review', 'complete', 'locker')
    or p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'DATA_UPDATE_INVALID_DRAFT';
  end if;
  select * into v_record from public.data_update_records where id = p_record_id for update;
  if not found then raise exception 'DATA_UPDATE_NOT_FOUND'; end if;
  if p_kind = 'locker' then
    if not public.is_admin() and not exists (
      select 1
      from public.data_update_campaign_participants participant
      where participant.campaign_id = v_record.campaign_id
        and participant.profile_id = auth.uid()
    ) then
      raise exception 'DATA_UPDATE_FORBIDDEN';
    end if;
  elsif not public.is_admin() and v_record.assigned_to is distinct from auth.uid() then
    raise exception 'DATA_UPDATE_FORBIDDEN';
  end if;

  v_hash := md5(jsonb_build_object('record', p_record_id, 'version', p_expected_version,
    'kind', p_kind, 'payload', p_payload)::text);
  select * into v_receipt from public.data_update_sync_receipts where operation_id = p_operation_id;
  if found then
    if v_receipt.user_id <> auth.uid() or v_receipt.record_id <> p_record_id or v_receipt.payload_hash <> v_hash then
      raise exception 'DATA_UPDATE_OPERATION_MISMATCH';
    end if;
    if v_record.version <> v_receipt.result_version then raise exception 'DATA_UPDATE_CONFLICT'; end if;
    return v_record;
  end if;
  if v_record.version <> p_expected_version then raise exception 'DATA_UPDATE_CONFLICT'; end if;

  case p_kind
    when 'save' then
      select * into v_record from public.save_data_update_record(p_record_id, v_record.version,
        p_payload->'data', (p_payload->>'step')::smallint, v_record.photo_path);
    when 'review' then
      select * into v_record from public.review_data_update_identity(p_record_id, v_record.version,
        p_payload->>'status', p_payload->'incidents');
    when 'complete' then
      select * into v_record from public.complete_data_update_record(p_record_id, v_record.version);
    when 'locker' then
      select * into v_record from public.assign_data_update_locker(p_record_id, p_payload->>'area', p_payload->>'locker');
  end case;
  insert into public.data_update_sync_receipts(operation_id, user_id, record_id, payload_hash, result_version)
    values (p_operation_id, auth.uid(), p_record_id, v_hash, v_record.version);
  return v_record;
end;
$$;

revoke all on function public.sync_data_update_operation(uuid, uuid, integer, text, jsonb) from public, anon;
grant execute on function public.sync_data_update_operation(uuid, uuid, integer, text, jsonb) to authenticated;

drop policy if exists data_update_photos_insert on storage.objects;
drop policy if exists data_update_photos_select on storage.objects;
drop policy if exists data_update_photos_delete on storage.objects;
drop policy if exists password_change_storage_gate on storage.objects;
create policy password_change_storage_gate on storage.objects as restrictive
for all to authenticated
using (
  bucket_id not in ('avatars', 'activity-proofs', 'transport-incident-images', 'daily-work-log-files')
  or not (select public.password_change_required())
)
with check (
  bucket_id not in ('avatars', 'activity-proofs', 'transport-incident-images', 'daily-work-log-files')
  or not (select public.password_change_required())
);

notify pgrst, 'reload schema';
commit;

-- Rollback: restore public.complete_data_update_record from migration 043 only
-- if the photo bucket is still available and photo-required completion is desired.
-- Restore public.sync_data_update_operation from migration 047 and the storage
-- policies from migrations 034/044 only if the bucket is restored.
