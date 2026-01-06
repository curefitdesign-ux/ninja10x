import { Plus, ScanFace, X, Camera, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import cardBackground from '@/assets/card-background.png';
import filmstripBg from '@/assets/frames/filmstrip-bg.png';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';

interface Photo {
  id: string;
  url: string;
  originalUrl?: string;
  storageUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  uploadDate: string;
}

type FrameType = 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';

const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

const renderInFrame = (photo: Photo, containerWidth: number = 180) => {
  const frame: FrameType = photo.frame || 'shaky';
  const baseWidth = 360;
  const scale = containerWidth / baseWidth;
  
  const frameProps = {
    imageUrl: photo.originalUrl || photo.url,
    isVideo: photo.isVideo || isVideoUrl(photo.url),
    activity: photo.activity || 'Activity',
    week: 1,
    day: 1,
    duration: photo.duration || '2hrs',
    pr: photo.pr || '',
    imagePosition: { x: 0, y: 0 },
    imageScale: 1.0,
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
        width: `${containerWidth}px`, 
        height: `${containerWidth * (16/9)}px` 
      }}
    >
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top left', 
          width: `${baseWidth}px`,
          marginLeft: `${(baseWidth * 0.05) * scale}px`
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
  onOpenCamera: () => void;
  currentDate: string;
  onGenerateReel?: (photos: Photo[]) => void;
  onRemovePhoto?: (photoId: string) => void;
}

