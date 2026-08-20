-- =============================================================================
-- 014_empleados_transporte.sql
-- =============================================================================
-- Agrega `ruta` y `parada` (text, nullable) a empleados para soportar control
-- de capacidad por ruta de transporte. Se reutiliza la tabla `empleados` en
-- lugar de crear una tabla nueva: cada empleado tiene a lo más una asignación
-- (ruta + parada) y se actualiza con un import JSON masivo desde /transporte.
--
-- Las columnas son nullables: empleados sin asignación quedan en `null`, lo
-- que la UI muestra como "sin transporte". No requiere backfill.
--
-- Aplicación:
--   1) En el SQL Editor de Supabase, pega este archivo y ejecuta.
--   2) "Success. No rows returned" — listo.
-- =============================================================================

alter table public.empleados
  add column if not exists ruta   text,
  add column if not exists parada text;

comment on column public.empleados.ruta is
  'Ruta de transporte asignada (texto libre). Null = sin asignación.';
comment on column public.empleados.parada is
  'Parada dentro de la ruta de transporte (texto libre). Null = sin asignación.';

-- Índice parcial para consultas tipo "capacidad por ruta/parada" en la
-- página /transporte. Solo cubre empleados con ruta asignada para mantener
-- el índice pequeño.
create index if not exists idx_empleados_transporte
  on public.empleados (ruta, parada)
  where ruta is not null;
