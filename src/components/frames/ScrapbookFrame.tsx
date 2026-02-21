import { useRef, useEffect } from 'react';

interface ScrapbookFrameProps {
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

const ScrapbookFrame = ({
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
}: ScrapbookFrameProps) => {
  const metricLabel = label1 || 'Distance';
  const durationLabel = label2 || 'Duration';
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div
      className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative"
      style={{
        background: '#e8e2d6',
        // Subtle paper texture via repeating gradient noise
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E"),
          linear-gradient(180deg, #ede7db 0%, #e0d9cb 50%, #d8d1c3 100%)
        `,
      }}
    >
      {/* ── Top Handle Bar ── */}
      <div className="flex justify-center" style={{ paddingTop: '3.5%' }}>
        <div
          style={{
            width: '18%',
            height: '4px',
            borderRadius: '9999px',
            background: 'rgba(180, 170, 155, 0.6)',
          }}
        />
      </div>

      {/* ── "I DID {Activity} TODAY!" Header ── */}
      <div style={{ padding: '5% 6% 0 6%' }}>
        <div style={{ lineHeight: 0.95 }}>
          <span
            style={{
              display: 'block',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '11cqw',
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            I DID
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: "'Georgia', 'Brush Script MT', 'Segoe Script', cursive",
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: '14cqw',
              color: '#7C5CFC',
              lineHeight: 1,
              marginTop: '-1%',
              marginLeft: '-1%',
            }}
          >
            {activity}
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '11cqw',
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginTop: '-1%',
            }}
          >
            TODAY!
          </span>
        </div>
      </div>

      {/* ── Dashed Separator ── */}
      <div style={{ padding: '2.5% 6% 0 6%' }}>
        <div
          style={{
            borderTop: '2px dashed rgba(140, 130, 115, 0.5)',
            width: '100%',
          }}
        />
      </div>

      {/* ── Meta Row: CULT NINJA JOURNEY / WEEK / DAY ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '2% 6% 2.5% 6%',
        }}
      >
        <span
          style={{
            fontFamily: "'Georgia', serif",
            fontWeight: 600,
            fontSize: '3.2cqw',
            color: '#3a3530',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          CULT NINJA JOURNEY
        </span>
        <span
          style={{
            fontFamily: "'Georgia', serif",
            fontWeight: 600,
            fontSize: '3.2cqw',
            color: '#3a3530',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          WEEK {week} / DAY {day}
        </span>
      </div>

      {/* ── Photo Area ── */}
      <div
        style={{
          margin: '0 5%',
          borderRadius: '4px',
          overflow: 'hidden',
          aspectRatio: '4/5',
          position: 'relative',
          background: '#000',
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

      {/* ── Bottom Metrics ── */}
      {(duration || pr) && (
        <div style={{ padding: '0 6%', marginTop: 'auto' }}>
          {/* Dashed separator above metrics */}
          <div
            style={{
              borderTop: '2px dashed rgba(140, 130, 115, 0.5)',
              width: '100%',
              marginTop: '3%',
              marginBottom: '2%',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingBottom: '4%',
            }}
          >
            {duration && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2%' }}>
                <span
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontWeight: 700,
                    fontSize: '2.8cqw',
                    color: '#3a3530',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {durationLabel} :
                </span>
                <span
                  style={{
                    fontFamily: "'Georgia', 'Brush Script MT', 'Segoe Script', cursive",
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: '7.5cqw',
                    color: '#7C5CFC',
                    lineHeight: 1,
                    marginLeft: '4px',
                  }}
                >
                  {duration}
                </span>
              </div>
            )}
            {pr && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2%' }}>
                <span
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontWeight: 700,
                    fontSize: '2.8cqw',
                    color: '#3a3530',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {metricLabel} :
                </span>
                <span
                  style={{
                    fontFamily: "'Georgia', 'Brush Script MT', 'Segoe Script', cursive",
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: '7.5cqw',
                    color: '#7C5CFC',
                    lineHeight: 1,
                    marginLeft: '4px',
                  }}
                >
                  {pr}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrapbookFrame;
