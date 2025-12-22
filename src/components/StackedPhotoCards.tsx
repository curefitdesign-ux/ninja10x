import { User } from 'lucide-react';
import ShakyFrame from './frames/ShakyFrame';
import JournalFrame from './frames/JournalFrame';
import VogueFrame from './frames/VogueFrame';

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
  maxPhotos?: number;
}

const StackedPhotoCards = ({ photos, onCardClick }: StackedPhotoCardsProps) => {
  // Show all photos - no capping
  
  // Calculate positions for stacked cards - next empty card front, filled cards stack left
  const getCardStyle = (index: number, isEmptyCard: boolean, totalVisible: number) => {
    if (isEmptyCard) {
      // Empty card (next capture) - front and center
      return {
        transform: 'translateX(0) scale(1) rotate(0deg)',
        zIndex: totalVisible + 1,
        opacity: 1,
        filter: 'none',
      };
    } else {
      // Filled cards - stack to left
      const offset = totalVisible - index;
      return {
        transform: `translateX(${-offset * 25}px) scale(${0.85 - (offset - 1) * 0.05}) rotate(-5deg)`,
        zIndex: index,
        opacity: Math.max(0.4, 0.8 - (offset - 1) * 0.15),
        backdropFilter: 'blur(16px)',
      };
    }
  };

  const renderFrameContent = (photo: Photo) => {
    const frameProps = {
      imageUrl: photo.url,
      activity: photo.activity || '',
      week: 1,
      day: 1,
      duration: photo.duration || '',
      pr: photo.pr || '',
      imagePosition: { x: 0, y: 0 },
      imageScale: 1.2,
    };

    switch (photo.frame) {
      case 'journal':
        return <JournalFrame {...frameProps} />;
      case 'vogue':
        return <VogueFrame {...frameProps} />;
      case 'shaky':
      default:
        return <ShakyFrame {...frameProps} />;
    }
  };

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '320px' }}>
      {/* Stacked Cards */}
      <div className="relative" style={{ width: '220px', height: '280px' }}>
        {/* Render all photo cards */}
        {photos.map((photo, index) => {
          const style = getCardStyle(index, false, photos.length);
          
          return (
            <div
              key={photo.id}
              className="absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-500 ease-out"
              style={style}
            >
              {renderFrameContent(photo)}
            </div>
          );
        })}
        
        {/* Empty card for next capture - always on top */}
        <div
          className="absolute top-0 left-0 w-full h-full rounded-3xl overflow-hidden transition-all duration-500 ease-out cursor-pointer glass-card"
          style={{
            ...getCardStyle(photos.length, true, photos.length),
            background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
          }}
          onClick={onCardClick}
        >
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
        </div>
      </div>
    </div>
  );
};

export default StackedPhotoCards;