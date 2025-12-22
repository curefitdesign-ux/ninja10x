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
    <div className="w-full aspect-[3/4] rounded-[32px] overflow-hidden bg-white shadow-2xl relative">
      {/* Paperclip */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
        <svg width="48" height="100" viewBox="0 0 48 100" fill="none">
          <path 
            d="M24 90 L24 20 C24 10 30 6 36 6 C42 6 46 12 46 20 L46 65 C46 72 42 76 36 76 L28 76" 
            stroke="url(#paperclipGradient)" 
            strokeWidth="4" 
            fill="none"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="paperclipGradient" x1="24" y1="6" x2="24" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D0D0D0" />
              <stop offset="0.5" stopColor="#A0A0A0" />
              <stop offset="1" stopColor="#C0C0C0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Photo area with aspect ratio maintained */}
      <div className="absolute top-12 left-5 right-5 bottom-[180px] rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
        <img 
          src={imageUrl}
          alt="Activity"
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
          }}
        />
      </div>
      
      {/* Activity icon - Shuttlecock */}
      <div className="absolute left-6 bottom-[135px]">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          {/* Shuttlecock feathers */}
          <ellipse cx="28" cy="20" rx="16" ry="20" fill="url(#featherGradient)" />
          <ellipse cx="22" cy="18" rx="4" ry="10" fill="rgba(200,230,240,0.6)" />
          <ellipse cx="28" cy="16" rx="4" ry="12" fill="rgba(220,240,250,0.6)" />
          <ellipse cx="34" cy="18" rx="4" ry="10" fill="rgba(200,230,240,0.6)" />
          {/* Cork base */}
          <ellipse cx="28" cy="42" rx="8" ry="6" fill="#E8C4C4" />
          <ellipse cx="28" cy="40" rx="6" ry="4" fill="#F0D4D4" />
          <defs>
            <linearGradient id="featherGradient" x1="28" y1="0" x2="28" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E8F4F8" />
              <stop offset="1" stopColor="#C8E0E8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pt-0">
        {/* Badges row */}
        <div className="flex justify-between mb-3">
          <div 
            className="rounded-full px-4 py-2"
            style={{ background: '#2DD4A8' }}
          >
            <span className="text-white font-bold text-xs tracking-wide">WEEK {week} | DAY {day}</span>
          </div>
          <div 
            className="rounded-full px-4 py-2"
            style={{ background: '#2DD4A8' }}
          >
            <span className="text-white font-bold text-xs tracking-wide">Bellandur, Bangalore</span>
          </div>
        </div>
        
        {/* Activity name */}
        <h2 className="text-black text-[40px] font-black italic leading-none mb-2">{activity}</h2>
        
        {/* Stats row */}
        <div className="flex gap-8">
          <div>
            <p className="text-gray-500 text-sm font-medium">Duration</p>
            <p className="text-black text-[28px] font-bold">{duration || "02hrs"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Rounds</p>
            <p className="text-black text-[28px] font-bold">{pr || "10"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Calories</p>
            <p className="text-black text-[28px] font-bold">400</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalFrame;