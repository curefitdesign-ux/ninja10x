
## Rebuilding TokenFrame with Real Assets

### What We're Doing
Replacing all the programmatic CSS/SVG attempts (perforations, bird SVG paths) with the three real design assets the user has provided:

1. **`token.png`** — The complete stamp frame image (gray background, perforated scalloped edges, "CULT NINJA / Journey" header text) used as a transparent overlay on top of the user's photo — exactly how `TicketFrame` uses `ticket-frame.png`
2. **`Container-7.png`** — The actual cult.fit bird mascot icon for the stamp seal center
3. **`2-2.png`** — The double concentric circle rings for the stamp seal

### Layout Architecture (matching the reference image exactly)

```text
+------------------------------------------+
| token.png overlaid on top (z=10)         |
|  ┌── photo fills full card (z=0) ──┐     |
|  │                                  │     |
|  │      USER PHOTO (full bleed)     │     |
|  │                                  │     |
|  └──────────────────────────────────┘     |
|                                           |
| [circles + bird seal — bottom-left, z=20] |
| SWIMMING          <-- bold blue caps      |
| 02 HRS | 05 PERSONAL BEST SCORE          |
+------------------------------------------+
```

The `token.png` frame already contains:
- The perforated stamp border
- The gray background
- "CULT NINJA" header text in navy blue
- "Journey" italic script text
- A transparent/white center window where the photo shows through

### Files to Change

**Step 1 — Copy assets to project:**
- `user-uploads://token.png` → `src/assets/frames/token-bg.png`
- `user-uploads://Container-7.png` → `src/assets/frames/token-bird.png`
- `user-uploads://2-2.png` → `src/assets/frames/token-circles.png`

**Step 2 — Rewrite `src/components/frames/TokenFrame.tsx`:**

Remove all the complex programmatic code (PerforationBorder, PerforationRows, TopBottomHoles, LeftRightHoles, CircularStampSeal SVG with manual path). Replace with:

```tsx
import tokenBg from '@/assets/frames/token-bg.png';
import tokenBird from '@/assets/frames/token-bird.png';
import tokenCircles from '@/assets/frames/token-circles.png';

const TokenFrame = ({ imageUrl, isVideo, activity, week, day, duration, pr, ... }) => {
  return (
    <div className="w-[90%] mx-auto aspect-[9/16] overflow-hidden relative">
      
      {/* Layer 0: Full-bleed user photo (fills entire card) */}
      <div className="absolute inset-0 z-0">
        <img/video src={imageUrl} ... />
      </div>

      {/* Layer 1: Stamp frame overlay — token.png covers the card,
          the frame's white center window reveals the photo underneath */}
      <img
        src={tokenBg}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        style={{ objectFit: 'fill' }}
      />

      {/* Layer 2: Stamp seal — circles + bird, bottom-left area */}
      <div className="absolute z-20" style={{ bottom: '16%', left: '4%', width: '22%' }}>
        {/* Circles ring behind bird */}
        <img src={tokenCircles} className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain' }} />
        {/* Bird mascot centered inside rings */}
        <img src={tokenBird} className="relative w-[55%] h-auto mx-auto block" style={{ marginTop: '22%' }} />
      </div>

      {/* Layer 3: Activity name + metrics in the bottom gray strip */}
      <div className="absolute z-20 bottom-0 left-0 right-0 text-center" style={{ paddingBottom: '4%' }}>
        <div style={{ fontFamily: 'Montserrat bold', color: '#0a5278', textTransform: 'uppercase' }}>
          {activity}
        </div>
        <div style={{ color: '#808080', fontSize: 'small' }}>
          {metricsLine}
        </div>
      </div>
    </div>
  );
};
```

### Key Positioning Details
Looking at `token.png` reference image carefully:
- The frame has a **top gray strip** (~20% height) containing "CULT NINJA / Journey" — already baked into the PNG
- The **photo window** is the white/transparent middle area (~55% height)
- There is a **bottom gray strip** (~25% height) below the photo for activity name + metrics
- The stamp seal sits at the **bottom-left of the bottom gray strip**, overlapping slightly with the photo boundary

The `token.png` overlay uses `objectFit: 'fill'` to stretch to fill the 9:16 container, matching exactly how `TicketFrame` handles `ticket-frame.png`.

### What Gets Removed
- `PerforationBorder` component (400+ lines of programmatic circles)
- `PerforationRows`, `TopBottomHoles`, `LeftRightHoles` sub-components
- `CircularStampSeal` SVG with manual bird path
- All the complex CSS mask attempts
- The Google Fonts `<link>` tag (fonts already in token.png image)

The result will be pixel-perfect to the reference design with far simpler code (~80 lines vs ~484 lines).
