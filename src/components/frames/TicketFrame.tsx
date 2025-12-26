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
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative">
      {/* Full bleed background image */}
      <img 
        src={imageUrl}
        alt="Activity"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
        }}
      />
      
      {/* Ticket frame overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top section - cream background with title */}
        <div 
          className="absolute top-0 left-0 right-0 h-[15%] flex items-center justify-center"
          style={{ background: '#F5F3ED' }}
        >
          <h1 
            className="text-[#2D2D2D] text-[42px] font-black uppercase tracking-tight leading-none animate-subtle-pulse"
            style={{ fontFamily: 'Impact, sans-serif' }}
          >
            {activity || 'TENNIS'}
          </h1>
        </div>
        
        {/* Left frame border */}
        <div 
          className="absolute top-[15%] left-0 w-4 bottom-[35%]"
          style={{ background: '#F5F3ED' }}
        />
        
        {/* Right frame border */}
        <div 
          className="absolute top-[15%] right-0 w-4 bottom-[35%]"
          style={{ background: '#F5F3ED' }}
        />
        
        {/* Bottom section - cream background with stats */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[35%]"
          style={{ background: '#F5F3ED' }}
        >
          {/* Ribbon badge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="relative">
              {/* Ribbon wings - left */}
              <svg className="absolute -left-5 top-1/2 -translate-y-1/2 w-6 h-5 animate-subtle-wave" viewBox="0 0 24 20">
                <polygon points="24,3 0,6 0,14 24,17" fill="#C5C3BC" />
              </svg>
              {/* Ribbon wings - right */}
              <svg className="absolute -right-5 top-1/2 -translate-y-1/2 w-6 h-5 animate-subtle-wave" style={{ animationDelay: '0.5s' }} viewBox="0 0 24 20">
                <polygon points="0,3 24,6 24,14 0,17" fill="#C5C3BC" />
              </svg>
              
              {/* Ribbon center */}
              <div className="bg-[#D0CEC7] px-5 py-1.5 relative shadow-sm">
                <span 
                  className="text-[#3D3D3D] font-black text-base tracking-wide"
                  style={{ fontFamily: 'Impact, sans-serif' }}
                >
                  WEEK {week} | DAY {day}
                </span>
              </div>
            </div>
          </div>
          
          {/* Dashed divider line */}
          <div className="absolute top-[22%] left-0 right-0 px-4">
            <div className="border-t-2 border-dashed border-[#C5C3BC]" />
          </div>
          
          {/* Side notches - left */}
          <div 
            className="absolute left-0 top-[22%] -translate-y-1/2 w-4 h-8 rounded-r-full"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          />
          {/* Side notches - right */}
          <div 
            className="absolute right-0 top-[22%] -translate-y-1/2 w-4 h-8 rounded-l-full"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          />
          
          {/* Stats section */}
          <div className="absolute bottom-4 left-0 right-0 px-6">
            <div className="flex justify-center items-end gap-6">
              {/* Laps */}
              <div className="text-center flex-1">
                <p className="text-[#6B6B6B] text-sm font-medium mb-0.5">Laps</p>
                <p 
                  className="text-[#2D2D2D] text-[44px] font-black leading-none animate-subtle-float"
                  style={{ fontFamily: 'Impact, sans-serif' }}
                >
                  {pr || '20'}
                </p>
              </div>
              
              {/* Divider */}
              <div className="h-16 w-[3px] bg-[#2D2D2D] rounded-full" />
              
              {/* Duration */}
              <div className="text-center flex-1">
                <p className="text-[#6B6B6B] text-sm font-medium mb-0.5">Duration</p>
                <p 
                  className="text-[#2D2D2D] text-[44px] font-black leading-none animate-subtle-float"
                  style={{ fontFamily: 'Impact, sans-serif', animationDelay: '0.3s' }}
                >
                  {duration || '2HRS'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Inner photo frame border - subtle shadow inset */}
        <div 
          className="absolute top-[15%] left-4 right-4 bottom-[35%] rounded-sm pointer-events-none"
          style={{ 
            boxShadow: 'inset 0 0 0 3px #F5F3ED, inset 0 0 10px rgba(0,0,0,0.1)'
          }}
        />
      </div>
    </div>
  );
};

export default TicketFrame;
