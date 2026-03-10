

## Problem

The `PullToRefresh` component wraps the entire Reel page and uses framer-motion's `onPan` handler, which intercepts all pointer/touch events. This conflicts with the horizontal native scroll (`overflow-x-auto` with `scroll-snap`) used for swiping between user stories. The pan handler captures vertical and horizontal gestures alike, preventing the browser's native horizontal scroll from working properly.

## Solution

Two changes are needed:

### 1. Fix PullToRefresh to not interfere with horizontal scrolling

Update `src/components/PullToRefresh.tsx`:
- Add a directional lock: only activate pull-to-refresh when the gesture is **predominantly vertical** (vertical offset > horizontal offset).
- Track whether the current gesture is a "pull" gesture. If the user starts swiping horizontally, ignore the gesture entirely.
- Use a ref to track gesture direction decided on first meaningful movement.

### 2. Ensure touch-action compatibility

The PullToRefresh's `motion.div` with `onPan` sets up pointer event listeners that can steal events from the inner scroll container. Add `touch-action: pan-x` or remove the `onPan` approach in favor of touch event listeners that check direction before engaging.

## Implementation Details

**PullToRefresh.tsx** changes:
- Add a `gestureDirectionRef` that tracks `'undecided' | 'vertical' | 'horizontal'`
- On first significant movement (>10px), decide direction
- Only set `pullDistance` if direction is vertical
- Reset direction ref on pan end
- Add `style={{ touchAction: 'pan-x' }}` to the motion container so the browser can still handle horizontal scrolling natively

This is a minimal, targeted fix — no changes to the Reel page itself.

