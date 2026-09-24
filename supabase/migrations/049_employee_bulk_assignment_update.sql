-- Actualiza puesto, categoría y turno de empleados existentes de forma atómica.
begin;

create or replace function public.bulk_update_employee_assignments(p_updates jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item jsonb;
  v_employee_number text;
  v_position text;
  v_category text;
  v_shift text;
  v_seen text[] := array[]::text[];
  v_updated_numbers jsonb := '[]'::jsonb;
  v_not_found jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_updates) is distinct from 'array'
    or jsonb_array_length(p_updates) = 0 then
    raise exception 'EMPLOYEE_BULK_INVALID_INPUT';
  end if;

  for v_item in select value from jsonb_array_elements(p_updates)
  loop
    if jsonb_typeof(v_item) is distinct from 'object' then
      raise exception 'EMPLOYEE_BULK_INVALID_INPUT';
    end if;

    v_employee_number := trim(coalesce(v_item->>'num_empleado', ''));
    v_position := trim(coalesce(v_item->>'puesto', ''));
    v_category := trim(coalesce(v_item->>'categoria', ''));
    v_shift := trim(coalesce(v_item->>'turno', ''));

    if v_employee_number = '' or v_position = '' or v_category = '' or v_shift = '' then
      raise exception 'EMPLOYEE_BULK_REQUIRED_FIELDS';
    end if;
    if v_employee_number = any(v_seen) then
      raise exception 'EMPLOYEE_BULK_DUPLICATE';
    end if;
    v_seen := array_append(v_seen, v_employee_number);

    update public.empleados
    set puesto = v_position,
        categoria = v_category,
        turno = v_shift
    where num_empleado = v_employee_number;

    if found then
      v_updated_numbers := v_updated_numbers || jsonb_build_array(v_employee_number);
    else
      v_not_found := v_not_found || jsonb_build_array(v_employee_number);
    end if;
  end loop;

  return jsonb_build_object(
    'updated', jsonb_array_length(v_updated_numbers),
    'updated_employee_numbers', v_updated_numbers,
    'not_found', v_not_found
  );
end;
$$;

revoke all on function public.bulk_update_employee_assignments(jsonb) from public;
grant execute on function public.bulk_update_employee_assignments(jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;

-- Rollback: drop function if exists public.bulk_update_employee_assignments(jsonb);
