-- Perfil General: plantillas ponderadas por puesto y evaluaciones semestrales.
-- Ciclo inicial autorizado: 01-jun-2026 a 30-nov-2026.

create table if not exists public.profile_general_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  constraint profile_general_cycles_dates_check check (starts_on <= ends_on),
  constraint profile_general_cycles_range_unique unique (starts_on, ends_on)
);

insert into public.profile_general_cycles (name, starts_on, ends_on)
values ('Junio–noviembre 2026', date '2026-06-01', date '2026-11-30')
on conflict (starts_on, ends_on) do nothing;

create table if not exists public.profile_general_templates (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  seccion text not null,
  puesto text not null,
  version integer not null check (version > 0),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  source text not null check (source in ('manual', 'import')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  constraint profile_general_template_version_unique
    unique (area, seccion, puesto, version)
);

create unique index if not exists profile_general_template_active_unique
  on public.profile_general_templates (lower(area), lower(seccion), lower(puesto))
  where status = 'active';

create table if not exists public.profile_general_criteria (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.profile_general_templates(id) on delete cascade,
  category text not null,
  description text not null,
  display_order integer not null check (display_order > 0),
  weight_bps integer not null default 0 check (weight_bps between 0 and 10000),
  is_scorable boolean not null default true,
  constraint profile_general_criterion_order_unique unique (template_id, display_order),
  constraint profile_general_criterion_weight_check
    check ((is_scorable and weight_bps > 0) or (not is_scorable and weight_bps = 0))
);

create table if not exists public.profile_general_evaluations (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.profile_general_cycles(id),
  template_id uuid not null references public.profile_general_templates(id),
  employee_num text not null,
  employee_name text not null,
  employee_area text not null,
  employee_section text not null,
  employee_position text not null,
  employee_entry_date date not null,
  employee_recruiter text,
  employee_source text not null check (employee_source in ('active', 'baja')),
  employee_exit_date date,
  employee_exit_reason text,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  score_bps integer not null default 0 check (score_bps between 0 and 10000),
  comments text,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  submitted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint profile_general_hiring_unique unique (employee_num, employee_entry_date)
);

create index if not exists profile_general_evaluations_cycle_idx
  on public.profile_general_evaluations(cycle_id, status);

create index if not exists profile_general_evaluations_recruiter_idx
  on public.profile_general_evaluations(employee_recruiter);

create table if not exists public.profile_general_evaluation_items (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.profile_general_evaluations(id) on delete cascade,
  criterion_id uuid not null references public.profile_general_criteria(id),
  category_snapshot text not null,
  description_snapshot text not null,
  weight_bps_snapshot integer not null check (weight_bps_snapshot between 0 and 10000),
  complies boolean not null,
  contribution_bps integer not null check (contribution_bps between 0 and 10000),
  constraint profile_general_evaluation_criterion_unique unique (evaluation_id, criterion_id)
);

create table if not exists public.profile_general_audit (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.profile_general_evaluations(id) on delete cascade,
  event text not null check (event in ('draft_saved', 'submitted', 'reopened')),
  actor_id uuid not null references public.profiles(id),
  occurred_at timestamptz not null default now()
);

create or replace function public.profile_general_can_evaluate()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'reclutador')
  );
$$;

grant execute on function public.profile_general_can_evaluate() to authenticated;

alter table public.profile_general_cycles enable row level security;
alter table public.profile_general_templates enable row level security;
alter table public.profile_general_criteria enable row level security;
alter table public.profile_general_evaluations enable row level security;
alter table public.profile_general_evaluation_items enable row level security;
alter table public.profile_general_audit enable row level security;

create policy "profile_general_cycles_read" on public.profile_general_cycles
  for select to authenticated using (public.profile_general_can_evaluate());
create policy "profile_general_templates_read" on public.profile_general_templates
  for select to authenticated using (public.profile_general_can_evaluate());
create policy "profile_general_criteria_read" on public.profile_general_criteria
  for select to authenticated using (public.profile_general_can_evaluate());
create policy "profile_general_evaluations_read" on public.profile_general_evaluations
  for select to authenticated using (public.profile_general_can_evaluate());
create policy "profile_general_items_read" on public.profile_general_evaluation_items
  for select to authenticated using (public.profile_general_can_evaluate());
create policy "profile_general_audit_read" on public.profile_general_audit
  for select to authenticated using (public.profile_general_can_evaluate());

grant select on public.profile_general_cycles,
  public.profile_general_templates,
  public.profile_general_criteria,
  public.profile_general_evaluations,
  public.profile_general_evaluation_items,
  public.profile_general_audit to authenticated;

create or replace function public.save_profile_general_template(
  p_area text,
  p_seccion text,
  p_puesto text,
  p_source text,
  p_criteria jsonb,
  p_activate boolean default true
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
    or nullif(trim(p_seccion), '') is null
    or nullif(trim(p_puesto), '') is null then
    raise exception 'Área, sección y puesto son obligatorios.';
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

  perform pg_advisory_xact_lock(hashtext(lower(trim(p_area)) || '|' || lower(trim(p_seccion)) || '|' || lower(trim(p_puesto))));
  select coalesce(max(version), 0) + 1 into v_version
  from public.profile_general_templates
  where lower(area) = lower(trim(p_area))
    and lower(seccion) = lower(trim(p_seccion))
    and lower(puesto) = lower(trim(p_puesto));

  if p_activate then
    update public.profile_general_templates
      set status = 'archived'
    where status = 'active'
      and lower(area) = lower(trim(p_area))
      and lower(seccion) = lower(trim(p_seccion))
      and lower(puesto) = lower(trim(p_puesto));
  end if;

  insert into public.profile_general_templates (
    area, seccion, puesto, version, status, source, created_by, activated_at
  ) values (
    trim(p_area), trim(p_seccion), trim(p_puesto), v_version,
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
      and lower(trim(seccion)) = lower(trim(p_employee->>'section'))
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

create or replace function public.reopen_profile_general_evaluation(p_evaluation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede reabrir evaluaciones.' using errcode = '42501';
  end if;
  update public.profile_general_evaluations
    set status = 'draft', submitted_at = null, submitted_by = null,
        updated_at = now(), updated_by = auth.uid()
  where id = p_evaluation_id and status = 'submitted';
  if not found then
    raise exception 'La evaluación no está enviada o no existe.';
  end if;
  insert into public.profile_general_audit (evaluation_id, event, actor_id)
  values (p_evaluation_id, 'reopened', auth.uid());
end;
$$;

grant execute on function public.save_profile_general_template(text, text, text, text, jsonb, boolean) to authenticated;
grant execute on function public.save_profile_general_evaluation(uuid, uuid, jsonb, jsonb, text, boolean) to authenticated;
grant execute on function public.reopen_profile_general_evaluation(uuid) to authenticated;
