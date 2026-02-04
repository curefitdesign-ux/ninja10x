
# Plan: Remove Lovable AI Credit Exhausted Popup

## Overview
Remove the error popup/toast that appears when Lovable AI credits are exhausted (402 Payment Required response).

## Changes Required

### 1. Backend Edge Function
**File:** `supabase/functions/generate-fitness-reel/index.ts`

**Current (line 299-301):**
```typescript
if (narrationResponse.status === 402) {
  throw new Error("Lovable AI credits exhausted. Please add credits in Settings → Workspace → Usage.");
}
```

**Change:** Remove or comment out the specific 402 handling so it falls through to the generic error.

### 2. Frontend Hook
**File:** `src/hooks/use-fitness-reel.ts`

**Current (line 184):**
```typescript
if (response.status === 402) throw new Error('Please add credits to continue using AI features.');
```

**Change:** Remove this line so the 402 error is handled silently or with a generic fallback.

### 3. Runway Service (Optional)
**File:** `src/services/runway-service.ts`

**Current (lines 106-108):**
```typescript
if (response.status === 402) {
  throw new Error('Insufficient credits');
}
```

**Change:** Remove this error handling as well for consistency.

## Technical Approach
- Remove the explicit 402 status checks that generate user-facing error messages
- The errors will either fall through to generic error handling or be silently handled
- This affects all AI credit-related popups across the reel generation flow

## Impact
- Users will no longer see "credit exhausted" or "add credits" popups
- If credits are exhausted, the reel generation will fail silently or show a generic "Failed to generate reel" message instead
