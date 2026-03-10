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
  const isNumericPr = pr ? /\d/.test(pr) : false;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div
      className="w-[90%] mx-auto aspect-[9/16] rounded-[4px] overflow-hidden relative flex flex-col"
      style={{
        containerType: 'inline-size',
        background: '#000000',
      }}
    >
      {/* ── Google Font import ── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&family=Press+Start+2P&display=swap');`}</style>

      {/* ── Activity Name — Pixelify Sans at top ── */}
      <div
        style={{
          padding: '6% 5% 2.5% 5%',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Pixelify Sans', 'Press Start 2P', monospace",
            fontSize: '14cqw',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            wordBreak: 'break-word',
            textAlign: 'center',
          }}
        >
          {activity}
        </div>
      </div>

      {/* ── Photo Area — white-bordered, fills middle ── */}
      <div
        style={{
          margin: '0 3.5%',
          flex: '1 1 0',
          position: 'relative',
          minHeight: 0,
          border: '1.5px solid rgba(255, 255, 255, 0.6)',
          marginBottom: '4cqw',
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
              transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})`,
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
              transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})`,
            }}
          />
        )}
      </div>

      {/* ── Bottom Metrics — stacked, left-aligned ── */}
      <div style={{ padding: '2.5% 5% 4% 5%', flexShrink: 0, marginTop: '-2cqw' }}>
        {(duration || pr) ? (
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Duration metric */}
            {duration && (
              <div>
                <div
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '2.4cqw',
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.75)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    lineHeight: 1.6,
                  }}
                >
                  {durationLabel}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: '8.5cqw',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    lineHeight: 1.1,
                    letterSpacing: '-0.01em',
                    marginTop: '0.5%',
                  }}
                >
                  {duration}
                </div>
              </div>
            )}

            {/* Secondary metric */}
            {pr && (
              <div>
                <div
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '2.4cqw',
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.75)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    lineHeight: 1.6,
                  }}
                >
                  {metricLabel}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    fontSize: isNumericPr ? '8.5cqw' : '5.5cqw',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    lineHeight: 1.1,
                    letterSpacing: '-0.01em',
                    marginTop: '0.5%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
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
