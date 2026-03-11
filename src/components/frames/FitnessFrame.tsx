import { useRef, useEffect, useId } from 'react';

interface FitnessFrameProps {
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

const FitnessFrame = ({ imageUrl, isVideo, activity, week, day, duration, pr, imagePosition, imageScale, label1, label2 }: FitnessFrameProps) => {
  const metricLabel = label1 || 'Distance';
  const durationLabel = label2 || 'Duration';
  const videoRef = useRef<HTMLVideoElement>(null);
  const uid = useId().replace(/:/g, '');
  const gridPatternId = `fitnessGrid-${uid}`;

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[0px] overflow-hidden relative" style={{ background: '#6B6B2A', containerType: 'inline-size' }}>
      {/* Grid background */}
      <div className="absolute inset-0">
        <div 
          className="absolute rounded-[12px]" 
          style={{ inset: '2.5cqw', border: '1px solid rgba(165, 165, 96, 0.35)' }}
        />
        
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={gridPatternId} width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(165, 165, 96, 0.45)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
        </svg>
        
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <ellipse cx="60" cy="50" rx="35" ry="25" fill="none" stroke="rgba(200, 200, 180, 0.12)" strokeWidth="0.15" transform="rotate(-15 60 50)" />
          <ellipse cx="55" cy="75" rx="40" ry="20" fill="none" stroke="rgba(200, 200, 180, 0.1)" strokeWidth="0.15" transform="rotate(-10 55 75)" />
        </svg>
      </div>
      
      {/* CONQUER WILL POWER tag */}
      <div className="absolute z-20" style={{ top: 'calc(8cqw + 20px)', right: '3cqw' }}>
        <div style={{ background: '#F45B4A', borderRadius: '2px', padding: '2px 6px' }}>
          <span className="text-white font-normal uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'calc(3.5cqw + 3px)', letterSpacing: '0.5px' }}>
            CONQUER WILL POWER
          </span>
        </div>
      </div>
      
      {/* CULT NINJA title + activity name */}
      <div className="absolute z-20" style={{ top: '13cqw', left: '4cqw' }}>
        <h1 
          className="font-black leading-[0.9] uppercase"
          style={{ color: '#F4E14D', fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(28px, 17cqw, 60px)', letterSpacing: '0px', textShadow: '2px 3px 4px rgba(0,0,0,0.35)' }}
        >
          CULT
        </h1>
        <h2 
          className="font-black leading-[0.95] uppercase"
          style={{ color: '#FFFFFF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(32px, 20cqw, 68px)', letterSpacing: '0px', textShadow: '3px 4px 8px rgba(0,0,0,0.5)', marginTop: '0.5cqw' }}
        >
          NINJA
        </h2>
        {activity && activity !== 'Activity' && (
          <div 
            className="inline-block"
            style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '1cqw', padding: '0.5cqw 2cqw', marginTop: '1.5cqw', backdropFilter: 'blur(4px)' }}
          >
            <span 
              className="text-white/90 font-bold uppercase"
              style={{ fontFamily: 'system-ui, sans-serif', fontSize: '2.8cqw', letterSpacing: '0.1em' }}
            >
              {activity}
            </span>
          </div>
        )}
      </div>
      
      {/* Photo container */}
      <div 
        className="absolute z-10"
        style={{ top: '22%', left: '50%', width: '75%', height: '48%', transform: 'translateX(-50%) rotate(-8deg)' }}
      >
        {/* Image container */}
        <div className="relative w-full h-full overflow-hidden bg-black" style={{ borderRadius: '4cqw' }}>
          <div className="absolute inset-0 overflow-hidden">
            {isVideo ? (
              <video 
                ref={videoRef}
                src={imageUrl}
                autoPlay loop muted playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})` }}
              />
            ) : (
              <img 
                src={imageUrl}
                alt="Activity"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                style={{ transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})` }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Stats pills */}
      {(duration || pr) && (
        <div className="absolute z-20" style={{ left: '3cqw', bottom: 'calc(18% + 10px)' }}>
          <div className="flex flex-col" style={{ gap: '1.5cqw' }}>
            {pr && (
              <div style={{ background: '#F45B4A', borderRadius: '2px', padding: '2px 6px' }}>
                <span className="text-white font-normal uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'calc(4cqw + 3px)', letterSpacing: '0.5px' }}>
                  {metricLabel} : {pr}
                </span>
              </div>
            )}
            {duration && (
              <div style={{ background: '#F45B4A', borderRadius: '2px', padding: '2px 6px' }}>
                <span className="text-white font-normal uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'calc(4cqw + 3px)', letterSpacing: '0.5px' }}>
                  {durationLabel} : {duration}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Bottom right - journey progress */}
      <div className="absolute z-20 text-right" style={{ right: '4cqw', bottom: '6%' }}>
        <h3 
          className="font-black leading-[0.9] uppercase"
          style={{ color: '#F4E14D', fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(24px, 14cqw, 50px)', letterSpacing: '0px', textShadow: '2px 3px 4px rgba(0,0,0,0.35)' }}
        >
          W{week}/D{((day - 1) % 3) + 1}
        </h3>
        <h4 
          className="font-black leading-[0.95] uppercase"
          style={{ color: '#FFFFFF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(32px, 20cqw, 68px)', letterSpacing: '0px', textShadow: '3px 4px 8px rgba(0,0,0,0.5)', marginTop: '0.5cqw' }}
        >
          Journey
        </h4>
      </div>
    </div>
  );
};

export default FitnessFrame;
