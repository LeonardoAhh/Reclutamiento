-- Separa asignaciones de locker por área sin inferir ubicación para datos existentes.
-- Registros previos conservan locker_area = null hasta revisión administrativa.

alter table public.data_update_records
  add column if not exists locker_area text;

alter table public.data_update_records
  drop constraint if exists data_update_records_locker_area_check;

alter table public.data_update_records
  add constraint data_update_records_locker_area_check
  check (
    locker_area is null
    or locker_area in (
      'Producción',
      'Almacén',
      'Taller de Moldes',
      'Mantenimiento',
      'Calidad'
    )
  );

create unique index if not exists data_update_records_locker_area_number_idx
  on public.data_update_records (
    campaign_id,
    locker_area,
    upper(regexp_replace(trim(coalesce(current_data->>'locker', '')), '[[:space:]]+', '', 'g'))
  )
  where locker_area is not null
    and upper(regexp_replace(trim(coalesce(current_data->>'locker', '')), '[[:space:]]+', '', 'g'))
      not in ('', 'N/A', 'NA');

create or replace function public.validate_data_update_locker_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locker text;
  v_previous_locker text;
  v_area text;
  v_previous_area text;
begin
  v_locker := upper(regexp_replace(trim(coalesce(new.current_data->>'locker', '')), '[[:space:]]+', '', 'g'));
  v_previous_locker := upper(regexp_replace(trim(coalesce(old.current_data->>'locker', '')), '[[:space:]]+', '', 'g'));
  v_area := nullif(trim(coalesce(new.locker_area, '')), '');
  v_previous_area := nullif(trim(coalesce(old.locker_area, '')), '');

  if v_locker = v_previous_locker
    and v_area is not distinct from v_previous_area then
    return new;
  end if;

  if v_locker in ('', 'N/A', 'NA') then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.campaign_id::text, 0)
  );

  if v_area is null then
    if exists (
      select 1
      from public.data_update_records record
      where record.campaign_id = new.campaign_id
        and record.id <> new.id
        and upper(regexp_replace(trim(coalesce(record.current_data->>'locker', '')), '[[:space:]]+', '', 'g')) = v_locker
    ) then
      raise exception 'DATA_UPDATE_LOCKER_ASSIGNED';
    end if;
  elsif exists (
    select 1
    from public.data_update_records record
    where record.campaign_id = new.campaign_id
      and record.id <> new.id
      and record.locker_area = v_area
      and upper(regexp_replace(trim(coalesce(record.current_data->>'locker', '')), '[[:space:]]+', '', 'g')) = v_locker
  ) then
    raise exception 'DATA_UPDATE_LOCKER_ASSIGNED';
  end if;

  return new;
end;
$$;

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
  if not public.is_admin() then
    raise exception 'DATA_UPDATE_FORBIDDEN';
  end if;

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

revoke all on function public.validate_data_update_locker_assignment() from public;
revoke all on function public.assign_data_update_locker(uuid, text, text) from public;
grant execute on function public.assign_data_update_locker(uuid, text, text) to authenticated;

-- Rollback compatible:
-- 1. Desplegar primero cliente anterior.
-- 2. Eliminar índice y función de tres parámetros.
-- 3. Restaurar validate_data_update_locker_assignment() desde migración 038.
-- 4. Conservar locker_area para no perder áreas capturadas; retirarla requiere
--    autorización destructiva separada.
