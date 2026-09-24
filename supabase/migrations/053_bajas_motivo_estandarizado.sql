-- Additive field for the standardized reason category. Existing motivo_baja
-- remains the historical free-text detail; no rows are rewritten.
alter table public.bajas
  add column if not exists motivo_baja_estandarizado text;

-- Rollback (manual, only after verifying no classified records depend on it):
-- alter table public.bajas drop column motivo_baja_estandarizado;
