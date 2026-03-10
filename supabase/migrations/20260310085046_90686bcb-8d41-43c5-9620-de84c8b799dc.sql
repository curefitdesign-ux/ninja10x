
CREATE TABLE public.nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- Anyone can view nudges sent to them
CREATE POLICY "Users can view their own nudges"
  ON public.nudges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = to_user_id);

-- Anyone can send nudges
CREATE POLICY "Users can send nudges"
  ON public.nudges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Enable realtime for nudges
ALTER PUBLICATION supabase_realtime ADD TABLE public.nudges;
