import { useRef, useEffect } from 'react';
import tokenBg from '@/assets/frames/token-bg.png';
import tokenBadge from '@/assets/frames/token-badge.png';

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

const TokenFrame = ({
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
}: TokenFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  // Metric labels
  const metric1Label = label1 || 'Hrs';
  const metric2Label = label2 || (pr ? 'Laps' : '');

  // Format duration value (strip units if present)
  const durationValue = duration ? duration.replace(/[^0-9:]/g, '').padStart(2, '0') : '';
  const prValue = pr ? pr.replace(/[^0-9]/g, '').padStart(2, '0') : '';

  return (
    // No overflow-hidden on outer — allows drop-shadow on perforated edges
    <div className="w-[90%] mx-auto aspect-[9/16] relative">

      {/* ── STAMP FRAME BACKGROUND ── */}
      <img
        src={tokenBg}
        alt=""
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%', objectFit: 'fill', zIndex: 1 }}
      />

      {/* ── TOP HEADER STRIP (Activity name + subtitle) ── */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ top: '2%', zIndex: 10, paddingLeft: '8%', paddingRight: '8%' }}
      >
        {/* Activity name — large serif bold, navy blue */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: 900,
            fontSize: 'clamp(28px, 10vw, 52px)',
            color: '#0a4a72',
            textTransform: 'capitalize',
            letterSpacing: '-0.01em',
            lineHeight: 1,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {activity || 'Activity'}
        </div>

        {/* CULT NINJA JOURNEY subtitle */}
        <div
          style={{
            fontFamily: "'Arial', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(7px, 2.5vw, 11px)',
            color: '#4a7a9b',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginTop: '2px',
            textAlign: 'center',
          }}
        >
          · CULT NINJA JOURNEY ·
        </div>
      </div>

      {/* ── USER PHOTO / VIDEO (inner window) ── */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '17%',
          left: '7%',
          right: '7%',
          bottom: '14%',
          zIndex: 2,
          borderRadius: '2px',
          background: 'transparent',
          boxShadow: 'none',
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

      {/* ── STAMP BADGE (bottom-left of photo, overlapping) ── */}
      <img
        src={tokenBadge}
        alt=""
        className="absolute pointer-events-none"
        style={{
          bottom: '18%',
          left: '5%',
          width: '24%',
          zIndex: 10,
          objectFit: 'contain',
          opacity: 0.85,
        }}
      />

      {/* ── BOTTOM METRICS STRIP ── */}
      <div
        className="absolute left-0 right-0 flex items-end justify-between"
        style={{
          bottom: '0%',
          height: '14%',
          paddingLeft: '8%',
          paddingRight: '8%',
          paddingBottom: '3%',
          zIndex: 10,
        }}
      >
        {/* Left metric — duration */}
        {durationValue ? (
          <div style={{ textAlign: 'left' }}>
            <span
              style={{
                fontFamily: "'Arial Black', 'Arial', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(18px, 7vw, 34px)',
                color: '#0a4a72',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              {durationValue}{' '}
              <span style={{ fontSize: 'clamp(14px, 5vw, 26px)' }}>{metric1Label}</span>
            </span>
          </div>
        ) : null}

        {/* Right metric — pr / laps */}
        {prValue ? (
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontFamily: "'Arial Black', 'Arial', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(18px, 7vw, 34px)',
                color: '#0a4a72',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              {prValue}{' '}
              <span style={{ fontSize: 'clamp(14px, 5vw, 26px)' }}>{metric2Label}</span>
            </span>
          </div>
        ) : null}
      </div>

    </div>
  );
};

export default TokenFrame;
