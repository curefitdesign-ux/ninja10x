interface ShakyFrameProps {
  imageUrl: string;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
}

const ShakyFrame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale }: ShakyFrameProps) => {
  return (
    <div className="w-full aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl relative">
      {/* Background image with object-cover fill */}
      <img 
        src={imageUrl}
        alt="Activity"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
        }}
      />
      
      
      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col">
        {/* Week/Day badge */}
        <div 
          className="inline-flex self-start rounded-full px-4 py-2"
          style={{
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <span className="text-white font-bold text-xs tracking-wide">WEEK {week} | DAY {day}</span>
        </div>
        
        {/* Activity name */}
        <h2 
          className="text-white text-[42px] font-black italic mt-4 leading-none"
          style={{
            textShadow: '2px 4px 8px rgba(0,0,0,0.2)',
          }}
        >
          {activity}
        </h2>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Stats at bottom */}
        <div className="flex gap-12">
          {/* Time section */}
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Time</p>
            <p 
              className="text-white text-[32px] font-bold tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {duration || "02:00:50"}
            </p>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1.5 mt-3 h-12">
              <div className="w-5 h-5 bg-white/25 rounded-sm" />
              <div className="w-5 h-10 bg-white/25 rounded-sm" />
              <div className="w-5 h-12 bg-white/25 rounded-sm" />
              <div className="w-5 h-7 bg-white/25 rounded-sm" />
            </div>
          </div>
          
          {/* PR section */}
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Punches Per Round</p>
            <p 
              className="text-white text-[32px] font-bold tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {pr || "100"}
            </p>
            {/* Mini line chart */}
            <svg className="w-28 h-12 mt-3" viewBox="0 0 112 48" fill="none">
              <path 
                d="M0 36 L16 28 L32 32 L48 18 L64 24 L80 12 L96 16 L112 8" 
                fill="none" 
                stroke="rgba(255,255,255,0.25)" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShakyFrame;