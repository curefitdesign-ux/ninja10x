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
    <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-2xl relative">
      {/* Background image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: `${imageScale * 100}%`,
          backgroundPosition: `${50 + imagePosition.x}% ${50 + imagePosition.y}%`,
        }}
      />
      
      {/* Top text - Magazine style */}
      <div className="absolute top-6 left-5 right-5">
        <h1 className="text-white text-7xl font-black italic drop-shadow-2xl" style={{ 
          textShadow: '4px 4px 8px rgba(0,0,0,0.3), -2px -2px 4px rgba(255,255,255,0.1)',
          letterSpacing: '-0.02em'
        }}>
          Player
        </h1>
        <p className="text-white/80 text-sm mt-1 drop-shadow-lg">Week {week} | Day {day}</p>
      </div>
      
      {/* Bottom stats */}
      <div className="absolute bottom-8 left-5 right-5 flex gap-8">
        <p className="text-white/60 text-4xl font-bold">{duration || "2hrs"}</p>
        <p className="text-white/60 text-4xl font-bold">{pr || "10"}</p>
      </div>
    </div>
  );
};

export default VogueFrame;