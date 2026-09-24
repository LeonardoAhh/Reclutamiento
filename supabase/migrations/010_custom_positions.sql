-- =============================================================================
-- 010_custom_positions.sql
-- Tabla `custom_positions`: puestos creados desde la UI (ej. al promover a un
-- empleado a un puesto que aún no está en la PLANTILLA_AUTORIZADA estática).
-- Se unen en runtime con la lista estática para alimentar los selectores de
-- área/sección/puesto en Dashboard, Vacantes, Pipeline, CandidateModal, etc.
--
-- Aplicación: pegar este archivo en el SQL Editor de Supabase y ejecutar.
-- =============================================================================

create table if not exists public.custom_positions (
  id                   uuid primary key default gen_random_uuid(),
  area                 text not null,
  seccion              text not null,
  puesto               text not null,
  plantilla_autorizada integer not null default 1 check (plantilla_autorizada >= 0),
  notas                text,
  created_by           text,
  created_at           timestamptz not null default now(),
  constraint custom_positions_unique_triplet unique (area, seccion, puesto)
);

create index if not exists idx_custom_positions_area on public.custom_positions(area);
create index if not exists idx_custom_positions_area_seccion
  on public.custom_positions(area, seccion);

-- RLS deshabilitada por defecto para mantener compatibilidad con anon key.
-- Cuando se endurezcan políticas, replicar el patrón de `empleados`.
