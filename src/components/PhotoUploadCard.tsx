import { Plus } from 'lucide-react';
import StackedPhotoCards from './StackedPhotoCards';
import WeekProgress from './WeekProgress';
import cardBackground from '@/assets/card-background.png';

interface Photo {
  id: string;
  storageUrl: string;
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  dayNumber: number;
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
          <div 
            className="px-4 py-2 rounded-full"
            style={{ 
              background: 'linear-gradient(180deg, rgba(90,90,90,0.85) 0%, rgba(61,61,61,0.85) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 15px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
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
      
        {/* Week Progress */}
        <div className="relative z-10">
          <WeekProgress currentWeek={currentWeek} photosPerWeek={photosPerWeek} />
        </div>
      </div>

      {/* Upload Button Below Widget */}
      <div className="flex justify-center mt-4">
        <button
          onClick={onCardClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #FF4D4D 0%, #FF3333 100%)',
            boxShadow: '0 4px 15px rgba(255,77,77,0.4)'
          }}
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">Add Photo</span>
        </button>
      </div>
    </div>
  );
};

export default PhotoUploadCard;
