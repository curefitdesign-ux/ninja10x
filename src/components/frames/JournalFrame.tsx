import { useRef, useEffect } from 'react';
import journalBgClean from '@/assets/frames/journal-bg-clean.png';
import shuttlecockImg from '@/assets/frames/shuttlecock.png';

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
  const metricLabel = label1 || 'Distance';
  const durationLabel = label2 || 'Duration';
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure video plays on mount and when URL changes
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl relative" style={{ background: '#fff' }}>
      {/* Background image */}
      <img src={journalBgClean} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      
      {/* CSS lined paper overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 38px, #2a9d6a 38px, #2a9d6a 39.5px)',
          backgroundPosition: '0 60px',
        }}
      />
      
      {/* Paper holes */}
      {[80, 200, 320, 440, 560].map((top) => (
        <div
          key={top}
          className="absolute pointer-events-none"
          style={{
            left: '12px',
            top: `${top}px`,
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#e8e0d0',
            border: '1.5px solid #c4b8a4',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      ))}
      
      {/* Photo area filling the frame - tilted 10deg, 90% size */}
      <div 
        className="absolute top-10 left-4 right-4 bottom-[140px] rounded-xl overflow-hidden bg-black"
        style={{
          transform: 'rotate(10deg) scale(0.8)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {isVideo ? (
            <video 
              ref={videoRef}
              src={imageUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})`,
              }}
            />
          ) : (
            <img 
              src={imageUrl}
              alt="Activity"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: (imagePosition.x || imagePosition.y || imageScale !== 1) ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})` : `scale(${imageScale})`,
              }}
            />
          )}
        </div>
      </div>

      {/* Shuttlecock sticker — bottom-left of photo */}
      <div
        className="absolute z-20"
        style={{
          bottom: '170px',
          left: '20px',
          width: '60px',
          height: '60px',
          transform: 'rotate(-15deg)',
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))',
        }}
      >
        <img src={shuttlecockImg} alt="" className="w-full h-full object-contain" />
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pt-0">
        {/* Badge */}
        <div className="mb-1.5">
          <div 
            className="inline-flex rounded-full px-2.5 py-0.5"
            style={{ background: '#2DD4A8' }}
          >
            <span className="text-black font-bold text-[9px] tracking-wide whitespace-nowrap">WEEK {week} | DAY {day}</span>
          </div>
        </div>
        
        {/* Activity name */}
        <h2 className="text-black text-[22px] font-black leading-none mb-2">{activity}</h2>
        
        {/* Stats row - only show if user entered values */}
        {(duration || pr) && (
          <div className="flex gap-6">
            {pr && (
              <div>
                <p className="text-gray-500 text-[9px] font-medium mb-0.5">{metricLabel}</p>
                <p className="text-black text-[15px] font-black leading-none">{pr}</p>
              </div>
            )}
            {duration && (
              <div>
                <p className="text-gray-500 text-[9px] font-medium mb-0.5">{durationLabel}</p>
                <p className="text-black text-[15px] font-black leading-none">{duration}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalFrame;