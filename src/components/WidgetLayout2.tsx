import StackedPhotoCards from './StackedPhotoCards';
import WeekProgress from './WeekProgress';
import cardBackground from '@/assets/card-background.png';

interface Photo {
  id: string;
  url: string;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue';
  duration?: string;
  pr?: string;
  uploadDate: string;
}

interface WidgetLayout2Props {
  photos: Photo[];
  onCardClick: () => void;
  hasUploadedToday: boolean;
  hoursUntilNextUpload: number;
  currentDate: string;
}

const WidgetLayout2 = ({ 
  photos, 
  onCardClick, 
  hasUploadedToday,
  hoursUntilNextUpload,
  currentDate
}: WidgetLayout2Props) => {
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);

  const photosPerWeek = [
    Math.min(photos.length, 3),
    Math.min(Math.max(photos.length - 3, 0), 3),
    Math.min(Math.max(photos.length - 6, 0), 3),
    Math.min(Math.max(photos.length - 9, 0), 3),
  ];

  return (
    <div className="px-5">
      {/* Layout 2 Widget */}
      <div 
        className="relative overflow-hidden w-full rounded-3xl"
        style={{ 
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Top Section with Title */}
        <div className="pt-6 pb-4 px-6">
          <h2 
            className="text-2xl font-black text-white text-center tracking-wider uppercase"
            style={{ 
              fontFamily: 'Impact, "Arial Black", sans-serif',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            CONQUER WILL POWER
          </h2>
        </div>

        {/* Photo Cards Section */}
        <div className="relative z-10 px-4">
          <StackedPhotoCards 
            photos={photos} 
            onCardClick={onCardClick}
            currentDate={currentDate}
          />
        </div>

        {/* Cult Ninja Label - positioned at bottom of photo section */}
        <div className="flex justify-center -mt-4 mb-4 relative z-20">
          <div 
            className="px-5 py-2 rounded-full"
            style={{ 
              background: 'linear-gradient(135deg, #ff4757 0%, #ff3f34 100%)',
              boxShadow: '0 4px 15px rgba(255,71,87,0.4)'
            }}
          >
            <span 
              className="text-white font-bold text-sm tracking-widest uppercase"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              cult NINJA
            </span>
          </div>
        </div>

        {/* Upload Status Message */}
        {hasUploadedToday && (
          <div className="text-center mb-3 relative z-10">
            <p className="text-sm text-white/50">
              Next upload in <span className="font-semibold text-white/70">{hoursUntilNextUpload}h</span>
            </p>
          </div>
        )}
      
        {/* Week Progress - Horizontal layout */}
        <div className="px-6 pb-6 relative z-10">
          <div className="flex justify-between items-center gap-2">
            {[1, 2, 3, 4].map((week) => (
              <div key={week} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((day) => {
                    const dayIndex = (week - 1) * 3 + day;
                    const isCompleted = dayIndex <= photos.length;
                    const isCurrent = dayIndex === photos.length + 1;
                    return (
                      <div 
                        key={day}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          isCompleted 
                            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                            : isCurrent
                            ? 'bg-white/40 animate-pulse'
                            : 'bg-white/20'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${
                  currentWeek === week ? 'text-white' : 'text-white/40'
                }`}>
                  {week === 1 ? 'Week 1' : `W${week}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetLayout2;
