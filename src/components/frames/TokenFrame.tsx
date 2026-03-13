import { useRef, useEffect } from 'react';
// @ts-ignore
import '@fontsource/dm-serif-display';
// @ts-ignore
import '@fontsource/rowdies/300.css';
// @ts-ignore
import '@fontsource/rowdies/700.css';
import tokenBg from '@/assets/frames/token-bg.png';
import tokenBadge from '@/assets/frames/token-badge.png';

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
  label1Name?: string;
  label2Name?: string;
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
  label1Name,
}: TokenFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  const durationUnit = label2 || 'min';
  const prUnit = label1 || '';
  const durationValue = duration ? duration.replace(/[^0-9:]/g, '') : '';
  const isNumericPr = pr ? /\d/.test(pr) : false;
  const prValue = pr ? (isNumericPr ? pr.replace(/[^0-9.]/g, '') : pr) : '';

  const mediaTransform =
    imagePosition.x || imagePosition.y || imageScale !== 1
      ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`
      : `scale(${imageScale})`;

  return (
    <div
      className="w-full h-full relative"
      style={{
        aspectRatio: '9 / 16',
        containerType: 'inline-size',
        backgroundImage: `url(${tokenBg})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* Photo / Video */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '33cqw',
          left: '7%',
          right: '7%',
          bottom: '24.5cqw',
          borderRadius: '0.6cqw',
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
            style={{ transform: mediaTransform }}
          />
        ) : (
          <img
            src={imageUrl}
            alt="Activity"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            style={{ transform: mediaTransform }}
          />
        )}
      </div>

      {/* Header */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ top: '9.4cqw', zIndex: 5, paddingLeft: '8%', paddingRight: '8%' }}
      >
        <div
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 400,
            fontSize: '13cqw',
            color: '#0a4a72',
            textTransform: 'capitalize',
            letterSpacing: '-0.01em',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          {activity || 'Activity'}
        </div>
        <div
          style={{
            fontFamily: "'Rowdies', 'Arial', sans-serif",
            fontWeight: 300,
            fontSize: '3.2cqw',
            color: '#696760',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: '1.3cqw',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          · CULT NINJA JOURNEY | WEEK {week} | DAY {day} ·
        </div>
      </div>

      {/* Badge */}
      <img
        src={tokenBadge}
        alt=""
        className="absolute pointer-events-none"
        style={{
          bottom: '26cqw',
          left: '3%',
          width: '34%',
          zIndex: 5,
          objectFit: 'contain',
          opacity: 0.85,
        }}
      />

      {/* Metrics */}
      <div
        className="absolute left-0 right-0 flex items-end justify-between"
        style={{
          bottom: '4.8cqw',
          height: '22.5cqw',
          paddingLeft: '8%',
          paddingRight: '8%',
          paddingBottom: '1.2cqw',
          zIndex: 5,
        }}
      >
        {durationValue ? (
          <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
            <div
              style={{
                fontFamily: "'Rowdies', 'Arial', sans-serif",
                fontWeight: 300,
                fontSize: '3.2cqw',
                color: '#696760',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '0.5cqw',
              }}
            >
              DURATION
            </div>
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontWeight: 400,
                fontSize: '6.5cqw',
                color: '#0a4a72',
                whiteSpace: 'nowrap',
              }}
            >
              {durationValue}
            </span>
            {durationUnit && (
              <span
                style={{
                  fontFamily: "'Rowdies', 'Arial Black', sans-serif",
                  fontWeight: 700,
                  fontSize: '4.5cqw',
                  color: '#0a4a72',
                  marginLeft: '1cqw',
                  whiteSpace: 'nowrap',
                }}
              >
                {durationUnit}
              </span>
            )}
          </div>
        ) : null}

        {prValue ? (
          <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
            <div
              style={{
                fontFamily: "'Rowdies', 'Arial', sans-serif",
                fontWeight: 300,
                fontSize: '3.2cqw',
                color: '#696760',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '0.5cqw',
              }}
            >
              {(label1Name || 'DISTANCE').toUpperCase()}
            </div>
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontWeight: 400,
                fontSize: isNumericPr ? '6.5cqw' : '4.5cqw',
                color: '#0a4a72',
                whiteSpace: 'nowrap',
              }}
            >
              {prValue}
            </span>
            {prUnit && (
              <span
                style={{
                  fontFamily: "'Rowdies', 'Arial Black', sans-serif",
                  fontWeight: 700,
                  fontSize: '4.5cqw',
                  color: '#0a4a72',
                  marginLeft: '1cqw',
                  whiteSpace: 'nowrap',
                }}
              >
                {prUnit}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TokenFrame;
