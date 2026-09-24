-- ==========================================
-- Schema for Activities and Proofs
-- ==========================================

-- 1. Create activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    asignado_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
    creado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Admin policies (Coordinadores)
CREATE POLICY "Admins can do everything on activities"
ON activities FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Reclutador policies
CREATE POLICY "Reclutadores can view their assigned activities"
ON activities FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'reclutador' AND asignado_a = auth.uid()
);

CREATE POLICY "Reclutadores can update their assigned activities"
ON activities FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'reclutador' AND asignado_a = auth.uid()
);


-- 2. Create activity_proofs table
CREATE TABLE activity_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_proofs ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view all proofs"
ON activity_proofs FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can insert proofs"
ON activity_proofs FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete proofs"
ON activity_proofs FOR DELETE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Reclutador policies
CREATE POLICY "Reclutadores can view proofs for their activities"
ON activity_proofs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM activities 
    WHERE id = activity_proofs.activity_id 
    AND asignado_a = auth.uid()
  )
);

CREATE POLICY "Reclutadores can insert proofs for their activities"
ON activity_proofs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM activities 
    WHERE id = activity_proofs.activity_id 
    AND asignado_a = auth.uid()
  )
);

CREATE POLICY "Reclutadores can delete their own proofs"
ON activity_proofs FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
);


-- 3. Storage Bucket for Proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('activity-proofs', 'activity-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (using standard owner approach for inserts)
CREATE POLICY "Activity proofs are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'activity-proofs' );

CREATE POLICY "Authenticated users can upload activity proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'activity-proofs' );

CREATE POLICY "Authenticated users can delete their own proofs"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'activity-proofs' AND auth.uid() = owner );
