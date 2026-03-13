import { useRef, useEffect } from 'react';
import ticketFrameAsset from '@/assets/frames/ticket-frame.png';
import ribbonAsset from '@/assets/frames/ticket-ribbon.png';

interface TicketFrameProps {
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

const TicketFrame = ({
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
}: TicketFrameProps) => {
  const metricLabel = label1 || 'Distance';
  const durationLabel = label2 || 'Duration';
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  const mediaTransform =
    imagePosition.x || imagePosition.y || imageScale !== 1
      ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`
      : `scale(${imageScale})`;

  return (
    <div className="w-full h-full overflow-hidden relative bg-black" style={{ containerType: 'inline-size' }}>
      {/* Layer 1: Background Image or Video */}
      <div className="absolute inset-0 overflow-hidden z-0">
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

      {/* Layer 2: Ticket frame */}
      <img
        src={ticketFrameAsset}
        alt=""
        className="absolute z-10 pointer-events-none"
        style={{
          objectFit: 'fill',
          top: '4%',
          left: '6%',
          width: '88%',
          height: '92%',
        }}
      />

      {/* Layer 3: Title */}
      <div
        className="absolute z-20 left-0 right-0 flex items-center justify-center"
        style={{
          top: '13.5cqw',
          height: '6%',
        }}
      >
        <h1
          className="text-[#2A2A2A] uppercase leading-none text-center"
          style={{
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '10.5cqw',
            letterSpacing: '0.6cqw',
          }}
        >
          {activity || 'TENNIS'}
        </h1>
      </div>

      {/* Layer 4: Ribbon */}
      <div
        className="absolute z-30 left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{
          top: '65%',
          width: '50%',
          height: '4%',
        }}
      >
        <img
          src={ribbonAsset}
          alt=""
          className="absolute w-full h-auto"
          style={{
            transform: 'rotate(-4deg)',
            filter: 'brightness(0.92)',
          }}
        />
        <span
          className="relative z-10 text-[#5A5A5A] font-bold whitespace-nowrap"
          style={{
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '3.8cqw',
            letterSpacing: '0.4cqw',
            transform: 'rotate(-4deg)',
          }}
        >
          WEEK {week} | DAY {day}
        </span>
      </div>

      {/* Layer 5: Dashed divider */}
      <div className="absolute z-20 left-[10%] right-[10%]" style={{ top: '73%' }}>
        <div
          className="w-full"
          style={{
            borderTop: '0.45cqw dashed #C8C5BC',
          }}
        />
      </div>

      {/* Layer 6-9: Stats section */}
      {(duration || pr) && (
        <div
          className="absolute z-20 left-0 right-0 px-[10%] flex items-center justify-center"
          style={{
            top: '71%',
            height: '24%',
          }}
        >
          <div className="flex items-center justify-center w-full">
            {pr && (
              <div className="text-center flex-1">
                <p
                  className="text-[#888888] font-normal mb-1"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '3.3cqw',
                    letterSpacing: '0.15cqw',
                  }}
                >
                  {metricLabel}
                </p>
                <p
                  className="text-[#2A2A2A] leading-none"
                  style={{
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    fontSize: '13cqw',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pr}
                </p>
              </div>
            )}

            {pr && duration && (
              <div
                style={{
                  width: '0.5cqw',
                  height: '15cqw',
                  margin: '0 1.6cqw',
                  borderRadius: '9999px',
                  background: '#2A2A2A',
                }}
              />
            )}

            {duration && (
              <div className="text-center flex-1">
                <p
                  className="text-[#888888] font-normal mb-1"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '3.3cqw',
                    letterSpacing: '0.15cqw',
                  }}
                >
                  {durationLabel}
                </p>
                <p
                  className="text-[#2A2A2A] leading-none uppercase"
                  style={{
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    fontSize: '13cqw',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {duration}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketFrame;
