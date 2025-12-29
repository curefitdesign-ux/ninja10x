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
    <div className="w-[90%] mx-auto aspect-[9/16] overflow-hidden relative bg-[#F5F0E8]">
      {/* Main ticket container */}
      <div className="absolute inset-0 flex flex-col">
        
        {/* Top cream header with activity name */}
        <div 
          className="flex items-center justify-center py-6 px-4"
          style={{ 
            background: '#F5F0E8',
            height: '10%',
            minHeight: '60px'
          }}
        >
          <h1 
            className="text-[#2A2A2A] text-[42px] font-black uppercase tracking-wide leading-none text-center"
            style={{ 
              fontFamily: 'Impact, "Arial Black", sans-serif',
              letterSpacing: '2px'
            }}
          >
            {activity || 'TENNIS'}
          </h1>
        </div>
        
        {/* Photo section with white border */}
        <div 
          className="relative mx-4 bg-white"
          style={{ 
            flex: '1 1 auto',
            minHeight: '45%'
          }}
        >
          {/* White border frame */}
          <div className="absolute inset-0 p-2">
            <div className="w-full h-full overflow-hidden relative">
              <img 
                src={imageUrl}
                alt="Activity"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Bottom stats section */}
        <div 
          className="relative"
          style={{ 
            background: '#F5F0E8',
            height: '35%',
            minHeight: '180px'
          }}
        >
          {/* Ribbon badge centered at top */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: '-14px' }}>
            <div className="relative flex items-center">
              {/* Left ribbon wing */}
              <svg width="28" height="28" viewBox="0 0 28 28" style={{ marginRight: '-1px' }}>
                <polygon points="28,6 0,10 0,18 28,22" fill="#C8C5BC" />
              </svg>
              
              {/* Center ribbon */}
              <div 
                className="px-5 py-2 relative"
                style={{ 
                  background: '#D4D1C8',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <span 
                  className="text-[#5A5A5A] font-bold text-sm tracking-wider whitespace-nowrap"
                  style={{ 
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    letterSpacing: '1px'
                  }}
                >
                  WEEK {week} | DAY {day}
                </span>
              </div>
              
              {/* Right ribbon wing */}
              <svg width="28" height="28" viewBox="0 0 28 28" style={{ marginLeft: '-1px' }}>
                <polygon points="0,6 28,10 28,18 0,22" fill="#C8C5BC" />
              </svg>
            </div>
          </div>
          
          {/* Left semicircle cutout */}
          <div 
            className="absolute left-0 w-5 h-10 rounded-r-full"
            style={{ 
              top: '28%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
              boxShadow: 'inset -3px 0 6px rgba(0,0,0,0.1)'
            }}
          />
          
          {/* Right semicircle cutout */}
          <div 
            className="absolute right-0 w-5 h-10 rounded-l-full"
            style={{ 
              top: '28%',
              transform: 'translateX(50%)',
              background: 'linear-gradient(to left, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
              boxShadow: 'inset 3px 0 6px rgba(0,0,0,0.1)'
            }}
          />
          
          {/* Dashed perforation line */}
          <div 
            className="absolute left-6 right-6"
            style={{ top: '33%' }}
          >
            <div 
              className="border-t-2 border-dashed"
              style={{ borderColor: '#C8C5BC' }}
            />
          </div>
          
          {/* Stats display */}
          <div 
            className="absolute left-0 right-0 px-8 flex items-end justify-center"
            style={{ bottom: '18%' }}
          >
            <div className="flex items-end justify-center w-full max-w-[320px]">
              {/* Left stat - Metric */}
              <div className="text-center flex-1">
                <p 
                  className="text-[#8A8A8A] text-base font-medium mb-2 uppercase tracking-wide"
                  style={{ fontSize: '14px' }}
                >
                  {metricLabel}
                </p>
                <p 
                  className="text-[#2A2A2A] leading-none"
                  style={{ 
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    fontSize: '56px',
                    fontWeight: 900
                  }}
                >
                  {pr || '20'}
                </p>
              </div>
              
              {/* Vertical divider */}
              <div 
                className="mx-6 rounded-full"
                style={{ 
                  width: '3px',
                  height: '80px',
                  background: '#2A2A2A'
                }}
              />
              
              {/* Right stat - Duration */}
              <div className="text-center flex-1">
                <p 
                  className="text-[#8A8A8A] text-base font-medium mb-2 uppercase tracking-wide"
                  style={{ fontSize: '14px' }}
                >
                  {durationLabel}
                </p>
                <p 
                  className="text-[#2A2A2A] leading-none uppercase"
                  style={{ 
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    fontSize: '56px',
                    fontWeight: 900
                  }}
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