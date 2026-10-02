-- La autorizacion administrativa conserva la solicitud y registra la decision.
-- Los rangos de reclutadores siguen bloqueados por la exclusion existente.
begin;

alter table public.leave_requests
  drop constraint if exists leave_requests_status_check;
alter table public.leave_requests
  add constraint leave_requests_status_check
  check (status in ('pending', 'approved'));

alter table public.leave_requests
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references public.profiles(id) on delete restrict;

create function public.approve_leave_request(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  target public.leave_requests;
begin
  if actor is null or public.app_access_enabled() is not true
    or public.password_change_required() is not false or public.is_admin() is not true then
    raise sqlstate '42501' using message = 'Solo un administrador puede autorizar solicitudes.';
  end if;
  if p_id is null then
    raise sqlstate '22023' using message = 'Selecciona la solicitud que quieres autorizar.';
  end if;
  select * into target from public.leave_requests where id = p_id for update;
  if not found then
    raise sqlstate '22023' using message = 'La solicitud ya no esta disponible.';
  end if;
  if target.requester_id = actor then
    raise sqlstate '42501' using message = 'No puedes autorizar tu propia solicitud.';
  end if;
  if target.status = 'approved' then return p_id; end if;
  if target.status <> 'pending' then
    raise sqlstate '22023' using message = 'Solo se pueden autorizar solicitudes pendientes.';
  end if;
  update public.leave_requests
    set status = 'approved', reviewed_at = now(), reviewed_by = actor
    where id = p_id and status = 'pending';
  return p_id;
end;
$$;
revoke all on function public.approve_leave_request(uuid) from public, anon;
grant execute on function public.approve_leave_request(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
