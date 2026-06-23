-- Ejecutar en SQL Editor de Supabase para arreglar Error 42501 (RLS)
-- Esto permite lectura/escritura pública con la anon key

-- Habilitar RLS explícitamente
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_reclutamiento ENABLE ROW LEVEL SECURITY;

-- Borrar políticas viejas si existen
DROP POLICY IF EXISTS "Acceso total empleados" ON empleados;
DROP POLICY IF EXISTS "Acceso total comentarios" ON comentarios_reclutamiento;

-- Crear políticas de acceso total (All / True)
CREATE POLICY "Acceso total empleados" ON empleados 
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acceso total comentarios" ON comentarios_reclutamiento 
FOR ALL USING (true) WITH CHECK (true);
