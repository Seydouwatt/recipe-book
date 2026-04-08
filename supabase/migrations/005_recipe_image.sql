-- Add image_url column to recipes (nullable, optional)
ALTER TABLE recipes
  ADD COLUMN image_url text DEFAULT NULL;

-- Create the public recipe-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read images (bucket is public)
CREATE POLICY "Public read recipe images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

-- Authenticated users can upload images
CREATE POLICY "Authenticated upload recipe images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipe-images');

-- Users can only delete their own images (path: {userId}/{filename})
CREATE POLICY "Authenticated delete own recipe images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
