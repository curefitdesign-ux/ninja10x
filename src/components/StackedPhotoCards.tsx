import { User, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Photo {
  id: string;
  url: string;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue';
  duration?: string;
  pr?: string;
  uploadDate: string;
}

interface StackedPhotoCardsProps {
  photos: Photo[];
  onCardClick: () => void;
  currentDate: string;
}

const StackedPhotoCards = ({ photos, onCardClick, currentDate }: StackedPhotoCardsProps) => {
  const navigate = useNavigate();
  const [animationKey, setAnimationKey] = useState(0);
  
  // Trigger animation when date changes (new day)
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [currentDate]);
  
  // Check if today has a photo
  const todaysPhoto = photos.find(p => p.uploadDate === currentDate);
  const canUploadToday = !todaysPhoto;
  
  const handlePhotoTap = (photo: Photo) => {
    navigate('/preview', { 
      state: { 
        imageUrl: photo.url, 
        activity: photo.activity,
        frame: photo.frame,
        duration: photo.duration,
        pr: photo.pr,
        isReview: true
      } 
    });
  };

  const renderEmptyCard = (isClickable: boolean, zIndex: number = 10) => {
    return (
      <div
        className={`absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isClickable ? 'cursor-pointer' : ''} glass-card`}
        style={{
          transform: 'translateX(0) scale(1) rotate(0deg)',
          zIndex,
          opacity: 1,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
          border: '1px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(10px)',
        }}
        onClick={isClickable ? onCardClick : undefined}
      >
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-foreground/40 rounded-tl-md" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-foreground/40 rounded-tr-md" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-foreground/40 rounded-bl-md" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-foreground/40 rounded-br-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-10 h-10 text-foreground/40" />
            </div>
          </div>
          {isClickable && <p className="text-xs text-foreground/50 mt-3">Today's capture</p>}
        </div>
      </div>
    );
  };

  // Render all stacked photos - all previous photos go to the back
  const renderStackedPhotos = () => {
    // Sort photos by date, newest first
    const sortedPhotos = [...photos].sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    return sortedPhotos.map((photo, index) => {
      const isTodaysPhoto = photo.uploadDate === currentDate;
      
      // If it's today's photo, it stays in front (no transform)
      // Otherwise, all previous photos shift to the back based on their position
      let translateX = 0;
      let scale = 1;
      let rotate = 0;
      let opacity = 1;
      let zIndex = sortedPhotos.length - index;
      
      if (!isTodaysPhoto) {
        // Previous day photos - shift them back
        // When canUploadToday is true (new day), the newest photo should animate to position 1
        const backPosition = canUploadToday ? index : index;
        translateX = (backPosition + 1) * 25; // Move left
        scale = Math.max(0.75, 1 - (backPosition + 1) * 0.06);
        rotate = Math.min((backPosition + 1) * 5, 15);
        opacity = Math.max(0.4, 1 - (backPosition + 1) * 0.12);
        zIndex = sortedPhotos.length - index - (canUploadToday ? 1 : 0);
      }
      
      return (
        <div
          key={`${photo.id}-${animationKey}`}
          className="absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer"
          style={{
            transform: `translateX(-${translateX}px) scale(${scale}) rotate(-${rotate}deg)`,
            zIndex,
            opacity,
          }}
          onClick={() => isTodaysPhoto && !canUploadToday ? onCardClick() : handlePhotoTap(photo)}
        >
          <img
            src={photo.url}
            alt={photo.activity || 'Photo'}
            className="w-full h-full object-cover"
          />
          {/* Edit indicator on today's photo */}
          {isTodaysPhoto && (
            <div className="absolute bottom-3 right-3 bg-foreground/20 backdrop-blur-sm rounded-full p-2">
              <Pencil className="w-4 h-4 text-foreground/80" />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '320px' }}>
      <div className="relative" style={{ width: '220px', height: '280px' }}>
        {/* No photos - show empty cards */}
        {photos.length === 0 && renderEmptyCard(true, 10)}
        
        {/* Render all stacked photos */}
        {photos.length > 0 && renderStackedPhotos()}
        
        {/* Fresh day capture card - show in front when new day starts */}
        {photos.length > 0 && canUploadToday && renderEmptyCard(true, photos.length + 1)}
      </div>
    </div>
  );
};

export default StackedPhotoCards;