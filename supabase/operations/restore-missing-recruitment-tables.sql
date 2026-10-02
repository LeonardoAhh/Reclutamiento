-- Recuperación puntual de las 12 tablas reportadas como faltantes el 02-oct-2026.
-- Ejecutar completo en el SQL Editor del proyecto afectado.
-- Usa las definiciones del repositorio y las políticas observadas en la consulta
-- del usuario. No recupera filas históricas ni elimina tablas/datos existentes.
-- Las tablas que ya existan se omiten: no modifica sus permisos ni sus índices.
-- custom_positions y toulouse_sheets usan el acceso authenticated observado
-- en position_settings; sus políticas anteriores no se conservan al borrar tablas.
-- Conserva todas las funciones existentes. Si falta la versión de cinco parámetros
-- de save_profile_general_template, la crea desde la migración 030.
-- Si falta otra dependencia, aborta antes de crear tablas.
-- El único dato inicial es el ciclo de Perfil General definido en la migración 029.
-- Reintento: ejecutar este mismo archivo; solo crea las tablas aún faltantes.
-- Un único bloque DO ejecuta la recuperación de forma atómica, sin tablas temporales.
-- Si falla una comprobación, se revierte el bloque completo.
-- Después de una ejecución exitosa no ejecutar DROP: podrían existir datos nuevos.

do $restore_tables$
declare restored_tables text[] := array[]::text[];
begin

declare dependency text; relation_name text;
begin
  foreach relation_name in array array['public.candidates', 'public.profiles', 'auth.users'] loop
    if to_regclass(relation_name) is null then
      raise exception 'Falta dependencia %. La recuperación se canceló.', relation_name;
    end if;
  end loop;
  foreach dependency in array array[
    'public.set_updated_at()',
    'public.set_current_timestamp_updated_at()',
    'public.is_admin()',
    'public.password_change_required()',
    'public.app_access_enabled()',
    'public.profile_general_can_evaluate()',
    'public.save_profile_general_template(text,text,text,text,jsonb,boolean)',
    'public.save_profile_general_evaluation(uuid,uuid,jsonb,jsonb,text,boolean)',
    'public.reopen_profile_general_evaluation(uuid)'
  ] loop
    if to_regprocedure(dependency) is null then
      raise exception 'Falta función %. No se modificó la base. Revisar su migración antes de continuar.', dependency;
    end if;
  end loop;
  foreach relation_name in array array['candidate_notes', 'comentarios_reclutamiento', 'custom_positions', 'toulouse_sheets', 'job_descriptions', 'ai_chat_sessions', 'profile_general_cycles', 'profile_general_templates', 'profile_general_criteria', 'profile_general_evaluations', 'profile_general_evaluation_items', 'profile_general_audit'] loop
    if to_regclass(format('public.%I', relation_name)) is null then
      restored_tables := array_append(restored_tables, relation_name);
    end if;
  end loop;
end;


-- Fuente: supabase/migrations/001_pipeline_schema.sql
create table if not exists public.candidate_notes (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references public.candidates(id) on delete cascade,
  autor         text,
  texto         text not null,
  created_at    timestamptz not null default now()
);

-- Fuente: supabase/supabase-schema.sql
create table if not exists public.comentarios_reclutamiento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  seccion TEXT NOT NULL,
  puesto TEXT NOT NULL,
  comentario TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('proceso_activo', 'entrevista', 'entrega_documentos', 'otro')),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  autor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuente: supabase/migrations/010_custom_positions.sql
create table if not exists public.custom_positions (
  id                   uuid primary key default gen_random_uuid(),
  area                 text not null,
  seccion              text not null,
  puesto               text not null,
  plantilla_autorizada integer not null default 1 check (plantilla_autorizada >= 0),
  notas                text,
  created_by           text,
  created_at           timestamptz not null default now(),
  constraint custom_positions_unique_triplet unique (area, seccion, puesto)
);

-- Fuente: supabase/migrations/012_toulouse_sheets.sql
create table if not exists public.toulouse_sheets (
  id                  uuid primary key default gen_random_uuid(),
  folio               text,
  candidato_nombre    text not null,
  puesto_solicitado   text,
  edad                integer check (edad is null or (edad >= 0 and edad < 130)),
  fecha               date not null default current_date,
  evaluador           text,
  tiempo_limite_seg   integer check (tiempo_limite_seg is null or tiempo_limite_seg > 0),
  seed                bigint not null,
  filas               integer not null check (filas > 0),
  columnas            integer not null check (columnas > 0),
  modelos             jsonb not null default '[]'::jsonb,
  total_objetivos     integer,
  created_by          text,
  created_at          timestamptz not null default now()
);

