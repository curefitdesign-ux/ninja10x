import { User, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import cardBackground from '@/assets/card-background.png';
import filmstripBg from '@/assets/frames/filmstrip-new.png';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';

interface Photo {
  id: string;
  url: string; // Framed/template image URL
  originalUrl?: string; // Original photo for film strip
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  uploadDate: string;
}

type FrameType = 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';

// Helper to detect if URL is a video
const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

// Render photo/video in its selected frame template (scaled for widget)
const renderInFrame = (photo: Photo, scale: number = 0.28) => {
  const frame: FrameType = photo.frame || 'shaky';
  const frameProps = {
    imageUrl: photo.originalUrl || photo.url,
    isVideo: photo.isVideo || isVideoUrl(photo.url),
    activity: photo.activity || 'Activity',
    week: 1,
    day: 1,
    duration: photo.duration || '2hrs',
    pr: photo.pr || '',
    imagePosition: { x: 0, y: 0 },
    imageScale: 1.2,
  };

  const FrameComponent = () => {
    switch (frame) {
      case 'journal':
        return <JournalFrame {...frameProps} />;
      case 'vogue':
        return <VogueFrame {...frameProps} />;
      case 'fitness':
        return <FitnessFrame {...frameProps} />;
      case 'ticket':
        return <TicketFrame {...frameProps} />;
      case 'shaky':
      default:
        return <ShakyFrame {...frameProps} />;
    }
  };

  return (
    <div 
      className="relative overflow-hidden"
      style={{ 
        width: '100%', 
        height: '100%',
      }}
    >
      <div 
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
          height: `${100 / scale}%`,
        }}
      >
        <FrameComponent />
      </div>
    </div>
  );
};

interface WidgetLayout3Props {
  photos: Photo[];
  onAddPhoto: () => void;
  currentDate: string;
}

