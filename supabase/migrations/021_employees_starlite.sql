-- Add is_starlite column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_starlite BOOLEAN DEFAULT FALSE;