-- Fuente: supabase/migrations/024_job_descriptions.sql
create table if not exists public.job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT,
    requirements_text TEXT,
    responsibilities_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fuente: supabase/migrations/028_ai_chat_sessions.sql
create table if not exists public.ai_chat_sessions (
  id                  uuid primary key,
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title               text not null,
  selected_job_id     uuid references public.job_descriptions(id) on delete set null,
  evaluated_job_name  text,
  candidate_file_name text,
  resume_text         text not null default '',
  evaluation_result   text not null default '',
  has_compared        boolean not null default false,
  messages            jsonb not null default '[]'::jsonb
    check (jsonb_typeof(messages) = 'array'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Fuente: supabase/migrations/029_profile_general.sql
create table if not exists public.profile_general_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  constraint profile_general_cycles_dates_check check (starts_on <= ends_on),
  constraint profile_general_cycles_range_unique unique (starts_on, ends_on)
);

-- Fuente: supabase/migrations/029_profile_general.sql
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

-- Fuente: supabase/migrations/029_profile_general.sql
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

-- Fuente: supabase/migrations/029_profile_general.sql
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

-- Fuente: supabase/migrations/029_profile_general.sql
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

-- Fuente: supabase/migrations/029_profile_general.sql
create table if not exists public.profile_general_audit (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.profile_general_evaluations(id) on delete cascade,
  event text not null check (event in ('draft_saved', 'submitted', 'reopened')),
  actor_id uuid not null references public.profiles(id),
  occurred_at timestamptz not null default now()
);

-- Fuente: supabase/migrations/030_profile_general_area_position_scope.sql
-- La app usa esta firma de cinco parámetros; conservar la de seis y cualquier
-- implementación existente. Crear la faltante después de restaurar sus tablas.
begin
  if to_regprocedure('public.save_profile_general_template(text,text,text,jsonb,boolean)') is null then
    execute $function_definition$
create function public.save_profile_general_template(
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
$function_definition$;
    grant execute on function public.save_profile_general_template(text, text, text, jsonb, boolean) to authenticated;
  end if;
end;


-- Índices originales; el índice Área + Puesto corresponde a la migración 030.
-- Solo se crean sobre tablas nuevas.
begin
  if 'candidate_notes' = any(restored_tables) then
    execute $index$create index candidate_notes_candidate_idx on public.candidate_notes(candidate_id, created_at desc)$index$;
  end if;
  if 'comentarios_reclutamiento' = any(restored_tables) then
    execute $index$create index idx_comentarios_area_puesto on public.comentarios_reclutamiento(area, seccion, puesto)$index$;
  end if;
  if 'custom_positions' = any(restored_tables) then
    execute $index$create index idx_custom_positions_area on public.custom_positions(area)$index$;
  end if;
  if 'custom_positions' = any(restored_tables) then
    execute $index$create index idx_custom_positions_area_seccion on public.custom_positions(area, seccion)$index$;
  end if;
  if 'toulouse_sheets' = any(restored_tables) then
    execute $index$create index idx_toulouse_sheets_created_at on public.toulouse_sheets(created_at desc)$index$;
  end if;
  if 'ai_chat_sessions' = any(restored_tables) then
    execute $index$create index ai_chat_sessions_user_updated_idx on public.ai_chat_sessions(user_id, updated_at desc)$index$;
  end if;
  if 'profile_general_templates' = any(restored_tables) then
    execute $index$create unique index profile_general_template_active_unique on public.profile_general_templates(lower(area), lower(puesto)) where status = 'active'$index$;
  end if;
  if 'profile_general_evaluations' = any(restored_tables) then
    execute $index$create index profile_general_evaluations_cycle_idx on public.profile_general_evaluations(cycle_id, status)$index$;
  end if;
  if 'profile_general_evaluations' = any(restored_tables) then
    execute $index$create index profile_general_evaluations_recruiter_idx on public.profile_general_evaluations(employee_recruiter)$index$;
  end if;
end;


-- Triggers originales; las funciones ya existentes no se reemplazan.
begin
  if 'job_descriptions' = any(restored_tables) then
    execute 'create trigger set_job_descriptions_updated_at before update on public.job_descriptions
      for each row execute function public.set_current_timestamp_updated_at()';
  end if;
  if 'ai_chat_sessions' = any(restored_tables) then
    execute 'create trigger ai_chat_sessions_set_updated_at before update on public.ai_chat_sessions
      for each row execute function public.set_updated_at()';
  end if;
end;


-- Seguridad solo para tablas creadas por esta ejecución.
-- Perfil General: lectura mediante la función existente; escritura mediante RPC.
-- Chat: cada usuario conserva acceso únicamente a sus sesiones.
-- Descripciones: SELECT/INSERT/UPDATE; no habilita DELETE para authenticated.
-- Notas y comentarios: política authenticated de la migración 005.
-- Puestos/Toulouse: patrón authenticated observado en position_settings.
declare table_name text; command_name text; policy_name text;
begin
  foreach table_name in array restored_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
    if table_name like 'profile_general_%' then
      execute format('grant select on public.%I to authenticated', table_name);
      policy_name := case table_name
        when 'profile_general_evaluation_items' then 'profile_general_items_read'
        else table_name || '_read' end;
      execute format('create policy %I on public.%I for select to authenticated
        using (public.profile_general_can_evaluate())', policy_name, table_name);
    elsif table_name = 'ai_chat_sessions' then
      execute 'grant select, insert, update, delete on public.ai_chat_sessions to authenticated';
      foreach command_name in array array['select', 'insert', 'update', 'delete'] loop
        policy_name := 'ai_chat_sessions_' || command_name || '_own';
        if command_name = 'insert' then
          execute format('create policy %I on public.ai_chat_sessions for insert
            to authenticated with check (user_id = auth.uid())', policy_name);
        elsif command_name = 'update' then
          execute format('create policy %I on public.ai_chat_sessions for update
            to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', policy_name);
        else
          execute format('create policy %I on public.ai_chat_sessions for %s
            to authenticated using (user_id = auth.uid())', policy_name, command_name);
        end if;
      end loop;
    elsif table_name = 'job_descriptions' then
      execute 'grant select, insert, update on public.job_descriptions to authenticated';
      execute 'create policy "Allow authenticated users to read job descriptions"
        on public.job_descriptions for select to authenticated using (true)';
      execute 'create policy "Allow authenticated users to insert job descriptions"
        on public.job_descriptions for insert to authenticated with check (true)';
      execute 'create policy "Allow authenticated users to update job descriptions"
        on public.job_descriptions for update to authenticated using (true) with check (true)';
    else
      execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
      execute format('create policy %I on public.%I for all to authenticated
        using (true) with check (true)', table_name || '_authenticated', table_name);
    end if;
    execute format('create policy password_change_gate on public.%I as restrictive
      for all to authenticated using (not (select public.password_change_required()))
      with check (not (select public.password_change_required()))', table_name);
    execute format('create policy team_access_gate on public.%I as restrictive
      for all to authenticated using ((select public.app_access_enabled()))
      with check ((select public.app_access_enabled()))', table_name);
  end loop;
end;


-- Único seed: ciclo original de Perfil General (029), si se recreó su tabla.
begin
  if 'profile_general_cycles' = any(restored_tables) then
    insert into public.profile_general_cycles (name, starts_on, ends_on)
    values ('Junio–noviembre 2026', date '2026-06-01', date '2026-11-30')
    on conflict (starts_on, ends_on) do nothing;
  end if;
end;


-- Verificación mínima antes de confirmar: función, tablas y políticas restrictivas.
declare table_name text; target regclass;
begin
  if to_regprocedure('public.save_profile_general_template(text,text,text,jsonb,boolean)') is null then
    raise exception 'No se restauró la función save_profile_general_template de cinco parámetros.';
  end if;
  foreach table_name in array array['candidate_notes', 'comentarios_reclutamiento', 'custom_positions', 'toulouse_sheets', 'job_descriptions', 'ai_chat_sessions', 'profile_general_cycles', 'profile_general_templates', 'profile_general_criteria', 'profile_general_evaluations', 'profile_general_evaluation_items', 'profile_general_audit'] loop
    target := to_regclass(format('public.%I', table_name));
    if target is null then raise exception 'No se restauró la tabla %.', table_name; end if;
  end loop;
  foreach table_name in array restored_tables loop
    target := to_regclass(format('public.%I', table_name));
    if not (select relrowsecurity from pg_class where oid = target) then
      raise exception 'RLS no está habilitada en %.', table_name;
    end if;
    if (select count(*) from pg_policy where polrelid = target and not polpermissive
        and polname in ('password_change_gate', 'team_access_gate')) <> 2 then
      raise exception 'Faltan políticas restrictivas en %.', table_name;
    end if;
  end loop;
end;


notify pgrst, 'reload schema';
end;
$restore_tables$;

-- Comprobación final: las 12 deben existir y tener RLS activada.
select c.relname as tabla, c.relrowsecurity as rls_activada,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('candidate_notes', 'comentarios_reclutamiento', 'custom_positions', 'toulouse_sheets', 'job_descriptions', 'ai_chat_sessions', 'profile_general_cycles', 'profile_general_templates', 'profile_general_criteria', 'profile_general_evaluations', 'profile_general_evaluation_items', 'profile_general_audit')
order by c.relname;
