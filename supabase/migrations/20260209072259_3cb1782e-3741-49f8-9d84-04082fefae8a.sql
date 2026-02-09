-- Create music storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('music-tracks', 'music-tracks', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Music tracks are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'music-tracks');

-- Service role can upload
CREATE POLICY "Service role can upload music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music-tracks');