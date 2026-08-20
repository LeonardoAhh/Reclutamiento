-- =============================================================================
-- 011_backfill_fecha_ingreso_iso.sql
-- Normaliza `empleados.fecha_ingreso` que esté en formato latino
-- (`DD/MM/YYYY` o `DD-MM-YYYY`) al formato ISO `YYYY-MM-DD`.
--
-- Contexto:
--   Importaciones Excel antiguas dejaron parte de los rows con fechas
--   `"20/08/2024"`. Postgres `date` columns (ej. `bajas.fecha_ingreso`,
--   creada en 007_bajas.sql) rechazan ese formato con SQLSTATE 22008
--   ("date/time field value out of range"). Eso bloqueaba el delete-with-baja
--   desde el dashboard hasta PR #37 (que normaliza al escribir).
--
--   Este script limpia el histórico de una sola vez. El frontend a partir
--   de PR #37 ya normaliza al insertar/actualizar, así que el patrón roto
--   no debería repetirse.
--
-- Aplicación: pegar este archivo en el SQL Editor de Supabase y ejecutar.
--   Es idempotente: solo toca rows que matcheen el regex `dd/mm/yyyy` o
--   `dd-mm-yyyy` y deja intactas las que ya son ISO o tienen otro shape.
-- =============================================================================

-- ── Diagnóstico (read-only) ────────────────────────────────────────────────
-- Antes de correr el UPDATE puedes ver los candidatos con:
--   SELECT num_empleado, nombre, fecha_ingreso
--   FROM public.empleados
--   WHERE fecha_ingreso ~ '^[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}$';

-- ── Backfill ───────────────────────────────────────────────────────────────
-- Convierte `DD/MM/YYYY` y `DD-MM-YYYY` → `YYYY-MM-DD` usando regex y
-- `to_char(to_date(...), 'YYYY-MM-DD')` para validar fechas reales.
-- Si el día/mes son inválidos (ej. `31/02/2024`), `to_date` lanza error y
-- el row queda fuera del UPDATE por el `WHERE` que filtra solo matches válidos.
update public.empleados
set fecha_ingreso = to_char(
  to_date(fecha_ingreso, 'DD/MM/YYYY'),
  'YYYY-MM-DD'
)
where fecha_ingreso ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$';

update public.empleados
set fecha_ingreso = to_char(
  to_date(fecha_ingreso, 'DD-MM-YYYY'),
  'YYYY-MM-DD'
)
where fecha_ingreso ~ '^[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}$';

-- ── Verificación ───────────────────────────────────────────────────────────
-- Después de correr, este SELECT debe devolver 0 rows:
--   SELECT count(*) FROM public.empleados
--   WHERE fecha_ingreso !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
--     AND fecha_ingreso IS NOT NULL
--     AND fecha_ingreso <> '';
