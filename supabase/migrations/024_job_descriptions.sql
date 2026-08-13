-- Migration: Create job_descriptions table
-- Purpose: Store the text extraction of job descriptions for AI comparison with CVs

CREATE TABLE IF NOT EXISTS public.job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT,
    requirements_text TEXT,
    responsibilities_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read job descriptions
CREATE POLICY "Allow authenticated users to read job descriptions"
    ON public.job_descriptions
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert/update job descriptions (for internal recruiter use)
CREATE POLICY "Allow authenticated users to insert job descriptions"
    ON public.job_descriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update job descriptions"
    ON public.job_descriptions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_descriptions_updated_at
BEFORE UPDATE ON public.job_descriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
