import { useRef, useEffect } from 'react';
import holographicOverlay from '@/assets/frames/holographic-overlay.png';

interface HolographicFrameProps {
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

/**
 * Holographic Frame — pixel-perfect recreation of template_8 reference.
 *
 * Layer stack (bottom → top):
 *  0. Holographic gradient background (full bleed)
 *  1. User media (full bleed — photo shows through overlay's white window)
 *  2. Holographic overlay PNG @ mix-blend-mode: multiply, opacity 1
 *     — white areas = transparent (photo shows) / colored areas = frame shows
 *  3. Header text   "CULT NINJA — {ACTIVITY}"  (above photo, in top strip)
 *  4. Sidebar text  "*** WEEK N / DAY N ***"   (left strip, rotated -90°)
 *  5. Metric boxes  (bottom-right notch, only when user has entered metrics)
 */
const HolographicFrame = ({
  imageUrl,
  isVideo,
  activity,
  week,
  day,
  duration,
  pr,
  imagePosition,
  imageScale,
  label1,
  label2,
}: HolographicFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Label defaults matching activity context
  const durationLabel = label2 || 'Duration';
  const metricLabel   = label1 || 'Distance';

  const hasMetric1 = !!duration;
  const hasMetric2 = !!pr;

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div
      className="w-[90%] mx-auto aspect-[9/16] relative overflow-hidden"
      style={{ borderRadius: '0px' }}
    >
      {/* ─────────────────────────────────────────────────────
          LAYER 0 — Holographic gradient base (full card)
          Matches: blue-gray top, cyan-teal left, peach bottom-right
         ───────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 0,
          background: `
            radial-gradient(ellipse 55% 35% at 6% 55%,  rgba(0, 224, 210, 0.80) 0%, transparent 65%),
            radial-gradient(ellipse 55% 40% at 85% 92%, rgba(238, 155, 120, 0.90) 0%, transparent 55%),
            radial-gradient(ellipse 70% 30% at 15% 4%,  rgba(165, 172, 215, 0.85) 0%, transparent 55%),
            radial-gradient(ellipse 50% 30% at 92% 8%,  rgba(145, 158, 218, 0.70) 0%, transparent 50%),
            radial-gradient(ellipse 60% 25% at 50% 0%,  rgba(180, 185, 220, 0.60) 0%, transparent 60%),
            linear-gradient(175deg, #b2b9d8 0%, #c4cce4 28%, #a0d0cc 62%, #d6b8a8 100%)
          `,
        }}
      />

      {/* ─────────────────────────────────────────────────────
          LAYER 1 — User photo / video (full bleed)
          The multiply overlay will mask it to the white window
         ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {isVideo ? (
          <video
            ref={videoRef}
            src={imageUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            }}
          />
        ) : (
          <img
            src={imageUrl}
            alt="Activity"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            }}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────
          LAYER 2 — Holographic overlay PNG
          mix-blend-mode: multiply  |  opacity: 1  (no reduction)
          White = photo shows through / Colored = frame gradient
         ───────────────────────────────────────────────────── */}
      <img
        src={holographicOverlay}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 2,
          objectFit: 'fill',
          mixBlendMode: 'multiply',
          opacity: 1,
        }}
      />

      {/* ─────────────────────────────────────────────────────
          LAYER 3 — Header: "CULT NINJA — {ACTIVITY}"
          Sits in the blue-gray top strip (~0–15% of card height)
          Full width, left-padded past the left holographic strip
         ───────────────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center"
        style={{
          zIndex: 10,
          height: '14%',
          paddingLeft: '3%',
          paddingRight: '2%',
        }}
      >
        <span
          style={{
            fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(15px, 5.6vw, 24px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            width: '100%',
          }}
        >
          CULT NINJA — {activity || 'Activity'}
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────
          LAYER 4 — Left sidebar vertical text
          "*** WEEK N / DAY N ***"  rotated -90°
          In the left cyan/teal holographic strip (~0–9% width)
         ───────────────────────────────────────────────────── */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          zIndex: 10,
          top: '14%',
          left: 0,
          width: '9%',
          bottom: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(4.5px, 1.5vw, 6.5px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            whiteSpace: 'nowrap',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center',
            display: 'block',
          }}
        >
          *** WEEK {week} / DAY {day} ***
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────
          LAYER 5 — Metric boxes
          Positioned in the bottom-right notch of the overlay
          (~62–96% width, ~79–100% height)
          Stack grows as user enters metrics — no placeholder boxes
         ───────────────────────────────────────────────────── */}
      {(hasMetric1 || hasMetric2) && (
        <div
          className="absolute flex flex-col"
          style={{
            zIndex: 10,
            right: '3%',
            bottom: '1.5%',
            width: '36%',
            gap: 0,
          }}
        >
          {/* ── Metric Box 1: Duration ──
              White background, thin black border, chamfered top-left corner.
              Only shown when duration is entered. */}
          {hasMetric1 && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #000000',
                borderBottom: hasMetric2 ? '1px solid #000000' : '2px solid #000000',
                padding: '5% 8% 4%',
                /* Chamfered top-left corner via clip-path */
                clipPath: 'polygon(14px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 14px)',
              }}
            >
              {/* Large metric value */}
              <div
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(22px, 8vw, 36px)',
                  color: '#000000',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {duration.replace(/[^0-9:/.]/g, '') || duration}
              </div>
              {/* Sub-label */}
              <div
                style={{
                  fontFamily: "'Arial', 'Helvetica', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(5.5px, 1.8vw, 7.5px)',
                  color: '#000000',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginTop: '3px',
                }}
              >
                HRS | {durationLabel.toUpperCase()}
              </div>
            </div>
          )}

          {/* ── Metric Box 2: PR / secondary metric ──
              Solid black background, white text.
              Chamfered top-left only when it's the first (and only) box.
              Rounded bottom-right corner.
              Only shown when pr is entered. */}
          {hasMetric2 && (
            <div
              style={{
                backgroundColor: '#000000',
                border: '2px solid #000000',
                borderTop: hasMetric1 ? 'none' : '2px solid #000000',
                padding: '5% 8% 5%',
                borderRadius: hasMetric1 ? '0 0 6px 0' : '0 0 6px 0',
                /* Chamfered top-left only when standalone (no metric1 above it) */
                clipPath: !hasMetric1
                  ? 'polygon(14px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 14px)'
                  : undefined,
              }}
            >
              {/* Large metric value */}
              <div
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(20px, 7.5vw, 34px)',
                  color: '#ffffff',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {pr}
              </div>
              {/* Sub-label — supports two-word wrapping like "Personal Best Score" */}
              <div
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(6px, 2vw, 9px)',
                  color: '#ffffff',
                  letterSpacing: '0.01em',
                  textTransform: 'capitalize',
                  marginTop: '3px',
                  lineHeight: 1.2,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                {metricLabel}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HolographicFrame;
