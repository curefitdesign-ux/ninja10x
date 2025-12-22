import { User } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue';
  duration?: string;
  pr?: string;
}

interface StackedPhotoCardsProps {
  photos: Photo[];
  onCardClick: () => void;
}

const StackedPhotoCards = ({ photos, onCardClick }: StackedPhotoCardsProps) => {
  // Always show 3 cards: left (previous), center (current/last), right (next empty)
  
  const renderEmptyCard = (position: 'left' | 'center' | 'right', isClickable: boolean) => {
    let style = {};
    
    if (position === 'left') {
      style = {
        transform: 'translateX(-35px) scale(0.85) rotate(-5deg)',
        zIndex: 1,
        opacity: 0.5,
      };
    } else if (position === 'center') {
      style = {
        transform: 'translateX(0) scale(1) rotate(0deg)',
        zIndex: 3,
        opacity: 1,
      };
    } else {
      style = {
        transform: 'translateX(35px) scale(0.85) rotate(5deg)',
        zIndex: 1,
        opacity: 0.5,
      };
    }
    
    return (
      <div
        className={`absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isClickable ? 'cursor-pointer' : ''} glass-card`}
        style={{
          ...style,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          border: '1px solid rgba(255,255,255,0.2)',
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
        </div>
      </div>
    );
  };

  const renderPhotoCard = (photo: Photo, position: 'left' | 'center') => {
    let style = {};
    
    if (position === 'left') {
      style = {
        transform: 'translateX(-35px) scale(0.85) rotate(-5deg)',
        zIndex: 2,
        opacity: 0.7,
      };
    } else {
      style = {
        transform: 'translateX(0) scale(1) rotate(0deg)',
        zIndex: 3,
        opacity: 1,
      };
    }
    
    return (
      <div
        key={photo.id}
        className="absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={style}
      >
        <img
          src={photo.url}
          alt={photo.activity || 'Photo'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  // Get last 2 photos for display
  const lastPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const previousPhoto = photos.length > 1 ? photos[photos.length - 2] : null;

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '320px' }}>
      <div className="relative" style={{ width: '220px', height: '280px' }}>
        {/* Left position: previous photo or empty */}
        {previousPhoto ? (
          renderPhotoCard(previousPhoto, 'left')
        ) : (
          renderEmptyCard('left', false)
        )}
        
        {/* Center position: last photo or empty (clickable if no photos) */}
        {lastPhoto ? (
          renderPhotoCard(lastPhoto, 'center')
        ) : (
          renderEmptyCard('center', true)
        )}
        
        {/* Right position: always empty card for next capture (clickable if we have photos) */}
        {photos.length > 0 ? (
          <div
            className="absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer glass-card"
            style={{
              transform: 'translateX(35px) scale(0.85) rotate(5deg)',
              zIndex: 4,
              opacity: 0.9,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={onCardClick}
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
            </div>
          </div>
        ) : (
          renderEmptyCard('right', false)
        )}
      </div>
    </div>
  );
};

export default StackedPhotoCards;