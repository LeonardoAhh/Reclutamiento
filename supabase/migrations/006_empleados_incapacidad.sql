-- =============================================================================
-- 006_empleados_incapacidad.sql
-- Marca de incapacidad por empleado.
--
-- Aplicación:
--   1) En el SQL Editor de Supabase, pega este archivo y ejecuta.
--   2) Las columnas se agregan con DEFAULT seguro, no requiere backfill.
-- =============================================================================

alter table public.empleados
  add column if not exists en_incapacidad   boolean      not null default false,
  add column if not exists incapacidad_hasta date;

-- Índice para acelerar conteos por área / sección cuando se filtra a quienes
-- están en incapacidad. Es chico (parcial) y solo cubre los registros activos.
create index if not exists idx_empleados_incapacidad
  on public.empleados (area, seccion)
  where en_incapacidad = true;
