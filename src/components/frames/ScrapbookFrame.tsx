import { useRef, useEffect } from 'react';
import '@fontsource/caveat/700.css';

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
      className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative flex flex-col"
      style={{
        containerType: 'inline-size',
        background: '#e8e2d6',
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E"),
          linear-gradient(180deg, #ede7db 0%, #e0d9cb 50%, #d8d1c3 100%)
        `,
      }}
    >
      {/* ── Top Handle Bar ── */}
      <div className="flex justify-center" style={{ paddingTop: '3%' }}>
        <div
          style={{
            width: '16%',
            height: '3.5px',
            borderRadius: '9999px',
            background: 'rgba(170, 162, 148, 0.55)',
          }}
        />
      </div>

      {/* ── "I DID {Activity} TODAY!" Header ── */}
      <div style={{ padding: '3.5% 5.5% 0 5.5%' }}>
        {/* "I DID" - Helvetica Neue Bold */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: '11.5cqw',
            color: '#1a1a1a',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}
        >
          I DID
        </div>
        {/* Activity name - Caveat (Figma Hand alternative) */}
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: '12.5cqw',
            color: '#7C5CFC',
            lineHeight: 0.85,
            marginTop: '-1%',
            marginLeft: '-0.5%',
          }}
        >
          {activity}
        </div>
        {/* "TODAY!" - Helvetica Neue Bold */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: '11.5cqw',
            color: '#1a1a1a',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            marginTop: '-1%',
          }}
        >
          TODAY!
        </div>
      </div>

      {/* ── Dashed Separator ── */}
      <div style={{ padding: '2% 5% 0 5%' }}>
        <div
          style={{
            borderTop: '1.5px dashed rgba(130, 120, 105, 0.55)',
            width: '100%',
          }}
        />
      </div>

      {/* ── Meta Row: CULT NINJA JOURNEY / WEEK / DAY ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '1.8% 5.5% 1.5% 5.5%',
        }}
      >
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            fontSize: '3cqw',
            color: '#2e2a25',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          CULT NINJA JOURNEY
        </span>
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            fontSize: '3cqw',
            color: '#2e2a25',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          WEEK {week} / DAY {day}
        </span>
      </div>

      {/* ── Photo Area — takes remaining space ── */}
      <div
        style={{
          margin: '0 4.5%',
          borderRadius: '3px',
          overflow: 'hidden',
          flex: 1,
          position: 'relative',
          background: '#000',
          minHeight: 0,
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
              transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})`,
            }}
          />
        ) : (
          <img
            src={imageUrl}
            alt="Activity"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})`,
            }}
          />
        )}
      </div>

      {/* ── Bottom Metrics ── */}
      <div style={{ padding: '0 5%', flexShrink: 0 }}>
        {/* Dashed separator */}
        <div
          style={{
            borderTop: '1.5px dashed rgba(130, 120, 105, 0.55)',
            width: '100%',
            marginTop: '2.5%',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: '2% 0.5% 3% 0.5%',
            minHeight: '8cqw',
          }}
        >
          {duration ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: 500,
                  fontSize: '2.2cqw',
                  color: '#2e2a25',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {durationLabel} :
              </span>
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: '6.5cqw',
                  color: '#7C5CFC',
                  lineHeight: 1,
                  marginLeft: '2px',
                }}
              >
                {duration}
              </span>
            </div>
          ) : null}

          {pr ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: 500,
                  fontSize: '2.2cqw',
                  color: '#2e2a25',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {metricLabel} :
              </span>
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: '6.5cqw',
                  color: '#7C5CFC',
                  lineHeight: 1,
                  marginLeft: '2px',
                }}
              >
                {pr}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScrapbookFrame;
