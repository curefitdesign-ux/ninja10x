import { useRef, useEffect } from 'react';

interface ArcadeFrameProps {
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

const ArcadeFrame = ({
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
}: ArcadeFrameProps) => {
  const metricLabel = label1 || 'Personal Best';
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
      className="w-full h-full rounded-[4px] overflow-hidden relative flex flex-col"
      style={{
        containerType: 'inline-size',
        background: '#000000',
      }}
    >
      {/* ── Google Font import for pixel font ── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}</style>

      {/* ── Activity Name — large pixel font at top ── */}
      <div
        style={{
          padding: '7% 5% 3% 5%',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '11cqw',
            color: '#FFFFFF',
            lineHeight: 1.15,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            wordBreak: 'break-word',
          }}
        >
          {activity}
        </div>
      </div>

      {/* ── Photo Area — white-bordered, fills middle ── */}
      <div
        style={{
          margin: '0 3.5%',
          flex: 1,
          position: 'relative',
          minHeight: 0,
          border: '1.5px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        {/* Journey info overlay — top-left inside photo */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            left: '4%',
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '2.8cqw',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.8,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            CULT NINJA JOURNEY
          </div>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '2.8cqw',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.8,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            WEEK {week} / DAY {day}
          </div>
        </div>

        {/* Media */}
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

      {/* ── Bottom Metrics — stacked, left-aligned ── */}
      <div style={{ padding: '3% 5% 4% 5%', flexShrink: 0 }}>
        {(duration || pr) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Duration metric */}
            {duration && (
              <div>
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '2.6cqw',
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    lineHeight: 1.4,
                  }}
                >
                  {durationLabel}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '8cqw',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {duration}
                </div>
              </div>
            )}

            {/* Separator line */}
            {duration && pr && (
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.3)',
                  width: '55%',
                  margin: '2% 0',
                }}
              />
            )}

            {/* Secondary metric */}
            {pr && (
              <div>
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '2.6cqw',
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    lineHeight: 1.4,
                  }}
                >
                  {metricLabel}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '8cqw',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {pr}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: '3%' }} />
        )}
      </div>
    </div>
  );
};

export default ArcadeFrame;
