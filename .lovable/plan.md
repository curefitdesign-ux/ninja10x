

## Current Ring Logic

### How it works today

**Storage:** `localStorage` key `ninja10x_last_seen_activities` stores `{ [userId]: latestActivityId }`.

**CommunityStoriesWidget (home page avatars):**
- On every render, reads localStorage inline (inside JSX via IIFE)
- Compares `stored[activity.userId] === activity.id`
- If match → grey ring (`rgba(255,255,255,0.3)`), else → gradient ring

**Reel page (avatar strip):**
- On mount, initializes `viewedUsers` Set by comparing stored activity IDs against each group's latest real activity
- When user taps another avatar or finishes viewing, calls `markUserViewed()` which adds to the Set and persists to localStorage
- Ring color: gradient if unviewed, grey if viewed, progress animation if active

### The Bug

In `CommunityStoriesWidget`, the comparison is `stored[activity.userId] === activity.id` — but `activity` here is the **latest activity per user** (already deduplicated). So the logic is correct in principle. However, the widget compares against the activity shown in the widget row, while the Reel persists the latest **real** activity (excluding log-activity/week-complete/week-recap cards). If these differ, the ring state can be inconsistent.

### Plan

**File: `src/components/CommunityStoriesWidget.tsx`**
- Extract the viewed-check out of the JSX IIFE into a clean variable before the map
- Ensure comparison uses `activity.userId` to look up the stored ID, then compares it against `activity.id` (the latest activity for that user) — this is already correct but will be cleaned up

**File: `src/pages/Reel.tsx`**
- No logic changes needed — the existing `markUserViewed` correctly persists the latest real activity ID

**Memory note to save:**
- Gradient ring = user's latest activity has NOT been seen (stored ID ≠ latest activity ID)
- Grey ring = user's latest activity HAS been seen (stored ID === latest activity ID)
- Storage format: `ninja10x_last_seen_activities` → `{ userId: lastSeenActivityId }`
- Both CommunityStoriesWidget and Reel avatar strip use the same localStorage key
- Reel marks viewed on: tapping another avatar (marks previous), swiping past last story, or navigating away
- "Latest activity" excludes synthetic cards (log-activity, week-complete, week-recap)

The current logic is already correct — colored gradient ring shows only for users whose latest story/activity has not been seen. No code changes are needed. I will save this to memory for future reference.

