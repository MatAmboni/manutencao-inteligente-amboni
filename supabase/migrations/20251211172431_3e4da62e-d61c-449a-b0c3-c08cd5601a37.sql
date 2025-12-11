-- Add category column to epis table
ALTER TABLE public.epis ADD COLUMN category text;

-- Create an index for better performance when filtering by category
CREATE INDEX idx_epis_category ON public.epis(category);