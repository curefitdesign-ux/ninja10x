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
    <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-b from-gray-300 to-gray-400 shadow-2xl relative">
      {/* Background image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: `${imageScale * 100}%`,
          backgroundPosition: `${50 + imagePosition.x}% ${50 + imagePosition.y}%`,
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-gray-600/60" />
      
      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col">
        {/* Week/Day badge */}
        <div className="inline-flex self-start bg-white/30 backdrop-blur-sm rounded-full px-4 py-1.5">
          <span className="text-white font-semibold text-sm">WEEK {week} | DAY {day}</span>
        </div>
        
        {/* Activity name */}
        <h2 className="text-white text-4xl font-black italic mt-3 drop-shadow-lg">{activity}</h2>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Stats at bottom */}
        <div className="flex gap-8">
          <div>
            <p className="text-white/80 text-sm">Time</p>
            <p className="text-white text-3xl font-bold">{duration || "00:00:00"}</p>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1 mt-2 h-10">
              <div className="w-4 h-4 bg-white/30 rounded-sm" />
              <div className="w-4 h-8 bg-white/30 rounded-sm" />
              <div className="w-4 h-10 bg-white/30 rounded-sm" />
              <div className="w-4 h-6 bg-white/30 rounded-sm" />
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm">PR</p>
            <p className="text-white text-3xl font-bold">{pr || "-"}</p>
            {/* Mini line chart */}
            <svg className="w-24 h-10 mt-2" viewBox="0 0 100 40">
              <path 
                d="M0 30 L20 20 L40 25 L60 10 L80 15 L100 5" 
                fill="none" 
                stroke="rgba(255,255,255,0.3)" 
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShakyFrame;