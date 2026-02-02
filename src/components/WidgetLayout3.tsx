import { Plus, ScanFace, X, Camera, Play, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import cardBackground from '@/assets/card-background.png';
import filmstripBg from '@/assets/frames/filmstrip-bg.png';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';
import ReelProgressPill from '@/components/ReelProgressPill';
import { useFitnessReel } from '@/hooks/use-fitness-reel';

interface Photo {
  id: string;
  storageUrl: string;
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  dayNumber: number;
}

type FrameType = 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';

const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

const renderInFrame = (photo: Photo, containerWidth: number = 180) => {
  const frame: FrameType = photo.frame || 'shaky';
  const baseWidth = 360;
  const scale = containerWidth / baseWidth;
  
  // Calculate week and day from dayNumber (3 days per week)
  const week = Math.ceil(photo.dayNumber / 3);
  const day = ((photo.dayNumber - 1) % 3) + 1;
  
  const frameProps = {
    imageUrl: photo.storageUrl,
    isVideo: photo.isVideo || isVideoUrl(photo.storageUrl),
    activity: photo.activity || 'Activity',
    week,
    day,
    dayNumber: photo.dayNumber,
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
  onEditPhoto?: (photo: Photo) => void;
  isGenerating?: boolean;
  isUploading?: boolean;
  weekTransitionAnimation?: boolean;
}

const WidgetLayout3 = ({ 
  photos, 
  onAddPhoto, 
  onOpenCamera, 
  onGenerateReel, 
  onRemovePhoto, 
  onEditPhoto,
  isGenerating = false, 
  isUploading = false,
  weekTransitionAnimation = false,
}: WidgetLayout3Props) => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [tappedElement, setTappedElement] = useState<string | null>(null);
  const prevPhotosLength = useRef(photos.length);
  const [newPhotoIndex, setNewPhotoIndex] = useState<number | null>(null);
  
  // Get reel state from hook
  const { 
    currentReel,
    currentStep: reelStep,
    isGenerating: isGeneratingReel,
  } = useFitnessReel();
  
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const hasThreePhotos = photos.length >= 3;
  const allPhotosUploaded = photos.every(p => p.storageUrl);
  const showPlayButton = hasThreePhotos;
  const canCreateReel = hasThreePhotos && allPhotosUploaded && !isGenerating && !isUploading;
  
  // Calculate reel progress based on step
  const reelProgress = (() => {
    if (!isGeneratingReel && !isGenerating) {
      return currentReel?.videoUrl ? 100 : 0;
    }
    switch (reelStep) {
      case 'narration': return 25;
      case 'voiceover': return 50;
      case 'video': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  })();
  
  // Determine which week just completed (for showing pill)
  const completedWeeks = Math.floor(photos.length / 3);
  const showReelPill = completedWeeks > 0 && (isGeneratingReel || isGenerating || currentReel?.videoUrl);

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
      // Navigate to reel view with the photo's user to show the same image
      navigate('/reel', {
        state: {
          activityId: photo.id,
          dayNumber: photo.dayNumber,
        },
      });
    }, 200);
  };

  const handleGenerateReel = () => {
    triggerHaptic('medium');
    if (onGenerateReel && photos.length >= 3) {
      // Use latest 3 photos for reel
      onGenerateReel(photos.slice(-3));
    }
  };

  const handleRemovePhoto = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    if (onRemovePhoto) {
      onRemovePhoto(photoId);
    }
  };

  // Calculate completed week for transition animation
  const completedWeek = Math.floor(photos.length / 3);
  const nextWeek = completedWeek + 1;

  return (
    <div className="px-5 pt-4 relative">
      {/* Week Transition Celebration Overlay */}
      {weekTransitionAnimation && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          {/* Bouncy liquid glass background */}
          <div 
            className="absolute inset-0 animate-week-transition-bg"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.15) 0%, transparent 60%)',
            }}
          />
          
          {/* Central celebration card */}
          <div 
            className="animate-week-celebration-bounce"
            style={{
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.25) 0%, rgba(34, 197, 94, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(52, 211, 153, 0.4)',
              borderRadius: '24px',
              padding: '32px 48px',
              boxShadow: '0 20px 60px rgba(52, 211, 153, 0.3), inset 0 1px 1px rgba(255,255,255,0.3)',
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="animate-sparkle-float">
                <Sparkles className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold text-2xl mb-1">
                  Week {completedWeek} Complete!
                </h3>
                <p className="text-emerald-300/80 text-sm font-medium">
                  Moving to Week {nextWeek}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ninja Widget */}
      <div 
        className={`glass-card p-5 pt-10 relative overflow-visible w-full transition-all duration-500 ${isLoaded ? 'animate-liquid-enter' : 'opacity-0'} ${weekTransitionAnimation ? 'animate-widget-pulse' : ''}`}
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
              onClick={() => { 
                handleTap('empty'); 
                // Navigate to gallery page instead of popup
                const nextDayNumber = photos.length + 1;
                navigate('/gallery', { state: { dayNumber: nextDayNumber } });
              }}
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
      
        {/* Film Strip Section with Play Button */}
        <div className={`relative z-10 -mt-5 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          {/* Play Button - Shows when 3+ photos exist */}
          {showPlayButton && (
            <button
              onClick={handleGenerateReel}
              disabled={!canCreateReel}
              className={`absolute -top-14 left-2 z-20 w-12 h-12 rounded-full tap-bounce flex items-center justify-center transition-all duration-300 ${canCreateReel ? 'animate-play-button-float' : 'opacity-60'}`}
              style={{
                background: canCreateReel 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(150, 150, 150, 0.2) 0%, rgba(100, 100, 100, 0.1) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: canCreateReel 
                  ? '1.5px solid rgba(255, 255, 255, 0.3)'
                  : '1.5px solid rgba(150, 150, 150, 0.2)',
                boxShadow: canCreateReel 
                  ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255,255,255,0.3)'
                  : 'none',
              }}
            >
              {isUploading || isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" fill="rgba(255,255,255,0.9)" />
              )}
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
                    // Highlight latest 3 for reel (when we have 3+)
                    const latest3Start = Math.max(0, photos.length - 3);
                    const isInLatest3 = hasThreePhotos && index >= latest3Start && index < photos.length;
                    
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
                          boxShadow: isInLatest3 ? '0 0 10px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.3)' : 'none',
                          border: isInLatest3 ? '1px solid rgba(34, 197, 94, 0.5)' : 'none'
                        }}
                        onClick={() => {
                          if (photo) {
                            handleTap(`strip-${index}`);
                            setTimeout(() => handlePhotoTap(photo), 200);
                          }
                        }}
                      >
                        {photo ? (
                          photo.isVideo || isVideoUrl(photo.storageUrl) ? (
                            <video
                              src={photo.storageUrl}
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
                              src={photo.storageUrl} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              style={{ borderRadius: '2px' }} 
                              onError={(e) => {
                                console.error('Image failed to load:', photo.storageUrl);
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

      {/* Upload Buttons Below Widget */}
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
          onClick={() => { 
            handleTap('add-btn'); 
            // Navigate to gallery page instead of popup
            const nextDayNumber = photos.length + 1;
            navigate('/gallery', { state: { dayNumber: nextDayNumber } });
          }}
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
      
      {/* Reel Progress Pill - Show below widget when a week is complete */}
      <AnimatePresence>
        {showReelPill && (
          <div className="mt-4 px-2">
            <ReelProgressPill
              weekNumber={completedWeeks}
              state={
                currentReel?.videoUrl 
                  ? 'complete' 
                  : reelProgress >= 90 
                    ? 'completing' 
                    : 'creating'
              }
              progress={reelProgress}
              onPlay={() => {
                if (currentReel?.videoUrl) {
                  navigate('/reel');
                }
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WidgetLayout3;
