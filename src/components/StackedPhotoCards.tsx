import { User } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  activity?: string;
}

interface StackedPhotoCardsProps {
  photos: Photo[];
  onCardClick: () => void;
  maxPhotos?: number;
}

const StackedPhotoCards = ({ photos, onCardClick, maxPhotos = 3 }: StackedPhotoCardsProps) => {
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
              onClick={isTopCard ? onCardClick : undefined}
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
    </div>
  );
};

export default StackedPhotoCards;
