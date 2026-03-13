import { useRef, useEffect } from 'react';
import '@fontsource/caveat/700.css';
import '@fontsource/bebas-neue/400.css';

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

  const hasMetrics = duration || pr;

  return (
    <div
      className="w-full h-full overflow-hidden relative flex flex-col"
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
      <div className="flex justify-center" style={{ paddingTop: '2.5cqw' }}>
        <div
          style={{
            width: '16%',
            height: '0.8cqw',
            borderRadius: '9999px',
            background: 'rgba(170, 162, 148, 0.55)',
          }}
        />
      </div>

      {/* ── "I DID {Activity} TODAY!" Header ── */}
      <div style={{ padding: '2.5cqw 5cqw 0 5cqw' }}>
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: '10.5cqw',
            color: '#1a1a1a',
            lineHeight: 0.95,
            letterSpacing: '-0.06em',
            textTransform: 'uppercase' as const,
          }}
        >
          I DID
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: '14cqw',
            color: '#7C5CFC',
            lineHeight: 0.85,
            marginTop: '-1cqw',
            marginLeft: '-0.5%',
            transform: 'rotate(-1.5deg)',
          }}
        >
          {activity}
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: '10.5cqw',
            color: '#1a1a1a',
            lineHeight: 0.95,
            letterSpacing: '-0.06em',
            textTransform: 'uppercase' as const,
            marginTop: '-0.5cqw',
          }}
        >
          TODAY!
        </div>
      </div>

      {/* ── Meta Row: CULT NINJA JOURNEY / WEEK / DAY ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '2.5cqw 5cqw 1cqw 5cqw',
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

      {/* ── Dashed Separator (above photo) ── */}
      <div style={{ padding: '0 5cqw' }}>
        <div
          style={{
            borderTop: '0.35cqw dashed rgba(130, 120, 105, 0.55)',
            width: '100%',
          }}
        />
      </div>

      {/* ── Photo Area — takes remaining space ── */}
      <div
        style={{
          margin: '1.5cqw 4.5% 0 4.5%',
          borderRadius: '1cqw',
          overflow: 'hidden',
          flex: 1,
          position: 'relative',
          background: '#000',
          minHeight: 0,
          marginBottom: hasMetrics ? '0' : '3cqw',
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
              transform: (imagePosition.x || imagePosition.y || imageScale !== 1)
                ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`
                : `scale(${imageScale})`,
            }}
          />
        ) : (
          <img
            src={imageUrl}
            alt="Activity"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            style={{
              transform: (imagePosition.x || imagePosition.y || imageScale !== 1)
                ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`
                : `scale(${imageScale})`,
            }}
          />
        )}
      </div>

      {/* ── Bottom Metrics ── */}
      {hasMetrics && (
        <div style={{ padding: '0 5cqw', flexShrink: 0, overflow: 'hidden' }}>
          {/* Dashed separator */}
          <div
            style={{
              borderTop: '0.35cqw dashed rgba(130, 120, 105, 0.55)',
              width: '100%',
              marginTop: '1.5cqw',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '1.5cqw 0.5cqw 2.5cqw 0.5cqw',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5cqw', visibility: duration ? 'visible' : 'hidden' }}>
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontWeight: 400,
                  fontSize: '3.6cqw',
                  color: '#2e2a25',
                  letterSpacing: '0.08em',
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
                  fontSize: '5.8cqw',
                  color: '#7C5CFC',
                  lineHeight: 1,
                  marginLeft: '0.5cqw',
                }}
              >
                {duration || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5cqw', visibility: pr ? 'visible' : 'hidden' }}>
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontWeight: 400,
                  fontSize: '3.6cqw',
                  color: '#2e2a25',
                  letterSpacing: '0.08em',
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
                  fontSize: '5.8cqw',
                  color: '#7C5CFC',
                  lineHeight: 1,
                  marginLeft: '0.5cqw',
                }}
              >
                {pr || '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden placeholder to keep consistent height when no metrics */}
      {!hasMetrics && (
        <div style={{ height: '0', flexShrink: 0 }} />
      )}
    </div>
  );
};

export default ScrapbookFrame;
