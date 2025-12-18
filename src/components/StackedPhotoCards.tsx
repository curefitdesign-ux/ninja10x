import { useState, useRef } from 'react';
import { User, Camera, Image as ImageIcon } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  activity?: string;
}

interface StackedPhotoCardsProps {
  photos: Photo[];
  onAddPhoto: (file: File, activity: string) => void;
  maxPhotos?: number;
}

const activities = [
  'Running', 'Cycling', 'Treking',
  'Swimming', 'Yoga', 'GYM',
  'Cricket', 'Badminton', 'Tennis',
  'Meditation', 'Boxing', 'Dance'
];

const StackedPhotoCards = ({ photos, onAddPhoto, maxPhotos = 3 }: StackedPhotoCardsProps) => {
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCardClick = () => {
    if (photos.length < maxPhotos) {
      setShowActivitySheet(true);
    }
  };

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    setShowActivitySheet(false);
    setShowUploadSheet(true);
  };

  const handleCameraClick = () => {
    setShowUploadSheet(false);
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    setShowUploadSheet(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedActivity) {
      onAddPhoto(file, selectedActivity);
      setSelectedActivity(null);
    }
    e.target.value = '';
  };

  const handleOverlayClick = () => {
    setShowActivitySheet(false);
    setShowUploadSheet(false);
    setSelectedActivity(null);
  };

  // Calculate positions for stacked cards - center focus with smaller cards behind
  const getCardStyle = (index: number, totalFilled: number) => {
    const currentCardIndex = totalFilled; // The next empty card to fill
    
    if (index < totalFilled) {
      // Filled cards - stack to back left, smaller, tilted -5deg
      const offset = totalFilled - index;
      return {
        transform: `translateX(${-offset * 25}px) scale(${0.85 - offset * 0.05}) rotate(-5deg)`,
        zIndex: index,
        opacity: 0.6 - offset * 0.15,
        backdropFilter: 'blur(16px)',
      };
    } else if (index === currentCardIndex) {
      // Current card - front and center, full size
      return {
        transform: 'translateX(0) scale(1) rotate(0deg)',
        zIndex: maxPhotos + 1,
        opacity: 1,
        filter: 'none',
      };
    } else {
      // Future cards - stack to back right, smaller, tilted 5deg, moved 20px more right
      const offset = index - currentCardIndex;
      return {
        transform: `translateX(${offset * 25 + 20}px) scale(${0.85 - offset * 0.05}) rotate(5deg)`,
        zIndex: maxPhotos - index,
        opacity: 0.6 - offset * 0.15,
        backdropFilter: 'blur(16px)',
      };
    }
  };

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '320px' }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Stacked Cards */}
      <div className="relative" style={{ width: '220px', height: '280px' }}>
        {Array.from({ length: maxPhotos }).map((_, index) => {
          const photo = photos[index];
          const style = getCardStyle(index, photos.length);
          const isTopCard = index === photos.length && photos.length < maxPhotos;
          
          return (
            <div
              key={index}
              className={`
                absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden
                transition-all duration-500 ease-out cursor-pointer
                ${photo ? '' : 'glass-card'}
              `}
              style={{
                ...style,
                background: photo 
                  ? 'transparent' 
                  : 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                border: photo ? 'none' : '1px solid rgba(255,255,255,0.2)',
                backdropFilter: photo ? 'none' : 'blur(10px)',
              }}
              onClick={isTopCard ? handleCardClick : undefined}
            >
              {photo ? (
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {/* Scan frame icon */}
                  <div className="relative w-20 h-20">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-foreground/40 rounded-tl-md" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-foreground/40 rounded-tr-md" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-foreground/40 rounded-bl-md" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-foreground/40 rounded-br-md" />
                    {/* User icon in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="w-10 h-10 text-foreground/40" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Activity Selection Bottom Sheet */}
      {showActivitySheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleOverlayClick}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="bg-background/95 backdrop-blur-xl rounded-t-3xl p-6 pb-10 border-t border-foreground/10">
              <div className="w-12 h-1 bg-foreground/20 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground text-center mb-8">Choose your activity</h3>
              <div className="grid grid-cols-3 gap-4 px-2">
                {activities.map((activity) => (
                  <button
                    key={activity}
                    onClick={() => handleActivitySelect(activity)}
                    className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-foreground/5 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-foreground/10 backdrop-blur-sm" />
                    <span className="text-sm font-semibold text-foreground italic">{activity}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upload Method Bottom Sheet */}
      {showUploadSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleOverlayClick}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="bg-background/95 backdrop-blur-xl rounded-t-3xl p-6 pb-10 border-t border-foreground/10">
              <div className="w-12 h-1 bg-foreground/20 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">Upload {selectedActivity} Photo</h3>
              <p className="text-sm text-foreground/60 text-center mb-6">Choose how to add your photo</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCameraClick}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors flex-1 max-w-[140px]"
                >
                  <Camera className="w-10 h-10 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Camera</span>
                </button>
                <button
                  onClick={handleGalleryClick}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-colors flex-1 max-w-[140px]"
                >
                  <ImageIcon className="w-10 h-10 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Gallery</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StackedPhotoCards;
