-- Extensión aditiva del tablero personal. Aplicar después de 063.
-- Mantiene filas, identidad, fechas de creación, tipos y estados existentes.
begin;
create or replace function public.valid_kanban_checklist(items jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare entry jsonb; ids text[] := array[]::text[]; entry_id text;
begin
  if jsonb_typeof(items) is distinct from 'array' then return false; end if;
  if jsonb_array_length(items) > 50 then return false; end if;
  for entry in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(entry) is distinct from 'object'
      or jsonb_typeof(entry->'id') is distinct from 'string'
      or jsonb_typeof(entry->'text') is distinct from 'string'
      or jsonb_typeof(entry->'done') is distinct from 'boolean' then return false; end if;
    entry_id := lower(entry->>'id');
    if entry_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or entry_id = any(ids) or length(btrim(entry->>'text')) not between 1 and 240
      or (entry - 'id' - 'text' - 'done') <> '{}'::jsonb then return false; end if;
    ids := array_append(ids, entry_id);
  end loop;
  return true;
end;
$$;
revoke all on function public.valid_kanban_checklist(jsonb) from public, anon;
grant execute on function public.valid_kanban_checklist(jsonb) to authenticated, service_role;

alter table public.kanban_tasks
  add column if not exists due_date date,
  add column if not exists due_time time without time zone,
  add column if not exists checklist jsonb not null default '[]'::jsonb,
  add column if not exists position integer not null default 0,
  add column if not exists archived_at timestamptz;

-- Permite reintentar una aplicación parcial sin borrar funciones ni datos.
do $$
declare rule record;
begin
  for rule in select * from (values
    ('kanban_due_date_valid', 'due_date is null or due_date between date ''0001-01-01'' and date ''9999-12-31'''),
    ('kanban_due_time_valid', 'due_time is null or due_time < time ''24:00'''),
    ('kanban_due_time_has_date', 'due_time is null or due_date is not null'),
    ('kanban_due_minute_precision', 'due_time is null or extract(second from due_time) = 0'),
    ('kanban_checklist_valid', 'public.valid_kanban_checklist(checklist)'),
    ('kanban_position_valid', 'position >= 0'),
    ('kanban_archive_completed', 'archived_at is null or status = ''completed''')
  ) as checks(name, expression) loop
    if not exists (
      select 1 from pg_catalog.pg_constraint
      where conrelid = 'public.kanban_tasks'::regclass and conname = rule.name
    ) then
      execute format('alter table public.kanban_tasks add constraint %I check (%s)', rule.name, rule.expression);
    end if;
  end loop;
end;
$$;
-- Fechas/horas de objetivo representan America/Mexico_City, igual que el proyecto.
comment on column public.kanban_tasks.due_time is 'Hora local America/Mexico_City; opcional, requiere due_date.';
-- Posición 0 conserva el orden previo por created_at hasta el primer ordenamiento manual.
create index if not exists kanban_tasks_board_order_idx on public.kanban_tasks(owner_id, archived_at, position, created_at desc, id desc);
grant insert(due_date, due_time, checklist) on public.kanban_tasks to authenticated;
grant update(due_date, due_time, checklist, position) on public.kanban_tasks to authenticated;

-- POST evita URLs crecientes al excluir tarjetas cargadas tras reordenamientos.
-- SECURITY INVOKER conserva íntegramente la política RLS existente.
create or replace function public.list_kanban_tasks(p_archived boolean, p_excluded_ids uuid[]) returns setof public.kanban_tasks
language sql stable security invoker set search_path = '' as $$
  select task.* from public.kanban_tasks task
  where task.owner_id = auth.uid()
    and (task.archived_at is not null) = p_archived
    and task.id <> all(coalesce(p_excluded_ids, array[]::uuid[]));
$$;
revoke all on function public.list_kanban_tasks(boolean, uuid[]) from public, anon;
grant execute on function public.list_kanban_tasks(boolean, uuid[]) to authenticated;

create or replace function public.archive_kanban_task(p_id uuid, p_version integer, p_archive boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); saved public.kanban_tasks;
begin
  if actor is null or public.app_access_enabled() is not true
    or public.password_change_required() is not false
    or not exists (select 1 from public.profiles where id = actor and role in ('admin', 'reclutador')) then
    raise sqlstate '42501' using message = 'Acceso no disponible.';
  end if;
  if p_version is null or p_version < 1 or p_archive is null then
    raise sqlstate '22023' using message = 'Acción no válida.';
  end if;
  select * into saved from public.kanban_tasks where id = p_id and owner_id = actor for update;
  if not found or saved.version <> p_version then raise sqlstate '40001' using message = 'El pendiente cambió.'; end if;
  if saved.status <> 'completed' then raise sqlstate '22023' using message = 'Solo se archivan pendientes completados.'; end if;
  update public.kanban_tasks set archived_at = case when p_archive then now() else null end
    where id = p_id and owner_id = actor returning * into saved;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.archive_kanban_task(uuid, integer, boolean) from public, anon;
grant execute on function public.archive_kanban_task(uuid, integer, boolean) to authenticated;

create or replace function public.reorder_kanban_task(p_id uuid, p_status text, p_before_id uuid, p_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); saved public.kanban_tasks; changed_task public.kanban_tasks;
  ordered uuid[]; insertion integer; item_id uuid; ordinal integer := 0; changes jsonb := '[]'::jsonb;
begin
  if actor is null or public.app_access_enabled() is not true
    or public.password_change_required() is not false
    or not exists (select 1 from public.profiles where id = actor and role in ('admin', 'reclutador')) then
    raise sqlstate '42501' using message = 'Acceso no disponible.';
  end if;
  if p_status is null or p_status not in ('pending','in_progress','completed')
    or p_version is null or p_version < 1 or p_before_id = p_id then
    raise sqlstate '22023' using message = 'Orden no válido.';
  end if;
  -- Serializa reordenamientos del mismo propietario; nunca bloquea otro tablero.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  select * into saved from public.kanban_tasks where id = p_id and owner_id = actor for update;
  if not found or saved.version <> p_version or saved.archived_at is not null then
    raise sqlstate '40001' using message = 'El pendiente cambió.';
  end if;
  perform 1 from public.kanban_tasks where owner_id = actor and status = p_status and archived_at is null
    order by id for update;
  select coalesce(array_agg(id order by position, created_at desc, id desc), array[]::uuid[]) into ordered
    from public.kanban_tasks where owner_id = actor and status = p_status and archived_at is null and id <> p_id;
  if p_before_id is null then insertion := cardinality(ordered) + 1;
  else
    insertion := array_position(ordered, p_before_id);
    if insertion is null then raise sqlstate '40001' using message = 'El destino cambió.'; end if;
  end if;
  ordered := coalesce(ordered[1:insertion-1], array[]::uuid[]) || array[p_id]
    || coalesce(ordered[insertion:cardinality(ordered)], array[]::uuid[]);
  foreach item_id in array ordered loop
    ordinal := ordinal + 1;
    update public.kanban_tasks set status = p_status, position = ordinal
      where id = item_id and owner_id = actor and (status is distinct from p_status or position is distinct from ordinal)
      returning * into changed_task;
    if found then changes := changes || jsonb_build_array(jsonb_build_object('id',changed_task.id,'position',changed_task.position,'version',changed_task.version)); end if;
  end loop;
  select * into saved from public.kanban_tasks where id = p_id and owner_id = actor;
  return jsonb_build_object('task',to_jsonb(saved),'positions',changes);
end;
$$;
revoke all on function public.reorder_kanban_task(uuid, text, uuid, integer) from public, anon;
grant execute on function public.reorder_kanban_task(uuid, text, uuid, integer) to authenticated;
notify pgrst, 'reload schema';
commit;
