-- Solicitudes internas: captura pendiente y lectura del coordinador.
-- No modifica incidencias, vacaciones disponibles ni formatos físicos.
begin;

create table public.leave_requests (
  id uuid primary key,
  requester_id uuid not null references public.profiles(id) on delete restrict,
  requester_name text not null check (length(trim(requester_name)) > 0),
  leave_type text not null check (leave_type in ('vacation', 'permission')),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  requested_at timestamptz not null default now(),
  requires_notice_exception boolean not null,
  blocks_recruiter_dates boolean not null,
  status text not null default 'pending' check (status = 'pending')
);
-- Rangos inclusivos: dos solicitudes de reclutadores no pueden solaparse.
-- La exclusión GiST también cubre guardados concurrentes, sin comprobación previa vulnerable.
alter table public.leave_requests add constraint leave_requests_recruiter_dates_excl
  exclude using gist (daterange(start_date, end_date, '[]') with &&)
  where (blocks_recruiter_dates);

create index leave_requests_requested_at_idx on public.leave_requests(requested_at desc, id desc);
create index leave_requests_requester_idx on public.leave_requests(requester_id);

create function public.can_review_leave_requests() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.app_access_enabled() and not public.password_change_required()
    and (public.is_admin() or exists (
      select 1 from public.recruiter_directory d
      where d.profile_id = auth.uid() and d.badge_role = 'coordinador'
        and d.active and d.archived_at is null
    ));
$$;
revoke all on function public.can_review_leave_requests() from public, anon;
grant execute on function public.can_review_leave_requests() to authenticated;

alter table public.leave_requests enable row level security;
revoke all on public.leave_requests from public, anon, authenticated;
grant select on public.leave_requests to authenticated;
grant all on public.leave_requests to service_role;
create policy leave_requests_read on public.leave_requests for select to authenticated
using ((select public.app_access_enabled()) and not (select public.password_change_required())
  and (requester_id = (select auth.uid()) or (select public.can_review_leave_requests())));

-- El servidor obtiene la identidad y el nombre: no acepta esos valores del cliente.
-- UUID del cliente permite reintentar el mismo guardado sin duplicar registros.
create function public.create_leave_request(
  p_id uuid, p_type text, p_start_date date, p_end_date date
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  today_mx date := (now() at time zone 'America/Mexico_City')::date;
  actor_name text;
  actor_is_recruiter boolean;
  saved public.leave_requests;
begin
  if not public.app_access_enabled() or public.password_change_required() then
    raise sqlstate '42501' using message = 'No tienes acceso para guardar solicitudes.';
  end if;
  if p_id is null or p_type is null or p_type not in ('vacation', 'permission')
    or p_start_date is null or p_end_date is null then
    raise sqlstate '22023' using message = 'Selecciona el tipo y las fechas de tu solicitud.';
  end if;
  select * into saved from public.leave_requests where id = p_id;
  if found then
    if saved.requester_id <> actor or saved.leave_type <> p_type
      or saved.start_date <> p_start_date or saved.end_date <> p_end_date then
      raise sqlstate '23505' using message = 'La solicitud ya existe con otros datos.';
    end if;
    return saved.id;
  end if;
  if p_start_date < today_mx then
    raise sqlstate '22023' using message = 'La fecha de inicio no puede ser anterior a hoy.';
  end if;
  if p_end_date < p_start_date then
    raise sqlstate '22023' using message = 'La fecha final debe ser igual o posterior a la inicial.';
  end if;
  select coalesce(nullif(trim(p.display_name), ''), p.username) into actor_name
    from public.profiles p where p.id = actor and p.role in ('admin', 'reclutador');
  if actor_name is null then
    raise sqlstate '42501' using message = 'La cuenta no está disponible.';
  end if;
  actor_is_recruiter := exists (select 1 from public.profiles p
    where p.id = actor and p.role = 'reclutador') and not exists (
      select 1 from public.recruiter_directory d where d.profile_id = actor
        and d.badge_role = 'coordinador' and d.active and d.archived_at is null
    );
  insert into public.leave_requests
    (id, requester_id, requester_name, leave_type, start_date, end_date, requires_notice_exception, blocks_recruiter_dates)
  values (p_id, actor, actor_name, p_type, p_start_date, p_end_date,
    p_type = 'vacation' and p_start_date < today_mx + 14, actor_is_recruiter)
  on conflict (id) do nothing;
  select * into strict saved from public.leave_requests where id = p_id;
  if saved.requester_id <> actor or saved.leave_type <> p_type
    or saved.start_date <> p_start_date or saved.end_date <> p_end_date then
    raise sqlstate '23505' using message = 'La solicitud ya existe con otros datos.';
  end if;
  return saved.id;
end;
$$;
revoke all on function public.create_leave_request(uuid, text, date, date) from public, anon;
grant execute on function public.create_leave_request(uuid, text, date, date) to authenticated;
notify pgrst, 'reload schema';
commit;
