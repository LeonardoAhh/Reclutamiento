-- =============================================
-- RECLUTAMIENTO — Supabase Schema (Simplificado)
-- Ejecutar en SQL Editor de Supabase
-- =============================================

-- Borrar tablas anteriores si existen (cuidado: borra datos)
DROP TABLE IF EXISTS comentarios_reclutamiento;
DROP TABLE IF EXISTS empleados;

-- Tabla de empleados (plantilla real) — 8 campos
CREATE TABLE empleados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  num_empleado TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  area TEXT NOT NULL,
  seccion TEXT NOT NULL,
  puesto TEXT NOT NULL,
  categoria TEXT DEFAULT 'N/A',
  turno TEXT DEFAULT '0',
  fecha_ingreso TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de comentarios de reclutamiento
CREATE TABLE comentarios_reclutamiento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  seccion TEXT NOT NULL,
  puesto TEXT NOT NULL,
  comentario TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('proceso_activo', 'entrevista', 'entrega_documentos', 'otro')),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  autor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries eficientes
CREATE INDEX idx_empleados_area ON empleados(area);
CREATE INDEX idx_empleados_area_seccion ON empleados(area, seccion);
CREATE INDEX idx_comentarios_area_puesto ON comentarios_reclutamiento(area, seccion, puesto);

-- RLS deshabilitado por defecto. Descomentar si necesitas control de acceso:
-- ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comentarios_reclutamiento ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read empleados" ON empleados FOR SELECT USING (true);
-- CREATE POLICY "Public read comentarios" ON comentarios_reclutamiento FOR SELECT USING (true);
-- CREATE POLICY "Public insert comentarios" ON comentarios_reclutamiento FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Public insert empleados" ON empleados FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Public update empleados" ON empleados FOR UPDATE USING (true);
