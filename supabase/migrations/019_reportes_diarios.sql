-- =============================================================================
-- 019_reportes_diarios.sql
-- Tabla `reportes_diarios`: histórico mensual del Reporte Diario de asistencia.
--
-- Un registro por mes (`mes` UNIQUE) → el guardado usa UPSERT con
-- onConflict = "mes", de modo que re-subir el mismo mes actualiza su registro
-- y la sección "Reportes guardados" / "Comparativa mensual" muestran el
-- historial de todos los meses.
--
-- Consumido por: src/hooks/useReporteDiario.ts
--   - fetchSummaries / fetchComparison  -> SELECT columnas resumen
--   - fetchByMes / fetchByMesList       -> SELECT * (incluye `data` jsonb)
--   - saveReport                        -> UPSERT (onConflict mes)
--   - deleteReport                      -> DELETE por id
--
-- Aplicación: pegar este archivo en el SQL Editor de Supabase y ejecutar.
-- =============================================================================

create table if not exists public.reportes_diarios (
  id                uuid primary key default gen_random_uuid(),
  mes               text not null unique,                 -- formato YYYY-MM
  data              jsonb not null default '[]'::jsonb,   -- filas crudas del mes
  total_empleados   integer not null default 0,
  total_incidencias integer not null default 0,
  tasa_asistencia   numeric(6,2) not null default 0,      -- %
  dias_disponibles  integer not null default 0,
  total_ausentismo  integer not null default 0,
  pct_ausentismo    numeric(6,2) not null default 0,      -- %
  uploaded_by       uuid references auth.users(id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_reportes_diarios_mes on public.reportes_diarios(mes);
create index if not exists idx_reportes_diarios_created_at on public.reportes_diarios(created_at);

-- updated_at automático en cada UPDATE (la app también lo envía, esto es respaldo)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reportes_diarios_updated_at on public.reportes_diarios;
create trigger trg_reportes_diarios_updated_at
  before update on public.reportes_diarios
  for each row execute function public.set_updated_at();

-- RLS: mismo patrón permisivo que `empleados`, `bajas`, `candidates` (ver
-- 005_auth_profiles.sql / 008_bajas_rls.sql). Usuarios autenticados pueden todo.
alter table public.reportes_diarios enable row level security;

drop policy if exists "reportes_diarios_all" on public.reportes_diarios;
drop policy if exists "reportes_diarios_authenticated" on public.reportes_diarios;

create policy "reportes_diarios_authenticated"
  on public.reportes_diarios for all
  to authenticated
  using (true)
  with check (true);
