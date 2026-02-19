import { useRef, useEffect } from 'react';
import holographicOverlay from '@/assets/frames/holographic-overlay.png';

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

  const hasMetric1 = !!duration;
  const hasMetric2 = !!pr;
  const metricCount = (hasMetric1 ? 1 : 0) + (hasMetric2 ? 1 : 0);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div
      className="w-[90%] mx-auto aspect-[9/16] relative overflow-hidden"
      style={{ borderRadius: '4px' }}
    >
      {/* ── Layer 1: Holographic gradient base background ── */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 0,
          background: `
            radial-gradient(ellipse at 10% 50%, rgba(0, 220, 220, 0.55) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 90%, rgba(240, 160, 120, 0.65) 0%, transparent 45%),
            radial-gradient(ellipse at 20% 5%, rgba(160, 170, 210, 0.7) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 10%, rgba(140, 155, 210, 0.5) 0%, transparent 40%),
            linear-gradient(180deg, #b0b8d8 0%, #c8d0e8 30%, #9ecece 60%, #d8c0b0 100%)
          `,
        }}
      />

      {/* ── Layer 2: User photo — full bleed ── */}
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

      {/* ── Layer 3: Holographic overlay — NO opacity, pure multiply blend ── */}
      <img
        src={holographicOverlay}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 2,
          objectFit: 'fill',
          mixBlendMode: 'multiply',
          opacity: 1,
        }}
      />

      {/* ── Layer 4: Header bar — "CULT NINJA — ACTIVITY" ── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center"
        style={{
          zIndex: 10,
          height: '14.5%',
          paddingLeft: '10%',
          paddingRight: '5%',
        }}
      >
        <span
          style={{
            fontFamily: "'Arial Black', 'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(13px, 4.5vw, 20px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          CULT NINJA — {activity || 'Activity'}
        </span>
      </div>

      {/* ── Layer 5: Left strip vertical text "*** WEEK N / DAY N ***" ── */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          zIndex: 10,
          top: '14.5%',
          left: 0,
          width: '9%',
          bottom: '0%',
        }}
      >
        <span
          style={{
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(5px, 1.6vw, 7px)',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            whiteSpace: 'nowrap',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center',
          }}
        >
          *** WEEK {week} / DAY {day} ***
        </span>
      </div>

      {/* ── Layer 6: Metric boxes — stack dynamically as user adds metrics ── */}
      {metricCount > 0 && (
        <div
          className="absolute flex flex-col"
          style={{
            zIndex: 10,
            bottom: '2%',
            right: '4%',
            width: '38%',
            gap: '0px',
          }}
        >
          {/* Box 1: Duration — white bg with chamfered top-left corner, black border */}
          {hasMetric1 && (
            <div
              style={{
                border: '2px solid #000000',
                borderBottom: hasMetric2 ? '1px solid #000000' : '2px solid #000000',
                padding: '6px 10px 5px',
                backgroundColor: '#ffffff',
                clipPath: metricCount === 1
                  ? 'polygon(16px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 16px)'
                  : 'polygon(16px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 16px)',
              }}
            >
              <div
                style={{
                  fontFamily: "'Arial Black', 'Montserrat', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(18px, 6.5vw, 30px)',
                  color: '#000000',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {duration.replace(/[^0-9:/.]/g, '') || duration}
              </div>
              <div
                style={{
                  fontFamily: "'Arial', 'Helvetica', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(6px, 2vw, 8px)',
                  color: '#000000',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginTop: '2px',
                }}
              >
                HRS | {durationLabel.toUpperCase()}
              </div>
            </div>
          )}

          {/* Box 2: PR / Metric — solid black bg, white text, rounded bottom-right */}
          {hasMetric2 && (
            <div
              style={{
                border: '2px solid #000000',
                borderTop: hasMetric1 ? 'none' : '2px solid #000000',
                backgroundColor: '#000000',
                padding: '6px 10px 5px',
                borderRadius: hasMetric1 ? '0 0 6px 0' : '0 0 6px 0',
                clipPath: !hasMetric1
                  ? 'polygon(16px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 16px)'
                  : undefined,
              }}
            >
              <div
                style={{
                  fontFamily: "'Arial Black', 'Montserrat', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(18px, 6.5vw, 30px)',
                  color: '#ffffff',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {pr}
              </div>
              <div
                style={{
                  fontFamily: "'Arial', 'Helvetica', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(6px, 2vw, 8px)',
                  color: 'rgba(255,255,255,0.85)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginTop: '2px',
                }}
              >
                {metricLabel.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HolographicFrame;
