-- Rechazar solicitudes registra la decision administrativa sin eliminar el historial.
begin;

alter table public.leave_requests
  drop constraint if exists leave_requests_recruiter_dates_excl;
alter table public.leave_requests
  add constraint leave_requests_recruiter_dates_excl
  exclude using gist (daterange(start_date, end_date, '[]') with &&)
  where (blocks_recruiter_dates and status in ('pending', 'approved'));

alter table public.leave_requests
  drop constraint if exists leave_requests_status_check;
alter table public.leave_requests
  add constraint leave_requests_status_check
  check (status in ('pending', 'approved', 'rejected'));

create function public.reject_leave_request(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  target public.leave_requests;
begin
  if actor is null or public.app_access_enabled() is not true
    or public.password_change_required() is not false or public.is_admin() is not true then
    raise sqlstate '42501' using message = 'Solo un administrador puede rechazar solicitudes.';
  end if;
  if p_id is null then
    raise sqlstate '22023' using message = 'Selecciona la solicitud que quieres rechazar.';
  end if;
  select * into target from public.leave_requests where id = p_id for update;
  if not found then
    raise sqlstate '22023' using message = 'La solicitud ya no esta disponible.';
  end if;
  if target.requester_id = actor then
    raise sqlstate '42501' using message = 'No puedes rechazar tu propia solicitud.';
  end if;
  if target.status = 'rejected' then return p_id; end if;
  if target.status <> 'pending' then
    raise sqlstate '22023' using message = 'Solo se pueden rechazar solicitudes pendientes.';
  end if;
  update public.leave_requests
    set status = 'rejected', reviewed_at = now(), reviewed_by = actor
    where id = p_id and status = 'pending';
  return p_id;
end;
$$;
revoke all on function public.reject_leave_request(uuid) from public, anon;
grant execute on function public.reject_leave_request(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
