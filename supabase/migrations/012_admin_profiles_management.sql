-- =============================================================================
-- 012_admin_profiles_management.sql
-- PR settings: permitir a usuarios con role='admin' leer y actualizar el rol
-- (y el display_name) de cualquier profile, no sólo el propio.
--
-- Antes de esta migración:
--   - SELECT profiles: cualquiera autenticado (ya funcionaba).
--   - UPDATE profiles: solo el dueño (id = auth.uid()).
--
-- Después de esta migración:
--   - SELECT profiles: igual (cualquiera autenticado).
--   - UPDATE profiles: el dueño O un admin.
--   - INSERT/DELETE de auth.users sigue siendo exclusivo del backend con
--     service_role (edge function `create-user`).
--
-- También expone helper `public.is_admin()` reutilizable en futuras políticas.
-- =============================================================================

-- ── Helper: is_admin() ────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ── Policy: admin puede update cualquier profile ──────────────────────────
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Nota: la policy "profiles_update_self" (migración 005) sigue vigente; un
-- usuario sin rol admin puede seguir actualizando su propio profile.
