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

  // Units passed directly (e.g. 'min', 'km', 'laps', 'sets')
  const durationUnit = label2 || 'min';
  const prUnit = label1 || '';

  // Strip any non-numeric chars from raw values, keep them clean
  const durationValue = duration ? duration.replace(/[^0-9:]/g, '') : '';
  const prValue = pr ? pr.replace(/[^0-9.]/g, '') : '';

  return (
    // No overflow-hidden on outer — allows drop-shadow on perforated edges
    <div className="w-full h-full relative">

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

      {/* ── STAMP BADGE (bottom-left of photo, overlapping) — larger ── */}
      <img
        src={tokenBadge}
        alt=""
        className="absolute pointer-events-none"
        style={{
          bottom: '16%',
          left: '3%',
          width: '34%',
          zIndex: 10,
          objectFit: 'contain',
          opacity: 0.85,
        }}
      />

      {/* ── BOTTOM METRICS STRIP — value + unit only ── */}
      <div
        className="absolute left-0 right-0 flex items-end justify-between"
        style={{
          bottom: '10px',
          height: '14%',
          paddingLeft: '8%',
          paddingRight: '8%',
          paddingBottom: '3%',
          zIndex: 10,
        }}
      >
        {/* Left metric — duration value + unit (e.g. "45 min") */}
        {durationValue ? (
          <div style={{ textAlign: 'left', lineHeight: 1 }}>
            <span
              style={{
                fontFamily: "'Arial Black', 'Arial', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(18px, 7vw, 34px)',
                color: '#0a4a72',
                letterSpacing: '-0.01em',
              }}
            >
              {durationValue}
            </span>
            {durationUnit && (
              <span
                style={{
                  fontFamily: "'Arial Black', 'Arial', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(14px, 5vw, 26px)',
                  color: '#0a4a72',
                  marginLeft: '4px',
                }}
              >
                {durationUnit}
              </span>
            )}
          </div>
        ) : null}

        {/* Right metric — pr value + unit (e.g. "05 km", "12 laps") */}
        {prValue && prUnit ? (
          <div style={{ textAlign: 'right', lineHeight: 1 }}>
            <span
              style={{
                fontFamily: "'Arial Black', 'Arial', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(18px, 7vw, 34px)',
                color: '#0a4a72',
                letterSpacing: '-0.01em',
              }}
            >
              {prValue}
            </span>
            <span
              style={{
                fontFamily: "'Arial Black', 'Arial', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(14px, 5vw, 26px)',
                color: '#0a4a72',
                marginLeft: '4px',
              }}
            >
              {prUnit}
            </span>
          </div>
        ) : null}
      </div>

    </div>
  );
};

export default TokenFrame;
