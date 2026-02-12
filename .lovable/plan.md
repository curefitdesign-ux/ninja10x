

# Ninja 10X -- Complete Product Documentation

---

## PRD 1: Master Plan -- What We Are Building and How

### Vision
Ninja 10X is a mobile-first fitness habit-building app that transforms the mundane act of "working out" into a social, visual, and rewarding 28-day journey. The core thesis: if you can get someone to log 3 activities per week for 4 weeks (12 total), the habit sticks. Every feature in the app exists to serve this singular goal.

### Core Product Loop

```text
+------------------+       +------------------+       +------------------+
|   CAPTURE        | ----> |   CELEBRATE      | ----> |   SHARE          |
| Photo/Video of   |       | Fullscreen       |       | Templated card   |
| workout moment   |       | celebration +    |       | to WhatsApp,     |
|                  |       | progress ring    |       | Instagram, etc.  |
+------------------+       +------------------+       +------------------+
        ^                                                      |
        |                                                      v
+------------------+       +------------------+       +------------------+
|   RETURN         | <---- |   MOTIVATE       | <---- |   COMMUNITY      |
| Next day, the    |       | AI weekly recap  |       | Reactions from   |
| ring resets,     |       | reel + progress  |       | friends, public  |
| mascot beckons   |       | tile path        |       | feed, streaks    |
+------------------+       +------------------+       +------------------+
```

### Architecture Overview

**Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion  
**Backend**: Lovable Cloud (Supabase) -- Postgres DB, Storage, Edge Functions, Realtime  
**Native Bridge**: Capacitor (iOS/Android) for camera, haptics, HealthKit  
**AI/Media**: Local canvas-based reel generator (no external AI APIs required)  
**Design System**: Apple "Liquid Glass" -- translucent cards, 40-60px backdrop blur, 180-200% saturation

### Data Model (Simplified)

| Table | Purpose |
|---|---|
| `profiles` | User identity: display_name, avatar_url, stories_public flag |
| `journey_activities` | Each logged workout: photo URL, activity type, metrics, day_number (1-12) |
| `activity_reactions` | Reactions on activities: user_id, activity_id, reaction_type |

### Key Constraints
- Mobile-only viewport (375-430px max width)
- Sequential journey: Day N must be completed before Day N+1
- Uploads restricted to media from the last 24 hours
- Only the most recent activity can be deleted
- 12 activities total = 4 weeks x 3 days per week

---

## PRD 2: Design Guidelines -- Overall Look and Feel

### Design Language: "Apple Liquid Glass"
Every surface in the app is translucent, blurred, and saturated -- inspired by iOS glassmorphism and Apple's visionOS aesthetic.

### Core Design Tokens

| Token | Value |
|---|---|
| Background | Deep purple gradient: #2a1b4e to #0a0720 (180deg) |
| Glass Surface | rgba(255, 255, 255, 0.06-0.12) with backdrop-blur(40-60px) and saturate(180-200%) |
| Glass Border | rgba(255, 255, 255, 0.08-0.15), 1px solid |
| Inner Highlight | inset 0 1px 1px rgba(255,255,255,0.1) (top edge "light beam") |
| Primary Text | #FFFFFF at 100% opacity |
| Secondary Text | rgba(180, 160, 220, 0.7) -- soft lavender |
| Muted Text | white/40 to white/60 |
| Accent Gradient | Orange-to-Pink: #F97316 to #EC4899 |
| Corner Radius | 16-24px for cards, 9999px for pills |
| Interaction Feedback | active:scale-[0.97] on all tappable elements |
| Font | Inter, -apple-system, system-ui |

### Component Patterns

- **Cards**: Translucent background + high blur + inner top highlight + subtle border
- **Bottom Sheets**: Slide-up with spring physics, dark translucent backdrop
- **Buttons (Primary)**: White background with gradient text (orange-to-pink)
- **Buttons (Secondary)**: Glass surface with white/80 text
- **Inputs**: Transparent background, border-bottom only, center-aligned
- **Toasts**: Liquid rise animation (0.5s spring), floating effect
- **Transitions**: Crossfade (0.15-0.35s), spring-based scale/translate

### Animation Philosophy
- Every state change has motion (Framer Motion)
- Springs over easing curves (stiffness: 120-200, damping: 15-20)
- Haptic feedback on all primary interactions (Capacitor)
- No visual chaos: no glitch effects, chromatic aberration, or excessive particles

