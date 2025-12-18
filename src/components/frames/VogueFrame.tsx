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
      {/* Background image with light overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: `${imageScale * 100}%`,
          backgroundPosition: `${50 + imagePosition.x}% ${50 + imagePosition.y}%`,
        }}
      />
      
      {/* Very light white overlay for washed out effect */}
      <div className="absolute inset-0 bg-white/75" />
      
      {/* Top text - Magazine masthead style */}
      <div className="absolute top-8 left-6 right-6">
        <h1 
          className="text-[80px] font-black italic leading-none tracking-tighter"
          style={{
            color: 'rgba(255,255,255,0.95)',
            textShadow: `
              3px 3px 0px rgba(200,200,200,0.5),
              6px 6px 0px rgba(180,180,180,0.3),
              0 0 40px rgba(255,255,255,0.8)
            `,
            WebkitTextStroke: '1px rgba(200,200,200,0.3)',
          }}
        >
          Player
        </h1>
        <p 
          className="text-sm font-medium mt-1 tracking-wide"
          style={{
            color: 'rgba(180,180,180,0.8)',
          }}
        >
          Week {week} | Day {day}
        </p>
      </div>
      
      {/* Bottom stats - very subtle */}
      <div className="absolute bottom-10 left-6 right-6 flex gap-10">
        <p 
          className="text-[48px] font-bold tracking-tight"
          style={{
            color: 'rgba(200,200,200,0.6)',
          }}
        >
          {duration || "2hrs"}
        </p>
        <p 
          className="text-[48px] font-bold tracking-tight"
          style={{
            color: 'rgba(200,200,200,0.6)',
          }}
        >
          {pr || "10"}
        </p>
      </div>
    </div>
  );
};

export default VogueFrame;