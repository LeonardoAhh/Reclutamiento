-- =============================================
-- Crear tabla no_citados
-- =============================================

CREATE TABLE IF NOT EXISTS no_citados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT NOT NULL,
  motivo TEXT NOT NULL,
  sub_motivo TEXT,
  reclutador TEXT NOT NULL,
  notas TEXT,
  fecha TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (opcional, para seguir patrón de app)
ALTER TABLE no_citados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access no_citados" ON no_citados FOR ALL USING (true) WITH CHECK (true);
