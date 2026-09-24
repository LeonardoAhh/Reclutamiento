-- Add reference_image column to activities table
ALTER TABLE public.activities
ADD COLUMN reference_image text;

-- Add a comment explaining what the column is for
COMMENT ON COLUMN public.activities.reference_image IS 'URL to an optional reference image for the activity, used as visual context or guide';
