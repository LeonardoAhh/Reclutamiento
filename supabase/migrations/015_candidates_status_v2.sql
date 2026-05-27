-- =============================================================================
-- 015_candidates_status_v2.sql
-- Alinea el CHECK de `candidates.status` con los 4 status vigentes en la app.
--
-- Contexto:
--   La migracion 001 dejo el CHECK con los status legacy
--   ('aplico','revision','entrevista_1','entrevista_2','oferta','contratado',
--    'rechazado'), pero el frontend (src/lib/types.ts -> CANDIDATE_STATUSES)
--   evoluciono a ('entrevista','entrega_documentos','faltan_documentos',
--    'contratado','rechazado'). Cualquier INSERT/UPDATE con un status nuevo
--   era rechazado por la DB con `23514 check_violation`, el hook lo capturaba
--   en silencio y la fila sobrevivia solo en localStorage -> KPIs divergian
--   por browser y se perdian al limpiar storage.
--
-- Cambios:
--   1) Drop del CHECK viejo (anonimo: nombre por defecto `candidates_status_check`).
--   2) Backfill de filas con status legacy al equivalente vigente:
--        aplico        -> entrevista
--        revision      -> entrevista
--        entrevista_1  -> entrevista
--        entrevista_2  -> entrevista
--        oferta        -> entrega_documentos
--   3) Cambio de DEFAULT a 'entrevista' (era 'aplico').
--   4) Nuevo CHECK con los 5 status vigentes.
--
-- Idempotente: si la constraint ya fue actualizada a mano en el proyecto
-- remoto, los `drop ... if exists` + `add constraint` con guardas no rompen.
-- El backfill solo toca filas que aun tengan valor legacy.
-- =============================================================================

-- 1) Drop del CHECK viejo (si existe con el nombre por defecto).
alter table public.candidates
  drop constraint if exists candidates_status_check;

-- 2) Backfill: traduce status legacy al nuevo conjunto. NO toca filas que
--    ya esten en el conjunto vigente.
update public.candidates
   set status = 'entrevista'
 where status in ('aplico', 'revision', 'entrevista_1', 'entrevista_2');

update public.candidates
   set status = 'entrega_documentos'
 where status = 'oferta';

-- 3) Default nuevo (alineado con CandidateModal -> emptyForm()).
alter table public.candidates
  alter column status set default 'entrevista';

-- 4) Re-instala el CHECK con los status vigentes. Si por algun motivo la
--    constraint ya fue creada bajo este nombre (reaplicacion manual), el
--    `drop if exists` de arriba la limpio antes de este `add`.
alter table public.candidates
  add constraint candidates_status_check
    check (status in (
      'entrevista',
      'entrega_documentos',
      'faltan_documentos',
      'contratado',
      'rechazado'
    ));

comment on column public.candidates.status is
  'Etapa del pipeline. Valores vigentes: entrevista, entrega_documentos, faltan_documentos, contratado, rechazado. Los status legacy (aplico/revision/entrevista_1/entrevista_2/oferta) se migraron en 015.';
