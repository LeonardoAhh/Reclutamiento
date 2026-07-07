-- Add is_starline column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_starline BOOLEAN DEFAULT FALSE;
