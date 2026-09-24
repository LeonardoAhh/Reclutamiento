-- =============================================================================
-- 011_position_settings.sql
-- Tabla `position_settings`: overrides editables por puesto (plantilla
-- autorizada, BACKUP, urgentes y notas). Antes el `backup` vivía SOLO en el
-- código (constants.ts), lo que provocaba errores difíciles de corregir.
-- Ahora un admin lo edita desde el wizard "Configurar plantilla/backup" en la
-- página Vacantes y el dato manda sobre el valor estático.
--
-- Se identifica el puesto por la tripleta (area, seccion, puesto), igual que
-- `custom_positions`. La app hace match normalizado (sin acentos / sufijo de
-- turno) contra el catálogo de puestos.
--
-- Aplicación: pegar este archivo en el SQL Editor de Supabase y ejecutar.
-- Incluye el SEED con los valores que hoy están en el código (los números NO
-- cambian al activar la tabla).
-- =============================================================================

create table if not exists public.position_settings (
  id                   uuid primary key default gen_random_uuid(),
  area                 text not null,
  seccion              text not null,
  puesto               text not null,
  -- Override de plantilla autorizada. `null` = usar el valor base del catálogo.
  plantilla_autorizada integer check (plantilla_autorizada is null or plantilla_autorizada >= 0),
  backup               integer not null default 0 check (backup >= 0),
  urgentes             integer not null default 0 check (urgentes >= 0),
  notas                text,
  updated_by           text,
  updated_at           timestamptz not null default now(),
  constraint position_settings_unique_triplet unique (area, seccion, puesto)
);

create index if not exists idx_position_settings_area on public.position_settings(area);
create index if not exists idx_position_settings_area_seccion
  on public.position_settings(area, seccion);

-- RLS deshabilitada por defecto para mantener compatibilidad con anon key,
-- igual que `custom_positions`. Endurecer luego replicando el patrón de `empleados`.

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: valores actuales del código (backup / urgentes). Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.position_settings (area, seccion, puesto, plantilla_autorizada, backup, urgentes, notas, updated_by)
values ('CALIDAD', 'A. CALIDAD 1ER TURNO', 'OPERADOR DE ACABADOS GP-12', 22, 2, 0, null, 'seed')
on conflict (area, seccion, puesto) do update set backup = excluded.backup, urgentes = excluded.urgentes, plantilla_autorizada = excluded.plantilla_autorizada;

insert into public.position_settings (area, seccion, puesto, plantilla_autorizada, backup, urgentes, notas, updated_by)
values ('CALIDAD', 'A. CALIDAD 2DO. TURNO', 'OPERADOR DE ACABADOS GP-12', 22, 2, 0, null, 'seed')
on conflict (area, seccion, puesto) do update set backup = excluded.backup, urgentes = excluded.urgentes, plantilla_autorizada = excluded.plantilla_autorizada;

insert into public.position_settings (area, seccion, puesto, plantilla_autorizada, backup, urgentes, notas, updated_by)
values ('CALIDAD', 'CALIDAD ADMTVO', 'INSPECTOR DE CALIDAD', 15, 2, 0, 'Backup autorizado 1 y 1 extra por maternidad de 4040 SOFIA.', 'seed')
on conflict (area, seccion, puesto) do update set backup = excluded.backup, urgentes = excluded.urgentes, plantilla_autorizada = excluded.plantilla_autorizada;

insert into public.position_settings (area, seccion, puesto, plantilla_autorizada, backup, urgentes, notas, updated_by)
values ('PRODUCCIÓN', 'PRODUCCIÓN 1ER. TURNO', 'OPERADOR DE MÁQUINA', 32, 5, 0, 'Back-up por ausentismo y rotación del turno.', 'seed')
on conflict (area, seccion, puesto) do update set backup = excluded.backup, urgentes = excluded.urgentes, plantilla_autorizada = excluded.plantilla_autorizada;

insert into public.position_settings (area, seccion, puesto, plantilla_autorizada, backup, urgentes, notas, updated_by)
values ('PRODUCCIÓN', 'PRODUCCIÓN 2o. TURNO', 'OPERADOR DE MÁQUINA', 32, 5, 0, 'Back-up por ausentismo y rotación del turno.', 'seed')
on conflict (area, seccion, puesto) do update set backup = excluded.backup, urgentes = excluded.urgentes, plantilla_autorizada = excluded.plantilla_autorizada;

insert into public.position_settings (area, seccion, puesto, plantilla_autorizada, backup, urgentes, notas, updated_by)
values ('PRODUCCIÓN', 'PRODUCCIÓN 3ER. TURNO', 'OPERADOR DE MÁQUINA', 32, 5, 0, 'Back-up por ausentismo y rotación del turno.', 'seed')
on conflict (area, seccion, puesto) do update set backup = excluded.backup, urgentes = excluded.urgentes, plantilla_autorizada = excluded.plantilla_autorizada;

insert into public.position_settings (area, seccion, puesto, plantilla_autorizada, backup, urgentes, notas, updated_by)
values ('PRODUCCIÓN', 'PRODUCCIÓN 4o. TURNO', 'OPERADOR DE MÁQUINA', 32, 5, 0, 'Back-up por ausentismo y rotación del turno.', 'seed')
on conflict (area, seccion, puesto) do update set backup = excluded.backup, urgentes = excluded.urgentes, plantilla_autorizada = excluded.plantilla_autorizada;
