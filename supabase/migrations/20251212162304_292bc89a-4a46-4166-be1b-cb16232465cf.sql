-- Add image_url column to epis table
ALTER TABLE public.epis ADD COLUMN image_url text;

-- Create storage bucket for EPI images
INSERT INTO storage.buckets (id, name, public) VALUES ('epi-images', 'epi-images', true);

-- Storage policies for EPI images
CREATE POLICY "EPI images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'epi-images');

CREATE POLICY "Anyone can upload EPI images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'epi-images');

CREATE POLICY "Anyone can update EPI images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'epi-images');

CREATE POLICY "Anyone can delete EPI images"
ON storage.objects FOR DELETE
USING (bucket_id = 'epi-images');