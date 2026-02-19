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
  label1?: string;
  label2?: string;
}

/**
 * Holographic Frame
 *
 * Layer stack (bottom → top):
 *  0. Holographic gradient background (full bleed)
 *  1. User media (full bleed)
 *  2. Holographic overlay PNG — NO blend mode, straight on top
 *  3. Header text  "CULT NINJA — {ACTIVITY}"  (small, top strip)
 *  4. Sidebar text "*** WEEK N / DAY N ***"   (left strip, rotated, large)
 *  5a. Metric 1 PNG  (if duration entered)
 *  5b. Metric 2 PNG  (if pr entered, stacks below metric 1)
 *  6a. Metric 1 text overlay (value + label, text only)
 *  6b. Metric 2 text overlay (value + label, text only)
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

  // Metric box dimensions as % of card height
  // Metric 1 PNG sits from ~79% → ~89% height, right edge
  // Metric 2 PNG sits from ~89% → ~100% height, right edge
  // Both right-aligned, width ~38% of card

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

      {/* ── LAYER 2: Holographic overlay PNG — NO blend mode ── */}
      <img
        src={holographicOverlay}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 2,
          objectFit: 'fill',
          // NO mixBlendMode — straight overlay
        }}
      />

      {/* ── LAYER 3: Header "CULT NINJA — {ACTIVITY}" (small) ── */}
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
            fontSize: 'clamp(10px, 3.5vw, 15px)',   // reduced from 5.6vw → 3.5vw
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
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

      {/* ── LAYER 4: Left sidebar "*** WEEK N / DAY N ***" (large) ── */}
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
            fontWeight: 900,
            fontSize: 'clamp(7px, 2.6vw, 11px)',   // increased from 1.5vw → 2.6vw
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

      {/* ── LAYER 5a: Metric 1 PNG (duration) ──
          Only shown when duration is entered.
          Positioned bottom-right, top half of the metric zone. */}
      {hasMetric1 && (
        <img
          src={metric1Png}
          alt=""
          className="absolute pointer-events-none"
          style={{
            zIndex: 11,
            objectFit: 'fill',
            right: 0,
            bottom: hasMetric2 ? '21%' : '0%',
            width: '40%',
            height: hasMetric2 ? '21%' : '21%',
          }}
        />
      )}

      {/* ── LAYER 5b: Metric 2 PNG (pr) ──
          Only shown when pr is entered.
          Stacks below metric 1 PNG. */}
      {hasMetric2 && (
        <img
          src={metric2Png}
          alt=""
          className="absolute pointer-events-none"
          style={{
            zIndex: 11,
            objectFit: 'fill',
            right: 0,
            bottom: 0,
            width: '40%',
            height: '22%',
          }}
        />
      )}

      {/* ── LAYER 6a: Metric 1 TEXT (duration value + label) ──
          Positioned exactly over the metric-1 PNG area.
          Text only — no background box. */}
      {hasMetric1 && (
        <div
          className="absolute flex flex-col justify-center"
          style={{
            zIndex: 12,
            right: '2%',
            bottom: hasMetric2 ? '22%' : '1%',
            width: '37%',
            height: '20%',
            paddingLeft: '8%',
            paddingRight: '4%',
          }}
        >
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(20px, 8vw, 34px)',
              color: '#000000',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {duration.replace(/[a-zA-Z\s]/g, '') || duration}
          </div>
          <div
            style={{
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(5px, 1.6vw, 7px)',
              color: '#000000',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            HRS | {durationLabel.toUpperCase()}
          </div>
        </div>
      )}

      {/* ── LAYER 6b: Metric 2 TEXT (pr value + label) ──
          Positioned exactly over the metric-2 PNG area.
          Text only — no background box. */}
      {hasMetric2 && (
        <div
          className="absolute flex flex-col justify-center"
          style={{
            zIndex: 12,
            right: '2%',
            bottom: '1%',
            width: '37%',
            height: '21%',
            paddingLeft: '8%',
            paddingRight: '4%',
          }}
        >
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(18px, 7.5vw, 32px)',
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {pr}
          </div>
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
