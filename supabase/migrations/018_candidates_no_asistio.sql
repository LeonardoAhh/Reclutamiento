-- =============================================================================
-- 018_candidates_no_asistio.sql
-- Agrega 'no_asistio' al CHECK de `candidates.status`.
--
-- Contexto:
--   Se añade una nueva etapa al pipeline de candidatos: "No asistió".
--
-- Cambios:
--   1) Drop del CHECK existente (candidates_status_check).
--   2) Re-creación del CHECK con los 7 status vigentes.
-- =============================================================================

-- 1) Drop del CHECK existente.
ALTER TABLE public.candidates
  DROP CONSTRAINT IF EXISTS candidates_status_check;

-- 2) Re-instala el CHECK con los 7 status vigentes (incluye no_asistio).
ALTER TABLE public.candidates
  ADD CONSTRAINT candidates_status_check
    CHECK (status IN (
      'entrevista',
      'entrega_documentos',
      'faltan_documentos',
      'feedback_pendiente',
      'contratado',
      'rechazado',
      'no_asistio'
    ));

COMMENT ON COLUMN public.candidates.status IS
  'Etapa del pipeline. Valores vigentes: entrevista, entrega_documentos, faltan_documentos, feedback_pendiente, contratado, rechazado, no_asistio. no_asistio agregado en 018.';
