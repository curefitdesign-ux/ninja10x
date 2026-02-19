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
    // No overflow-hidden on outer — allows drop-shadow to render uncropped on perforated edges
    <div
      className="w-[90%] mx-auto aspect-[9/16] relative"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.32))' }}
    >
      {/* Layer 1: Stamp frame background — perforated edges + CULT NINJA header + gray strip */}
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

      {/* Layer 2: User photo/video — clipped to inner photo window, sits above stamp bg */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '10%',
          left: '7%',
          right: '7%',
          bottom: '15%',
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

      {/* Layer 3: CULT NINJA JOURNEY text — above media, center-aligned, smaller */}
      <img
        src={tokenCultNinjaText}
        alt=""
        className="absolute pointer-events-none"
        style={{
          top: '2%',
          left: '10%',
          right: '10%',
          width: '80%',
          zIndex: 5,
          objectFit: 'contain',
          objectPosition: 'center',
        }}
      />

      {/* Layer 4: Duck + rings stamp seal — overlays on the photo */}
      <img
        src={tokenDuckRing}
        alt=""
        className="absolute pointer-events-none"
        style={{
          bottom: '20%',
          left: '3%',
          width: '22%',
          zIndex: 10,
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default TokenFrame;
