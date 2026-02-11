
# Add "Back to Login" Option on Profile Setup Page

## What Changes
A "Back to Login" link/button will be added to the profile setup page (visible only during initial setup, not in edit mode). Tapping it will sign the user out and redirect them to the login page.

## Technical Details

**File: `src/pages/ProfileSetupPage.tsx`**

1. Import `LogOut` icon from `lucide-react` and destructure `signOut` from the existing `useAuth()` hook.
2. Add a "Back to Login" button below the submit button (or at the top-left), visible only when `editMode` is false.
3. On tap, call `signOut()` which clears the session, then navigate to `/auth` with `replace: true`.

The button will use a subtle text-link style (e.g., `text-white/50` with an arrow or logout icon) to keep it secondary to the main "Continue" CTA, matching the existing dark liquid glass theme.
