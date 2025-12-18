import StackedPhotoCards from './StackedPhotoCards';
import WeekProgress from './WeekProgress';
import cardBackground from '@/assets/card-background.png';

interface Photo {
  id: string;
  url: string;
  activity?: string;
}

interface PhotoUploadCardProps {
  photos: Photo[];
  onCardClick: () => void;
}

const PhotoUploadCard = ({ photos, onCardClick }: PhotoUploadCardProps) => {
  // Determine current week based on photos (3 photos per week = 12 total for 4 weeks)
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);

  // Calculate photos per week
  const photosPerWeek = [
    Math.min(photos.length, 3),
    Math.min(Math.max(photos.length - 3, 0), 3),
    Math.min(Math.max(photos.length - 6, 0), 3),
    Math.min(Math.max(photos.length - 9, 0), 3),
  ];

  // Get photos for current week only (max 3)
  const currentWeekStartIndex = (currentWeek - 1) * 3;
  const currentWeekPhotos = photos.slice(currentWeekStartIndex, currentWeekStartIndex + 3);

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
        <div className="relative z-10 mb-6">
          <StackedPhotoCards 
            photos={currentWeekPhotos} 
            onCardClick={onCardClick}
            maxPhotos={3}
          />
        </div>
      
        {/* Week Progress */}
        <div className="relative z-10">
          <WeekProgress currentWeek={currentWeek} photosPerWeek={photosPerWeek} />
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadCard;
