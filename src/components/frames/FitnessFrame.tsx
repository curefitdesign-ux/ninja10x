interface FitnessFrameProps {
  imageUrl: string;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
}

const FitnessFrame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale }: FitnessFrameProps) => {
  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[20px] overflow-hidden shadow-2xl relative" style={{ background: '#6B6B2A' }}>
      {/* Grid background */}
      <div className="absolute inset-0">
        {/* Outer border frame */}
        <div 
          className="absolute inset-[10px] rounded-[12px]" 
          style={{ border: '1px solid rgba(165, 165, 96, 0.35)' }}
        />
        
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="fitnessGrid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(165, 165, 96, 0.45)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fitnessGrid)" />
        </svg>
        
        {/* Curved decorative lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Upper curve around photo */}
          <ellipse 
            cx="60" cy="50" rx="35" ry="25"
            fill="none" 
            stroke="rgba(200, 200, 180, 0.12)" 
            strokeWidth="0.15"
            transform="rotate(-15 60 50)"
          />
          {/* Lower curve */}
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
      <div className="absolute top-5 right-3 z-20 animate-subtle-pulse">
        <div 
          className="px-2.5 py-1"
          style={{ 
            background: '#F45B4A',
            borderRadius: '2px'
          }}
        >
          <span 
            className="text-white font-bold text-[9px] tracking-[0.08em]"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            CONQUER WILL POWER
          </span>
        </div>
      </div>
      
      {/* CULT NINJA title */}
      <div className="absolute top-12 left-4 z-20">
        <h1 
          className="text-[36px] font-black italic leading-[0.9] tracking-tight"
          style={{ 
            color: '#F4E14D',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '2px 3px 4px rgba(0,0,0,0.35)'
          }}
        >
          CULT
        </h1>
        <h2 
          className="text-[44px] font-black leading-[0.95] tracking-tight -mt-1"
          style={{ 
            color: '#FFFFFF',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '3px 4px 8px rgba(0,0,0,0.5)'
          }}
        >
          NINJA
        </h2>
      </div>
      
      {/* Photo container - tilted with shadow */}
      <div 
        className="absolute z-10"
        style={{
          top: '18%',
          left: '50%',
          width: '68%',
          aspectRatio: '3/4',
          transform: 'translateX(-40%) rotate(-8deg)',
        }}
      >
        {/* Card shadow */}
        <div 
          className="absolute inset-0 rounded-[16px]"
          style={{
            background: 'rgba(0,0,0,0.3)',
            filter: 'blur(12px)',
            transform: 'translate(6px, 8px)',
          }}
        />
        {/* Photo card */}
        <div 
          className="relative w-full h-full rounded-[16px] overflow-hidden bg-white"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
          }}
        >
          <img 
            src={imageUrl}
            alt="Activity"
            className="w-full h-full object-cover"
            style={{
              transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            }}
          />
        </div>
      </div>
      
      {/* Left side stats pills */}
      <div className="absolute left-3 z-20 space-y-1.5" style={{ bottom: '26%' }}>
        <div 
          className="px-2.5 py-1 animate-subtle-float"
          style={{ 
            background: '#F45B4A',
            borderRadius: '2px',
            animationDelay: '0.2s'
          }}
        >
          <span 
            className="text-white font-bold text-[11px]"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Laps : {pr || '20'}
          </span>
        </div>
        <div 
          className="px-2.5 py-1 animate-subtle-float"
          style={{ 
            background: '#F45B4A',
            borderRadius: '2px',
            animationDelay: '0.4s'
          }}
        >
          <span 
            className="text-white font-bold text-[11px]"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Duration : {duration || '02:00:50'}
          </span>
        </div>
      </div>
      
      {/* Bottom right content */}
      <div className="absolute right-4 z-20 text-right" style={{ bottom: '6%' }}>
        <p 
          className="text-[13px] font-medium mb-0"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Week
        </p>
        <p 
          className="text-[52px] font-black leading-none animate-subtle-pulse"
          style={{ 
            color: '#F4E14D',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          {week}/{day + 2}
        </p>
        <p 
          className="text-[15px] font-medium -mt-1"
          style={{ color: '#F4E14D' }}
        >
          Activity
        </p>
      </div>
    </div>
  );
};

export default FitnessFrame;
