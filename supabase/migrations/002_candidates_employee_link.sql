-- Migration 002 — Link candidates to the employee they became.
--
-- Cuando un candidato pasa a "contratado" y se le crea un registro en
-- `empleados`, queremos guardar el `num_empleado` resultante en el
-- candidato para:
--   • Saber que ya fue convertido (no volver a contratar al mismo).
--   • Auditar el linaje aplicacion -> contratacion.
--   • Habilitar reportes de tasa de conversion por reclutador / fuente.
--
-- Se mantiene `text` (no FK estricto) para no romper imports masivos en
-- los que un empleado podria ser borrado y reinsertado: el linaje queda
-- igual aunque el row de empleados se reescriba.

alter table public.candidates
  add column if not exists employee_num text;

-- Indice util para buscar al empleado correspondiente a un candidato.
create index if not exists idx_candidates_employee_num
  on public.candidates (employee_num)
  where employee_num is not null;

comment on column public.candidates.employee_num is
  'Numero de empleado generado al contratar al candidato. Null mientras no se haya convertido a empleado.';
