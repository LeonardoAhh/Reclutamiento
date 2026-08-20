-- =============================================================================
-- 005_auth_profiles.sql
-- PR auth: login con usuario + password vía Supabase Auth.
--
-- Decisión de diseño: la app pide "usuario", no email. Internamente cada
-- usuario se mapea a un email sintético `${usuario}@reclutamiento.local` para
-- aprovechar Supabase Auth nativo (sesiones, refresh tokens, RLS). El email
-- sintético nunca se le muestra al usuario final.
--
-- Esta migración:
--   1) Crea la tabla `profiles` linkeada 1:1 con `auth.users(id)`.
--   2) Trigger `on_auth_user_created` que auto-crea el profile al registrar
--      un usuario (extrae el username del email).
--   3) Endurece las políticas RLS de TODAS las tablas existentes para que
--      solo usuarios autenticados puedan leer/escribir. Sin esto el login
--      sería decorativo (`anon` podría seguir leyendo todo via la URL).
--
-- DESPUÉS DE CORRER ESTA MIGRACIÓN, NECESITAS CREAR EL PRIMER USUARIO ADMIN:
--   1. Abre tu proyecto en https://app.supabase.com
--   2. Authentication → Users → "Add user" → "Create new user"
--   3. Email: `<tu-usuario>@reclutamiento.local` (ej. `leonardo@reclutamiento.local`)
--   4. Password: <elige uno fuerte>
--   5. ✅ Marca "Auto Confirm User" (para saltar email confirmation)
--   6. Click "Create user"
--   7. El trigger crea el row en `profiles` automáticamente.
--   8. (Opcional) En SQL Editor: `update profiles set role = 'admin' where username = '<tu-usuario>';`
-- =============================================================================

-- ── Tabla profiles ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  display_name    text,
  role            text not null default 'reclutador'
    check (role in ('admin', 'reclutador', 'gerente', 'auditor')),
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz
);

create index if not exists profiles_username_idx on public.profiles(username);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Los usuarios solo pueden modificar su propio profile (display_name, etc.).
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── Trigger: crear profile cuando se registra un usuario ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(split_part(new.email, '@', 1), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Tighten RLS en tablas existentes ──────────────────────────────────────
-- Las migraciones 001–004 dejaron políticas `using (true)` para `anon`. Las
-- reemplazamos para que solo `authenticated` pueda leer/escribir.

-- empleados
drop policy if exists "Allow all operations" on public.empleados;
drop policy if exists "empleados_all" on public.empleados;
drop policy if exists "empleados_authenticated" on public.empleados;
create policy "empleados_authenticated"
  on public.empleados for all
  to authenticated
  using (true)
  with check (true);

-- comentarios_reclutamiento
drop policy if exists "Allow all operations" on public.comentarios_reclutamiento;
drop policy if exists "comentarios_reclutamiento_all" on public.comentarios_reclutamiento;
drop policy if exists "comentarios_reclutamiento_authenticated" on public.comentarios_reclutamiento;
create policy "comentarios_reclutamiento_authenticated"
  on public.comentarios_reclutamiento for all
  to authenticated
  using (true)
  with check (true);

-- candidates
drop policy if exists "candidates_all" on public.candidates;
drop policy if exists "candidates_authenticated" on public.candidates;
create policy "candidates_authenticated"
  on public.candidates for all
  to authenticated
  using (true)
  with check (true);

-- candidate_notes
drop policy if exists "candidate_notes_all" on public.candidate_notes;
drop policy if exists "candidate_notes_authenticated" on public.candidate_notes;
create policy "candidate_notes_authenticated"
  on public.candidate_notes for all
  to authenticated
  using (true)
  with check (true);

-- vacancy_requests
drop policy if exists "vacancy_requests_all" on public.vacancy_requests;
drop policy if exists "vacancy_requests_authenticated" on public.vacancy_requests;
create policy "vacancy_requests_authenticated"
  on public.vacancy_requests for all
  to authenticated
  using (true)
  with check (true);

-- vacancy_status_history
drop policy if exists "vacancy_status_history_all" on public.vacancy_status_history;
drop policy if exists "vacancy_status_history_authenticated" on public.vacancy_status_history;
create policy "vacancy_status_history_authenticated"
  on public.vacancy_status_history for all
  to authenticated
  using (true)
  with check (true);
