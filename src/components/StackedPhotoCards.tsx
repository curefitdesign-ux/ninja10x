import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  // Default empty upload card - the first upload state
  const DefaultUploadCard = ({ zIndex = 100, isClickable = true }: { zIndex?: number; isClickable?: boolean }) => (
    <div
      className={`absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isClickable ? 'cursor-pointer' : ''}`}
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
        {/* Camera frame with user icon */}
        <div className="relative w-24 h-24">
          {/* Corner brackets - curved like camera viewfinder */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/30 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-foreground/30 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-foreground/30 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/30 rounded-br-xl" />
          {/* User icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="w-12 h-12 text-foreground/30" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-base text-foreground/40 mt-4 font-medium">Today's capture</p>
      </div>
    </div>
  );

  // Upcoming placeholder card (faded cards to the right/back)
  const UpcomingCard = ({ position }: { position: number }) => {
    const translateX = position * 20;
    const scale = Math.max(0.85, 1 - position * 0.05);
    const rotate = position * 4;
    const opacity = Math.max(0.2, 0.5 - position * 0.15);
    const zIndex = 50 - position;

    return (
      <div
        className="absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          transform: `translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
          zIndex,
          opacity,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(5px)',
        }}
      />
    );
  };

  // Render previous photos stacked to the left
  const renderPreviousPhotos = () => {
    // Sort photos by date, newest first
    const sortedPhotos = [...photos].sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    return sortedPhotos.map((photo, index) => {
      // All photos stack to the left
      // When canUploadToday, all photos shift back by 1 to make room for empty card
      const stackPosition = canUploadToday ? index + 1 : index;
      
      const translateX = stackPosition * 25;
      const scale = Math.max(0.75, 1 - stackPosition * 0.06);
      const rotate = Math.min(stackPosition * 5, 15);
      const opacity = Math.max(0.4, 1 - stackPosition * 0.12);
      const zIndex = 100 - stackPosition;
      
      return (
        <div
          key={photo.id}
          className="absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer"
          style={{
            transform: `translateX(-${translateX}px) scale(${scale}) rotate(-${rotate}deg)`,
            zIndex,
            opacity,
          }}
          onClick={() => handlePhotoTap(photo)}
        >
          <img
            src={photo.url}
            alt={photo.activity || 'Photo'}
            className="w-full h-full object-cover"
          />
        </div>
      );
    });
  };

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '320px' }}>
      <div className="relative" style={{ width: '220px', height: '280px' }}>
        {/* Upcoming placeholder cards (behind, to the right) */}
        <UpcomingCard position={2} />
        <UpcomingCard position={1} />
        
        {/* Previous photos stacked to the left */}
        {photos.length > 0 && renderPreviousPhotos()}
        
        {/* Default upload card - always show in center when can upload today */}
        {canUploadToday && <DefaultUploadCard zIndex={100} isClickable={true} />}
      </div>
    </div>
  );
};

export default StackedPhotoCards;