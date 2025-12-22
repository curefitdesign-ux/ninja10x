interface VogueFrameProps {
  imageUrl: string;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
}

const VogueFrame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale }: VogueFrameProps) => {
  return (
    <div className="w-full aspect-[3/4] rounded-[32px] overflow-hidden bg-white shadow-2xl relative">
      {/* Background image with object-cover fill */}
      <img 
        src={imageUrl}
        alt="Activity"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
        }}
      />
      
      {/* Top text - Magazine masthead style with massive title */}
      <div className="absolute top-6 left-5 right-5">
        <h1 
          className="font-black italic leading-[0.85] tracking-tighter"
          style={{
            fontSize: 'clamp(72px, 22vw, 100px)',
            color: 'rgba(255,255,255,0.95)',
            textShadow: `
              4px 4px 0px rgba(200,200,200,0.4),
              8px 8px 0px rgba(180,180,180,0.25),
              0 0 60px rgba(255,255,255,0.6)
            `,
            WebkitTextStroke: '1px rgba(200,200,200,0.2)',
          }}
        >
          Player
        </h1>
        <p 
          className="text-xs font-medium mt-0.5 tracking-wide"
          style={{
            color: 'rgba(180,180,180,0.7)',
          }}
        >
          Week {week} | Day {day}
        </p>
      </div>
      
      {/* Bottom stats - large and subtle */}
      <div className="absolute bottom-8 left-5 right-5 flex gap-6">
        <p 
          className="font-bold tracking-tight"
          style={{
            fontSize: 'clamp(40px, 14vw, 56px)',
            color: 'rgba(200,200,200,0.5)',
          }}
        >
          {duration || "2hrs"}
        </p>
        <p 
          className="font-bold tracking-tight"
          style={{
            fontSize: 'clamp(40px, 14vw, 56px)',
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