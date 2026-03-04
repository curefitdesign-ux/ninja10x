import { useRef, useEffect } from 'react';

interface ShakyFrameProps {
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

const ShakyFrame = ({ imageUrl, isVideo, activity, week, day, duration, pr, imagePosition, imageScale, label1, label2 }: ShakyFrameProps) => {
  const metricLabel = label1 || 'Distance';
  const durationLabel = label2 || 'Duration';
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative bg-black" style={{ containerType: 'inline-size' }}>
      {/* Background image or video filling the frame */}
      <div className="absolute inset-0 overflow-hidden">
        {isVideo ? (
          <video 
            ref={videoRef}
            src={imageUrl}
            autoPlay loop muted playsInline
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
            style={{
              transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})`,
            }}
          />
        )}
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: '4cqw' }}>
        {/* Week/Day badge - top left */}
        <div 
          className="inline-flex self-start rounded-full"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.25)',
            padding: '1cqw 2.5cqw',
          }}
        >
          <span className="text-white font-semibold tracking-wider" style={{ fontSize: 'calc(2.5cqw + 5px)' }}>WEEK {week} | DAY {day}</span>
        </div>
        
        {/* Activity name */}
        <h2 
          className="text-white font-black italic leading-[0.95]"
          style={{
            fontSize: '13cqw',
            marginTop: 'calc(2cqw + 5px)',
            marginLeft: '10px',
          }}
        >
          {activity}
        </h2>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Stats at bottom */}
        {(duration || pr) && (
          <div className="flex" style={{ gap: '6cqw' }}>
            {duration && (
              <div className="flex-1">
                <p className="text-white/60 font-medium tracking-wide" style={{ fontSize: '2.5cqw', marginBottom: '0.5cqw' }}>{durationLabel}</p>
                <p 
                  className="text-white font-bold leading-none animate-subtle-pulse"
                  style={{ fontSize: '5.5cqw', fontVariantNumeric: 'tabular-nums' }}
                >
                  {duration}
                </p>
                <div className="flex items-end" style={{ gap: '0.5cqw', marginTop: '2cqw', height: '6cqw' }}>
                  <div className="bg-white/20 rounded-sm animate-subtle-float" style={{ width: '2.5cqw', height: '2.5cqw', animationDelay: '0s' }} />
                  <div className="bg-white/20 rounded-sm animate-subtle-float" style={{ width: '2.5cqw', height: '5cqw', animationDelay: '0.2s' }} />
                  <div className="bg-white/20 rounded-sm animate-subtle-float" style={{ width: '2.5cqw', height: '6cqw', animationDelay: '0.4s' }} />
                  <div className="bg-white/20 rounded-sm animate-subtle-float" style={{ width: '2.5cqw', height: '4cqw', animationDelay: '0.6s' }} />
                </div>
              </div>
            )}
            
            {pr && (
              <div className="flex-1">
                <p className="text-white/60 font-medium tracking-wide" style={{ fontSize: '2.5cqw', marginBottom: '0.5cqw' }}>{metricLabel}</p>
                <p 
                  className="text-white font-bold leading-none animate-subtle-pulse"
                  style={{ fontSize: '5.5cqw', fontVariantNumeric: 'tabular-nums', animationDelay: '0.5s' }}
                >
                  {pr}
                </p>
                <svg style={{ width: '16cqw', height: '6cqw', marginTop: '2cqw' }} viewBox="0 0 96 40" fill="none">
                  <path 
                    d="M0 30 L14 22 L28 26 L42 14 L56 20 L70 10 L84 14 L96 6" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShakyFrame;
