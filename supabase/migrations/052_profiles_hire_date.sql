-- =============================================================================
-- 052_profiles_hire_date.sql
-- Añade la fecha laboral de ingreso a los perfiles de usuario.
--
-- Compatibilidad:
--   - La columna es nullable para perfiles existentes y clientes anteriores.
--   - El backfill no reemplaza una fecha corregida previamente.
--   - Los usuarios pueden seguir actualizando su propio perfil, pero solo un
--     administrador puede modificar la fecha de ingreso desde una sesión.
-- =============================================================================

alter table public.profiles
  add column if not exists hire_date date;

update public.profiles
set hire_date = case username
  when 'noemi' then date '2024-05-24'
  when 'leonardo' then date '2024-06-19'
  when 'alexandra' then date '2024-08-21'
  when 'daniela' then date '2025-08-06'
end
where username in ('noemi', 'leonardo', 'alexandra', 'daniela')
  and hire_date is null;

create or replace function public.protect_profile_hire_date()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.hire_date is distinct from old.hire_date
    and auth.uid() is not null
    and not public.is_admin()
  then
    raise exception 'Solo un administrador puede modificar la fecha de ingreso.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_hire_date on public.profiles;
create trigger profiles_protect_hire_date
  before update of hire_date on public.profiles
  for each row execute function public.protect_profile_hire_date();

comment on column public.profiles.hire_date is
  'Fecha laboral de ingreso del usuario. Solo administradores pueden modificarla.';

-- Rollback no destructivo:
--   1. drop trigger profiles_protect_hire_date on public.profiles;
--   2. drop function public.protect_profile_hire_date();
--   3. conservar hire_date hasta respaldar sus valores.
-- La eliminación de la columna requiere autorización destructiva separada.
