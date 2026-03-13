

## Restricting Profile Data Exposure

### The Problem
Right now, anyone with a valid JWT can call `GET /rest/v1/profiles?select=*` and receive every column for every user, including `cult_user_id`, `id`, `created_at`, `updated_at`. The RLS policy allows SELECT for all rows (`true`), and PostgREST lets the caller pick any columns.

Changing `.select('*')` to `.select('display_name, avatar_url')` in frontend code does NOT fix this -- an attacker can still call the REST API directly with `select=*`.

### Solution: Database View + Restricted Base Table

1. **Create a `profiles_public` view** that exposes only safe columns: `user_id`, `display_name`, `avatar_url`, `stories_public`. Uses `security_invoker=on` so RLS still applies.

2. **Lock down the base `profiles` table SELECT policy** so only the owner can read their own row (`auth.uid() = user_id`). This prevents direct `select=*` on the base table from leaking other users' data.

3. **Update all frontend code** to query `profiles_public` instead of `profiles` for reads involving other users. The owner's own profile fetch (`use-profile.ts`) can remain on the base table since the new RLS still allows self-select.

### Database Migration

```sql
-- View exposing only public-safe columns
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT user_id, display_name, avatar_url, stories_public
  FROM public.profiles;

-- Restrict base table: only owner can SELECT their own row
DROP POLICY "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Frontend Changes (11 files)

All queries that fetch **other users'** profiles switch from `.from('profiles')` to `.from('profiles_public')`:
- `use-journey-activities.ts` (2 locations)
- `NotificationSheet.tsx` (4 locations)
- `ReactionNotificationPill.tsx`
- `NotificationCenter.tsx`
- `use-reaction-notifications.ts`
- `Activity.tsx`
- `Auth.tsx` (checks `id` -- will need to use base table or adjust to check `user_id`)

Queries that read/write the **current user's own** profile stay on `profiles`:
- `use-profile.ts` (select, insert, update)
- `ProfileSetup.tsx` (insert)
- `ProfileSetupPage.tsx` (insert)
- `MakePublicSheet.tsx` (update)

### Impact
- `cult_user_id`, `id`, `created_at`, `updated_at` are no longer exposed via the public view
- Direct REST API calls to `profiles` with `select=*` only return the caller's own row
- No functional changes to the app -- all existing queries already select only the columns present in the view

