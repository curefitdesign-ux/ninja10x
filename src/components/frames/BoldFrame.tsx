import { useRef, useEffect } from 'react';
// @ts-ignore
import '@fontsource/caveat/700.css';

interface BoldFrameProps {
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

const BoldFrame = ({
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
}: BoldFrameProps) => {
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
  const prValue = pr ? pr.replace(/[^0-9.]/g, '') : '';

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: '#f0ede6',
        borderRadius: '16px',
      }}
    >
      {/* ── TOP HEADER — "I DID {activity} TODAY!" ── */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '4%',
          paddingLeft: '7%',
          paddingRight: '7%',
          zIndex: 5,
        }}
      >
        <div style={{ lineHeight: 0.95 }}>
          <div
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(28px, 10vw, 52px)',
              color: '#1a1a1a',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}
          >
            I DID
          </div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontWeight: 700,
              fontSize: 'clamp(32px, 11vw, 56px)',
              color: '#6B4EE6',
              textTransform: 'capitalize',
              lineHeight: 1,
              marginTop: '-2px',
            }}
          >
            {activity || 'Activity'}
          </div>
          <div
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(28px, 10vw, 52px)',
              color: '#1a1a1a',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}
          >
            TODAY!
          </div>
        </div>
      </div>

      {/* ── SUBTITLE ROW — dashed line separator ── */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{
          top: '30%',
          paddingLeft: '7%',
          paddingRight: '7%',
          zIndex: 5,
        }}
      >
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            fontSize: 'clamp(7px, 2.2vw, 11px)',
            color: '#3a3a3a',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          CULT NINJA JOURNEY
        </span>
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            fontSize: 'clamp(7px, 2.2vw, 11px)',
            color: '#3a3a3a',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          WEEK {week} / DAY {day}
        </span>
      </div>

      {/* Dashed line above photo */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '33%',
          marginLeft: '5%',
          marginRight: '5%',
          borderTop: '2px dashed #b8b4a8',
          zIndex: 5,
        }}
      />

      {/* ── PHOTO / VIDEO ── */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '35%',
          left: '5%',
          right: '5%',
          bottom: '16%',
          borderRadius: '6px',
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

      {/* Dashed line below photo */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: '14%',
          marginLeft: '5%',
          marginRight: '5%',
          borderTop: '2px dashed #b8b4a8',
          zIndex: 5,
        }}
      />

      {/* ── BOTTOM METRICS ── */}
      <div
        className="absolute left-0 right-0 flex items-end justify-between"
        style={{
          bottom: '4%',
          paddingLeft: '7%',
          paddingRight: '7%',
          zIndex: 5,
        }}
      >
        {durationValue ? (
          <div className="flex items-baseline gap-1.5">
            <span
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 500,
                fontSize: 'clamp(7px, 2.2vw, 11px)',
                color: '#3a3a3a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              DURATION :
            </span>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 700,
                fontSize: 'clamp(18px, 6vw, 30px)',
                color: '#6B4EE6',
                fontStyle: 'italic',
              }}
            >
              {durationValue}
            </span>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 700,
                fontSize: 'clamp(14px, 4.5vw, 24px)',
                color: '#6B4EE6',
                fontStyle: 'italic',
              }}
            >
              {durationUnit}
            </span>
          </div>
        ) : null}

        {prValue && prUnit ? (
          <div className="flex items-baseline gap-1.5">
            <span
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 500,
                fontSize: 'clamp(7px, 2.2vw, 11px)',
                color: '#3a3a3a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              DISTANCE :
            </span>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 700,
                fontSize: 'clamp(18px, 6vw, 30px)',
                color: '#6B4EE6',
                fontStyle: 'italic',
              }}
            >
              {prValue}
            </span>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 700,
                fontSize: 'clamp(14px, 4.5vw, 24px)',
                color: '#6B4EE6',
                fontStyle: 'italic',
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

export default BoldFrame;
