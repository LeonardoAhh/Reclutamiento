-- Script para agregar el campo 'turno' a la tabla 'bajas'
-- Ejecuta este script en Supabase SQL Editor

-- Agregar columna turno a la tabla bajas
ALTER TABLE bajas ADD COLUMN IF NOT EXISTS turno TEXT;

-- Comentario descriptivo para la columna
COMMENT ON COLUMN bajas.turno IS 'Turno del empleado al momento de la baja';

-- Opcional: Intentar poblar el turno desde la tabla empleados actual para bajas existentes
-- (solo funcionará para empleados que aún estén activos)
UPDATE bajas
SET turno = empleados.turno
FROM empleados
WHERE bajas.num_empleado = empleados.num_empleado
  AND bajas.turno IS NULL;
