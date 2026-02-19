import { useRef, useEffect } from 'react';
import tokenBg from '@/assets/frames/token-bg.png';
import tokenBird from '@/assets/frames/token-bird.png';
import tokenCircles from '@/assets/frames/token-circles.png';

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
  const durationLabel = label2 || 'Duration';
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
      {/* Layer 0: Full-bleed user photo / video */}
      <div className="absolute inset-0 z-0">
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

      {/* Layer 1: token.png stamp frame — contains perforations, gray bg,
          "CULT NINJA / Journey" header and bottom gray strip baked in.
          mix-blend-mode: multiply makes the white center transparent so photo shows through. */}
      <img
        src={tokenBg}
        alt=""
        className="absolute inset-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          zIndex: 10,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Layer 2: Stamp seal — concentric rings + bird mascot
          Positioned bottom-left, overlapping the photo/bottom-strip boundary */}
      <div
        className="absolute"
        style={{
          bottom: '17%',
          left: '5%',
          width: '22%',
          aspectRatio: '1 / 1',
          zIndex: 20,
        }}
      >
        {/* Outer circles ring */}
        <img
          src={tokenCircles}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain' }}
        />
        {/* Bird mascot centered inside rings */}
        <img
          src={tokenBird}
          alt=""
          className="absolute"
          style={{
            width: '52%',
            height: '52%',
            top: '24%',
            left: '24%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Layer 3: Activity name + metrics — rendered inside the bottom gray strip */}
      <div
        className="absolute left-0 right-0 text-center"
        style={{
          bottom: '3%',
          paddingBottom: '2%',
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontFamily: "'Montserrat', 'Arial Black', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(18px, 6.5vw, 28px)',
            color: '#0a5278',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1.1,
          }}
        >
          {activity || 'Activity'}
        </div>
        {metricsLine ? (
          <div
            style={{
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontWeight: 500,
              fontSize: 'clamp(8px, 2.8vw, 12px)',
              color: '#808080',
              letterSpacing: '0.05em',
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
