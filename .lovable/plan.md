

## Stacked Cards Behind Main Card — Deck Style

The reference image shows a vertical card stack where 2 cards peek out **behind and below** the main card, progressively offset downward and slightly narrower — like a deck of cards. Currently, the code fans them out left/right with rotation. The bottom peek strips also need to be removed since the stacked cards themselves will serve that purpose.

### Changes to `src/pages/Reel.tsx`

**1. Replace the fanned-out stacked cards (lines ~1801-1898) with vertically stacked deck cards:**
- Remove the left/right fan-out (`x: -12, rotate: -3` and `x: 8, rotate: 2`)
- Instead, stack them directly behind the main card, offset only on the Y axis (downward) and slightly scaled down
- Card 1 (middle): `y: 12, scale: 0.95`, full opacity ~0.7, `zIndex: 2`
- Card 2 (back): `y: 24, scale: 0.90`, opacity ~0.5, `zIndex: 1`
- Both cards: `borderRadius: 12px` (slightly rounded like the reference), centered horizontally, same aspect ratio
- Keep thumbnail images on stacked cards for visual richness
- Remove `rotate` entirely — cards are perfectly aligned vertically

**2. Remove the bottom peek strips (lines ~2168-2216):**
- Delete the two `motion.div` peek strips since the stacked cards now fulfill that role

**3. Adjust main card z-index to stay on top (`zIndex: 3` — already correct)**

### Visual Result
```text
  ┌──────────────┐  ← back card (scale 0.90, y+24)
  │              │
  ├──────────────┤  ← middle card (scale 0.95, y+12)  
  │              │
  ┌──────────────┐  ← main card (scale 1.0, y: 0)
  │              │
  │   CONTENT    │
  │              │
  └──────────────┘
```

The stacked cards remain tappable to open the History Gallery. This matches the reference image's deck-of-cards aesthetic pixel-perfectly.

