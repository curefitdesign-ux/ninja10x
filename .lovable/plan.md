
## New "Token" Frame Template — Postage Stamp Style

### What We're Building
A new 7th sharing frame template called **"Token"** — styled as a collectible postage stamp. It matches the reference image exactly:

- **White/light gray background** (`#f0f0f0`)
- **Perforated/scalloped stamp edges** all around (created with CSS `radial-gradient` punch-out border technique — no image asset needed)
- **"CULT NINJA"** in bold Montserrat-style uppercase dark blue (`#0a5278`) at the top
- **"Journey"** in italic serif script below it (Playfair Display-like using a serif italic font)
- **Full photo** taking up ~65% of the card height, edge-to-edge with small margin
- **Circular stamp seal** in the bottom-left corner of the photo — shows "WEEK {N} | DAY {N}" text rotating around a bird SVG icon
- **Activity name** in large bold Montserrat dark blue at the bottom
- **Metrics** in gray Montserrat below the activity name (e.g., "02 HRS | 05 PERSONAL BEST SCORE")

### Technical Approach

#### 1. Create `src/components/frames/TokenFrame.tsx`
A new React component with these sections:

```text
+------------------------------------------+
| [scalloped border all around via CSS]    |
|  CULT NINJA        <-- bold blue caps    |
|  Journey           <-- italic serif      |
|  +------------------------------------+  |
|  |                                    |  |
|  |       USER PHOTO                   |  |
|  | [stamp seal]                       |  |
|  +------------------------------------+  |
|  SWIMMING          <-- bold blue caps   |
|  02 HRS | 05 PERSONAL BEST SCORE        |
+------------------------------------------+
```

**Stamp edge CSS technique:** Use `radial-gradient` repeated along all 4 edges to punch out semi-circles, creating the classic perforated stamp look — no PNG asset required.

**Stamp seal SVG:** Inline SVG with circular text using `<textPath>` on a `<circle>` path, repeating "WEEK {N} · DAY {N} ·" around the circumference, with a bird/dove icon in the center (simple SVG path).

**Props interface** — matches all existing frames:
```typescript
interface TokenFrameProps {
  imageUrl: string;
  isVideo?: boolean;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
  label1?: string;
  label2?: string;
}
```

#### 2. Register in `src/pages/Preview.tsx`
Four changes needed:

1. **Import** `TokenFrame` at the top
2. **Add `'token'` to the `FRAMES` constant** — `['shaky', 'journal', 'vogue', 'fitness', 'ticket', 'token']`
3. **Add `token` to `FRAME_COLORS`** with a blue/navy accent matching the stamp palette:
   ```typescript
   token: {
     accent: 'rgba(10, 82, 120, 0.45)',
     gradient: 'linear-gradient(160deg, rgba(15, 100, 145, 0.35) 0%, rgba(5, 40, 60, 0.6) 100%)'
   }
   ```
4. **Add `case 'token'`** in `renderFrame()` switch and in the 3 JSX conditional render spots (main preview, off-screen capture div, and carousel thumbnails)

### Files to Create/Edit
- **NEW** `src/components/frames/TokenFrame.tsx`
- **EDIT** `src/pages/Preview.tsx` (4 small changes)

### Design Details
- Background: `#e8e8e8` (light stamp gray)
- Stamp holes: `radial-gradient` 8px circles punched from the background along all edges
- Top header text: `#0a5278` dark navy blue, Montserrat-weight bold uppercase ~52px
- "Journey": `#1a1a1a` black italic serif ~36px
- Photo: takes 60–65% height, 4px margin on sides
- Circular stamp text: white text on transparent SVG, 90px circle at 40px from bottom-left of photo
- Activity name: `#0a5278` bold uppercase Montserrat ~44px
- Metrics: `#808080` gray medium ~16px, formatted as `{duration} | {pr} {metricLabel}`
