-- Expand-only: deploy before the offline client. Existing online RPC signatures remain valid.
begin;

create table if not exists public.data_update_sync_receipts (
  operation_id uuid primary key,
  user_id uuid not null references auth.users(id),
  record_id uuid not null references public.data_update_records(id) on delete cascade,
  payload_hash text not null,
  result_version integer not null,
  created_at timestamptz not null default now()
);
alter table public.data_update_sync_receipts enable row level security;
revoke all on public.data_update_sync_receipts from anon, authenticated;

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
    or p_kind not in ('save', 'review', 'photo', 'complete', 'locker')
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
    -- A lost acknowledgement must not silently rebase later edits over another device.
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
    when 'photo' then
      if not exists (select 1 from storage.objects where bucket_id = 'data-update-photos' and name = p_payload->>'path') then
        raise exception 'DATA_UPDATE_INVALID_PHOTO';
      end if;
      select * into v_record from public.save_data_update_record(p_record_id, v_record.version,
        v_record.current_data, (p_payload->>'step')::smallint, p_payload->>'path');
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
notify pgrst, 'reload schema';
commit;

-- Rollback: restore the previous client first. Keep this additive RPC and receipts
-- while devices still have pending operations. Never delete receipts during retries.
-- No existing data, RLS policy, role, or RPC is replaced by this migration.
