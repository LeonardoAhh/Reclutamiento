-- =============================================================================
-- 008_bajas_rls.sql
-- Habilita RLS sobre `bajas` y agrega política permisiva para `authenticated`,
-- mismo patrón que `empleados`, `candidates`, etc. (ver 005_auth_profiles.sql).
--
-- Síntoma sin esto: con RLS activada en 007 vía "Run and enable RLS" pero sin
-- políticas, el cliente queda bloqueado: `select` regresa filas vacías y
-- `upsert` falla con 42501 (permission denied).
--
-- Aplicación: pegar en SQL Editor de Supabase y ejecutar.
-- =============================================================================

alter table public.bajas enable row level security;

drop policy if exists "bajas_all" on public.bajas;
drop policy if exists "bajas_authenticated" on public.bajas;

create policy "bajas_authenticated"
  on public.bajas for all
  to authenticated
  using (true)
  with check (true);
