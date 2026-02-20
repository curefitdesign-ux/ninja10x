import { useRef, useEffect } from 'react';
import holographicOverlay from '@/assets/frames/holographic-overlay.png';
import metric1Png from '@/assets/frames/metric-1.png';
import metric2Png from '@/assets/frames/metric-2.png';

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
  label1?: string;   // secondary metric name (e.g. "Distance")
  label2?: string;   // primary metric name  (e.g. "Duration")
}

/**
 * Holographic Frame — pixel-perfect match to reference design.
 *
 * PNG Layer logic:
 *  - hasMetric1 only  → metric-1.png (single white chamfered box)
 *  - hasMetric1+2     → metric-2.png (white box + black box — both in one PNG)
 *  - !hasMetric1      → no metric PNG shown
 *
 * Layer stack (bottom → top):
 *  0. Holographic gradient base
 *  1. User media
 *  2. Holographic overlay PNG (no blend mode)
 *  3. Header "CULT NINJA — {ACTIVITY}"  — large, fills top strip
 *  4. Sidebar "*** WEEK N / DAY N ***"  — rotated, medium size
 *  5. Metric PNG (conditional)
 *  6. Metric text overlays
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

  // label2 = primary (Duration), label1 = secondary (Distance, Runs, etc.)
  const durationLabel = label2 || 'Duration';
  const metricLabel   = label1 || 'Distance';

  const hasMetric1 = !!duration;
  const hasMetric2 = !!pr;

  // Strip letters/units from duration value for display (e.g. "30 min" → "30")
  const durationValue = duration.replace(/[a-zA-Z\s]/g, '') || duration;

  // Strip units from pr/secondary metric value for display (e.g. "10.5km" → "10.5", "3 sets" → "3")
  const prValue = pr.replace(/[a-zA-Z\s]/g, '') || pr;

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
      {/* ── LAYER 0: Holographic gradient base ── */}
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

      {/* ── LAYER 1: User media ── */}
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
            style={{ transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` }}
          />
        ) : (
          <img
            src={imageUrl}
            alt="Activity"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` }}
          />
        )}
      </div>

      {/* ── LAYER 2: Holographic overlay PNG — no blend mode ── */}
      <img
        src={holographicOverlay}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2, objectFit: 'fill' }}
      />

      {/* ── LAYER 3: Header "CULT NINJA — {ACTIVITY}"
          Matches reference: very large black bold text across the full top strip.
          Top strip height = ~13% of card. ── */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center"
        style={{
          zIndex: 10,
          height: '13%',
          paddingLeft: '4%',
          paddingRight: '3%',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(8px, 3.5cqw, 16px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'visible',
            textOverflow: 'clip',
            display: 'block',
            width: '100%',
          }}
        >
          CULT NINJA — {activity || 'Activity'}
        </span>
      </div>

      {/* ── LAYER 4: Left sidebar "*** WEEK N / DAY N ***"
          Rotated -90°, medium-large, in the left cyan strip. ── */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          zIndex: 10,
          top: '13%',
          left: 0,
          width: '9%',
          bottom: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            fontWeight: 900,
            // Medium size — clearly readable like reference
            fontSize: 'clamp(5.5px, 2cqw, 9px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '0.20em',
            whiteSpace: 'nowrap',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center',
            display: 'block',
          }}
        >
          *** WEEK {week} / DAY {day} ***
        </span>
      </div>

      {/* ── LAYER 5: Metric PNG ──
          Logic:
          - metric-1.png: single white chamfered box → shown when ONLY duration
          - metric-2.png: white box + black box  → shown when BOTH metrics exist
          Both PNGs are full-card size; boxes sit in the bottom-right corner. ── */}
      {hasMetric1 && (
        <img
          src={metric1Png}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 11, objectFit: 'fill' }}
        />
      )}
      {hasMetric2 && (
        <img
          src={metric2Png}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 12, objectFit: 'fill' }}
        />
      )}

      {/* ── LAYER 6a: Metric 1 TEXT (duration) ──
          Positioned over the WHITE box in the bottom-right.
          When both metrics: white box = bottom 12%–24% zone.
          When only metric 1: white box = bottom ~0–20% zone. ── */}
      {hasMetric1 && (
        <div
          className="absolute flex flex-col justify-start"
          style={{
            zIndex: 13,
            right: 0,
            bottom: 'calc(21% - 10px)',
            width: '32%',
            height: '12%',
            paddingTop: '2%',
            paddingLeft: '6%',
            paddingRight: '2%',
          }}
        >
          {/* Large numeric value */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(16px, 7cqw, 36px)',
              color: '#000000',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            }}
          >
            {durationValue}
          </div>
          {/* Small label — left-aligned, no truncation */}
          <div
            style={{
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(7px, 2.2cqw, 11px)',
              color: '#000000',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              marginTop: '3px',
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textAlign: 'left',
            }}
          >
            {durationLabel.toUpperCase()}
          </div>
        </div>
      )}

      {/* ── LAYER 6b: Metric 2 NUMBER (pr value) — black text, 5% from bottom ── */}
      {hasMetric2 && (
        <div
          className="absolute flex flex-col justify-end"
          style={{
            zIndex: 13,
            right: 0,
            bottom: '9%',
            width: '32%',
            height: '7%',
            paddingLeft: '6%',
            paddingRight: '2%',
          }}
        >
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(14px, 6cqw, 32px)',
              color: '#000000',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            }}
          >
            {prValue}
          </div>
        </div>
      )}

      {/* ── LAYER 6c: Metric 2 SUBTEXT (label) — white text, 4% from bottom ── */}
      {hasMetric2 && (
        <div
          className="absolute flex flex-col justify-start"
          style={{
            zIndex: 13,
            right: 0,
            bottom: '4%',
            width: '32%',
            height: '5%',
            paddingLeft: '6%',
            paddingRight: '2%',
            paddingTop: '1%',
          }}
        >
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(4px, 1.6cqw, 8px)',
              color: '#ffffff',
              letterSpacing: '0.01em',
              textTransform: 'capitalize',
              lineHeight: 1.2,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflow: 'visible',
            }}
          >
            {metricLabel}
          </div>
        </div>
      )}
    </div>
  );
};

export default HolographicFrame;
