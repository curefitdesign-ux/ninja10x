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
  label1?: string;        // secondary metric unit (e.g. "km") — used for box 2 subtext
  label2?: string;        // primary metric unit (e.g. "min") — combined with label2Name for box 1
  label1Name?: string;    // secondary metric name (e.g. "Distance") — for box 2 label
  label2Name?: string;    // primary metric name  (e.g. "Duration") — for box 1 "UNIT | NAME"
}

/**
 * Holographic Frame — pixel-perfect match to reference design (Frame_2147223513).
 *
 * Metric box layout (bottom-right corner):
 *  BOX 1 (white/salmon chamfered): large bold NUMBER + "UNIT | LABEL" subtext
 *  BOX 2 (dark):                   large bold NUMBER + white label subtext below
 *
 * Layer stack (bottom → top):
 *  0. Holographic gradient base
 *  1. User media
 *  2. Holographic overlay PNG
 *  3. Activity header
 *  4. Sidebar week/day text
 *  5. Metric PNG (conditional)
 *  6. Metric text overlays (pixel-perfect inside boxes)
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
  label1Name,
  label2Name,
}: HolographicFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Box 1 (top, light box): shows duration value + "UNIT | METRIC NAME"
  // label2 = primary unit (e.g. "min"), label2Name = primary metric name (e.g. "Duration")
  const durationMetricName = label2Name || 'Duration';
  const durationUnit = label2?.toUpperCase() || '';
  
  // Box 2 (bottom, dark box): shows pr value + metric name label
  // label1 = secondary unit (e.g. "km"), label1Name = secondary metric name (e.g. "Distance")
  const metricLabel = label1Name || label1 || 'Distance';

  const hasMetric1 = !!duration;
  const hasMetric2 = !!pr;

  // Strip letters/units from duration value for display (e.g. "30 min" → "30")
  const durationRaw = duration.replace(/[a-zA-Z\s]/g, '').trim() || duration;

  // Subtext for metric 1 box: "MIN | DURATION" style matching reference
  const metric1Subtext = durationUnit
    ? `${durationUnit} | ${durationMetricName.toUpperCase()}`
    : durationMetricName.toUpperCase();

  // Strip units from pr/secondary metric value for display
  const prValue = pr.replace(/[a-zA-Z\s]/g, '').trim() || pr;

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div
      className="w-[90%] mx-auto aspect-[9/16] relative overflow-hidden"
      style={{ borderRadius: '0px', containerType: 'size' }}
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

      {/* ── LAYER 2: Holographic overlay PNG ── */}
      <img
        src={holographicOverlay}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2, objectFit: 'fill' }}
      />

      {/* ── LAYER 3: Activity name — large bold header at top ── */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-center"
        style={{
          zIndex: 10,
          height: '13%',
          paddingLeft: '10%',
          paddingRight: '3%',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(14px, 6.5cqw, 32px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'visible',
            textOverflow: 'clip',
            textAlign: 'center',
          }}
        >
          {activity || 'Activity'}
        </span>
      </div>

      {/* ── LAYER 4: Left sidebar "*** WEEK N / DAY N ***" rotated ── */}
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

      {/* ── LAYER 5: Metric PNG ── */}
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

      {/* BOX 1 text: Large number + unit | label subtext — shifted slightly down */}
      {hasMetric1 && (
        <div
          className="absolute"
          style={{
            zIndex: 13,
            bottom: '18%',
            right: '10px',
            width: '30%',
            height: '13%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: '8%',
            paddingRight: '4%',
            paddingTop: '2%',
          }}
        >
          {/* Large bold number */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(22px, 10cqw, 52px)',
              color: '#000000',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {durationRaw}
          </div>
          {/* Unit | Label subtext — shifted left by 10px */}
          <div
            style={{
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(6px, 2.2cqw, 11px)',
              color: '#000000',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: '3px',
              marginLeft: '-10px',
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
            }}
          >
            {metric1Subtext}
          </div>
        </div>
      )}

      {/* BOX 2 text: Large number + white label subtext */}
      {hasMetric2 && (
        <div
          className="absolute"
          style={{
            zIndex: 13,
            bottom: '5%',
            right: '0%',
            width: '30%',
            height: '14%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: '8%',
            paddingRight: '4%',
          }}
        >
          {/* Large bold number — shifted down by 5px */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(20px, 9cqw, 46px)',
              color: '#000000',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              marginTop: '5px',
            }}
          >
            {prValue}
          </div>
          {/* White label subtext — 10px down, 5px left */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Arial', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(6px, 2.2cqw, 11px)',
              color: '#ffffff',
              letterSpacing: '0.02em',
              textTransform: 'capitalize',
              marginTop: '15px',
              marginLeft: '-5px',
              whiteSpace: 'nowrap',
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
