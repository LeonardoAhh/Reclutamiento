-- Asignación administrativa de lockers con validación transaccional por campaña.
-- No reescribe asignaciones existentes; la validación se aplica cuando cambia el locker.

create or replace function public.validate_data_update_locker_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locker text;
  v_previous_locker text;
begin
  v_locker := upper(regexp_replace(trim(coalesce(new.current_data->>'locker', '')), '[[:space:]]+', '', 'g'));
  v_previous_locker := upper(regexp_replace(trim(coalesce(old.current_data->>'locker', '')), '[[:space:]]+', '', 'g'));

  if v_locker = v_previous_locker
    or v_locker in ('', 'N/A', 'NA') then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.campaign_id::text, 0)
  );

  if exists (
    select 1
    from public.data_update_records record
    where record.campaign_id = new.campaign_id
      and record.id <> new.id
      and upper(regexp_replace(trim(coalesce(record.current_data->>'locker', '')), '[[:space:]]+', '', 'g')) = v_locker
  ) then
    raise exception 'DATA_UPDATE_LOCKER_ASSIGNED';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_data_update_locker_assignment
on public.data_update_records;

create trigger validate_data_update_locker_assignment
before update of current_data on public.data_update_records
for each row
execute function public.validate_data_update_locker_assignment();

create or replace function public.assign_data_update_locker(
  p_record_id uuid,
  p_locker text
)
returns public.data_update_records
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record public.data_update_records;
  v_locker text := trim(coalesce(p_locker, ''));
  v_previous_locker text;
begin
  if not public.is_admin() then
    raise exception 'DATA_UPDATE_FORBIDDEN';
  end if;

  if v_locker = '' or v_locker !~ '^[0-9]+$' then
    raise exception 'DATA_UPDATE_INVALID_LOCKER';
  end if;

  select *
  into v_record
  from public.data_update_records
  where id = p_record_id
  for update;

  if not found then
    raise exception 'DATA_UPDATE_NOT_FOUND';
  end if;

  v_previous_locker := v_record.current_data->>'locker';
  if v_previous_locker is not distinct from v_locker then
    return v_record;
  end if;

  insert into public.data_update_audit (
    record_id,
    field_name,
    previous_value,
    next_value,
    changed_by
  ) values (
    p_record_id,
    'locker',
    v_previous_locker,
    v_locker,
    auth.uid()
  );

  update public.data_update_records
  set
    current_data = jsonb_set(current_data, '{locker}', to_jsonb(v_locker), true),
    version = version + 1,
    updated_at = now()
  where id = p_record_id
  returning * into v_record;

  return v_record;
end;
$$;

revoke all on function public.validate_data_update_locker_assignment() from public;
revoke all on function public.assign_data_update_locker(uuid, text) from public;
grant execute on function public.assign_data_update_locker(uuid, text) to authenticated;

-- Rollback: eliminar el trigger y ambas funciones. Los valores de locker guardados
-- permanecen dentro de current_data, por lo que no existe pérdida de información.