const WidgetLayout3 = ({ 
  photos, 
  onAddPhoto,
}: WidgetLayout3Props) => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [tappedElement, setTappedElement] = useState<string | null>(null);
  const prevPhotosLength = useRef(photos.length);
  const [newPhotoIndex, setNewPhotoIndex] = useState<number | null>(null);
  
  // Get the latest photo for center display
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;

  // Trigger entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Track new photo additions for animation
  useEffect(() => {
    if (photos.length > prevPhotosLength.current) {
      setNewPhotoIndex(photos.length - 1);
      setTimeout(() => setNewPhotoIndex(null), 700);
    }
    prevPhotosLength.current = photos.length;
  }, [photos.length]);

  const handleTap = (id: string) => {
    triggerHaptic('light');
    setTappedElement(id);
    setTimeout(() => setTappedElement(null), 400);
  };

  const handlePhotoTap = (photo: Photo) => {
    triggerHaptic('medium');
    handleTap(`photo-${photo.id}`);
    // Navigate to preview in edit mode
    setTimeout(() => {
      navigate('/preview', {
        state: {
          imageUrl: photo.originalUrl || photo.url,
          originalUrl: photo.originalUrl || photo.url,
          isVideo: photo.isVideo,
          activity: photo.activity,
          frame: photo.frame,
          duration: photo.duration,
          pr: photo.pr,
          isReview: false, // Allow editing
        },
      });
    }, 200);
  };


  return (
    <div className="px-5 pt-4">
      {/* Ninja Widget */}
      <div 
        className={`glass-card p-5 pt-10 relative overflow-visible w-full transition-all duration-500 ${isLoaded ? 'animate-liquid-enter' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${cardBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '420px' }}
      >
        {/* Cult Ninja Tag - Centered at top edge */}
        <div className={`absolute -top-3 left-0 right-0 flex justify-center z-20 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          <div 
            className={`px-3 py-1 rounded-full border border-foreground/30 bg-background/60 backdrop-blur-md tap-bounce cursor-pointer shadow-lg ${tappedElement === 'tag' ? 'animate-liquid-tap' : ''}`}
            onClick={() => handleTap('tag')}
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
          >
            <span className="text-[10px] font-semibold text-foreground tracking-wider">CULT NINJA</span>
          </div>
        </div>
        
        {/* Title */}
        <h2 className={`text-lg font-bold text-foreground text-center mb-4 relative z-10 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          CONQUER WILL POWER
        </h2>
      
        {/* Single Center Photo Card - Shows the captured framed image */}
        <div 
          className={`relative z-10 mb-6 flex justify-center ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} 
          style={{ minHeight: latestPhoto ? '220px' : '160px', animationDelay: '0.3s' }}
        >
          {latestPhoto ? (
            <div 
              className={`relative cursor-pointer overflow-hidden rounded-xl tap-bounce ${tappedElement === `photo-${latestPhoto.id}` ? 'animate-liquid-tap' : ''} ${newPhotoIndex === photos.length - 1 ? 'animate-liquid-bounce' : ''}`}
              onClick={() => handlePhotoTap(latestPhoto)}
              style={{ 
                transform: 'rotate(2deg)',
                width: '180px',
                aspectRatio: '9/16',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}
            >
              {/* Render in selected frame template - scaled proportionally */}
              {renderInFrame(latestPhoto, 0.28)}
            </div>
          ) : (
            /* Empty State */
            <div 
              className={`flex flex-col items-center justify-center cursor-pointer tap-bounce ${tappedElement === 'empty' ? 'animate-liquid-tap' : ''}`}
              onClick={() => { handleTap('empty'); onAddPhoto(); }}
            >
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
                style={{ 
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px dashed rgba(255,255,255,0.3)'
                }}
              >
                <User className="w-8 h-8 text-white/50" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-white/60 font-medium">Upload your first image</p>
            </div>
          )}
        </div>
      
        {/* Film Strip Section with Week Labels */}
        <div className={`relative z-10 -mt-5 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="relative w-full flex items-center">
            {/* Week Label on Yellow Spool */}
            <div 
              className="absolute left-0 flex items-center justify-center z-10"
              style={{
                width: '40px',
                height: '100%',
              }}
            >
              <span 
                className="font-bold text-black text-[10px] tracking-wider"
                style={{
                  transform: 'rotate(-90deg)',
                  whiteSpace: 'nowrap',
                }}
              >
                WEEK {Math.min(Math.ceil((photos.length + 1) / 3), 4)}
              </span>
            </div>
            
            {/* Film strip background image */}
            <img 
              src={filmstripBg} 
              alt="" 
              className="w-full h-auto"
              style={{ display: 'block' }}
            />
            
            {/* 12 photo boxes - hidden, photos only show on main display */}
            <div 
              className="absolute flex items-center"
              style={{ 
                left: '14%',
                right: '3%',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '60%',
              }}
            >
              {Array.from({ length: 12 }).map((_, index) => {
                const photo = photos[index];
                const isNewPhoto = newPhotoIndex === index;
                return (
                  <div 
                    key={index}
                    className={`flex-1 h-full overflow-hidden cursor-pointer ${photo ? 'animate-film-shimmer' : ''} ${isNewPhoto ? 'animate-liquid-bounce' : ''} ${tappedElement === `strip-${index}` ? 'animate-liquid-tap' : ''}`}
                    style={{ 
                      marginRight: (index + 1) % 3 === 0 && index < 11 ? '3%' : '1px',
                      animationDelay: photo && !isNewPhoto ? `${index * 50}ms` : '0ms',
                      animationFillMode: 'both'
                    }}
                    onClick={() => {
                      if (photo) {
                        handleTap(`strip-${index}`);
                        setTimeout(() => handlePhotoTap(photo), 200);
                      }
                    }}
                  >
                    {photo ? (
                      photo.isVideo || isVideoUrl(photo.originalUrl || photo.url) ? (
                        <video
                          src={photo.originalUrl || photo.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={photo.originalUrl || photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Button Below Widget */}
      <div className={`flex justify-center mt-4 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
        <button
          onClick={() => { handleTap('add-btn'); onAddPhoto(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full tap-bounce ${tappedElement === 'add-btn' ? 'animate-liquid-tap' : ''}`}
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

export default WidgetLayout3;
