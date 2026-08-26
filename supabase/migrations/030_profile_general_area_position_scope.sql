begin;

-- Una plantilla corresponde al perfil del puesto dentro de un área. La sección
-- se conserva únicamente en las evaluaciones como dato histórico del empleado.
with active_templates as (
  select
    id,
    row_number() over (
      partition by lower(trim(area)), lower(trim(puesto))
      order by activated_at desc nulls last, created_at desc, id desc
    ) as active_order
  from public.profile_general_templates
  where status = 'active'
)
update public.profile_general_templates as template
set status = 'archived'
from active_templates
where template.id = active_templates.id
  and active_templates.active_order > 1;

drop index if exists public.profile_general_template_active_unique;

create unique index profile_general_template_active_unique
  on public.profile_general_templates (lower(area), lower(puesto))
  where status = 'active';

create or replace function public.save_profile_general_template(
  p_area text,
  p_puesto text,
  p_source text,
  p_criteria jsonb,
  p_activate boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template_id uuid;
  v_version integer;
  v_weight integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede administrar plantillas.' using errcode = '42501';
  end if;
  if nullif(trim(p_area), '') is null
    or nullif(trim(p_puesto), '') is null then
    raise exception 'Área y puesto son obligatorios.';
  end if;
  if p_source not in ('manual', 'import') then
    raise exception 'Origen de plantilla inválido.';
  end if;
  if jsonb_typeof(p_criteria) <> 'array' or jsonb_array_length(p_criteria) = 0 then
    raise exception 'La plantilla requiere al menos un criterio.';
  end if;

  select coalesce(sum((item->>'weight_bps')::integer), 0)
    into v_weight
  from jsonb_array_elements(p_criteria) item
  where coalesce((item->>'is_scorable')::boolean, true);

  if v_weight <> 10000 then
    raise exception 'Los criterios evaluables deben sumar 100%%.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_criteria) item
    where nullif(trim(item->>'description'), '') is null
      or ((not coalesce((item->>'is_scorable')::boolean, true))
          and coalesce((item->>'weight_bps')::integer, 0) <> 0)
  ) then
    raise exception 'Hay criterios incompletos o pesos inválidos.';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(lower(trim(p_area)) || '|' || lower(trim(p_puesto)))
  );

  select coalesce(max(version), 0) + 1 into v_version
  from public.profile_general_templates
  where lower(area) = lower(trim(p_area))
    and lower(puesto) = lower(trim(p_puesto));

  if p_activate then
    update public.profile_general_templates
      set status = 'archived'
    where status = 'active'
      and lower(area) = lower(trim(p_area))
      and lower(puesto) = lower(trim(p_puesto));
  end if;

  insert into public.profile_general_templates (
    area, seccion, puesto, version, status, source, created_by, activated_at
  ) values (
    trim(p_area), '', trim(p_puesto), v_version,
    case when p_activate then 'active' else 'draft' end,
    p_source, auth.uid(), case when p_activate then now() else null end
  ) returning id into v_template_id;

  insert into public.profile_general_criteria (
    template_id, category, description, display_order, weight_bps, is_scorable
  )
  select
    v_template_id,
    coalesce(nullif(trim(item->>'category'), ''), 'General'),
    trim(item->>'description'),
    ordinality::integer,
    coalesce((item->>'weight_bps')::integer, 0),
    coalesce((item->>'is_scorable')::boolean, true)
  from jsonb_array_elements(p_criteria) with ordinality as source(item, ordinality);

  return v_template_id;
end;
$$;

