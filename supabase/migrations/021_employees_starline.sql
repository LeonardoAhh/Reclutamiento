-- Add is_starline column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_starline BOOLEAN DEFAULT FALSE;
