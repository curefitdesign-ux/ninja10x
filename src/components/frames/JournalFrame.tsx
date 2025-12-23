import shuttlecockIcon from '@/assets/frames/shuttlecock.png';
import journalBg from '@/assets/frames/journal-bg.png';

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
    <div className="w-full aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative">
      {/* Background image */}
      <img 
        src={journalBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Paperclip */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
        <svg width="40" height="80" viewBox="0 0 48 100" fill="none">
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
      
      {/* Photo area filling the frame - tilted 10deg, 90% size */}
      <div 
        className="absolute top-10 left-4 right-4 bottom-[140px] rounded-xl overflow-hidden bg-gray-100"
        style={{
          transform: 'rotate(-10deg) scale(0.9)',
          transformOrigin: 'center center',
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
      
      {/* Activity icon - Shuttlecock - positioned above the tilted image */}
      <div className="absolute left-6 top-[45px] z-20">
        <img 
          src={shuttlecockIcon}
          alt="Shuttlecock"
          className="w-20 h-20 object-contain"
        />
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-0">
        {/* Badges row */}
        <div className="flex justify-between mb-2">
          <div 
            className="rounded-full px-3 py-1.5"
            style={{ background: '#2DD4A8' }}
          >
            <span className="text-white font-bold text-[10px] tracking-wide">WEEK {week} | DAY {day}</span>
          </div>
          <div 
            className="rounded-full px-3 py-1.5"
            style={{ background: '#2DD4A8' }}
          >
            <span className="text-white font-bold text-[10px] tracking-wide">Bellandur, Bangalore</span>
          </div>
        </div>
        
        {/* Activity name */}
        <h2 className="text-black text-[28px] font-black italic leading-none mb-2">{activity}</h2>
        
        {/* Stats row */}
        <div className="flex gap-6">
          <div>
            <p className="text-gray-500 text-[10px] font-medium">Duration</p>
            <p className="text-black text-xl font-bold">{duration || "02hrs"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] font-medium">Rounds</p>
            <p className="text-black text-xl font-bold">{pr || "10"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalFrame;