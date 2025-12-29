import ticketFrameAsset from '@/assets/frames/ticket-frame.png';
import ribbonAsset from '@/assets/frames/ticket-ribbon.png';

interface TicketFrameProps {
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

const TicketFrame = ({ imageUrl, isVideo, activity, week, day, duration, pr, imagePosition, imageScale, label1, label2 }: TicketFrameProps) => {
  const metricLabel = label1 || 'Laps';
  const durationLabel = label2 || 'Duration';
  
  return (
    <div className="w-[90%] mx-auto aspect-[9/16] overflow-hidden relative rounded-3xl">
      {/* Layer 1: Background Image or Video (full-bleed) */}
      {isVideo ? (
        <video 
          src={imageUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            transformOrigin: 'center center'
          }}
        />
      ) : (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            transformOrigin: 'center center'
          }}
        />
      )}
      
      {/* Layer 2: Ticket Frame Asset (with transparent window) - reduced size */}
      <img 
        src={ticketFrameAsset}
        alt=""
        className="absolute z-10 pointer-events-none"
        style={{ 
          objectFit: 'fill',
          top: '4%',
          left: '6%',
          width: '88%',
          height: '92%'
        }}
      />
      
      {/* Layer 3: Title Text (dynamic) - positioned in top cream area */}
      <div 
        className="absolute z-20 left-0 right-0 flex items-center justify-center"
        style={{ 
          top: 'calc(4% + 20px)',
          height: '6%'
        }}
      >
        <h1 
          className="text-[#2A2A2A] uppercase tracking-wide leading-none text-center"
          style={{ 
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: 'clamp(24px, 8vw, 36px)',
            letterSpacing: '2px'
          }}
        >
          {activity || 'TENNIS'}
        </h1>
      </div>
      
      {/* Layer 4: Ribbon Asset + Text (positioned at bottom of photo area) */}
      <div 
        className="absolute z-30 left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{ 
          top: '52%',
          width: '50%',
          height: '4%'
        }}
      >
        {/* Ribbon image */}
        <img 
          src={ribbonAsset}
          alt=""
          className="absolute w-full h-auto"
          style={{ 
            transform: 'rotate(-4deg)',
            filter: 'brightness(0.92)'
          }}
        />
        {/* Ribbon text */}
        <span 
          className="relative z-10 text-[#5A5A5A] font-bold tracking-wider whitespace-nowrap"
          style={{ 
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: 'clamp(10px, 3vw, 13px)',
            letterSpacing: '1.5px',
            transform: 'rotate(-4deg)'
          }}
        >
          WEEK {week} | DAY {day}
        </span>
      </div>
      
      {/* Layer 5: Dashed Divider Line */}
      <div 
        className="absolute z-20 left-[10%] right-[10%]"
        style={{ top: '60%' }}
      >
        <div 
          className="w-full"
          style={{ 
            borderTop: '2px dashed #C8C5BC'
          }}
        />
      </div>
      
      {/* Layer 6-9: Stats Section */}
      <div 
        className="absolute z-20 left-0 right-0 px-[10%] flex items-center justify-center"
        style={{ 
          top: '64%',
          height: '24%'
        }}
      >
        <div className="flex items-center justify-center w-full">
          {/* Left stat - Metric Label + Value */}
          <div className="text-center flex-1">
            <p 
              className="text-[#888888] font-normal mb-1"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(9px, 2.5vw, 12px)',
                letterSpacing: '0.5px'
              }}
            >
              {metricLabel}
            </p>
            <p 
              className="text-[#2A2A2A] leading-none"
              style={{ 
                fontFamily: 'Impact, "Arial Black", sans-serif',
                fontSize: 'clamp(32px, 10vw, 48px)',
                fontWeight: 900
              }}
            >
              {pr || '20'}
            </p>
          </div>
          
          {/* Vertical divider */}
            <div 
              className="mx-3 rounded-full"
              style={{ 
                width: '2px',
                height: 'clamp(40px, 12vw, 60px)',
                background: '#2A2A2A'
              }}
            />
          
          {/* Right stat - Duration Label + Value */}
          <div className="text-center flex-1">
            <p 
              className="text-[#888888] font-normal mb-1"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(9px, 2.5vw, 12px)',
                letterSpacing: '0.5px'
              }}
            >
              {durationLabel}
            </p>
            <p 
              className="text-[#2A2A2A] leading-none uppercase"
              style={{ 
                fontFamily: 'Impact, "Arial Black", sans-serif',
                fontSize: 'clamp(32px, 10vw, 48px)',
                fontWeight: 900
              }}
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
