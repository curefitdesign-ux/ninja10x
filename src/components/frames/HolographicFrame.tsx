import { useRef, useEffect } from 'react';

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
  const metricLabel = label1 || 'Distance';
  const durationLabel = label2 || 'Duration';

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div
      className="w-[90%] mx-auto aspect-[9/16] relative overflow-hidden rounded-[20px]"
      style={{ boxShadow: '0 0 40px rgba(120, 80, 255, 0.5), 0 0 80px rgba(255, 60, 180, 0.3)' }}
    >
      {/* Layer 1: User photo/video — full bleed */}
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

      {/* Layer 2: Dark vignette gradient for readability */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Layer 3: Holographic rainbow overlay — mix-blend-mode color */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 3,
          background: `linear-gradient(
            135deg,
            rgba(255, 0, 128, 0.18) 0%,
            rgba(255, 120, 0, 0.15) 15%,
            rgba(255, 230, 0, 0.13) 28%,
            rgba(0, 230, 120, 0.15) 42%,
            rgba(0, 180, 255, 0.18) 57%,
            rgba(80, 0, 255, 0.20) 72%,
            rgba(200, 0, 255, 0.22) 85%,
            rgba(255, 0, 128, 0.18) 100%
          )`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Layer 4: Iridescent shimmer bands */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 4,
          background: `repeating-linear-gradient(
            -45deg,
            transparent 0px,
            rgba(255,255,255,0.03) 1px,
            transparent 2px,
            transparent 8px
          )`,
        }}
      />

      {/* Layer 5: Top header bar — vertical WEEK/DAY label */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-2"
        style={{ zIndex: 10 }}
      >
        {/* Left: vertical WEEK / DAY stacked */}
        <div
          className="flex flex-col items-start"
          style={{
            writingMode: 'horizontal-tb',
          }}
        >
          <span
            style={{
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(8px, 2.5vw, 11px)',
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.20em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            WEEK
          </span>
          <span
            style={{
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(22px, 8vw, 36px)',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              textShadow: '0 0 20px rgba(180, 120, 255, 0.8)',
            }}
          >
            {week}
          </span>
        </div>

        {/* Center: thin divider line */}
        <div
          style={{
            flex: 1,
            height: '1px',
            margin: '0 12px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            marginTop: '8px',
          }}
        />

        {/* Right: DAY */}
        <div className="flex flex-col items-end">
          <span
            style={{
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(8px, 2.5vw, 11px)',
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.20em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            DAY
          </span>
          <span
            style={{
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(22px, 8vw, 36px)',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              textShadow: '0 0 20px rgba(120, 200, 255, 0.8)',
            }}
          >
            {day}
          </span>
        </div>
      </div>

      {/* Layer 6: Bottom content — activity name + metric boxes */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-5"
        style={{ zIndex: 10 }}
      >
        {/* Activity name */}
        <div
          style={{
            fontFamily: "'Montserrat', 'Arial Black', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(20px, 7vw, 30px)',
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.0,
            textShadow: '0 2px 16px rgba(0,0,0,0.6)',
            marginBottom: '10px',
          }}
        >
          {activity || 'Activity'}
        </div>

        {/* Metric boxes — right-aligned, 33% width each, side by side */}
        {(duration || pr) && (
          <div className="flex gap-2 justify-end">
            {pr && (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  width: '33%',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(14px, 5vw, 20px)',
                    color: '#ffffff',
                    lineHeight: 1,
                    textShadow: '0 0 10px rgba(200,150,255,0.6)',
                  }}
                >
                  {pr}
                </span>
                <span
                  style={{
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    fontWeight: 500,
                    fontSize: 'clamp(7px, 2.2vw, 9px)',
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: '3px',
                  }}
                >
                  {metricLabel}
                </span>
              </div>
            )}
            {duration && (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  width: '33%',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(14px, 5vw, 20px)',
                    color: '#ffffff',
                    lineHeight: 1,
                    textShadow: '0 0 10px rgba(120,200,255,0.6)',
                  }}
                >
                  {duration}
                </span>
                <span
                  style={{
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    fontWeight: 500,
                    fontSize: 'clamp(7px, 2.2vw, 9px)',
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: '3px',
                  }}
                >
                  {durationLabel}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Layer 7: Holographic border glow */}
      <div
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{
          zIndex: 11,
          border: '1.5px solid',
          borderImageSlice: 1,
          borderRadius: '20px',
          boxShadow: `
            inset 0 0 0 1px rgba(255,255,255,0.15),
            0 0 20px rgba(180, 80, 255, 0.4),
            0 0 40px rgba(80, 180, 255, 0.2)
          `,
        }}
      />
    </div>
  );
};

export default HolographicFrame;
