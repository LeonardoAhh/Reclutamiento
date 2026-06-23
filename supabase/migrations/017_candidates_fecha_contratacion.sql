-- =============================================================================
-- 017_candidates_fecha_contratacion.sql
-- =============================================================================
-- Agrega `fecha_contratacion` (date) a candidates para rastrear cuándo se
-- contrató al candidato (status -> 'contratado'). Permite filtrar el reporte
-- de WhatsApp a "contratados de la semana en curso" sin depender de
-- `updated_at` (timestamptz con drift de TZ).
--
-- Tipo `date` (no timestamptz) → la fecha de contratación es una fecha civil
-- mexicana, no un instante UTC. Coincide con `empleados.fecha_ingreso`, que es
-- el día capturado al convertir el candidato en empleado.
-- =============================================================================

alter table public.candidates
  add column if not exists fecha_contratacion date;

comment on column public.candidates.fecha_contratacion is
  'Fecha (civil MX) en la que el candidato fue contratado (status = contratado). Null = aún no contratado. Coincide con empleados.fecha_ingreso del empleado generado.';

-- Backfill aproximado para contratados existentes: usamos la fecha de la
-- última actualización (cuando se marcó contratado) evaluada en TZ MX. Solo
-- afecta filas ya contratadas sin fecha; las futuras la reciben en el hire.
update public.candidates
set fecha_contratacion = (updated_at at time zone 'America/Mexico_City')::date
where status = 'contratado'
  and fecha_contratacion is null
  and updated_at is not null;

-- Índice para consultas tipo "WHERE fecha_contratacion between ... and ...".
create index if not exists candidates_fecha_contratacion_idx
  on public.candidates(fecha_contratacion)
  where fecha_contratacion is not null;
