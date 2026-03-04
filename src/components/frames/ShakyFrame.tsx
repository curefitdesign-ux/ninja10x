import { useRef, useEffect } from 'react';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/instrument-sans/700.css';

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

  const fontFamily = "'Instrument Sans', system-ui, sans-serif";

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
            marginTop: '20px',
            marginLeft: '10px',
          }}
        >
          <span className="text-white font-semibold tracking-wider" style={{ fontSize: 'calc(2.5cqw + 2px)', fontFamily }}>CULT NINJA JOURNEY · WEEK {week} | DAY {day}</span>
        </div>
        
        {/* Activity name */}
        <h2 
          className="text-white font-bold leading-[0.95]"
          style={{
            fontSize: 'calc(13cqw + 5px)',
            marginTop: 'calc(2cqw + 5px)',
            marginLeft: '10px',
            fontFamily,
            fontStyle: 'normal',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {activity}
        </h2>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Stats at bottom */}
        {(duration || pr) && (
          <div className="flex" style={{ gap: '6cqw', marginLeft: '10px', marginBottom: '10px' }}>
            {duration && (
              <div className="flex-1">
                <p className="text-white/60 font-medium tracking-wide" style={{ fontSize: 'calc(2.5cqw + 5px)', marginBottom: '0.5cqw', fontFamily }}>{durationLabel}</p>
                <p 
                  className="text-white font-bold leading-none animate-subtle-pulse"
                  style={{ fontSize: 'calc(5.5cqw + 5px)', fontVariantNumeric: 'tabular-nums', fontFamily }}
                >
                  {duration}
                </p>
                {/* Lollipop chart infographic */}
                <svg style={{ width: '22cqw', height: '8cqw', marginTop: '2cqw' }} viewBox="0 0 130 50" fill="none">
                  <line x1="5" y1="48" x2="5" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="5" cy="28" r="3.5" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="20" y1="48" x2="20" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="4" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="35" y1="48" x2="35" y2="26" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="35" cy="24" r="3.5" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="50" y1="48" x2="50" y2="16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="50" cy="14" r="4.5" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="65" y1="48" x2="65" y2="8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="65" cy="6" r="5.5" fill="rgba(255,255,255,0.4)" />
                  
                  <line x1="80" y1="48" x2="80" y2="32" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="80" cy="30" r="3" fill="rgba(255,255,255,0.3)" />
                  
                  <line x1="95" y1="48" x2="95" y2="24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="95" cy="22" r="4" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="110" y1="48" x2="110" y2="36" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="110" cy="34" r="3" fill="rgba(255,255,255,0.3)" />
                  
                  <line x1="125" y1="48" x2="125" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="125" cy="16" r="4" fill="rgba(255,255,255,0.35)" />
                </svg>
              </div>
            )}
            
            {pr && (
              <div className="flex-1">
                <p className="text-white/60 font-medium tracking-wide" style={{ fontSize: 'calc(2.5cqw + 5px)', marginBottom: '0.5cqw', fontFamily }}>{metricLabel}</p>
                <p 
                  className="text-white font-bold leading-none animate-subtle-pulse"
                  style={{ fontSize: 'calc(5.5cqw + 5px)', fontVariantNumeric: 'tabular-nums', animationDelay: '0.5s', fontFamily }}
                >
                  {pr}
                </p>
                {/* Lollipop chart infographic */}
                <svg style={{ width: '22cqw', height: '8cqw', marginTop: '2cqw' }} viewBox="0 0 130 50" fill="none">
                  <line x1="5" y1="48" x2="5" y2="34" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="5" cy="32" r="3" fill="rgba(255,255,255,0.3)" />
                  
                  <line x1="20" y1="48" x2="20" y2="18" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="20" cy="16" r="4" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="35" y1="48" x2="35" y2="28" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="35" cy="26" r="3.5" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="50" y1="48" x2="50" y2="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="50" cy="10" r="5" fill="rgba(255,255,255,0.4)" />
                  
                  <line x1="65" y1="48" x2="65" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="65" cy="20" r="4" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="80" y1="48" x2="80" y2="38" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="80" cy="36" r="3" fill="rgba(255,255,255,0.3)" />
                  
                  <line x1="95" y1="48" x2="95" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="95" cy="12" r="4.5" fill="rgba(255,255,255,0.35)" />
                  
                  <line x1="110" y1="48" x2="110" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="110" cy="28" r="3.5" fill="rgba(255,255,255,0.35)" />
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