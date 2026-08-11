-- =============================================================================
-- 023_candidates_baja.sql
-- Agrega 'baja' al CHECK de `candidates.status`.
--
-- Contexto:
--   Se añade la capacidad de marcar a un candidato como dado de baja.
--
-- Cambios:
--   1) Drop del CHECK existente (candidates_status_check).
--   2) Re-creación del CHECK con los 8 status vigentes.
-- =============================================================================

-- 1) Drop del CHECK existente.
ALTER TABLE public.candidates
  DROP CONSTRAINT IF EXISTS candidates_status_check;

-- 2) Re-instala el CHECK con los 8 status vigentes (incluye baja).
ALTER TABLE public.candidates
  ADD CONSTRAINT candidates_status_check
    CHECK (status IN (
      'entrevista',
      'entrega_documentos',
      'faltan_documentos',
      'feedback_pendiente',
      'contratado',
      'baja',
      'rechazado',
      'no_asistio'
    ));

COMMENT ON COLUMN public.candidates.status IS
  'Etapa del pipeline. Valores vigentes: entrevista, entrega_documentos, faltan_documentos, feedback_pendiente, contratado, baja, rechazado, no_asistio.';
