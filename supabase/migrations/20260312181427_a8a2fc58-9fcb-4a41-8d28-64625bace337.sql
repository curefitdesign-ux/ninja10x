-- Create feedback storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-attachments', 'feedback-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  screenshot_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  current_route TEXT,
  device_info TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage policies for feedback-attachments bucket
CREATE POLICY "Users can upload feedback attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'feedback-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own feedback attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'feedback-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
