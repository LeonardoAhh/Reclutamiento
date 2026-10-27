-- Los reclutadores registran avances en tareas asignadas mediante estado y evidencias.
-- La definicion de la tarea y la eliminacion de evidencias quedan a cargo de administradores.
begin;

create function public.guard_recruiter_activity_fields() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is not null
    and not public.is_admin()
    and (to_jsonb(new) - array['estado', 'updated_at'])
      is distinct from (to_jsonb(old) - array['estado', 'updated_at']) then
    raise exception 'Solo puedes actualizar el estado de la actividad.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_recruiter_activity_fields() from public, anon, authenticated;

create trigger guard_recruiter_activity_fields
  before update on public.activities
  for each row execute function public.guard_recruiter_activity_fields();

drop policy if exists "Reclutadores can delete their own proofs" on public.activity_proofs;
drop policy if exists "Authenticated users can delete their own proofs" on storage.objects;

create policy "Admins can delete activity proof files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'activity-proofs' and (select public.is_admin()));

commit;
