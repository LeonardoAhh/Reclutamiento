-- Add is_starlite column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_starlite BOOLEAN DEFAULT FALSE;
