-- =============================================================================
-- 016_candidates_feedback_pendiente.sql
-- Agrega 'feedback_pendiente' al CHECK de `candidates.status`.
--
-- Contexto:
--   Se añade una nueva etapa al pipeline de candidatos: "Feedback pendiente".
--   Representa candidatos que completaron entrega de documentos y están
--   esperando la confirmación/feedback del área solicitante antes de proceder
--   a contratación.
--
-- Cambios:
--   1) Drop del CHECK existente (candidates_status_check).
--   2) Re-creación del CHECK con los 6 status vigentes.
--
-- Idempotente: si la constraint ya incluye 'feedback_pendiente', el drop +
-- add simplemente la recrea con el mismo conjunto de valores.
-- =============================================================================

-- 1) Drop del CHECK existente.
ALTER TABLE public.candidates
  DROP CONSTRAINT IF EXISTS candidates_status_check;

-- 2) Re-instala el CHECK con los 6 status vigentes (incluye feedback_pendiente).
ALTER TABLE public.candidates
  ADD CONSTRAINT candidates_status_check
    CHECK (status IN (
      'entrevista',
      'entrega_documentos',
      'faltan_documentos',
      'feedback_pendiente',
      'contratado',
      'rechazado'
    ));

COMMENT ON COLUMN public.candidates.status IS
  'Etapa del pipeline. Valores vigentes: entrevista, entrega_documentos, faltan_documentos, feedback_pendiente, contratado, rechazado. feedback_pendiente agregado en 016.';
