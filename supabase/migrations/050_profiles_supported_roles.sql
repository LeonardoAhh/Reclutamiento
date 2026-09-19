-- Restringe el contrato de perfiles a los dos roles utilizados por la app.
-- La validación previa evita eliminar o reinterpretar datos existentes.
do $$
begin
  if exists (
    select 1
    from public.profiles
    where role not in ('admin', 'reclutador')
  ) then
    raise exception 'profiles contiene roles fuera del contrato admin/reclutador';
  end if;

  alter table public.profiles
    drop constraint if exists profiles_role_check;

  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('admin', 'reclutador'));
end;
$$;

-- Rollback: restaurar profiles_role_check con el conjunto anterior de roles.
