import { X } from 'lucide-react';

interface PhotoPreviewProps {
  imageUrl: string;
  activity: string;
  week: number;
  day: number;
  onSave: () => void;
  onClose: () => void;
}

const PhotoPreview = ({ imageUrl, activity, week, day, onSave, onClose }: PhotoPreviewProps) => {
  return (
    <div className="fixed inset-0 z-50">
      {/* Blurred zoomed background */}
      <div 
        className="absolute inset-0 scale-150"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px)',
        }}
      />
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen p-5">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-12 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Main card with preview */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="glass-card rounded-3xl p-4 mx-auto w-full max-w-[335px]">
            {/* CULT NINJA header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground/60 leading-none">CULT</h1>
                <h2 className="text-3xl font-black italic text-foreground leading-none">NINJA</h2>
              </div>
              <div className="bg-[#FF4D4D] px-3 py-1.5 rounded">
                <span className="text-white text-xs font-bold tracking-wide">CONQUER WILL POWER</span>
              </div>
            </div>

            {/* Photo preview with data overlay */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              
              {/* Data points overlay */}
              <div className="absolute left-3 bottom-20 flex flex-col gap-1">
                <div className="bg-[#FF4D4D] px-2 py-1 rounded">
                  <span className="text-white text-xs font-semibold">Laps: 20</span>
                </div>
                <div className="bg-[#FF4D4D] px-2 py-1 rounded">
                  <span className="text-white text-xs font-semibold">Duration: 02:00:50</span>
                </div>
              </div>
            </div>

            {/* Week/Activity counter */}
            <div className="text-center">
              <span className="text-foreground/60 text-sm">Week</span>
              <div className="text-4xl font-bold text-foreground/80">
                {week}<span className="text-foreground/40">/3</span>
              </div>
              <span className="text-foreground/60 text-sm">Activity</span>
            </div>
          </div>
        </div>

        {/* Bottom section - Data points and Health sync */}
        <div className="mt-6 space-y-4">
          {/* Data points card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/80">Duration</span>
              <span className="text-white font-semibold text-lg">2hrs</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/80">PR <span className="text-white/40">(Optional)</span></span>
              <span className="text-white/40">-</span>
            </div>
          </div>

          {/* Health sync widget */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">Auto sync with a device</h3>
              <p className="text-white/60 text-sm">Sync your health & fitness data to track your progress and get better insights</p>
            </div>
            <button className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white font-semibold text-sm">CONNECT</span>
            </button>
          </div>

          {/* Save button */}
          <button 
            onClick={onSave}
            className="w-full bg-[#FF4D4D] py-4 rounded-2xl"
          >
            <span className="text-white font-bold text-lg">Save Activity</span>
          </button>
        </div>

        {/* Bottom safe area */}
        <div className="h-6" />
      </div>
    </div>
  );
};

export default PhotoPreview;
