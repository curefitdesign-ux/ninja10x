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
  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden bg-white shadow-2xl relative">
      {/* Background image or video filling the frame */}
      {isVideo ? (
        <video 
          src={imageUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
          }}
        />
      ) : (
        <img 
          src={imageUrl}
          alt="Activity"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
          }}
        />
      )}
      
      {/* Top text - Magazine masthead style with subtle animation */}
      <div className="absolute top-4 left-4 right-4">
        <h1 
          className="font-black italic leading-[0.85] tracking-tighter animate-subtle-pulse"
          style={{
            fontSize: 'clamp(48px, 18vw, 72px)',
            color: 'rgba(255,255,255,0.95)',
            textShadow: `
              3px 3px 0px rgba(200,200,200,0.4),
              6px 6px 0px rgba(180,180,180,0.25),
              0 0 40px rgba(255,255,255,0.6)
            `,
            WebkitTextStroke: '1px rgba(200,200,200,0.2)',
          }}
        >
          Player
        </h1>
        <p 
          className="text-[10px] font-medium mt-0.5 tracking-wide animate-subtle-wave"
          style={{
            color: 'rgba(180,180,180,0.7)',
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
            color: 'rgba(200,200,200,0.5)',
          }}
        >
          {duration || "2hrs"}
        </p>
        <p 
          className="font-bold tracking-tight"
          style={{
            fontSize: 'clamp(28px, 10vw, 40px)',
            color: 'rgba(200,200,200,0.5)',
          }}
        >
          {pr || "10"}
        </p>
      </div>
    </div>
  );
};

export default VogueFrame;