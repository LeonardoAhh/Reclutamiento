-- Cuarta columna y portada privada opcional. Aplicar después de 064.
-- No modifica ni elimina tareas existentes.
begin;

alter table public.kanban_tasks drop constraint if exists kanban_tasks_status_check;
alter table public.kanban_tasks add constraint kanban_tasks_status_check
  check (status in ('pending', 'in_progress', 'completed', 'notes'));

alter table public.kanban_tasks add column if not exists cover_path text;
alter table public.kanban_tasks drop constraint if exists kanban_tasks_cover_path_check;
alter table public.kanban_tasks add constraint kanban_tasks_cover_path_check
  check (cover_path is null or cover_path ~ (
    '^' || owner_id::text || '/' || id::text ||
    '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  ));
grant insert(cover_path) on public.kanban_tasks to authenticated;
grant update(cover_path) on public.kanban_tasks to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kanban-covers', 'kanban-covers', false, 307200, array['image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists kanban_covers_insert on storage.objects;
create policy kanban_covers_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'kanban-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
  and public.app_access_enabled() is true
  and public.password_change_required() is false
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'reclutador'))
);
drop policy if exists kanban_covers_select on storage.objects;
create policy kanban_covers_select on storage.objects for select to authenticated
using (
  bucket_id = 'kanban-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.app_access_enabled() is true
  and public.password_change_required() is false
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'reclutador'))
);
drop policy if exists kanban_covers_delete on storage.objects;
create policy kanban_covers_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'kanban-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.app_access_enabled() is true
  and public.password_change_required() is false
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'reclutador'))
);

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
  if p_status is null or p_status not in ('pending','in_progress','completed','notes')
    or p_version is null or p_version < 1 or p_before_id = p_id then
    raise sqlstate '22023' using message = 'Orden no válido.';
  end if;
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
notify pgrst, 'reload schema';
commit;
