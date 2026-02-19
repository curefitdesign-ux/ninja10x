import { useRef, useEffect } from 'react';
import holographicOverlay from '@/assets/frames/holographic-overlay.png';
import metric1Bg from '@/assets/frames/holographic-metric1.png';
import metric2Bg from '@/assets/frames/holographic-metric2.png';

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

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  // Extract numeric duration value (e.g. "02" from "2 hrs")
  const durationValue = duration
    ? duration.replace(/[^0-9./:]/g, '').trim() || duration.replace(/\s*(hrs?|min.*)/i, '').trim()
    : '00';
  const durationUnit = duration
    ? duration.toLowerCase().includes('min') ? 'MINS' : 'HRS'
    : 'HRS';
  const metricLabel = label1 || 'DURATION';
  const prValue = pr || '—';
  const prLabel = label2 || 'Personal Best Score';

  return (
    // overflow-hidden clips the photo; drop-shadow on outer for depth
    <div
      className="w-full aspect-[9/16] relative overflow-hidden"
      style={{
        // Holographic gradient — this IS the visible border/background
        background: 'linear-gradient(170deg, #b0b5d0 0%, #9ab5d0 12%, #6dcfcf 28%, #a0d0a8 44%, #d8c07a 62%, #dea080 76%, #c8a0b5 100%)',
      }}
    >
      {/* ── Layer 1: User photo — positioned inside the overlay's white window ──
          Overlay white window: top ~10.5%, left ~4.5%, right ~4.8%, bottom ~13.5%     */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '10.5%',
          left: '4.5%',
          right: '4.8%',
          bottom: '13.5%',
          zIndex: 2,
        }}
      >
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

      {/* ── Layer 2: Holographic overlay — full opacity, multiply blend ──
          White areas in overlay = transparent (shows photo through)
          Gradient areas = visible holographic border                    */}
      <img
        src={holographicOverlay}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          objectFit: 'fill',
          zIndex: 3,
          mixBlendMode: 'multiply',
          opacity: 1,
        }}
      />

      {/* ── Layer 3: Header "CULT NINJA — ACTIVITY" ──
          Sits in the top gradient strip (~10% tall), above the photo window  */}
      <div
        className="absolute"
        style={{
          top: '1.5%',
          left: '4.5%',
          right: '4.5%',
          zIndex: 10,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', Impact, 'Helvetica Neue', sans-serif",
            fontWeight: 900,
            // Small enough that even long activity names don't truncate
            fontSize: 'clamp(10px, 3.8vw, 17px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            wordBreak: 'break-word',
          }}
        >
          CULT NINJA — {activity || 'WORKOUT'}
        </div>
      </div>

      {/* ── Layer 4: Left vertical WEEK / DAY label ──
          Sits in the left holographic border strip                       */}
      <div
        className="absolute"
        style={{
          left: '0',
          top: '18%',
          bottom: '22%',
          width: '5%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            fontFamily: "'Arial', 'Courier New', monospace",
            fontWeight: 700,
            fontSize: 'clamp(5px, 1.6vw, 8px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            whiteSpace: 'nowrap',
          }}
        >
          ** WEEK {week} / DAY {day} **
        </div>
      </div>

      {/* ── Layer 5: Metric boxes — bottom-right, inside overlay cut-out ──
          The overlay has a notched cut-out at bottom-right for these boxes */}
      <div
        className="absolute"
        style={{
          bottom: '1.5%',
          right: '4.5%',
          width: '33%',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
        }}
      >
        {/* Box 1: Duration — beveled top-left corner shape */}
        <div className="relative" style={{ width: '100%' }}>
          <img
            src={metric1Bg}
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: 'fill' }}
          />
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ paddingTop: '10%', paddingBottom: '8%', paddingLeft: '4%', paddingRight: '4%' }}
          >
            {/* Large duration number */}
            <div
              style={{
                fontFamily: "'Arial Black', Impact, sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(20px, 7.5vw, 34px)',
                color: '#000000',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {durationValue}
            </div>
            {/* Unit + label */}
            <div
              style={{
                fontFamily: "'Arial', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(5.5px, 1.8vw, 8px)',
                color: '#000000',
                letterSpacing: '0.06em',
                marginTop: '3px',
                textTransform: 'uppercase',
              }}
            >
              {durationUnit} | {metricLabel}
            </div>
          </div>
        </div>

        {/* Box 2: PR — white top / black bottom split shape */}
        <div className="relative" style={{ width: '100%' }}>
          <img
            src={metric2Bg}
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: 'fill' }}
          />
          <div
            className="relative flex flex-col"
            style={{ minHeight: 'clamp(44px, 13vw, 62px)' }}
          >
            {/* White top half — PR value */}
            <div
              className="flex items-center justify-center"
              style={{ flex: '1 1 50%', paddingTop: '6%' }}
            >
              <div
                style={{
                  fontFamily: "'Arial Black', Impact, sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(18px, 6.5vw, 29px)',
                  color: '#000000',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {prValue}
              </div>
            </div>
            {/* Black bottom half — label */}
            <div
              className="flex items-center justify-center"
              style={{ flex: '1 1 50%', paddingBottom: '8%' }}
            >
              <div
                style={{
                  fontFamily: "'Arial', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(5.5px, 1.8vw, 8px)',
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  textTransform: 'capitalize',
                }}
              >
                {prLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolographicFrame;
