import { useRef, useEffect } from 'react';
// @ts-ignore
import '@fontsource/dm-serif-display';
// @ts-ignore
import '@fontsource/rowdies/300.css';
// @ts-ignore
import '@fontsource/rowdies/700.css';
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
  label1Name?: string;
  label2Name?: string;
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

  const durationUnit = label2 || 'min';
  const prUnit = label1 || '';
  const durationValue = duration ? duration.replace(/[^0-9:]/g, '') : '';
  const isNumericPr = pr ? /\d/.test(pr) : false;
  const prValue = pr ? (isNumericPr ? pr.replace(/[^0-9.]/g, '') : pr) : '';

  return (
    <div
      className="w-[90%] mx-auto relative"
      style={{
        aspectRatio: '9 / 16',
        containerType: 'inline-size',
        backgroundImage: `url(${tokenBg})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* ── USER PHOTO / VIDEO — clipped inside the stamp window ── */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '17%',
          left: '7%',
          right: '7%',
          bottom: '14%',
          borderRadius: '2px',
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

      {/* ── TOP HEADER (Activity name + subtitle) ── */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ top: 'calc(3.5% + 10px)', zIndex: 5, paddingLeft: '8%', paddingRight: '8%' }}
      >
        <div
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(25px, 13cqw, 49px)',
            color: '#0a4a72',
            textTransform: 'capitalize',
            letterSpacing: '-0.01em',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {activity || 'Activity'}
        </div>
        <div
          style={{
            fontFamily: "'Rowdies', 'Arial', sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(8px, 3.2cqw, 12px)',
            color: '#696760',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: '5px',
            textAlign: 'center',
          }}
        >
          · CULT NINJA JOURNEY | WEEK {week} | DAY {day} ·
        </div>
      </div>

      {/* ── STAMP BADGE ── */}
      <img
        src={tokenBadge}
        alt=""
        className="absolute pointer-events-none"
        style={{
          bottom: '16%',
          left: '3%',
          width: '34%',
          zIndex: 5,
          objectFit: 'contain',
          opacity: 0.85,
        }}
      />

      {/* ── BOTTOM METRICS ── */}
      <div
        className="absolute left-0 right-0 flex items-end justify-between"
        style={{
          bottom: '5cqw',
          height: '14%',
          paddingLeft: '8%',
          paddingRight: '8%',
          paddingBottom: '3%',
          zIndex: 5,
        }}
      >
        {durationValue ? (
          <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
            <div style={{ fontFamily: "'Rowdies', 'Arial', sans-serif", fontWeight: 300, fontSize: 'clamp(8px, 3.4cqw, 12px)', color: '#696760', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>
              DURATION
            </div>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400, fontSize: 'clamp(14px, 6.5cqw, 24px)', color: '#0a4a72' }}>
              {durationValue}
            </span>
            {durationUnit && (
              <span style={{ fontFamily: "'Rowdies', 'Arial Black', sans-serif", fontWeight: 700, fontSize: 'clamp(10px, 4.5cqw, 18px)', color: '#0a4a72', marginLeft: '4px' }}>
                {durationUnit}
              </span>
            )}
          </div>
        ) : null}

        {prValue ? (
          <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
            <div style={{ fontFamily: "'Rowdies', 'Arial', sans-serif", fontWeight: 300, fontSize: 'clamp(8px, 3.4cqw, 12px)', color: '#696760', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>
              DISTANCE
            </div>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400, fontSize: isNumericPr ? 'clamp(14px, 6.5cqw, 24px)' : 'clamp(10px, 4.5cqw, 18px)', color: '#0a4a72' }}>
              {prValue}
            </span>
            {prUnit && (
              <span style={{ fontFamily: "'Rowdies', 'Arial Black', sans-serif", fontWeight: 700, fontSize: 'clamp(10px, 4.5cqw, 18px)', color: '#0a4a72', marginLeft: '4px' }}>
                {prUnit}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TokenFrame;
