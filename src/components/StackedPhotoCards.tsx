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
  const MIN_CARDS = 3;
  const totalCards = Math.max(MIN_CARDS, photos.length + 1);
  
  // Calculate positions - filled cards stack left, empty cards in center/right
  const getCardStyle = (cardIndex: number, isFilled: boolean, filledCount: number) => {
    if (isFilled) {
      // Filled cards animate from center to left
      const distanceFromTop = filledCount - 1 - cardIndex; // 0 for most recent, increases for older
      return {
        transform: `translateX(${-distanceFromTop * 30}px) scale(${Math.max(0.75, 1 - distanceFromTop * 0.08)}) rotate(-${Math.min(distanceFromTop * 3, 10)}deg)`,
        zIndex: cardIndex + 1,
        opacity: Math.max(0.4, 1 - distanceFromTop * 0.2),
      };
    } else {
      // Empty cards - first empty is front center, rest stack behind
      const emptyIndex = cardIndex - filledCount;
      if (emptyIndex === 0) {
        // Next capture card - front and center
        return {
          transform: 'translateX(0) scale(1) rotate(0deg)',
          zIndex: totalCards + 1,
          opacity: 1,
        };
      } else {
        // Background empty cards - stack slightly behind
        return {
          transform: `translateX(${emptyIndex * 15}px) scale(${0.95 - emptyIndex * 0.05}) rotate(${emptyIndex * 2}deg)`,
          zIndex: totalCards - emptyIndex,
          opacity: 0.3 - emptyIndex * 0.1,
        };
      }
    }
  };

  const renderEmptyCard = (index: number, isClickable: boolean) => (
    <div
      key={`empty-${index}`}
      className={`absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isClickable ? 'cursor-pointer' : ''} glass-card`}
      style={{
        ...getCardStyle(index, false, photos.length),
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

  // Calculate how many empty cards to show
  const emptyCardsCount = Math.max(1, MIN_CARDS - photos.length);

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '320px' }}>
      <div className="relative" style={{ width: '220px', height: '280px' }}>
        {/* Render filled photo cards - they animate left when new ones are added */}
        {photos.map((photo, index) => {
          const style = getCardStyle(index, true, photos.length);
          
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
        })}
        
        {/* Render empty cards - background ones first, then the clickable one on top */}
        {Array.from({ length: emptyCardsCount }).map((_, i) => {
          const cardIndex = photos.length + (emptyCardsCount - 1 - i);
          const isClickable = i === emptyCardsCount - 1;
          return renderEmptyCard(cardIndex, isClickable);
        })}
      </div>
    </div>
  );
};

export default StackedPhotoCards;