-- Actualiza únicamente el turno de registros de la campaña seleccionada.
-- La transacción completa se revierte ante datos inválidos, faltantes o versiones obsoletas.
begin;

create or replace function public.bulk_update_data_update_shifts(
  p_campaign_id uuid,
  p_updates jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_record public.data_update_records%rowtype;
  v_employee_number text;
  v_shift text;
  v_expected_version text;
  v_seen text[] := array[]::text[];
  v_updated integer := 0;
begin
  if not public.is_admin() then
    raise exception 'DATA_UPDATE_FORBIDDEN';
  end if;
  if p_campaign_id is null or not exists (
    select 1 from public.data_update_campaigns where id = p_campaign_id
  ) then
    raise exception 'DATA_UPDATE_NOT_FOUND';
  end if;
  if jsonb_typeof(p_updates) is distinct from 'array' then
    raise exception 'DATA_UPDATE_SHIFT_INVALID_INPUT';
  end if;
  if jsonb_array_length(p_updates) = 0 then
    raise exception 'DATA_UPDATE_SHIFT_INVALID_INPUT';
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_updates)
    order by value->>'employeeNumber'
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or jsonb_typeof(v_item->'employeeNumber') is distinct from 'string'
      or jsonb_typeof(v_item->'shift') is distinct from 'string'
      or jsonb_typeof(v_item->'expectedVersion') is distinct from 'number' then
      raise exception 'DATA_UPDATE_SHIFT_INVALID_INPUT';
    end if;

    v_employee_number := trim(v_item->>'employeeNumber');
    v_shift := trim(v_item->>'shift');
    v_expected_version := v_item->>'expectedVersion';
    if v_employee_number = '' or v_shift = ''
      or v_expected_version !~ '^[1-9][0-9]*$' then
      raise exception 'DATA_UPDATE_SHIFT_INVALID_INPUT';
    end if;
    if v_employee_number = any(v_seen) then
      raise exception 'DATA_UPDATE_SHIFT_DUPLICATE';
    end if;
    v_seen := array_append(v_seen, v_employee_number);

    select * into v_record
    from public.data_update_records
    where campaign_id = p_campaign_id and employee_number = v_employee_number
    for update;
    if not found then
      raise exception 'DATA_UPDATE_SHIFT_NOT_FOUND';
    end if;
    if v_record.version::text <> v_expected_version then
      raise exception 'DATA_UPDATE_CONFLICT';
    end if;

    if v_record.shift is distinct from v_shift then
      insert into public.data_update_audit (
        record_id, field_name, previous_value, next_value, changed_by
      ) values (
        v_record.id, 'shift', v_record.shift, v_shift, auth.uid()
      );

      update public.data_update_records
      set shift = v_shift, version = version + 1, updated_at = now()
      where id = v_record.id;
      v_updated := v_updated + 1;
    end if;
  end loop;

  return v_updated;
end;
$$;

revoke all on function public.bulk_update_data_update_shifts(uuid, jsonb) from public;
grant execute on function public.bulk_update_data_update_shifts(uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;

-- Rollback: drop function if exists public.bulk_update_data_update_shifts(uuid, jsonb);
