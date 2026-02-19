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
  const metricLabel = label1 || 'Metric';

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  const metricsLine = [duration, pr ? `${pr} ${metricLabel}` : '']
    .filter(Boolean)
    .join(' | ');

  return (
    // No overflow-hidden on outer — allows shadow to render uncropped
    // No background — stamp bg PNG provides all the gray/white surface
    <div
      className="w-[90%] mx-auto aspect-[9/16] relative"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.32))' }}
    >
      {/* Layer 0: Stamp frame background — gray bg + perforated edges + baked CULT NINJA text */}
      <img
        src={tokenBg}
        alt=""
        className="absolute inset-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          zIndex: 0,
        }}
      />

      {/* Layer 1: User photo/video — starts halfway below the CULT NINJA text area */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '27%',
          left: '6.5%',
          right: '6.5%',
          bottom: '23%',
          zIndex: 10,
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

      {/* Layer 2: Duck + rings stamp seal — bottom-left, at photo/strip boundary */}
      <img
        src={tokenDuckRing}
        alt=""
        className="absolute pointer-events-none"
        style={{
          bottom: '20%',
          left: '3%',
          width: '22%',
          zIndex: 20,
          objectFit: 'contain',
        }}
      />

      {/* Layer 3: Activity name + metrics — bottom gray strip, right-aligned */}
      <div
        className="absolute text-right"
        style={{
          bottom: '3%',
          right: '7%',
          paddingBottom: '2%',
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontFamily: "'Montserrat', 'Arial Black', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(16px, 6vw, 26px)',
            color: '#0a5278',
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            lineHeight: 1.1,
          }}
        >
          {activity || 'Activity'}
        </div>
        {metricsLine ? (
          <div
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(7px, 2.4vw, 10px)',
              color: '#555',
              letterSpacing: '0.04em',
              marginTop: 3,
              lineHeight: 1.3,
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
