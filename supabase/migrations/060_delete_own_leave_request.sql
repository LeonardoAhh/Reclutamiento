-- Retiro de solicitudes propias pendientes desde la página de revisión.
-- Mantiene RLS y el bloqueo de borrados directos desde el cliente.
begin;

create function public.delete_own_leave_request(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or public.can_review_leave_requests() is not true then
    raise sqlstate '42501' using message = 'No tienes acceso para eliminar solicitudes.';
  end if;
  if p_id is null then
    raise sqlstate '22023' using message = 'Selecciona la solicitud que quieres eliminar.';
  end if;
  if exists (select 1 from public.leave_requests r where r.id = p_id and r.requester_id <> actor) then
    raise sqlstate '42501' using message = 'Solo puedes eliminar tus solicitudes pendientes.';
  end if;
  delete from public.leave_requests r
    where r.id = p_id and r.requester_id = actor and r.status = 'pending';
  -- Reintentar tras una respuesta perdida confirma el mismo resultado.
  return p_id;
end;
$$;

revoke all on function public.delete_own_leave_request(uuid) from public, anon;
grant execute on function public.delete_own_leave_request(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
