begin;

-- Permite retirar integrantes inactivos con cuenta vinculada sin borrar Auth ni el historial.
create or replace function public.archive_recruiter_member(p_id uuid) returns void
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
  if previous_row.profile_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = previous_row.profile_id and p.role = 'admin'
  ) then raise exception 'No se puede eliminar esta cuenta.'; end if;
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

-- La reserva también comprueba el retiro bajo bloqueo para evitar reactivaciones concurrentes.
create or replace function public.acquire_recruiter_status_operation(p_id uuid, p_actor uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  operation uuid;
  archived timestamptz;
begin
  if not exists (select 1 from public.profiles p where p.id = p_actor and p.role = 'admin')
    or exists (select 1 from public.recruiter_directory d where d.profile_id = p_actor and not d.active) then
    raise sqlstate '42501' using message = 'Acceso denegado.';
  end if;
  select archived_at into archived from public.recruiter_directory where id = p_id for update;
  if not found then raise exception 'Integrante no disponible.'; end if;
  if archived is not null then raise exception 'El integrante ya fue eliminado de Equipo.'; end if;
  insert into public.recruiter_status_operations values (p_id, gen_random_uuid(), now() + interval '5 minutes')
    on conflict (member_id) do update set operation_id = excluded.operation_id, expires_at = excluded.expires_at
    where public.recruiter_status_operations.expires_at <= now()
    returning operation_id into operation;
  if operation is null then raise exception 'Ya se está actualizando este integrante.'; end if;
  return operation;
end;
$$;

revoke all on function public.archive_recruiter_member(uuid) from public, anon;
grant execute on function public.archive_recruiter_member(uuid) to authenticated;
revoke all on function public.acquire_recruiter_status_operation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.acquire_recruiter_status_operation(uuid, uuid) to service_role;

commit;
