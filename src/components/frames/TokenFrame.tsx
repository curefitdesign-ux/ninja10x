import { useRef, useEffect } from 'react';
import tokenBg from '@/assets/frames/token-bg.png';
import tokenDuckRing from '@/assets/frames/token-duck-ring.png';

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
  const metricLabel = label1 || 'Personal Best Score';

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  // Build the metrics line: "02 HRS | 05 PERSONAL BEST SCORE"
  const durationUnit = duration?.toLowerCase().includes('min') ? 'MINS' : 'HRS';
  const durationClean = duration ? duration.replace(/[a-zA-Z\s]/g, '').trim() : '';
  const prClean = pr ? pr.replace(/[a-zA-Z\s]/g, '').trim() : '';

  const metricsParts: string[] = [];
  if (durationClean) metricsParts.push(`${durationClean} ${durationUnit}`);
  if (prClean) metricsParts.push(`${prClean} ${metricLabel.toUpperCase()}`);
  const metricsLine = metricsParts.join(' | ');

  return (
    // No overflow-hidden on outer — allows drop-shadow to render on perforated edges
    <div
      className="w-[90%] mx-auto aspect-[9/16] relative"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.32))' }}
    >
      {/* Layer 1: Stamp background — perforated edges + baked CULT NINJA Journey header + bottom gray strip */}
      <img
        src={tokenBg}
        alt=""
        className="absolute inset-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          zIndex: 1,
        }}
      />

      {/* Layer 2: User photo — starts BELOW the baked header text (~20% from top) */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '20%',
          left: '7%',
          right: '7%',
          bottom: '18%',
          zIndex: 2,
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

      {/* Layer 3: Duck + rings stamp seal — bottom-left, overlaps photo/strip boundary */}
      <img
        src={tokenDuckRing}
        alt=""
        className="absolute pointer-events-none"
        style={{
          bottom: '16%',
          left: '4%',
          width: '20%',
          zIndex: 10,
          objectFit: 'contain',
        }}
      />

      {/* Layer 4: Activity name + metrics — bottom gray strip, center-aligned */}
      <div
        className="absolute text-center"
        style={{
          bottom: '2%',
          left: '7%',
          right: '7%',
          zIndex: 10,
        }}
      >
        {/* Large bold activity name */}
        <div
          style={{
            fontFamily: "'Arial Black', Impact, 'Helvetica Neue', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(16px, 6.5vw, 28px)',
            color: '#0a4f6f',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            lineHeight: 1.1,
          }}
        >
          {activity || 'Activity'}
        </div>

        {/* Smaller metrics line */}
        {metricsLine ? (
          <div
            style={{
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(6px, 2.2vw, 9px)',
              color: '#555555',
              letterSpacing: '0.05em',
              marginTop: '2px',
              lineHeight: 1.3,
              textTransform: 'uppercase',
            }}
          >
            {metricsLine}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TokenFrame;
