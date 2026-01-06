-- Create storage bucket for user fitness journey uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journey-uploads',
  'journey-uploads',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to uploaded files
CREATE POLICY "Public read access for journey uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'journey-uploads');

-- Allow anyone to upload (for now - can add auth later)
CREATE POLICY "Anyone can upload to journey uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'journey-uploads');

-- Allow anyone to delete their uploads
CREATE POLICY "Anyone can delete from journey uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'journey-uploads');