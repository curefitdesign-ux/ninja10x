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
  label1?: string; // Secondary metric label (e.g., "Distance")
  label2?: string; // Primary metric label (e.g., "Duration")
}

const VogueFrame = ({ imageUrl, isVideo, activity, week, day, duration, pr, imagePosition, imageScale, label1, label2 }: VogueFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationLabel = label2 || 'Duration';
  const metricLabel = label1 || 'Metric';

  // Ensure video plays on mount and when URL changes
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden bg-black shadow-2xl relative" style={{ containerType: 'inline-size' }}>
      {/* Background image or video filling the frame */}
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
      
      {/* Top text - Magazine masthead style with subtle animation */}
      <div className="absolute top-4 left-4 right-4">
        <h1 
          className="font-black italic leading-[0.85] tracking-tighter animate-subtle-pulse uppercase"
          style={{
            fontSize: 'clamp(40px, 18cqw, 60px)',
            color: 'rgba(255,255,255,1)',
            textShadow: `
              3px 3px 0px rgba(0,0,0,0.3),
              6px 6px 0px rgba(0,0,0,0.15),
              0 0 40px rgba(255,255,255,0.4)
            `,
            WebkitTextStroke: '1px rgba(0,0,0,0.1)',
          }}
        >
          {activity || 'Activity'}
        </h1>
        <p 
          className="text-[10px] font-medium mt-0.5 tracking-wide animate-subtle-wave"
          style={{
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          Week {week} | Day {day}
        </p>
      </div>
      
      {/* Bottom stats with contextual labels - only show if user entered values */}
      {(duration || pr) && (
        <div className="absolute bottom-6 left-4 right-4 flex gap-4">
          {/* Duration stat */}
          {duration && (
            <div className="flex flex-col">
              <span 
                className="text-[10px] font-medium tracking-wide mb-0.5"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {durationLabel}
              </span>
              <p 
                className="font-bold tracking-tight"
                style={{
                  fontSize: 'clamp(28px, 13cqw, 40px)',
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {duration}
              </p>
            </div>
          )}
          {/* Secondary metric stat - only show if provided */}
          {pr && (
            <div className="flex flex-col">
              <span 
                className="text-[10px] font-medium tracking-wide mb-0.5"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {metricLabel}
              </span>
              <p 
                className="font-bold tracking-tight"
                style={{
                  fontSize: 'clamp(28px, 13cqw, 40px)',
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                }}
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
