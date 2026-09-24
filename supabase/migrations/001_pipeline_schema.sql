-- =============================================================================
-- 001_pipeline_schema.sql
-- Crea las tablas necesarias para el pipeline de candidatos y el ciclo de vida
-- de vacantes (PRs B–H de la roadmap Pipeline + Vacancy lifecycle).
--
-- Aplicación:
--   1) Desde el editor SQL de Supabase: pega este archivo entero y corre.
--   2) O via Supabase CLI: `supabase db push` con el proyecto vinculado.
--
-- RLS: queda habilitada con políticas permisivas (`using (true)`) para mantener
--      compatibilidad con el frontend actual (que usa solo la anon key).
--      Cuando llegue PR de auth + roles, las políticas se endurecen.
-- =============================================================================

-- ── Extensiones ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";  -- para gen_random_uuid()

-- ── Helper: trigger genérico para mantener updated_at ──────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- Candidates
-- ===========================================================================
create table if not exists public.candidates (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  telefono          text,
  email             text,
  cv_url            text,
  source            text,                    -- linkedin, indeed, referido, etc.
  puesto            text not null,
  area              text not null,
  seccion           text,
  status            text not null default 'aplico'
    check (status in (
      'aplico', 'revision', 'entrevista_1', 'entrevista_2',
      'oferta', 'contratado', 'rechazado'
    )),
  reclutador        text,
  fecha_aplicacion  timestamptz not null default now(),
  notas             text,                    -- summary corto; las largas viven en candidate_notes
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists candidates_status_idx       on public.candidates(status);
create index if not exists candidates_puesto_idx       on public.candidates(puesto);
create index if not exists candidates_area_idx         on public.candidates(area);
create index if not exists candidates_reclutador_idx   on public.candidates(reclutador);
create index if not exists candidates_created_at_idx   on public.candidates(created_at desc);

drop trigger if exists candidates_set_updated_at on public.candidates;
create trigger candidates_set_updated_at
  before update on public.candidates
  for each row execute function public.set_updated_at();

alter table public.candidates enable row level security;
drop policy if exists "candidates_all" on public.candidates;
create policy "candidates_all" on public.candidates for all using (true) with check (true);

-- ===========================================================================
-- Candidate notes (mirror de PositionComment pero atado a un candidato)
-- ===========================================================================
create table if not exists public.candidate_notes (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references public.candidates(id) on delete cascade,
  autor         text,
  texto         text not null,
  created_at    timestamptz not null default now()
);

create index if not exists candidate_notes_candidate_idx
  on public.candidate_notes(candidate_id, created_at desc);

alter table public.candidate_notes enable row level security;
drop policy if exists "candidate_notes_all" on public.candidate_notes;
create policy "candidate_notes_all" on public.candidate_notes for all using (true) with check (true);

-- ===========================================================================
-- Vacancy requests (ciclo de vida de la vacante)
-- ===========================================================================
create table if not exists public.vacancy_requests (
  id                    uuid primary key default gen_random_uuid(),
  puesto                text not null,
  area                  text not null,
  seccion               text,
  fecha_apertura        timestamptz not null default now(),
  fecha_objetivo        date,
  fecha_cubierta        timestamptz,
  reclutador_asignado   text,
  fuente_planeada       text,
  status                text not null default 'abierta'
    check (status in (
      'abierta', 'en_proceso', 'pausa', 'cubierta', 'cancelada'
    )),
  prioridad             text not null default 'media'
    check (prioridad in ('alta', 'media', 'baja')),
  justificacion         text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists vacancy_requests_status_idx      on public.vacancy_requests(status);
create index if not exists vacancy_requests_puesto_idx      on public.vacancy_requests(puesto);
create index if not exists vacancy_requests_area_idx        on public.vacancy_requests(area);
create index if not exists vacancy_requests_apertura_idx    on public.vacancy_requests(fecha_apertura desc);

drop trigger if exists vacancy_requests_set_updated_at on public.vacancy_requests;
create trigger vacancy_requests_set_updated_at
  before update on public.vacancy_requests
  for each row execute function public.set_updated_at();

alter table public.vacancy_requests enable row level security;
drop policy if exists "vacancy_requests_all" on public.vacancy_requests;
create policy "vacancy_requests_all" on public.vacancy_requests for all using (true) with check (true);

-- ===========================================================================
-- Vacancy status history (audit log: PR H)
-- ===========================================================================
create table if not exists public.vacancy_status_history (
  id           uuid primary key default gen_random_uuid(),
  vacancy_id   uuid not null references public.vacancy_requests(id) on delete cascade,
  from_status  text,
  to_status    text not null,
  changed_by   text,
  reason       text,
  changed_at   timestamptz not null default now()
);

create index if not exists vacancy_status_history_vacancy_idx
  on public.vacancy_status_history(vacancy_id, changed_at desc);

alter table public.vacancy_status_history enable row level security;
drop policy if exists "vacancy_status_history_all" on public.vacancy_status_history;
create policy "vacancy_status_history_all"
  on public.vacancy_status_history for all using (true) with check (true);

-- ── Trigger: registrar cada cambio de status automáticamente ───────────────
create or replace function public.log_vacancy_status_change()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.vacancy_status_history (vacancy_id, from_status, to_status)
    values (new.id, null, new.status);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.vacancy_status_history (vacancy_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists vacancy_requests_log_status on public.vacancy_requests;
create trigger vacancy_requests_log_status
  after insert or update of status on public.vacancy_requests
  for each row execute function public.log_vacancy_status_change();

-- ── Trigger: cuando una vacancy pasa a 'cubierta', setear fecha_cubierta ───
create or replace function public.set_fecha_cubierta()
returns trigger
language plpgsql
as $$
begin
  if (new.status = 'cubierta' and new.fecha_cubierta is null) then
    new.fecha_cubierta = now();
  end if;
  return new;
end;
$$;

drop trigger if exists vacancy_requests_set_fecha_cubierta on public.vacancy_requests;
create trigger vacancy_requests_set_fecha_cubierta
  before update of status on public.vacancy_requests
  for each row execute function public.set_fecha_cubierta();
