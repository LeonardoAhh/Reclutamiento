-- Administradores pueden eliminar cualquier solicitud pendiente.
-- Conserva compatibilidad con la RPC anterior y deniega borrados directos.
begin;

create function public.delete_leave_request(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_is_admin boolean := public.is_admin() is true;
  target public.leave_requests;
begin
  if actor is null or public.can_review_leave_requests() is not true then
    raise sqlstate '42501' using message = 'No tienes acceso para eliminar solicitudes.';
  end if;
  if p_id is null then
    raise sqlstate '22023' using message = 'Selecciona la solicitud que quieres eliminar.';
  end if;
  select * into target from public.leave_requests where id = p_id for update;
  if not found then return p_id; end if;
  if not actor_is_admin and target.requester_id <> actor then
    raise sqlstate '42501' using message = 'Solo un administrador puede eliminar solicitudes de otras personas.';
  end if;
  if target.status <> 'pending' then
    raise sqlstate '22023' using message = 'Solo se pueden eliminar solicitudes pendientes.';
  end if;
  delete from public.leave_requests
    where id = p_id and status = 'pending' and (actor_is_admin or requester_id = actor);
  return p_id;
end;
$$;
revoke all on function public.delete_leave_request(uuid) from public, anon;
grant execute on function public.delete_leave_request(uuid) to authenticated;

-- Las sesiones anteriores pueden completar sus solicitudes de borrado.
create or replace function public.delete_own_leave_request(p_id uuid) returns uuid
language sql security invoker set search_path = '' as $$
  select public.delete_leave_request(p_id);
$$;
revoke all on function public.delete_own_leave_request(uuid) from public, anon;
grant execute on function public.delete_own_leave_request(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