-- Compatibilidad con clientes que aún envíen sección: el valor se ignora y
-- la misma regla Área + Puesto evita que vuelvan a generarse duplicados.
create or replace function public.save_profile_general_template(
  p_area text,
  p_seccion text,
  p_puesto text,
  p_source text,
  p_criteria jsonb,
  p_activate boolean default true
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.save_profile_general_template(
    p_area,
    p_puesto,
    p_source,
    p_criteria,
    p_activate
  );
$$;

create or replace function public.save_profile_general_evaluation(
  p_cycle_id uuid,
  p_template_id uuid,
  p_employee jsonb,
  p_responses jsonb,
  p_comments text,
  p_submit boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evaluation public.profile_general_evaluations%rowtype;
  v_evaluation_id uuid;
  v_response_count integer;
  v_criterion_count integer;
  v_score integer;
  v_entry_date date;
  v_has_evaluation boolean := false;
begin
  if not public.profile_general_can_evaluate() then
    raise exception 'No tienes permiso para capturar evaluaciones.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_employee) <> 'object' or jsonb_typeof(p_responses) <> 'array' then
    raise exception 'Datos de evaluación inválidos.';
  end if;

  v_entry_date := (p_employee->>'entry_date')::date;
  if not exists (
    select 1 from public.profile_general_cycles
    where id = p_cycle_id and v_entry_date between starts_on and ends_on
  ) then
    raise exception 'El ingreso no pertenece al ciclo seleccionado.';
  end if;
  if not exists (
    select 1 from public.profile_general_templates
    where id = p_template_id
      and status in ('active', 'archived')
      and lower(trim(area)) = lower(trim(p_employee->>'area'))
      and lower(trim(puesto)) = lower(trim(p_employee->>'position'))
  ) then
    raise exception 'La plantilla no corresponde al puesto del empleado.';
  end if;

  select * into v_evaluation
  from public.profile_general_evaluations
  where employee_num = trim(p_employee->>'num') and employee_entry_date = v_entry_date
  for update;
  v_has_evaluation := found;

  if v_has_evaluation and v_evaluation.status = 'submitted' then
    raise exception 'La evaluación enviada debe reabrirse antes de corregirla.';
  end if;

  select count(*) into v_criterion_count
  from public.profile_general_criteria
  where template_id = p_template_id and is_scorable;

  select count(distinct criterion.id) into v_response_count
  from jsonb_array_elements(p_responses) response
  join public.profile_general_criteria criterion
    on criterion.id = (response->>'criterion_id')::uuid
   and criterion.template_id = p_template_id
   and criterion.is_scorable
  where jsonb_typeof(response->'complies') = 'boolean';

  if p_submit and v_response_count <> v_criterion_count then
    raise exception 'Responde todos los criterios antes de enviar.';
  end if;

  if v_has_evaluation then
    update public.profile_general_evaluations set
      cycle_id = p_cycle_id,
      template_id = p_template_id,
      employee_name = trim(p_employee->>'name'),
      employee_area = trim(p_employee->>'area'),
      employee_section = trim(p_employee->>'section'),
      employee_position = trim(p_employee->>'position'),
      employee_recruiter = nullif(trim(p_employee->>'recruiter'), ''),
      employee_source = p_employee->>'source',
      employee_exit_date = nullif(p_employee->>'exit_date', '')::date,
      employee_exit_reason = nullif(trim(p_employee->>'exit_reason'), ''),
      status = case when p_submit then 'submitted' else 'draft' end,
      comments = nullif(trim(p_comments), ''),
      updated_by = auth.uid(),
      updated_at = now(),
      submitted_by = case when p_submit then auth.uid() else null end,
      submitted_at = case when p_submit then now() else null end
    where id = v_evaluation.id
    returning id into v_evaluation_id;
  else
    insert into public.profile_general_evaluations (
      cycle_id, template_id, employee_num, employee_name, employee_area,
      employee_section, employee_position, employee_entry_date,
      employee_recruiter, employee_source, employee_exit_date,
      employee_exit_reason, status, comments, created_by, updated_by,
      submitted_by, submitted_at
    ) values (
      p_cycle_id, p_template_id, trim(p_employee->>'num'), trim(p_employee->>'name'),
      trim(p_employee->>'area'), trim(p_employee->>'section'), trim(p_employee->>'position'),
      v_entry_date, nullif(trim(p_employee->>'recruiter'), ''), p_employee->>'source',
      nullif(p_employee->>'exit_date', '')::date, nullif(trim(p_employee->>'exit_reason'), ''),
      case when p_submit then 'submitted' else 'draft' end,
      nullif(trim(p_comments), ''), auth.uid(), auth.uid(),
      case when p_submit then auth.uid() else null end,
      case when p_submit then now() else null end
    ) returning id into v_evaluation_id;
  end if;

  delete from public.profile_general_evaluation_items where evaluation_id = v_evaluation_id;
  insert into public.profile_general_evaluation_items (
    evaluation_id, criterion_id, category_snapshot, description_snapshot,
    weight_bps_snapshot, complies, contribution_bps
  )
  select
    v_evaluation_id, criterion.id, criterion.category, criterion.description,
    criterion.weight_bps, (response->>'complies')::boolean,
    case when (response->>'complies')::boolean then criterion.weight_bps else 0 end
  from jsonb_array_elements(p_responses) response
  join public.profile_general_criteria criterion
    on criterion.id = (response->>'criterion_id')::uuid
   and criterion.template_id = p_template_id
   and criterion.is_scorable
  where jsonb_typeof(response->'complies') = 'boolean';

  select coalesce(sum(contribution_bps), 0) into v_score
  from public.profile_general_evaluation_items where evaluation_id = v_evaluation_id;
  update public.profile_general_evaluations set score_bps = v_score
  where id = v_evaluation_id;

  insert into public.profile_general_audit (evaluation_id, event, actor_id)
  values (v_evaluation_id, case when p_submit then 'submitted' else 'draft_saved' end, auth.uid());

  return v_evaluation_id;
end;
$$;

grant execute on function public.save_profile_general_template(text, text, text, jsonb, boolean) to authenticated;

commit;