### Media Aesthetic
- Captured photos/videos are always "hero" -- clean, full-bleed, unobstructed
- Templates/frames overlay metadata without covering the media center
- Recap reels follow Nike/Brutalist typography with Apple Memories transitions

---

## PRD 3: User Journey -- End-to-End Flow

### Phase 0: Onboarding (One-time)

1. User opens app, sees Auth screen (email/password login or signup)
2. After signup, redirected to Profile Setup:
   - Choose a sport-themed preset avatar OR upload + crop a custom photo
   - Enter display name (center-aligned, single line)
   - "Back to Login" option if wrong account
3. Tap "Continue" -- profile saved, redirected to Home

### Phase 1: Daily Activity Logging (Core Loop)

**Step 1 -- Home Page (Activity Hub)**
- Circular progress ring with mascot (Curo) at center
- Motivational greeting: "Hey {Name}!" or "Nice one, {Name}!"
- Photo strip showing logged activities (horizontal scroll by week)
- Week selector tabs (W1-W4) with AI recap pill per completed week
- "+" button to log next activity

**Step 2 -- Media Capture**
- Tap "+" opens MediaSourceSheet: "Take Photo" or "Choose from Gallery"
- Camera UI with photo/video toggle, activity badge overlay
- Gallery picker with 24-hour recency filter

**Step 3 -- Activity Selection**
- Bottom sheet with 9 sport icons (Running, Cycling, Yoga, etc. + "Other")
- Tap selects activity with acknowledgment animation (icon bounce + "Let's capture your moment!")

**Step 4 -- Preview and Frame**
- Immersive Apple Memories-style preview with blurred background
- Activity/metric widget row: tap to edit duration, distance, PR
- Template carousel: 5 frame styles (Shaky, Journal, Vogue, Fitness, Ticket)
- iOS-style wheel pickers for duration input
- Contextual metrics per activity (e.g., Distance/km for Running, Sets for GYM)
- "Save" commits to backend (Supabase storage + journey_activities table)

**Step 5 -- Celebration**
- Fullscreen "Activity Logged!" overlay with Lottie success tick
- Progress ring fills with glow effect
- If it's Day 3/6/9/12 (week milestone): enhanced "Week Complete!" celebration with confetti

**Step 6 -- Share Sheet**
- Appears after celebration (auto for milestones, optional otherwise)
- Framed activity card with Download and Copy actions
- Social sharing to WhatsApp, Instagram Stories, Twitter, etc.
- "VIEW PROGRESS" primary CTA navigates to Reel viewer

### Phase 2: Weekly AI Recap (Hook Point)

**Trigger**: Completing Day 3, 6, 9, or 12 (every 3rd activity)

1. Auto-redirect to /reel-generation route
2. Canvas-based engine renders a 9:16 recap video locally:
   - Personalized intro: "{NAME}'S JOURNEY -- WEEK {N} IN MOTION"
   - Week theme title (e.g., "CONQUER WILL POWER", "BUILD ENERGY")
   - 3 days x (metric card + photo hold) with Ken Burns + crossfade transitions
   - 20 visual template pool ensures variety
   - Royalty-free music matched to activity type
   - Outro with motivational quote
3. Progress bar with motivational phrases during generation
4. Recap cached locally (IndexedDB) + uploaded to Supabase Storage
5. Viewer: 9:16 player with liquid glass border, controls:
   - Regenerate (new random seed, transitions, music)
   - Download as video
   - Delete recap
   - "ADD TO MY STORY" -- publishes recap to community feed
   - Pull-to-refresh triggers regeneration
   - Tap to play/pause

### Phase 3: Community and Social (Retention Hook)

**Progress Page (Tile Journey Path)**
- Vertical tile path (12 tiles) with milestone labels
- Completed tiles glow, locked tiles are dimmed
- User avatar sits on latest completed tile
- Top story strip: horizontal scroll of all public activities from all users
- Locked/blurred cards for users who haven't shared publicly yet

**Reel Viewer (Stories-style)**
- Instagram Stories-like vertical swipe between users
- Tap left/right to cycle through a user's activities
- Auto-advance timer (10s per photo, video duration for video)
- Progress segments at top (like Instagram)
- Reactions: 10 fitness-themed 3D emojis (fire, clap, fistbump, flex, trophy, etc.)
- Owners see "Reacts So Far" summary sheet with reactor profiles
- Visitors see "Send Reaction" picker sheet
- Realtime notifications when someone reacts to your activity

