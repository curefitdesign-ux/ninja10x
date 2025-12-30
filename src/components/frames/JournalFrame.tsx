import shuttlecockIcon from '@/assets/frames/shuttlecock.png';
import journalBg from '@/assets/frames/journal-bg.png';

interface JournalFrameProps {
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

const JournalFrame = ({
  imageUrl,
  isVideo,
  activity,
  week,
  day,
  duration,
  pr,
  imagePosition,
  imageScale,
  label1,
  label2,
}: JournalFrameProps) => {
  const metricLabel = label1 || 'Metric';
  const durationLabel = label2 || 'Duration';
  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative">
      {/* Background image */}
      <img 
        src={journalBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Paperclip - with subtle animation */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 animate-subtle-float">
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
        className="absolute top-10 left-4 right-4 bottom-[140px] rounded-xl overflow-hidden bg-black"
        style={{
          transform: 'rotate(10deg) scale(0.8)',
        }}
      >
        {isVideo ? (
          <video 
            src={imageUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            }}
          />
        ) : (
          <img 
            src={imageUrl}
            alt="Activity"
            className="w-full h-full object-cover"
            style={{
              transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            }}
          />
        )}
      </div>
      
      {/* Activity icon - Shuttlecock - positioned above the tilted image with animation */}
      <div className="absolute left-[34px] top-[35px] z-20 animate-subtle-wave">
        <img 
          src={shuttlecockIcon}
          alt="Shuttlecock"
          className="w-20 h-20 object-contain"
        />
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-0">
        {/* Badge */}
        <div className="mb-3">
          <div 
            className="inline-flex rounded-full px-3 py-1"
            style={{ background: '#2DD4A8' }}
          >
            <span className="text-black font-bold text-[10px] tracking-wide whitespace-nowrap">WEEK {week} | DAY {day}</span>
          </div>
        </div>
        
        {/* Activity name */}
        <h2 className="text-black text-[32px] font-black leading-none mb-3">{activity}</h2>
        
        {/* Stats row */}
        <div className="flex gap-8">
          <div>
            <p className="text-gray-500 text-xs font-medium">{metricLabel}</p>
            <p className="text-black text-2xl font-black">{pr || "10"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium">{durationLabel}</p>
            <p className="text-black text-2xl font-black">{duration || "02hrs"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalFrame;