import paperclipImg from '@/assets/frames/paperclip.png';
import shuttlecockImg from '@/assets/frames/shuttlecock.png';

interface Journal2FrameProps {
  imageUrl: string;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
}

const Journal2Frame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale }: Journal2FrameProps) => {
  return (
    <div className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden bg-white shadow-2xl relative">
      {/* Paperclip - positioned at top center, overlapping the image */}
      <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-20 w-16 h-24">
        <img 
          src={paperclipImg} 
          alt="Paperclip"
          className="w-full h-full object-contain"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
        />
      </div>
      
      {/* Photo area - slightly rotated for journal feel */}
      <div 
        className="absolute top-12 left-4 right-4 bottom-[140px] rounded-2xl overflow-hidden bg-gray-100 shadow-lg"
        style={{ transform: 'rotate(2deg)' }}
      >
        <img 
          src={imageUrl}
          alt="Activity"
          className="w-full h-full object-cover"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
          }}
        />
        
        {/* Shuttlecock sticker - positioned at bottom-left of image */}
        <div 
          className="absolute bottom-4 left-4 w-20 h-20 z-10"
          style={{ 
            transform: 'rotate(-15deg)',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
          }}
        >
          <img 
            src={shuttlecockImg}
            alt="Shuttlecock"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-0">
        {/* Badges row */}
        <div className="flex justify-between mb-2">
          <div 
            className="rounded-full px-3 py-1.5"
            style={{ background: '#2DD4A8' }}
          >
            <span className="text-black font-bold text-[10px] tracking-wide">WEEK {week} | DAY {day}</span>
          </div>
          <div 
            className="rounded-full px-3 py-1.5"
            style={{ background: '#2DD4A8' }}
          >
            <span className="text-black font-bold text-[10px] tracking-wide">Bellandur, Bangalore</span>
          </div>
        </div>
        
        {/* Activity name */}
        <h2 className="text-black text-[28px] font-black italic leading-none mb-2">{activity}</h2>
        
        {/* Stats row */}
        <div className="flex gap-6">
          <div>
            <p className="text-gray-500 text-[10px] font-medium">Duration</p>
            <p className="text-black text-xl font-bold">{duration || "02hrs"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] font-medium">Rounds</p>
            <p className="text-black text-xl font-bold">{pr || "10"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] font-medium">Calories</p>
            <p className="text-black text-xl font-bold">400</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal2Frame;
