-- Migration 003 — SLA configurable + flag de exclusion del indicador en vacantes.
--
-- Contexto:
--   El area de operacion tiene un SLA de 10 dias para cubrir una vacante
--   recien aperturada. Si los responsables del area NO le dan seguimiento,
--   la vacante puede demorarse pero NO debe contar en el KPI de tiempo-de-
--   cobertura (time-to-fill). Lo mismo aplica para vacantes pausadas por
--   gerencia o recursos reasignados.
--
-- Cambios:
--   • dias_sla:           int. SLA por vacante. Default 10.
--   • excluida_indicador: bool. Marca explicita "no contar en KPI". Default false.
--   • motivo_exclusion:   text. Texto libre con la razon. Null cuando no aplica.

alter table public.vacancy_requests
  add column if not exists dias_sla integer not null default 10;

alter table public.vacancy_requests
  add column if not exists excluida_indicador boolean not null default false;

alter table public.vacancy_requests
  add column if not exists motivo_exclusion text;

-- Indice util para listar las que estan fuera del indicador.
create index if not exists idx_vacancy_excluida
  on public.vacancy_requests (excluida_indicador)
  where excluida_indicador = true;

comment on column public.vacancy_requests.dias_sla is
  'SLA en dias para cubrir la vacante (default 10).';
comment on column public.vacancy_requests.excluida_indicador is
  'Si true, la vacante no se cuenta en los KPIs de time-to-fill / SLA cumplido.';
comment on column public.vacancy_requests.motivo_exclusion is
  'Razon por la que la vacante esta excluida del indicador (ej. "Sin seguimiento del area").';
