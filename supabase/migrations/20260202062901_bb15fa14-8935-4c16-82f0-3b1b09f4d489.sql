-- Add stories visibility setting to profiles
ALTER TABLE public.profiles
ADD COLUMN stories_public BOOLEAN NOT NULL DEFAULT true;