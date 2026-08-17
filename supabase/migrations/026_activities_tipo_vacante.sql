-- Drop existing constraint
ALTER TABLE "public"."activities" DROP CONSTRAINT IF EXISTS "activities_tipo_check";

-- Add the updated constraint that includes 'vacante'
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_tipo_check" 
CHECK ((tipo = ANY (ARRAY['unica'::text, 'rutinaria'::text, 'vacante'::text])));
