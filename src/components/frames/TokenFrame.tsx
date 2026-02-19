import { useRef, useEffect } from 'react';
import tokenBg from '@/assets/frames/token-bg.png';
import tokenDuckRing from '@/assets/frames/token-duck-ring.png';
import tokenCultNinjaText from '@/assets/frames/token-cult-ninja-text.png';

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
    <div
      className="w-[90%] mx-auto aspect-[9/16] overflow-hidden relative"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.28)' }}
    >
      {/* Layer 0: Stamp frame background — gray bg + perforated edges + header area */}
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

      {/* Layer 1: User photo/video — fills the inner photo window of the stamp */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '20%',
          left: '6%',
          right: '6%',
          bottom: '22%',
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

      {/* Layer 2: CULT NINJA Journey text — overlaid on top of the photo (top area) */}
      <img
        src={tokenCultNinjaText}
        alt="CULT NINJA Journey"
        className="absolute pointer-events-none"
        style={{
          top: '3%',
          left: '8%',
          width: '60%',
          zIndex: 20,
          objectFit: 'contain',
        }}
      />

      {/* Layer 3: Duck + rings stamp seal — bottom-left, overlapping photo/strip boundary */}
      <img
        src={tokenDuckRing}
        alt=""
        className="absolute pointer-events-none"
        style={{
          bottom: '19%',
          left: '3%',
          width: '22%',
          zIndex: 20,
          objectFit: 'contain',
        }}
      />

      {/* Layer 4: Activity name + metrics — bottom gray strip, right-aligned */}
      <div
        className="absolute right-0 text-right"
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
