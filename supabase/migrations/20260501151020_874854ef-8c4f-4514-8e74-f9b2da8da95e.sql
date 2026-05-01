-- Add columns to social_posts for templates, inspiration, topic, image_urls
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_inspiration boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS image_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create private storage bucket for social assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-assets',
  'social-assets',
  false,
  52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = EXCLUDED.public;

-- RLS policies for social-assets bucket: users can only access their own folder (user_id/...)
DROP POLICY IF EXISTS "Users view own social assets" ON storage.objects;
CREATE POLICY "Users view own social assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'social-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users upload own social assets" ON storage.objects;
CREATE POLICY "Users upload own social assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'social-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own social assets" ON storage.objects;
CREATE POLICY "Users update own social assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'social-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own social assets" ON storage.objects;
CREATE POLICY "Users delete own social assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'social-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
