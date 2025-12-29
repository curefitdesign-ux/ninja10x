import { User, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cardBackground from '@/assets/card-background.png';
import filmstripBg from '@/assets/frames/filmstrip-bg.png';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';
import { useActivityDataPoints } from '@/hooks/use-activity-data-points';

interface Photo {
  id: string;
  url: string;
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  uploadDate: string;
}

// Helper to detect if URL is a video
const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
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
  
  // Get the latest photo for center display
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  
  // Get activity data points for labels
  const { label1, label2 } = useActivityDataPoints(latestPhoto?.activity || '');

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

  // Render the appropriate frame based on selected frame type
  const renderFrame = () => {
    if (!latestPhoto) return null;
    
    const frameProps = {
      imageUrl: latestPhoto.url,
      isVideo: latestPhoto.isVideo || isVideoUrl(latestPhoto.url),
      activity: latestPhoto.activity || '',
      week: 1,
      day: photos.length,
      duration: latestPhoto.duration || '',
      pr: latestPhoto.pr || '',
      imagePosition: { x: 0, y: 0 },
      imageScale: 1.2,
      label1,
      label2,
    };

    switch (latestPhoto.frame) {
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
      
        {/* Single Center Photo Card - Shows selected frame template */}
        <div className="relative z-10 mb-6 flex justify-center" style={{ minHeight: latestPhoto ? '280px' : '160px' }}>
          {latestPhoto ? (
            <div 
              className="relative cursor-pointer w-[55%]"
              onClick={() => handlePhotoTap(latestPhoto)}
              style={{ transform: 'rotate(2deg)' }}
            >
              {renderFrame()}
            </div>
          ) : (
            /* Empty State */
            <div 
              className="flex flex-col items-center justify-center cursor-pointer"
              onClick={onAddPhoto}
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
      
        {/* Film Strip Section - 12 blocks in one row */}
        <div className="relative z-10">
          {/* Film strip background image */}
          <div className="relative w-full">
            <img 
              src={filmstripBg} 
              alt="" 
              className="w-full h-auto"
              style={{ display: 'block' }}
            />
            {/* 12 photo blocks overlaid on film strip - 4 groups of 3 with spacing */}
            <div 
              className="absolute inset-0 flex items-center justify-center gap-[5px]"
              style={{ 
                paddingLeft: '16px',
                paddingRight: '3px',
                paddingTop: '16px', 
                paddingBottom: '6px' 
              }}
            >
              {[0, 1, 2, 3].map((groupIndex) => (
                <div key={groupIndex} className="flex gap-[1px]">
                  {[0, 1, 2].map((boxIndex) => {
                    const index = groupIndex * 3 + boxIndex;
                    const photo = photos[index];
                    return (
                      <div 
                        key={index}
                        className={`overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/50 transition-all ${photo ? 'animate-scale-in' : ''}`}
                        style={{ 
                          background: '#0a0a0a',
                          borderRadius: '2px',
                          width: '18px',
                          aspectRatio: '9/16',
                          animationDelay: photo ? `${index * 50}ms` : '0ms',
                          animationFillMode: 'both'
                        }}
                        onClick={() => photo && handlePhotoTap(photo)}
                      >
                        {photo ? (
                          photo.isVideo || isVideoUrl(photo.url) ? (
                            <video
                              src={photo.url}
                              className="w-full h-full object-cover"
                              style={{ borderRadius: '2px' }}
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={photo.url}
                              alt=""
                              className="w-full h-full object-cover"
                              style={{ borderRadius: '2px' }}
                            />
                          )
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Button Below Widget */}
      <div className="flex justify-center mt-4">
        <button
          onClick={onAddPhoto}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
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
