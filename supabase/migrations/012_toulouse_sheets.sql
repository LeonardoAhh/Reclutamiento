-- =============================================================================
-- 012_toulouse_sheets.sql
-- Hojas generadas de la prueba de atención Toulouse-Piéron.
-- Se guarda SOLO la semilla + configuración (no la rejilla completa): la
-- rejilla se regenera de forma determinista desde la semilla, por lo que la
-- hoja del candidato y la plantilla de corrección siempre coinciden y se
-- pueden reimprimir idénticas.
--
-- Aplicación: pegar en el SQL Editor de Supabase y ejecutar.
-- RLS deshabilitada (compatibilidad con anon key), igual que el resto.
-- =============================================================================

create table if not exists public.toulouse_sheets (
  id                  uuid primary key default gen_random_uuid(),
  folio               text,
  candidato_nombre    text not null,
  puesto_solicitado   text,
  edad                integer check (edad is null or (edad >= 0 and edad < 130)),
  fecha               date not null default current_date,
  evaluador           text,
  tiempo_limite_seg   integer check (tiempo_limite_seg is null or tiempo_limite_seg > 0),
  seed                bigint not null,
  filas               integer not null check (filas > 0),
  columnas            integer not null check (columnas > 0),
  modelos             jsonb not null default '[]'::jsonb,
  total_objetivos     integer,
  created_by          text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_toulouse_sheets_created_at
  on public.toulouse_sheets(created_at desc);