**Notifications**
- Realtime Postgres changes subscription on activity_reactions table
- Toast notifications: "{Name} fired up your activity!"
- Bell icon with unread count badge on home page

### Phase 4: Journey Completion

- After 12 activities (4 weeks), the full journey is complete
- All 4 weekly recaps available for replay
- Final sharable reel combining the entire journey
- All progress tiles active on the tile path
- Community reactions accumulated across the journey

---

## PRD 4: Action Plan -- Step-by-Step Implementation

### Current State
The app is fully functional with all core features implemented. Below is the implementation status and the ordered steps that were followed to build it.

### Step 1: Foundation (Complete)
- [x] Vite + React + TypeScript + Tailwind project setup
- [x] Lovable Cloud (Supabase) connection
- [x] Database schema: profiles, journey_activities, activity_reactions tables
- [x] RLS policies for row-level security
- [x] Auth flow: email signup/login with email verification
- [x] Profile setup with avatar presets, custom upload + crop, name input
- [x] Protected routes with auth and profile checks

### Step 2: Activity Logging Core (Complete)
- [x] Home page with circular progress ring and mascot
- [x] MediaSourceSheet: camera vs gallery picker
- [x] Camera UI with photo/video capture (Capacitor bridge)
- [x] Gallery file picker with file type detection
- [x] Activity selection bottom sheet (9 sports + Other)
- [x] Preview page with Apple Memories aesthetic
- [x] 5 frame templates (Shaky, Journal, Vogue, Fitness, Ticket)
- [x] Contextual metric inputs per activity type
- [x] iOS-style wheel pickers for duration
- [x] Upload to Supabase Storage + upsert journey_activities
- [x] Sequential day enforcement (Day N before Day N+1)

### Step 3: Celebration and Sharing (Complete)
- [x] ActivityLoggedCelebration fullscreen overlay
- [x] Lottie tick animation + progress ring fill
- [x] Week-complete confetti for milestones (Day 3, 6, 9, 12)
- [x] ShareSheet with framed card preview
- [x] Download and copy image to clipboard
- [x] Social deep links (WhatsApp, Instagram, Twitter, etc.)
- [x] "VIEW PROGRESS" CTA navigation

### Step 4: AI Weekly Recap (Complete)
- [x] Canvas-based motion recap generator (3500+ lines)
- [x] 20 visual metric templates with activity-aware icons
- [x] Personalized intro card with user name and week theme
- [x] Ken Burns motion on photos, crossfade transitions
- [x] Royalty-free music from Pixabay (edge function)
- [x] IndexedDB + Supabase Storage caching
- [x] Regeneration with nuclear cache clear + random seed
- [x] Reel viewer: play/pause, download, delete, "ADD TO MY STORY"
- [x] Week-specific reel pills on home page

### Step 5: Community and Reactions (Complete)
- [x] Public/private activity toggle with "Make Public" sheet
- [x] Progress page with 12-tile journey path
- [x] Public feed: all users' shared activities
- [x] Reel viewer: Instagram Stories-style navigation
- [x] 10 fitness-themed 3D reaction emojis
- [x] Send reaction sheet + "Reacts So Far" summary
- [x] Realtime reaction notifications (Postgres changes)
- [x] Notification bell with count badge
- [x] Profile avatars on story cards and reel viewer

### Step 6: Polish and Native (Complete)
- [x] Apple Liquid Glass design system across all surfaces
- [x] Framer Motion page transitions and micro-animations
- [x] Pull-to-refresh on home and reel pages
- [x] Skeleton loaders for all async states
- [x] Haptic feedback via Capacitor
- [x] PWA manifest (pwa-192x192, pwa-512x512)
- [x] Capacitor config for iOS and Android builds
- [x] HealthKit integration bridge
- [x] Bottom navigation bar

### Future Enhancements (Not Yet Built)
- [ ] Final 4-week journey compilation reel
- [ ] Streak badges and achievement system
- [ ] Push notifications (FCM/APNs via Capacitor)
- [ ] Friend invite system with referral tracking
- [ ] Leaderboard: most reactions, longest streaks
- [ ] Activity reminder notifications (time-based nudges)
- [ ] HealthKit auto-sync for steps/calories overlay on cards

