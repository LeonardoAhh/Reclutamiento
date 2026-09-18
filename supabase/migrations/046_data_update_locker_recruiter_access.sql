-- Permite que cualquier participante de la campaña administre lockers.
-- Conserva las validaciones, la unicidad y la auditoría de la migración 045.
begin;

create or replace function public.assign_data_update_locker(
  p_record_id uuid,
  p_locker_area text,
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
  v_area text := trim(coalesce(p_locker_area, ''));
  v_previous_locker text;
  v_previous_area text;
begin
  if v_area not in (
    'Producción',
    'Almacén',
    'Taller de Moldes',
    'Mantenimiento',
    'Calidad'
  ) then
    raise exception 'DATA_UPDATE_INVALID_LOCKER_AREA';
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

  if not public.is_admin() and not exists (
    select 1
    from public.data_update_campaign_participants participant
    where participant.campaign_id = v_record.campaign_id
      and participant.profile_id = auth.uid()
  ) then
    raise exception 'DATA_UPDATE_FORBIDDEN';
  end if;

  v_previous_locker := v_record.current_data->>'locker';
  v_previous_area := v_record.locker_area;

  if v_previous_locker is not distinct from v_locker
    and v_previous_area is not distinct from v_area then
    return v_record;
  end if;

  if v_previous_area is distinct from v_area then
    insert into public.data_update_audit (
      record_id,
      field_name,
      previous_value,
      next_value,
      changed_by
    ) values (
      p_record_id,
      'lockerArea',
      v_previous_area,
      v_area,
      auth.uid()
    );
  end if;

  if v_previous_locker is distinct from v_locker then
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
  end if;

  update public.data_update_records
  set
    locker_area = v_area,
    current_data = jsonb_set(current_data, '{locker}', to_jsonb(v_locker), true),
    version = version + 1,
    updated_at = now()
  where id = p_record_id
  returning * into v_record;

  return v_record;
end;
$$;

revoke all on function public.assign_data_update_locker(uuid, text, text) from public;
grant execute on function public.assign_data_update_locker(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;

-- Rollback: restaurar assign_data_update_locker(uuid, text, text) desde 045.
