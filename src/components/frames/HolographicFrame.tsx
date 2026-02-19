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

  const durationValue = duration ? duration.replace(/[^0-9.:]/g, '') : '00';
  const durationUnit = duration ? (duration.toLowerCase().includes('min') ? 'MINS' : 'HRS') : 'HRS';
  const prValue = pr || '—';
  const metricLabel = label1 || 'DURATION';
  const prLabel = label2 || 'Personal Best Score';

  return (
    <div
      className="w-full aspect-[9/16] relative overflow-hidden"
      style={{
        // Holographic gradient background matching the reference
        background: 'linear-gradient(160deg, #b8bfe8 0%, #9eb8d9 15%, #7dd4d4 35%, #a8d8b0 50%, #e8c88a 70%, #e8a890 85%, #d4a0b8 100%)',
      }}
    >
      {/* ── Layer 1: User photo/video — fills most of the frame ── */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '12%',
          left: '4.5%',
          right: '4.5%',
          bottom: '26%',
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

      {/* ── Layer 2: Holographic frame overlay (sits on top of photo) ── */}
      <img
        src={holographicOverlay}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: 'fill', zIndex: 3, mixBlendMode: 'multiply', opacity: 0.9 }}
      />

      {/* ── Layer 3: Header — CULT NINJA — ACTIVITY ── */}
      <div
        className="absolute"
        style={{
          top: '2%',
          left: '5%',
          right: '5%',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(18px, 6.5vw, 28px)',
            color: '#000',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          CULT NINJA — {activity || 'WORKOUT'}
        </div>
      </div>

      {/* ── Layer 4: Left-side vertical WEEK / DAY label ── */}
      <div
        className="absolute"
        style={{
          left: '-2%',
          top: '30%',
          bottom: '30%',
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
            fontFamily: "'Arial', monospace",
            fontWeight: 700,
            fontSize: 'clamp(8px, 2.5vw, 11px)',
            color: '#000',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            whiteSpace: 'nowrap',
          }}
        >
          ** WEEK {week} / DAY {day} **
        </div>
      </div>

      {/* ── Layer 5: Metric boxes — bottom-right corner ── */}
      <div
        className="absolute"
        style={{
          bottom: '3%',
          right: '4.5%',
          width: '42%',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Metric Box 1 — Duration (beveled top-left corner shape) */}
        <div className="relative" style={{ width: '100%' }}>
          <img
            src={metric1Bg}
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: 'fill' }}
          />
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ padding: '8% 6%', minHeight: 'clamp(50px, 14vw, 70px)' }}
          >
            <div
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(26px, 10vw, 44px)',
                color: '#000',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {durationValue}
            </div>
            <div
              style={{
                fontFamily: "'Arial', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(7px, 2.2vw, 10px)',
                color: '#000',
                letterSpacing: '0.08em',
                marginTop: '2px',
              }}
            >
              {durationUnit} | {metricLabel}
            </div>
          </div>
        </div>

        {/* Metric Box 2 — PR / Personal Best (split white/black shape) */}
        <div className="relative" style={{ width: '100%' }}>
          <img
            src={metric2Bg}
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: 'fill' }}
          />
          <div
            className="relative flex flex-col"
            style={{ minHeight: 'clamp(56px, 16vw, 80px)' }}
          >
            {/* White top half — PR value */}
            <div
              className="flex items-center justify-center"
              style={{ flex: 1, paddingTop: '6%', paddingBottom: '2%' }}
            >
              <div
                style={{
                  fontFamily: "'Arial Black', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(22px, 8vw, 36px)',
                  color: '#000',
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
              style={{ flex: 1, paddingBottom: '8%', paddingTop: '2%' }}
            >
              <div
                style={{
                  fontFamily: "'Arial', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(7px, 2.2vw, 10px)',
                  color: '#fff',
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                  lineHeight: 1.3,
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
