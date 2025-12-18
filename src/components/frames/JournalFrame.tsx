interface JournalFrameProps {
  imageUrl: string;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
}

const JournalFrame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale }: JournalFrameProps) => {
  return (
    <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-2xl relative">
      {/* Paperclip */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <svg width="40" height="80" viewBox="0 0 40 80" fill="none">
          <path 
            d="M20 75 L20 15 C20 8 25 5 30 5 C35 5 38 10 38 15 L38 55 C38 60 35 63 30 63 L25 63" 
            stroke="#B0B0B0" 
            strokeWidth="3" 
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
      
      {/* Photo area */}
      <div className="absolute top-8 left-4 right-4 bottom-40 rounded-2xl overflow-hidden bg-gray-100">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: `${imageScale * 100}%`,
            backgroundPosition: `${50 + imagePosition.x}% ${50 + imagePosition.y}%`,
          }}
        />
      </div>
      
      {/* Activity icon */}
      <div className="absolute left-6 bottom-36">
        <span className="text-5xl">🏸</span>
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {/* Badges row */}
        <div className="flex justify-between mb-2">
          <div className="bg-emerald-400 rounded-full px-4 py-1.5">
            <span className="text-white font-bold text-sm">WEEK {week} | DAY {day}</span>
          </div>
          <div className="bg-emerald-400 rounded-full px-4 py-1.5">
            <span className="text-white font-bold text-sm">Bellandur, Bangalore</span>
          </div>
        </div>
        
        {/* Activity name */}
        <h2 className="text-black text-4xl font-black italic mb-2">{activity}</h2>
        
        {/* Stats */}
        <div className="flex gap-6">
          <div>
            <p className="text-gray-600 text-sm">Duration</p>
            <p className="text-black text-2xl font-bold">{duration || "02hrs"}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Rounds</p>
            <p className="text-black text-2xl font-bold">{pr || "10"}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Calories</p>
            <p className="text-black text-2xl font-bold">400</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalFrame;