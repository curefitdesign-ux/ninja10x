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
  // Unique IDs per instance — prevents SVG pattern conflicts in carousel (white line artifact)
  const uid = useId().replace(/:/g, '');
  const gridPatternId = `fitnessGrid-${uid}`;

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[20px] overflow-hidden shadow-2xl relative" style={{ background: '#6B6B2A' }}>
      {/* Grid background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-[10px] rounded-[12px]" 
          style={{ border: '1px solid rgba(165, 165, 96, 0.35)' }}
        />
        
        {/* Unique pattern ID per instance — fixes white lines from ID collision */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={gridPatternId} width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(165, 165, 96, 0.45)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
        </svg>
        
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <ellipse 
            cx="60" cy="50" rx="35" ry="25"
            fill="none" 
            stroke="rgba(200, 200, 180, 0.12)" 
            strokeWidth="0.15"
            transform="rotate(-15 60 50)"
          />
          <ellipse 
            cx="55" cy="75" rx="40" ry="20"
            fill="none" 
            stroke="rgba(200, 200, 180, 0.1)" 
            strokeWidth="0.15"
            transform="rotate(-10 55 75)"
          />
        </svg>
      </div>
      
      {/* CONQUER WILL POWER tag */}
      <div className="absolute right-3 z-20 animate-subtle-pulse" style={{ top: 'calc(1.25rem + 20px)' }}>
        <div className="px-1.5 py-1" style={{ background: '#F45B4A', borderRadius: '2px' }}>
          <span className="text-white font-normal text-[14px] uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.5px' }}>
            CONQUER WILL POWER
          </span>
        </div>
      </div>
      
      {/* CULT NINJA title + actual activity name */}
      <div className="absolute top-12 left-4 z-20">
        <h1 
          className="text-[46px] font-black leading-[0.9] uppercase"
          style={{ color: '#F4E14D', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0px', textShadow: '2px 3px 4px rgba(0,0,0,0.35)' }}
        >
          CULT
        </h1>
        <h2 
          className="text-[54px] font-black leading-[0.95] uppercase"
          style={{ color: '#FFFFFF', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0px', textShadow: '3px 4px 8px rgba(0,0,0,0.5)', marginTop: '2px' }}
        >
          NINJA
        </h2>
        {/* Activity name badge */}
        {activity && activity !== 'Activity' && (
          <div 
            className="mt-1.5 inline-block px-2 py-0.5"
            style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '2px', backdropFilter: 'blur(4px)' }}
          >
            <span 
              className="text-white/90 font-bold text-[11px] tracking-[0.1em] uppercase"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {activity}
            </span>
          </div>
        )}
      </div>
      
      {/* Photo container - tilted with shadow */}
      <div 
        className="absolute z-10"
        style={{ top: '22%', left: '50%', width: 'calc(58% + 40px)', height: 'calc(44% + 75px)', transform: 'translateX(-50%) rotate(-8deg)' }}
      >
        <div 
          className="absolute inset-0 rounded-[16px]"
          style={{ background: 'rgba(0,0,0,0.3)', filter: 'blur(12px)', transform: 'translate(6px, 8px)' }}
        />
        <div className="relative w-full h-full rounded-[16px] overflow-hidden bg-black" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
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
                style={{ transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})` }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Stats pills */}
      {(duration || pr) && (
        <div className="absolute left-3 z-20 space-y-1.5" style={{ bottom: '26%' }}>
          {pr && (
           <div className="px-1.5 py-1 animate-subtle-float" style={{ background: '#F45B4A', borderRadius: '2px', animationDelay: '0.2s' }}>
              <span className="text-white font-normal text-[16px] uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.5px' }}>
                {metricLabel} : {pr}
              </span>
            </div>
          )}
          {duration && (
            <div className="px-1.5 py-1 animate-subtle-float" style={{ background: '#F45B4A', borderRadius: '2px', animationDelay: '0.4s' }}>
              <span className="text-white font-normal text-[16px] uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.5px' }}>
                {durationLabel} : {duration}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Bottom right - journey progress */}
      <div className="absolute right-4 z-20 text-right" style={{ bottom: '6%' }}>
        <p className="text-[13px] font-medium mb-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {week > 1 ? 'Week' : 'Day'}
        </p>
        <p 
          className="text-[52px] font-black leading-none animate-subtle-pulse"
          style={{ color: '#F4E14D', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.02em' }}
        >
          {week > 1 ? week : day}
        </p>
        <p className="text-[15px] font-medium -mt-1" style={{ color: '#F4E14D' }}>
          {week > 1 ? `Day ${((day - 1) % 3) + 1} of 3` : 'Journey'}
        </p>
      </div>
    </div>
  );
};

export default FitnessFrame;
