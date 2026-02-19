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

  // Strip letters from duration value for display (e.g. "30 min" → "30")
  const durationValue = duration.replace(/[a-zA-Z\s]/g, '') || duration;

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
          Reference: massive bold text fills full top strip edge-to-edge ── */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center"
        style={{
          zIndex: 10,
          height: '13%',
          paddingLeft: '3%',
          paddingRight: '3%',
          overflow: 'visible',
        }}
      >
        <span
          style={{
            fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(11px, 5.5cqw, 26px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'visible',
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

      {/* ── LAYER 6a: Metric 1 TEXT (duration) — WHITE box ── */}
      {hasMetric1 && (
        <div
          className="absolute flex flex-col justify-start"
          style={{
            zIndex: 13,
            right: 0,
            // Moved up by ~20% of box height relative to previous position
            bottom: hasMetric2 ? '14.4%' : '3%',
            width: '38%',
            height: hasMetric2 ? '13%' : '20%',
            paddingTop: '1.5%',
            paddingLeft: '5%',
            paddingRight: '2%',
          }}
        >
          {/* Large numeric value — big, like "02" in reference */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(20px, 9cqw, 48px)',
              color: '#000000',
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            }}
          >
            {durationValue}
          </div>
          {/* Label — "MIN | DURATION" */}
          <div
            style={{
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(5px, 1.8cqw, 9px)',
              color: '#000000',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: '3px',
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textAlign: 'left',
            }}
          >
            MIN | {durationLabel.toUpperCase()}
          </div>
        </div>
      )}

      {/* ── LAYER 6b: Metric 2 TEXT (pr / secondary) — BLACK box ── */}
      {hasMetric2 && (
        <div
          className="absolute flex flex-col justify-start"
          style={{
            zIndex: 13,
            right: 0,
            bottom: '1%',
            width: '38%',
            height: '14%',
            paddingTop: '1.5%',
            paddingLeft: '5%',
            paddingRight: '2%',
          }}
        >
          {/* Large pr value — "05/10" style */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(18px, 8cqw, 42px)',
              color: '#ffffff',
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            }}
          >
            {pr}
          </div>
          {/* Bold white label — "Personal Best Score" */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(5px, 1.9cqw, 10px)',
              color: '#ffffff',
              letterSpacing: '0.01em',
              textTransform: 'capitalize',
              marginTop: '3px',
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
