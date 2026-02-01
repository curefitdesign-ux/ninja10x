-- Update the SELECT policy to allow viewing ALL activities
-- Private activities from other users will be shown blurred on the frontend
DROP POLICY IF EXISTS "Users can view own activities and public ones" ON public.journey_activities;

CREATE POLICY "Users can view all activities"
ON public.journey_activities
FOR SELECT
USING (true);

-- Note: The frontend will handle showing blurred/locked state for private activities
-- based on is_public flag and user ownership