import { useRef, useEffect, useMemo } from 'react';
import '@fontsource/caveat/700.css';
import journalBgWhite from '@/assets/frames/journal-bg-white.png';
import journalLinesOverlay from '@/assets/frames/journal-lines-overlay.png';
import paperclipImg from '@/assets/frames/paperclip-silver.png';

/** Returns an SVG path for common activities */
const getActivityIconPath = (activity: string): string => {
  const key = activity.toLowerCase();
  if (key.includes('run')) return 'M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3A6.3 6.3 0 0 0 18 13h2a8 8 0 0 1-5.3-3.4l-1-1.6a2 2 0 0 0-1.7-1 2 2 0 0 0-.7.1L6 9.8V14h2V11l1.8-.9';
  if (key.includes('cycl') || key.includes('bike')) return 'M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 6l-3 5h5l-1 4';
  if (key.includes('yoga') || key.includes('zen')) return 'M12 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 2v6m-4 4h8m-6-4-2 4m6-4 2 4';
  if (key.includes('swim')) return 'M2 6c.6.5 1.2 1 2.5 1C6 7 7 6 8.5 6c1 0 1.8.5 2.5 1s1.5 1 2.5 1 2-.5 2.5-1m-14 6c.6.5 1.2 1 2.5 1 1.5 0 2.5-1 4-1s2 .5 2.5 1 1.5 1 2.5 1 2-.5 2.5-1';
  if (key.includes('trek') || key.includes('hik')) return 'M3 19h4l1-6 2 3 2-3 1 6h4M12 5l-2 3h4l-2-3Z';
  if (key.includes('gym') || key.includes('weight') || key.includes('lift')) return 'M6.5 6.5h11M6.5 17.5h11M3 10h1.5v4H3zm17 0h1.5v4H20zM6.5 8h1v8h-1zm10 0h1v8h-1z';
  if (key.includes('box')) return 'M18 4a2 2 0 0 0-2 2v1H8V6a2 2 0 0 0-4 0v4a2 2 0 0 0 2 2h1v3a5 5 0 0 0 10 0v-3h1a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z';
  if (key.includes('basket')) return 'M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2Zm0 4 2.5 2-1 3h-3l-1-3Zm-4.5 5 1-3L12 6l3.5 2 1 3-2 2.5h-3Z';
  if (key.includes('foot') || key.includes('soccer')) return 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4 2.5 2-1 3h-3l-1-3Zm-4.5 5 1-3L12 6l3.5 2 1 3-2 2.5h-3Z';
  if (key.includes('cricket') || key.includes('bat')) return 'M15 4l5 5-9 9-5-5zm-7 11-4 4m1-1 3 3';
  if (key.includes('racquet') || key.includes('tennis') || key.includes('badminton')) return 'M12 2a6 6 0 0 1 6 6c0 3-2 5.5-6 8-4-2.5-6-5-6-8a6 6 0 0 1 6-6Zm0 14v6';
  return 'M13 2 3 14h9l-1 8 10-12h-9l1-8z'; // lightning bolt default
};

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
      <img src={journalBgWhite} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      
      {/* Lines overlay — centered on top of background */}
      <img src={journalLinesOverlay} alt="" className="absolute pointer-events-none" style={{ top: 'calc(50% + 20px)', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 40px)', height: 'calc(100% - 40px)', objectFit: 'contain' }} />
      
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
          top: 'calc(2.5rem - 25px)',
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

      {/* Paperclip on top of image */}
      <div className="absolute z-20" style={{ top: '5px', right: '185px', width: '45px' }}>
        <img src={paperclipImg} alt="" className="w-full h-full object-contain pointer-events-none" />
      </div>

      {/* Bottom content */}
      <div className="absolute left-0 right-0 pt-0" style={{ bottom: '35px', padding: '0 12px', paddingLeft: '37px' }}>
        {/* Activity name */}
        <h2 className="leading-none mb-2" style={{ fontSize: '54px', fontFamily: "'Caveat', cursive", fontWeight: 700, marginTop: '20px', color: '#3C46AF' }}>{activity}</h2>
        
        {/* Stats row */}
        {(duration || pr) && (
          <div className="flex" style={{ gap: '86px' }}>
            {pr && (
              <div>
                <p className="text-gray-500 mb-0.5" style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{metricLabel}</p>
                <p className="leading-none" style={{ fontSize: '30px', fontFamily: "'Caveat', cursive", fontWeight: 700, color: '#3C46AF' }}>{pr}</p>
              </div>
            )}
            {duration && (
              <div>
                <p className="text-gray-500 mb-0.5" style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{durationLabel}</p>
                <p className="leading-none" style={{ fontSize: '30px', fontFamily: "'Caveat', cursive", fontWeight: 700, color: '#3C46AF' }}>{duration}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CULT NINJA JOURNEY tag — bottom left */}
      <div className="absolute z-30" style={{ bottom: '160px', left: '20px' }}>
        <div 
          className="inline-flex rounded-full px-4 py-1.5"
          style={{ 
            background: '#2DD4A8',
            boxShadow: '2px 3px 0px rgba(0,0,0,0.15)',
          }}
        >
          <span className="text-black font-bold text-[13px] tracking-wide whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif' }}>CULT NINJA JOURNEY</span>
        </div>
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