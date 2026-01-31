-- Add is_public column to journey_activities (default false = private)
ALTER TABLE public.journey_activities 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Update RLS policy for viewing: users can see all their own + only public ones from others
DROP POLICY IF EXISTS "Anyone can view journey activities" ON public.journey_activities;

CREATE POLICY "Users can view own activities and public ones" 
ON public.journey_activities 
FOR SELECT 
USING (
  auth.uid() = user_id  -- Own activities always visible
  OR is_public = true   -- Public activities visible to everyone
);