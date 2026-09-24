-- =============================================================================
-- 013_candidates_fecha_cita.sql
-- =============================================================================
-- Agrega `fecha_cita` (date) a candidates para rastrear cuándo está citado
-- el candidato para entrevista / siguiente paso. Permite filtrar "citados del
-- día en curso" en el KPI sin depender de status ni de timestamps con TZ.
--
-- Tipo `date` (no timestamptz) → evita drift por timezone: la fecha agendada
-- es una fecha civil mexicana, no un instante UTC.
-- =============================================================================

alter table public.candidates
  add column if not exists fecha_cita date;

comment on column public.candidates.fecha_cita is
  'Fecha (civil MX) en la que el candidato está citado para entrevista / siguiente paso. Null = sin cita programada.';

-- Índice para consultas tipo "WHERE fecha_cita = current_date"
-- (el KPI "Citados hoy" filtra por igualdad).
create index if not exists candidates_fecha_cita_idx
  on public.candidates(fecha_cita);
