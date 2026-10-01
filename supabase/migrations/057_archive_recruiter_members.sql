begin;

alter table public.recruiter_directory
  add column archived_at timestamptz,
  add constraint recruiter_directory_archived_inactive check (archived_at is null or not active);

create function public.prevent_archived_recruiter_changes() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.archived_at is not null then
    raise exception 'Un integrante eliminado no se puede editar ni reactivar.';
  end if;
  return new;
end;
$$;

create trigger prevent_archived_recruiter_changes
before update on public.recruiter_directory
for each row execute function public.prevent_archived_recruiter_changes();

create function public.archive_recruiter_member(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  previous_row public.recruiter_directory;
  next_row public.recruiter_directory;
begin
  if not public.app_access_enabled() or not public.is_admin() or public.password_change_required() then
    raise sqlstate '42501' using message = 'Solo administradores pueden administrar el equipo.';
  end if;

  select * into previous_row from public.recruiter_directory where id = p_id for update;
  if not found then raise exception 'Integrante no disponible.'; end if;
  if previous_row.archived_at is not null then raise exception 'El integrante ya fue eliminado.'; end if;
  if previous_row.active then raise exception 'Primero da de baja al integrante.'; end if;
  if previous_row.profile_id is not null then
    raise exception 'No se puede eliminar a un integrante con cuenta vinculada.';
  end if;
  if exists (
    select 1 from public.recruiter_status_operations op
    where op.member_id = p_id and op.expires_at > now()
  ) then raise exception 'Espera a que termine la actualización de estado.'; end if;

  update public.recruiter_directory
    set archived_at = now(), updated_at = now()
    where id = p_id returning * into next_row;

  insert into public.recruiter_directory_audit(member_id, actor_id, previous_value, next_value)
  values (p_id, auth.uid(), to_jsonb(previous_row), to_jsonb(next_row));
end;
$$;

revoke all on function public.archive_recruiter_member(uuid) from public, anon;
grant execute on function public.archive_recruiter_member(uuid) to authenticated;

commit;
