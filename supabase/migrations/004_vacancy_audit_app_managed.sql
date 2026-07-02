-- =============================================================================
-- 004_vacancy_audit_app_managed.sql
-- PR H: audit log de cambios de status manejado por la aplicación.
--
-- La migration 001 dejó un trigger que auto-inserta una fila en
-- `vacancy_status_history` tanto al INSERT como al UPDATE de la columna
-- `status`. Eso funciona pero no captura contexto (quién hizo el cambio,
-- por qué, si fue automático por contratación, etc.).
--
-- En PR H la aplicación maneja las inserciones de UPDATE para poder
-- escribir `changed_by` y `reason` con contexto. El trigger queda activo
-- únicamente para INSERT (fila inicial cuando se abre una vacante nueva).
-- Si alguien edita el status directo en la SQL UI de Supabase, no se
-- registrará en el log de la app — corner case aceptable para una app
-- interna.
-- =============================================================================

drop trigger if exists vacancy_requests_log_status on public.vacancy_requests;

create trigger vacancy_requests_log_status
  after insert on public.vacancy_requests
  for each row execute function public.log_vacancy_status_change();

comment on trigger vacancy_requests_log_status on public.vacancy_requests is
  'Solo registra la fila inicial al crear la vacante. Las transiciones de status las inserta la app explícitamente para incluir contexto (changed_by, reason, source).';
