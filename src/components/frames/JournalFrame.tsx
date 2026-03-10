import { useRef, useEffect } from 'react';
import '@fontsource/caveat/700.css';
import journalBgWhite from '@/assets/frames/journal-bg-white.png';
import journalLinesOverlay from '@/assets/frames/journal-lines-overlay.png';
import paperclipImg from '@/assets/frames/paperclip-silver.png';

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

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div
      className="w-[90%] mx-auto aspect-[9/16] rounded-[4px] overflow-hidden shadow-2xl relative"
      style={{ containerType: 'inline-size', background: '#fff' }}
    >
      {/* Background image */}
      <img src={journalBgWhite} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      
      {/* Lines overlay */}
      <img
        src={journalLinesOverlay}
        alt=""
        className="absolute pointer-events-none"
        style={{
          top: 'calc(50% + 2.5cqw)',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 5cqw)',
          height: 'calc(100% - 5cqw)',
          objectFit: 'contain',
        }}
      />
      
      {/* Paper holes */}
      {[12, 25, 38, 51, 64, 76, 89].map((leftPct) => (
        <div
          key={leftPct}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${leftPct}%`,
            top: '1.8cqw',
            width: '4.5cqw',
            height: '4.5cqw',
            background: '#1a1030',
            transform: 'translateX(-50%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      ))}
      
      {/* Photo area */}
      <div 
        className="absolute overflow-hidden bg-black"
        style={{
          left: '4cqw',
          right: '4cqw',
          top: '6cqw',
          bottom: '25cqw',
          borderRadius: '3cqw',
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
                transform: (imagePosition.x || imagePosition.y || imageScale !== 1)
                  ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`
                  : `scale(${imageScale})`,
              }}
            />
          ) : (
            <img 
              src={imageUrl}
              alt="Activity"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              style={{
                transform: (imagePosition.x || imagePosition.y || imageScale !== 1)
                  ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`
                  : `scale(${imageScale})`,
              }}
            />
          )}
        </div>
      </div>

      {/* Paperclip */}
      <div className="absolute z-20" style={{ top: '0.6cqw', right: '46cqw', width: '11cqw' }}>
        <img src={paperclipImg} alt="" className="w-full h-full object-contain pointer-events-none" />
      </div>

      {/* Bottom content */}
      <div className="absolute left-0 right-0" style={{ bottom: '8cqw', padding: '0 3cqw', paddingLeft: '9cqw' }}>
        {/* Activity name */}
        <h2
          className="leading-none"
          style={{
            fontSize: '13.5cqw',
            fontFamily: "'Caveat', cursive",
            fontWeight: 700,
            marginBottom: '2cqw',
            color: '#3C46AF',
          }}
        >
          {activity}
        </h2>
        
        {/* Stats row */}
        {(duration || pr) && (
          <div className="flex" style={{ gap: '21cqw' }}>
            {pr && (
              <div>
                <p className="text-gray-500" style={{ fontSize: '3.5cqw', fontFamily: 'Inter, sans-serif', fontWeight: 700, marginBottom: '0.5cqw' }}>{metricLabel}</p>
                <p className="leading-none" style={{ fontSize: '7.5cqw', fontFamily: "'Caveat', cursive", fontWeight: 700, color: '#3C46AF' }}>{pr}</p>
              </div>
            )}
            {duration && (
              <div>
                <p className="text-gray-500" style={{ fontSize: '3.5cqw', fontFamily: 'Inter, sans-serif', fontWeight: 700, marginBottom: '0.5cqw' }}>{durationLabel}</p>
                <p className="leading-none" style={{ fontSize: '7.5cqw', fontFamily: "'Caveat', cursive", fontWeight: 700, color: '#3C46AF' }}>{duration}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top badges row */}
      <div className="absolute z-30 flex items-center justify-between" style={{ top: '16cqw', left: '5cqw', right: '5cqw' }}>
        <div className="inline-flex rounded-full" style={{ background: '#2DD4A8', padding: '0.8cqw 2.5cqw' }}>
          <span className="text-black font-bold whitespace-nowrap" style={{ fontSize: '2.8cqw', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>CULT NINJA JOURNEY</span>
        </div>
        <div className="inline-flex rounded-full" style={{ background: '#2DD4A8', padding: '0.8cqw 2.5cqw' }}>
          <span className="text-black font-bold whitespace-nowrap" style={{ fontSize: '2.8cqw', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>WEEK {week} | DAY {day}</span>
        </div>
      </div>
    </div>
  );
};

export default JournalFrame;
