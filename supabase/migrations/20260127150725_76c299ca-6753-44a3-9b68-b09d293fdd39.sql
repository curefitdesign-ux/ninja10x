-- Ensure one activity per user per day (required for upsert onConflict)
ALTER TABLE public.journey_activities
  ADD CONSTRAINT journey_activities_user_day_unique UNIQUE (user_id, day_number);

-- Helpful indexes for feed + per-user loading
CREATE INDEX IF NOT EXISTS journey_activities_created_at_idx ON public.journey_activities (created_at DESC);
CREATE INDEX IF NOT EXISTS journey_activities_user_day_idx ON public.journey_activities (user_id, day_number);