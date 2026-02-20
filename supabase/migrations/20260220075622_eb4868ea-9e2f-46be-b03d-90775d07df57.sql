-- Drop the overly-permissive public read policy on journey-uploads
DROP POLICY IF EXISTS "Public read access for journey uploads" ON storage.objects;

-- Restrict SELECT: authenticated users can view their own files OR files linked to public activities
CREATE POLICY "Authenticated users can view own and public activity files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'journey-uploads' AND (
    -- User can always see their own files (path starts with their user id)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Or the file belongs to a public activity
    EXISTS (
      SELECT 1 FROM public.journey_activities
      WHERE is_public = true
        AND (storage_url LIKE '%' || name || '%' OR original_url LIKE '%' || name || '%')
    )
  )
);
