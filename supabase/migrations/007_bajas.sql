-- =============================================================================
-- 007_bajas.sql
-- Tabla `bajas`: histórico de empleados que dejaron la planta. Vive aparte de
-- `empleados` para no perder el dato al eliminar al empleado activo.
--
-- Aplicación: pegar este archivo en el SQL Editor de Supabase y ejecutar.
-- =============================================================================

create table if not exists public.bajas (
  id              uuid primary key default gen_random_uuid(),
  num_empleado    text not null unique,
  nombre          text not null,
  area            text not null,
  seccion         text not null,
  puesto          text not null,
  fecha_ingreso   date,
  fecha_baja      date not null,
  tipo_baja       text,
  motivo_baja     text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_bajas_fecha_baja on public.bajas(fecha_baja);
create index if not exists idx_bajas_area_puesto on public.bajas(area, puesto);

-- RLS: deshabilitada por defecto para mantener compatibilidad con anon key.
-- Cuando se endurezcan políticas (PR auth), seguir el mismo patrón que `empleados`.
