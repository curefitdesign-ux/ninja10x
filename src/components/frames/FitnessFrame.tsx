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
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative" style={{ background: '#7A7A32' }}>
      {/* Grid background */}
      <div className="absolute inset-0">
        {/* Outer border */}
        <div className="absolute inset-3 border border-[#A5A560]/40 rounded-lg" />
        
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="fitnessGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#A5A560" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fitnessGrid)" />
        </svg>
        
        {/* Curved decorative line */}
        <svg className="absolute inset-0 w-full h-full animate-subtle-wave" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path 
            d="M 30 45 Q 50 35, 70 50 Q 85 60, 95 55" 
            fill="none" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="0.3"
          />
          <path 
            d="M 25 75 Q 45 65, 65 80 Q 85 90, 100 85" 
            fill="none" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="0.3"
          />
        </svg>
      </div>
      
      {/* CONQUER WILL POWER tag */}
      <div className="absolute top-6 right-4 z-20 animate-subtle-pulse">
        <div className="bg-[#FF5A4D] px-3 py-1.5 rounded-sm">
          <span className="text-white font-bold text-[10px] tracking-wider">CONQUER WILL POWER</span>
        </div>
      </div>
      
      {/* CULT NINJA title */}
      <div className="absolute top-16 left-4 z-20">
        <h1 className="text-[#F4E04D] text-[40px] font-black italic leading-none tracking-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          CULT
        </h1>
        <h2 className="text-white text-[48px] font-black leading-none tracking-tight" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.4)' }}>
          NINJA
        </h2>
      </div>
      
      {/* Photo container - tilted */}
      <div 
        className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/4 w-[65%] aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-xl"
        style={{
          transform: 'translateX(-50%) translateY(-25%) rotate(8deg)',
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
      
      {/* Left side stats */}
      <div className="absolute left-4 bottom-[30%] z-20 space-y-2">
        <div className="bg-[#FF5A4D] px-3 py-1 rounded-sm animate-subtle-float" style={{ animationDelay: '0.2s' }}>
          <span className="text-white font-bold text-sm">Laps : {pr || '20'}</span>
        </div>
        <div className="bg-[#FF5A4D] px-3 py-1 rounded-sm animate-subtle-float" style={{ animationDelay: '0.4s' }}>
          <span className="text-white font-bold text-sm">Duration : {duration || '02:00:50'}</span>
        </div>
      </div>
      
      {/* Bottom right content */}
      <div className="absolute bottom-6 right-4 text-right z-20">
        <p className="text-white/60 text-sm font-medium">Week</p>
        <p className="text-[#F4E04D] text-[56px] font-black leading-none animate-subtle-pulse">{week}/{day + 2}</p>
        <p className="text-[#F4E04D] text-lg font-medium">Activity</p>
      </div>
    </div>
  );
};

export default FitnessFrame;
