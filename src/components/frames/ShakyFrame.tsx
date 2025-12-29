interface ShakyFrameProps {
  imageUrl: string;
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

const ShakyFrame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale, label1, label2 }: ShakyFrameProps) => {
  const metricLabel = label1 || 'Metric';
  const durationLabel = label2 || 'Duration';
  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative">
      {/* Background image filling the frame */}
      <img 
        src={imageUrl}
        alt="Activity"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
        }}
      />
      
      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col">
        {/* Week/Day badge - top left */}
        <div 
          className="inline-flex self-start rounded-full px-2.5 py-1"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          <span className="text-white font-semibold text-[10px] tracking-wider">WEEK {week} | DAY {day}</span>
        </div>
        
        {/* Activity name */}
        <h2 
          className="text-white font-black italic mt-2 leading-[0.95]"
          style={{
            fontSize: 'clamp(28px, 10vw, 40px)',
            textShadow: '2px 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {activity}
        </h2>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Stats at bottom */}
        <div className="flex gap-6">
          <div className="flex-1">
            <p className="text-white/60 text-[10px] font-medium mb-0.5 tracking-wide">{durationLabel}</p>
            <p 
              className="text-white font-bold leading-none text-xl animate-subtle-pulse"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {duration || "02:00:50"}
            </p>
            <div className="flex items-end gap-0.5 mt-2 h-6">
              <div className="w-2.5 h-2.5 bg-white/20 rounded-sm animate-subtle-float" style={{ animationDelay: '0s' }} />
              <div className="w-2.5 h-5 bg-white/20 rounded-sm animate-subtle-float" style={{ animationDelay: '0.2s' }} />
              <div className="w-2.5 h-6 bg-white/20 rounded-sm animate-subtle-float" style={{ animationDelay: '0.4s' }} />
              <div className="w-2.5 h-4 bg-white/20 rounded-sm animate-subtle-float" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-white/60 text-[10px] font-medium mb-0.5 tracking-wide">{metricLabel}</p>
            <p 
              className="text-white font-bold leading-none text-xl animate-subtle-pulse"
              style={{ fontVariantNumeric: 'tabular-nums', animationDelay: '0.5s' }}
            >
              {pr || "10"}
            </p>
            <svg className="w-16 h-6 mt-2 animate-subtle-wave" viewBox="0 0 96 40" fill="none">
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