const WidgetLayout3 = ({ photos, onAddPhoto, onOpenCamera, onGenerateReel, onRemovePhoto }: WidgetLayout3Props) => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [tappedElement, setTappedElement] = useState<string | null>(null);
  const prevPhotosLength = useRef(photos.length);
  const [newPhotoIndex, setNewPhotoIndex] = useState<number | null>(null);
  
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const hasThreePhotos = photos.length >= 3;
  const allPhotosUploaded = photos.slice(0, 3).every(p => p.storageUrl);
  const isUploading = hasThreePhotos && !allPhotosUploaded;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
          isReview: true,
          photoId: photo.id,
        },
      });
    }, 200);
  };

  const handleGenerateReel = () => {
    triggerHaptic('medium');
    if (onGenerateReel && photos.length >= 3) {
      onGenerateReel(photos.slice(0, 3));
    }
  };

  const handleRemovePhoto = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    if (onRemovePhoto) {
      onRemovePhoto(photoId);
    }
  };

  return (
    <div className="px-5 pt-4">
      {/* Ninja Widget */}
      <div 
        className={`glass-card p-5 pt-10 relative overflow-visible w-full transition-all duration-500 ${isLoaded ? 'animate-liquid-enter' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${cardBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '420px' }}
      >
        {/* Cult Ninja Tag */}
        <div className={`absolute -top-3 left-0 right-0 flex justify-center z-20 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          <div 
            className={`px-3 py-1 rounded-full tap-bounce cursor-pointer shadow-lg ${tappedElement === 'tag' ? 'animate-liquid-tap' : ''}`}
            onClick={() => handleTap('tag')}
            style={{ 
              background: 'linear-gradient(180deg, rgba(90,90,90,0.85) 0%, rgba(61,61,61,0.85) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 15px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span className="text-[10px] font-semibold text-foreground tracking-wider">CULT NINJA</span>
          </div>
        </div>
        
        {/* Title */}
        <h2 className={`text-lg font-bold text-foreground text-center mb-4 relative z-10 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          CONQUER WILL POWER
        </h2>
      
        {/* Center Photo Card */}
        <div 
          className={`relative z-10 mb-6 flex justify-center ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} 
          style={{ minHeight: latestPhoto ? '220px' : '160px', animationDelay: '0.3s' }}
        >
          {latestPhoto ? (
            <div className="relative">
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
                {renderInFrame(latestPhoto, 180)}
                
                {/* Remove button */}
                {onRemovePhoto && (
                  <button
                    onClick={(e) => handleRemovePhoto(latestPhoto.id, e)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-20 transition-all duration-200 hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <X className="w-4 h-4 text-white/80" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div 
              className={`relative cursor-pointer tap-bounce group ${tappedElement === 'empty' ? 'animate-liquid-tap' : ''}`}
              onClick={() => { handleTap('empty'); onAddPhoto(); }}
              style={{ 
                width: '160px',
                aspectRatio: '3/4',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(75,85,99,0.95) 0%, rgba(55,65,81,0.98) 100%)' }} />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <ScanFace className="text-white/40" size={64} strokeWidth={1.2} style={{ animation: 'float-gentle 3s ease-in-out infinite' }} />
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          )}
        </div>
      
        {/* Film Strip Section with Create Reel Button */}
        <div className={`relative z-10 -mt-5 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          {/* Create Reel Button - Liquid Glass Style */}
          {hasThreePhotos && (
            <button
              onClick={handleGenerateReel}
              disabled={isUploading}
              className={`absolute -top-14 left-2 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full tap-bounce ${!isUploading ? 'animate-play-button-float' : ''}`}
              style={{
                background: isUploading
                  ? 'linear-gradient(135deg, rgba(150, 150, 150, 0.25) 0%, rgba(100, 100, 100, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(250, 204, 21, 0.25) 0%, rgba(234, 179, 8, 0.15) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: isUploading
                  ? '1.5px solid rgba(150, 150, 150, 0.4)'
                  : '1.5px solid rgba(250, 204, 21, 0.4)',
                boxShadow: isUploading
                  ? 'none'
                  : '0 4px 24px rgba(250, 204, 21, 0.3), inset 0 1px 1px rgba(255,255,255,0.2), 0 0 40px rgba(250, 204, 21, 0.15)',
                opacity: isUploading ? 0.7 : 1,
              }}
            >
              <Sparkles className={`w-4 h-4 drop-shadow-lg ${isUploading ? 'text-gray-400' : 'text-yellow-400'}`} />
              <span className={`text-xs font-semibold ${isUploading ? 'text-gray-400' : 'text-yellow-400'}`}>
                {isUploading ? 'Uploading...' : 'Create Reel'}
              </span>
            </button>
          )}
          
          <div className="relative w-full">
            <img src={filmstripBg} alt="" className="w-full h-auto" style={{ display: 'block' }} />
            <div 
              className="absolute inset-0 flex items-center justify-center gap-[10px]"
              style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '14px', paddingBottom: '6px' }}
            >
              {[0, 1, 2, 3].map((groupIndex) => (
                <div key={groupIndex} className="flex gap-[2px]">
                  {[0, 1, 2].map((boxIndex) => {
                    const index = groupIndex * 3 + boxIndex;
                    const photo = photos[index];
                    const isNewPhoto = newPhotoIndex === index;
                    const isWeek1 = groupIndex === 0;
                    const showGreenGlow = hasThreePhotos && isWeek1 && photo;
                    
                    return (
                      <div 
                        key={index}
                        className={`overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/50 tap-bounce relative ${photo ? 'animate-film-shimmer' : ''} ${isNewPhoto ? 'animate-liquid-bounce' : ''} ${tappedElement === `strip-${index}` ? 'animate-liquid-tap' : ''}`}
                        style={{ 
                          background: '#1a1a1a',
                          borderRadius: '2px',
                          width: '16px',
                          aspectRatio: '9/16',
                          animationDelay: photo && !isNewPhoto ? `${index * 50}ms` : '0ms',
                          animationFillMode: 'both',
                          boxShadow: showGreenGlow ? '0 0 10px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.3)' : 'none',
                          border: showGreenGlow ? '1px solid rgba(34, 197, 94, 0.5)' : 'none'
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
                              style={{ borderRadius: '2px' }}
                              muted
                              playsInline
                              preload="metadata"
                              onLoadedData={(e) => {
                                (e.target as HTMLVideoElement).currentTime = 0.1;
                              }}
                            />
                          ) : (
                            <img 
                              src={photo.originalUrl || photo.url} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              style={{ borderRadius: '2px' }} 
                              onError={(e) => {
                                console.error('Image failed to load:', photo.originalUrl || photo.url);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
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

      {/* Upload Buttons Below Widget - Liquid Glass Design */}
      <div className={`flex justify-center gap-3 mt-4 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
        <button
          onClick={() => { handleTap('camera-btn'); onOpenCamera(); }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl transition-all duration-150 ${tappedElement === 'camera-btn' ? 'scale-[0.92] brightness-110' : 'hover:scale-[1.02] active:scale-[0.96]'}`}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.12) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: tappedElement === 'camera-btn' 
              ? '0 2px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1)' 
              : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.05)',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Camera className="w-5 h-5 text-white/90" />
          <span className="text-white/90 font-medium text-sm tracking-wide">Camera</span>
        </button>
        <button
          onClick={() => { handleTap('add-btn'); onAddPhoto(); }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl transition-all duration-150 ${tappedElement === 'add-btn' ? 'scale-[0.92] brightness-110' : 'hover:scale-[1.02] active:scale-[0.96]'}`}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.12) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: tappedElement === 'add-btn' 
              ? '0 2px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1)' 
              : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.05)',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Plus className="w-5 h-5 text-white/90" />
          <span className="text-white/90 font-medium text-sm tracking-wide">Gallery</span>
        </button>
      </div>
    </div>
  );
};

export default WidgetLayout3;
