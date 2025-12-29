interface TicketFrameProps {
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

const TicketFrame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale, label1, label2 }: TicketFrameProps) => {
  const metricLabel = label1 || 'Metric';
  const durationLabel = label2 || 'Duration';
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
          className="absolute top-0 left-0 right-0 flex items-center justify-center"
          style={{ background: '#F5F3ED', height: '14%' }}
        >
          <h1 
            className="text-[#2D2D2D] text-[48px] font-black uppercase tracking-tight leading-none"
            style={{ fontFamily: 'Impact, sans-serif' }}
          >
            {activity || 'TENNIS'}
          </h1>
        </div>
        
        {/* Left frame border */}
        <div 
          className="absolute left-0"
          style={{ background: '#F5F3ED', top: '14%', bottom: '30%', width: '16px' }}
        />
        
        {/* Right frame border */}
        <div 
          className="absolute right-0"
          style={{ background: '#F5F3ED', top: '14%', bottom: '30%', width: '16px' }}
        />
        
        {/* Photo frame with white border */}
        <div 
          className="absolute left-4 right-4 bg-white"
          style={{ 
            top: '14%', 
            bottom: '30%',
            boxShadow: 'inset 0 0 0 8px white'
          }}
        >
          {/* Inner white border effect */}
          <div 
            className="absolute inset-2 overflow-hidden"
            style={{ border: '6px solid white' }}
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
        </div>
        
        {/* Bottom section - cream background with stats */}
        <div 
          className="absolute bottom-0 left-0 right-0"
          style={{ background: '#F5F3ED', height: '30%' }}
        >
          {/* Ribbon badge - positioned at top edge */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: '-12px' }}>
            <div className="relative flex items-center">
              {/* Ribbon wings - left */}
              <svg className="w-8 h-6" viewBox="0 0 32 24" style={{ marginRight: '-2px' }}>
                <polygon points="32,4 0,8 0,16 32,20" fill="#B8B6AF" />
              </svg>
              
              {/* Ribbon center */}
              <div 
                className="bg-[#C5C3BC] px-4 py-1.5 relative"
                style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
              >
                <span 
                  className="text-[#4A4A4A] font-black text-sm tracking-wide whitespace-nowrap"
                  style={{ fontFamily: 'Impact, sans-serif' }}
                >
                  WEEK {week} | DAY {day}
                </span>
              </div>
              
              {/* Ribbon wings - right */}
              <svg className="w-8 h-6" viewBox="0 0 32 24" style={{ marginLeft: '-2px' }}>
                <polygon points="0,4 32,8 32,16 0,20" fill="#B8B6AF" />
              </svg>
            </div>
          </div>
          
          {/* Side notches - left */}
          <div 
            className="absolute left-0 w-5 h-10 rounded-r-full"
            style={{ 
              background: 'transparent',
              top: '35%',
              transform: 'translateY(-50%)',
              boxShadow: '-20px 0 0 0 rgba(0,0,0,0.2), inset 0 0 0 0 transparent'
            }}
          >
            <div 
              className="absolute inset-0 rounded-r-full"
              style={{ 
                background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)'
              }}
            />
          </div>
          
          {/* Side notches - right */}
          <div 
            className="absolute right-0 w-5 h-10 rounded-l-full"
            style={{ 
              background: 'transparent',
              top: '35%',
              transform: 'translateY(-50%)',
            }}
          >
            <div 
              className="absolute inset-0 rounded-l-full"
              style={{ 
                background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)'
              }}
            />
          </div>
          
          {/* Cutout notches */}
          <div 
            className="absolute left-0 w-4 h-8 rounded-r-full"
            style={{ 
              top: '35%',
              transform: 'translateX(-50%) translateY(-50%)',
              background: 'rgba(0,0,0,0.2)'
            }}
          />
          <div 
            className="absolute right-0 w-4 h-8 rounded-l-full"
            style={{ 
              top: '35%',
              transform: 'translateX(50%) translateY(-50%)',
              background: 'rgba(0,0,0,0.2)'
            }}
          />
          
          {/* Dashed divider line */}
          <div className="absolute left-6 right-6" style={{ top: '35%' }}>
            <div 
              className="border-t-2 border-dashed"
              style={{ borderColor: '#C5C3BC' }}
            />
          </div>
          
          {/* Stats section */}
          <div className="absolute left-0 right-0 px-8" style={{ bottom: '15%' }}>
            <div className="flex justify-center items-end">
              {/* Metric */}
              <div className="text-center flex-1">
                <p className="text-[#7A7A7A] text-base font-medium mb-1">{metricLabel}</p>
                <p 
                  className="text-[#2D2D2D] text-[52px] font-black leading-none"
                  style={{ fontFamily: 'Impact, sans-serif' }}
                >
                  {pr || '20'}
                </p>
              </div>
              
              {/* Divider */}
              <div className="h-20 w-[3px] bg-[#2D2D2D] rounded-full mx-4" />
              
              {/* Duration */}
              <div className="text-center flex-1">
                <p className="text-[#7A7A7A] text-base font-medium mb-1">{durationLabel}</p>
                <p 
                  className="text-[#2D2D2D] text-[52px] font-black leading-none uppercase"
                  style={{ fontFamily: 'Impact, sans-serif' }}
                >
                  {duration || '2HRS'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFrame;
