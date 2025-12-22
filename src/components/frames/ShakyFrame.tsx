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
    <div className="w-full aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl relative bg-black/20">
      {/* Background image with aspect ratio maintained */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src={imageUrl}
          alt="Activity"
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
          }}
        />
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col">
        {/* Week/Day badge - top left */}
        <div 
          className="inline-flex self-start rounded-full px-3 py-1.5"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          <span className="text-white font-semibold text-[11px] tracking-wider">WEEK {week} | DAY {day}</span>
        </div>
        
        {/* Activity name - large italic bold */}
        <h2 
          className="text-white font-black italic mt-3 leading-[0.95]"
          style={{
            fontSize: 'clamp(36px, 12vw, 52px)',
            textShadow: '2px 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {activity}
        </h2>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Stats at bottom - side by side */}
        <div className="flex gap-8">
          {/* Time section */}
          <div className="flex-1">
            <p className="text-white/60 text-xs font-medium mb-0.5 tracking-wide">Time</p>
            <p 
              className="text-white font-bold leading-none"
              style={{ 
                fontSize: 'clamp(28px, 8vw, 36px)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {duration || "02:00:50"}
            </p>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1 mt-3 h-10">
              <div className="w-4 h-4 bg-white/20 rounded-sm" />
              <div className="w-4 h-8 bg-white/20 rounded-sm" />
              <div className="w-4 h-10 bg-white/20 rounded-sm" />
              <div className="w-4 h-6 bg-white/20 rounded-sm" />
            </div>
          </div>
          
          {/* PR section */}
          <div className="flex-1">
            <p className="text-white/60 text-xs font-medium mb-0.5 tracking-wide">Punches Per Round</p>
            <p 
              className="text-white font-bold leading-none"
              style={{ 
                fontSize: 'clamp(28px, 8vw, 36px)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pr || "100"}
            </p>
            {/* Mini line chart */}
            <svg className="w-24 h-10 mt-3" viewBox="0 0 96 40" fill="none">
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
        </div>
      </div>
    </div>
  );
};

export default ShakyFrame;