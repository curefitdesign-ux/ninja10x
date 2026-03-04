import { useRef, useEffect } from 'react';
import journalBgClean from '@/assets/frames/journal-bg-clean.png';

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
      
      {/* Paper holes — horizontal row across the top */}
      {[12, 25, 38, 51, 64, 76, 89].map((leftPct) => (
        <div
          key={leftPct}
          className="absolute pointer-events-none"
          style={{
            left: `${leftPct}%`,
            top: '14px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#1a1030',
            transform: 'translateX(-50%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      ))}
      
      {/* Photo area filling the frame - tilted 10deg, 90% size */}
      <div 
        className="absolute left-4 right-4 rounded-xl overflow-hidden bg-black"
        style={{
          top: 'calc(2.5rem - 5px)',
          bottom: '100px',
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


      {/* Bottom content */}
      <div className="absolute left-0 right-0 pt-0" style={{ bottom: '40px', padding: '0 12px', paddingLeft: '37px' }}>
        {/* Activity name */}
        <h2 className="text-black font-black leading-none mb-2" style={{ fontSize: '27px' }}>{activity}</h2>
        
        {/* Stats row */}
        {(duration || pr) && (
          <div className="flex gap-6">
            {pr && (
              <div>
                <p className="text-gray-500 font-medium mb-0.5" style={{ fontSize: '14px' }}>{metricLabel}</p>
                <p className="text-black font-black leading-none" style={{ fontSize: '20px' }}>{pr}</p>
              </div>
            )}
            {duration && (
              <div>
                <p className="text-gray-500 font-medium mb-0.5" style={{ fontSize: '14px' }}>{durationLabel}</p>
                <p className="text-black font-black leading-none" style={{ fontSize: '20px' }}>{duration}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WEEK | DAY badge — top right corner */}
      <div className="absolute z-30" style={{ top: '50px', right: '20px' }}>
        <div 
          className="inline-flex rounded-full px-2.5 py-0.5"
          style={{ background: '#2DD4A8' }}
        >
          <span className="text-black font-bold text-[11px] tracking-wide whitespace-nowrap">WEEK {week} | DAY {day}</span>
        </div>
      </div>
    </div>
  );
};

export default JournalFrame;