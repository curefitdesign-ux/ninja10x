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
}

const VogueFrame = ({ imageUrl, isVideo, activity, week, day, duration, pr, imagePosition, imageScale }: VogueFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure video plays on mount and when URL changes
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden bg-black shadow-2xl relative">
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
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            }}
          />
        ) : (
          <img 
            src={imageUrl}
            alt="Activity"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
            }}
          />
        )}
      </div>
      
      {/* Top text - Magazine masthead style with subtle animation */}
      <div className="absolute top-4 left-4 right-4">
        <h1 
          className="font-black italic leading-[0.85] tracking-tighter animate-subtle-pulse uppercase"
          style={{
            fontSize: 'clamp(40px, 14vw, 60px)',
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
      
      {/* Bottom stats */}
      <div className="absolute bottom-6 left-4 right-4 flex gap-4">
        <p 
          className="font-bold tracking-tight"
          style={{
            fontSize: 'clamp(28px, 10vw, 40px)',
            color: 'rgba(255,255,255,0.9)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {duration || "2hrs"}
        </p>
        <p 
          className="font-bold tracking-tight"
          style={{
            fontSize: 'clamp(28px, 10vw, 40px)',
            color: 'rgba(255,255,255,0.9)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {pr || "10"}
        </p>
      </div>
    </div>
  );
};

export default VogueFrame;