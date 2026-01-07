-- Drop ALL existing storage policies for journey-uploads bucket
DROP POLICY IF EXISTS "Anyone can upload to journey uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete from journey uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view journey uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for journey uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create secure policies requiring authentication and scoping to user folders

-- Allow anyone to view files in the bucket (needed for public URLs used by Runway API)
CREATE POLICY "Public read access for journey uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'journey-uploads');

-- Allow authenticated users to upload only to their own folder
CREATE POLICY "Authenticated users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journey-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update only their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'journey-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'journey-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete only their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'journey-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);