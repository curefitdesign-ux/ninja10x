import { useRef, useEffect } from 'react';

interface VogueFrameProps {
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

const VogueFrame = ({ imageUrl, isVideo, activity, week, day, duration, pr, imagePosition, imageScale, label1, label2 }: VogueFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationLabel = label2 || 'Duration';
  const metricLabel = label1 || 'Metric';

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[14px] overflow-hidden bg-black shadow-2xl relative" style={{ containerType: 'inline-size' }}>
      {/* Background image or video */}
      <div className="absolute inset-0 overflow-hidden">
        {isVideo ? (
          <video 
            ref={videoRef}
            src={imageUrl}
            autoPlay loop muted playsInline
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
      
      {/* Top text */}
      <div className="absolute" style={{ top: '4cqw', left: '4cqw', right: '4cqw' }}>
        <h1 
          className="font-black italic leading-[0.85] tracking-tighter animate-subtle-pulse uppercase"
          style={{
            fontSize: '18cqw',
            color: 'rgba(255,255,255,1)',
            textShadow: '3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.15), 0 0 40px rgba(255,255,255,0.4)',
            WebkitTextStroke: '1px rgba(0,0,0,0.1)',
          }}
        >
          {activity || 'Activity'}
        </h1>
        <p 
          className="font-medium tracking-wide animate-subtle-wave"
          style={{ color: 'rgba(255,255,255,0.85)', fontSize: '2.5cqw', marginTop: '0.5cqw' }}
        >
          Week {week} | Day {day}
        </p>
      </div>
      
      {/* Bottom stats */}
      {(duration || pr) && (
        <div className="absolute flex" style={{ bottom: '6cqw', left: '4cqw', right: '4cqw', gap: '4cqw' }}>
          {duration && (
            <div className="flex flex-col">
              <span className="font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '2.5cqw', marginBottom: '0.5cqw' }}>
                {durationLabel}
              </span>
              <p 
                className="font-bold tracking-tight"
                style={{ fontSize: '13cqw', color: 'rgba(255,255,255,0.9)', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
              >
                {duration}
              </p>
            </div>
          )}
          {pr && (
            <div className="flex flex-col">
              <span className="font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '2.5cqw', marginBottom: '0.5cqw' }}>
                {metricLabel}
              </span>
              <p 
                className="font-bold tracking-tight"
                style={{ fontSize: '13cqw', color: 'rgba(255,255,255,0.9)', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
              >
                {pr}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VogueFrame;
