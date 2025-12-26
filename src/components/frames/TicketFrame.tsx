interface TicketFrameProps {
  imageUrl: string;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
}

const TicketFrame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale }: TicketFrameProps) => {
  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative" style={{ background: '#F5F3ED' }}>
      {/* Side notches - left */}
      <div className="absolute left-0 top-[68%] -translate-y-1/2 w-6 h-12 rounded-r-full" style={{ background: 'rgba(0,0,0,0.1)' }} />
      {/* Side notches - right */}
      <div className="absolute right-0 top-[68%] -translate-y-1/2 w-6 h-12 rounded-l-full" style={{ background: 'rgba(0,0,0,0.1)' }} />
      
      {/* Activity title at top */}
      <div className="absolute top-6 left-0 right-0 text-center z-20">
        <h1 
          className="text-[#2D2D2D] text-[48px] font-black uppercase tracking-tight leading-none animate-subtle-pulse"
          style={{ fontFamily: 'Impact, sans-serif' }}
        >
          {activity || 'TENNIS'}
        </h1>
      </div>
      
      {/* Photo container */}
      <div className="absolute top-[15%] left-4 right-4 bottom-[35%] rounded-lg overflow-hidden bg-white border-4 border-[#E8E4DA]">
        <img 
          src={imageUrl}
          alt="Activity"
          className="w-full h-full object-cover"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
          }}
        />
      </div>
      
      {/* Ribbon badge */}
      <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2 z-20">
        <div className="relative">
          {/* Ribbon wings */}
          <svg className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-6 animate-subtle-wave" viewBox="0 0 32 24">
            <polygon points="32,4 0,8 0,16 32,20" fill="#BFBDB6" />
          </svg>
          <svg className="absolute -right-6 top-1/2 -translate-y-1/2 w-8 h-6 animate-subtle-wave" style={{ animationDelay: '0.5s' }} viewBox="0 0 32 24">
            <polygon points="0,4 32,8 32,16 0,20" fill="#BFBDB6" />
          </svg>
          
          {/* Ribbon center */}
          <div className="bg-[#CFCDC6] px-6 py-2 relative">
            <span 
              className="text-[#4A4A4A] font-black text-lg tracking-wide"
              style={{ fontFamily: 'Impact, sans-serif' }}
            >
              WEEK {week} | DAY {day}
            </span>
          </div>
        </div>
      </div>
      
      {/* Dashed divider line */}
      <div className="absolute bottom-[28%] left-6 right-6 border-t-2 border-dashed border-[#BFBDB6]" />
      
      {/* Bottom stats section */}
      <div className="absolute bottom-4 left-0 right-0 px-8">
        <div className="flex justify-between items-end">
          {/* Laps */}
          <div className="text-center">
            <p className="text-[#6B6B6B] text-sm font-medium mb-1">Laps</p>
            <p 
              className="text-[#2D2D2D] text-[48px] font-black leading-none animate-subtle-float"
              style={{ fontFamily: 'Impact, sans-serif' }}
            >
              {pr || '20'}
            </p>
          </div>
          
          {/* Divider */}
          <div className="h-20 w-[3px] bg-[#2D2D2D] mx-4" />
          
          {/* Duration */}
          <div className="text-center">
            <p className="text-[#6B6B6B] text-sm font-medium mb-1">Duration</p>
            <p 
              className="text-[#2D2D2D] text-[48px] font-black leading-none animate-subtle-float"
              style={{ fontFamily: 'Impact, sans-serif', animationDelay: '0.3s' }}
            >
              {duration || '2HRS'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFrame;
