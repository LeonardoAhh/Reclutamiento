-- La actividad completa de usuarios es información administrativa.
-- Cada usuario conserva lectura de su propio perfil; solo administradores
-- pueden listar los perfiles del resto del equipo.
drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_select_self_or_admin on public.profiles;

create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

-- Los cambios de profiles alimentan el modal administrativo en tiempo real.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end
$$;
