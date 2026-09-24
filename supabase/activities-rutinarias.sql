-- ==========================================
-- Add 'tipo' to activities
-- ==========================================

ALTER TABLE activities ADD COLUMN tipo TEXT NOT NULL DEFAULT 'unica' CHECK (tipo IN ('unica', 'rutinaria'));

-- Drop the old select policies and create new ones to allow seeing activities where asignado_a IS NULL (Todo el equipo)

DROP POLICY IF EXISTS "Reclutadores can view their assigned activities" ON activities;

CREATE POLICY "Reclutadores can view their assigned or general activities"
ON activities FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'reclutador' 
  AND (asignado_a = auth.uid() OR asignado_a IS NULL)
);
