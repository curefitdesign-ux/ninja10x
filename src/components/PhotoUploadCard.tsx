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

interface PhotoUploadCardProps {
  photos: Photo[];
  onCardClick: () => void;
  hasUploadedToday: boolean;
  hoursUntilNextUpload: number;
  currentDate: string;
}

const PhotoUploadCard = ({ 
  photos, 
  onCardClick, 
  hasUploadedToday,
  hoursUntilNextUpload,
  currentDate
}: PhotoUploadCardProps) => {
  // Determine current week based on photos (3 photos per week = 12 total for 4 weeks)
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);

  // Calculate photos per week
  const photosPerWeek = [
    Math.min(photos.length, 3),
    Math.min(Math.max(photos.length - 3, 0), 3),
    Math.min(Math.max(photos.length - 6, 0), 3),
    Math.min(Math.max(photos.length - 9, 0), 3),
  ];

  return (
    <div className="px-5">
      {/* Ninja Widget */}
      <div 
        className="glass-card p-5 relative overflow-hidden w-full"
        style={{ backgroundImage: `url(${cardBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Cult Ninja Tag */}
        <div className="flex justify-center mb-4">
          <div className="px-4 py-2 rounded-full border border-foreground/30 bg-background/30 backdrop-blur-sm">
            <span className="text-sm font-semibold text-foreground tracking-wider">CULT NINJA</span>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-foreground text-center mb-6 relative z-10">
          CONQUER WILL POWER
        </h2>
      
        {/* Stacked Photo Cards */}
        <div className="relative z-10 mb-4">
          <StackedPhotoCards 
            photos={photos} 
            onCardClick={onCardClick}
            currentDate={currentDate}
          />
        </div>
        
        {/* Upload Status Message */}
        {hasUploadedToday && (
          <div className="text-center mb-4 relative z-10">
            <p className="text-sm text-foreground/60">
              Next upload in <span className="font-semibold text-foreground/80">{hoursUntilNextUpload}h</span>
            </p>
            <p className="text-xs text-foreground/40 mt-1">
              Tap photo to edit
            </p>
          </div>
        )}
      
        {/* Week Progress */}
        <div className="relative z-10">
          <WeekProgress currentWeek={currentWeek} photosPerWeek={photosPerWeek} />
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadCard;
