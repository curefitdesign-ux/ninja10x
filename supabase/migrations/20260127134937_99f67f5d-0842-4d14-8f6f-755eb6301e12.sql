-- Journey activities table (stores user uploads with metadata)
CREATE TABLE public.journey_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  original_url TEXT,
  is_video BOOLEAN DEFAULT false,
  activity TEXT,
  frame TEXT,
  duration TEXT,
  pr TEXT,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 12),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_number)
);

-- Enable RLS
ALTER TABLE public.journey_activities ENABLE ROW LEVEL SECURITY;

-- Users can view all activities (public feed)
CREATE POLICY "Anyone can view journey activities"
  ON public.journey_activities FOR SELECT
  USING (true);

-- Users can insert their own activities
CREATE POLICY "Users can insert their own activities"
  ON public.journey_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update their own activities"
  ON public.journey_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
  ON public.journey_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Reactions table (Instagram-like hearts)
CREATE TABLE public.activity_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.journey_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'heart',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions (for counts)
CREATE POLICY "Anyone can view reactions"
  ON public.activity_reactions FOR SELECT
  USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
  ON public.activity_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON public.activity_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on journey_activities
CREATE OR REPLACE FUNCTION public.update_journey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_journey_activities_updated_at
  BEFORE UPDATE ON public.journey_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journey_updated_at();

-- Create indexes for performance
CREATE INDEX idx_journey_activities_user_id ON public.journey_activities(user_id);
CREATE INDEX idx_journey_activities_created_at ON public.journey_activities(created_at DESC);
CREATE INDEX idx_activity_reactions_activity_id ON public.activity_reactions(activity_id);