-- =============================================================================
-- 009_bajas_cubierta_manual.sql
-- Agrega columnas para marcar manualmente que la vacante de una baja fue
-- cubierta (ej. por promoción interna o transferencia). Aplica al reporte
-- /bajas: las marcadas cuentan como cubiertas sin necesidad de un hire externo.
--
-- Aplicación: pegar en SQL Editor de Supabase y ejecutar.
-- =============================================================================

alter table public.bajas
  add column if not exists cubierta_manual boolean not null default false,
  add column if not exists cubierta_fecha  date,
  add column if not exists cubierta_nota   text;

create index if not exists idx_bajas_cubierta_manual
  on public.bajas (cubierta_manual)
  where cubierta_manual = true;
