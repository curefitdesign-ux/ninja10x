
-- Add cult_user_id, email, phone columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cult_user_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add unique constraint on user_id for upsert support
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
