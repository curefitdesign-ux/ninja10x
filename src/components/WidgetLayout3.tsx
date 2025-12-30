import { User, Plus, ScanFace, Play, X } from 'lucide-react';
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
    <div className="relative overflow-hidden" style={{ width: '100%', height: '100%' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%`, height: `${100 / scale}%` }}>
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

const WidgetLayout3 = ({ photos, onAddPhoto }: WidgetLayout3Props) => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [tappedElement, setTappedElement] = useState<string | null>(null);
  const prevPhotosLength = useRef(photos.length);
  const [newPhotoIndex, setNewPhotoIndex] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const hasThreePhotos = photos.length >= 3;
  const week1Photos = photos.slice(0, 3);

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

  // Auto-advance slideshow when video is playing
  useEffect(() => {
    if (isVideoPlaying && !isVideoMinimized && week1Photos.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % week1Photos.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isVideoPlaying, isVideoMinimized, week1Photos.length]);

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
          isReview: false,
        },
      });
    }, 200);
  };

  const handlePlayVideo = () => {
    triggerHaptic('medium');
    setIsCreatingVideo(true);
    setCurrentSlide(0);
    
    // Simulate video creation loading
    setTimeout(() => {
      setIsCreatingVideo(false);
      setIsVideoPlaying(true);
      setIsVideoMinimized(false);
    }, 1500);
  };

  const handleMinimizeVideo = () => {
    triggerHaptic('light');
    setIsVideoMinimized(true);
    setIsVideoPlaying(false);
  };

  const handleExpandFromFilmStrip = () => {
    if (isVideoMinimized && hasThreePhotos) {
      triggerHaptic('medium');
      setIsVideoMinimized(false);
      setIsVideoPlaying(true);
    }
  };

  return (
    <div className="px-5 pt-4">
      {/* Full Screen Video Player Overlay */}
      {isVideoPlaying && !isVideoMinimized && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in"
          style={{ padding: '30px' }}
        >
          {/* Close Button */}
          <button
            onClick={handleMinimizeVideo}
            className="absolute top-10 right-8 z-60 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Video Content Area - 9:16 ratio */}
          <div className="flex-1 flex items-center justify-center">
            <div 
              className="relative overflow-hidden rounded-2xl"
              style={{ 
                aspectRatio: '9/16',
                maxHeight: 'calc(100vh - 180px)',
                width: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
            >
              {/* Slideshow of photos */}
              {week1Photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    currentSlide === index ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {renderInFrame(photo, 0.5)}
                </div>
              ))}
              
              {/* Progress indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {week1Photos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      currentSlide === index ? 'w-6 bg-white' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Film Strip at Bottom with Loader */}
          <div className="mt-4">
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
                      const isCurrentSlide = index === currentSlide && groupIndex === 0;
                      return (
                        <div 
                          key={index}
                          className={`overflow-hidden ${isCurrentSlide ? 'ring-2 ring-white animate-pulse' : ''}`}
                          style={{ 
                            background: '#1a1a1a',
                            borderRadius: '2px',
                            width: '16px',
                            aspectRatio: '9/16',
                          }}
                        >
                          {photo ? (
                            <img
                              src={photo.originalUrl || photo.url}
                              alt=""
                              className="w-full h-full object-cover"
                              style={{ borderRadius: '2px' }}
                            />
                          ) : (
                            /* Loader animation for empty slots */
                            <div 
                              className="w-full h-full"
                              style={{
                                background: 'linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite'
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Creating Overlay */}
      {isCreatingVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin mb-4" />
          <p className="text-white font-medium">Creating your journey...</p>
        </div>
      )}

      {/* Ninja Widget */}
      <div 
        className={`glass-card p-5 pt-10 relative overflow-visible w-full transition-all duration-500 ${isLoaded ? 'animate-liquid-enter' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${cardBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '420px' }}
      >
        {/* Cult Ninja Tag */}
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
      
        {/* Center Photo Card with Play Button */}
        <div 
          className={`relative z-10 mb-6 flex justify-center ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} 
          style={{ minHeight: latestPhoto ? '220px' : '160px', animationDelay: '0.3s' }}
        >
          {latestPhoto ? (
            <div className="relative">
              {/* Glow effect for week 1 completion */}
              {hasThreePhotos && (
                <div 
                  className="absolute -inset-4 rounded-2xl z-0"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,77,77,0.4) 0%, transparent 70%)',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                    filter: 'blur(10px)'
                  }}
                />
              )}
              
              <div 
                className={`relative cursor-pointer overflow-hidden rounded-xl tap-bounce ${tappedElement === `photo-${latestPhoto.id}` ? 'animate-liquid-tap' : ''} ${newPhotoIndex === photos.length - 1 ? 'animate-liquid-bounce' : ''} ${hasThreePhotos ? 'ring-2 ring-white/30' : ''}`}
                onClick={() => !hasThreePhotos && handlePhotoTap(latestPhoto)}
                style={{ 
                  transform: 'rotate(2deg)',
                  width: '180px',
                  aspectRatio: '9/16',
                  boxShadow: hasThreePhotos 
                    ? '0 8px 32px rgba(255,77,77,0.4), 0 0 40px rgba(255,77,77,0.2)' 
                    : '0 8px 32px rgba(0,0,0,0.4)'
                }}
              >
                {renderInFrame(latestPhoto, 0.28)}
                
                {/* Play Button Overlay - Only show when 3+ photos */}
                {hasThreePhotos && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors"
                    onClick={(e) => { e.stopPropagation(); handlePlayVideo(); }}
                  >
                    <div 
                      className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center"
                      style={{
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        animation: 'pulse-scale 2s ease-in-out infinite'
                      }}
                    >
                      <Play className="w-8 h-8 text-black ml-1" fill="black" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State - Selfie Upload Card */
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
      
        {/* Film Strip Section */}
        <div className={`relative z-10 -mt-5 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
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
                    const showPlayIcon = isVideoMinimized && isWeek1 && index === 0;
                    
                    return (
                      <div 
                        key={index}
                        className={`overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/50 tap-bounce relative ${photo ? 'animate-film-shimmer' : ''} ${isNewPhoto ? 'animate-liquid-bounce' : ''} ${tappedElement === `strip-${index}` ? 'animate-liquid-tap' : ''} ${hasThreePhotos && isWeek1 && photo ? 'ring-1 ring-white/40' : ''}`}
                        style={{ 
                          background: '#1a1a1a',
                          borderRadius: '2px',
                          width: '16px',
                          aspectRatio: '9/16',
                          animationDelay: photo && !isNewPhoto ? `${index * 50}ms` : '0ms',
                          animationFillMode: 'both',
                          boxShadow: hasThreePhotos && isWeek1 && photo ? '0 0 8px rgba(255,77,77,0.4)' : 'none'
                        }}
                        onClick={() => {
                          if (showPlayIcon) {
                            handleExpandFromFilmStrip();
                          } else if (photo) {
                            handleTap(`strip-${index}`);
                            setTimeout(() => handlePhotoTap(photo), 200);
                          }
                        }}
                      >
                        {photo ? (
                          photo.isVideo || isVideoUrl(photo.originalUrl || photo.url) ? (
                            <video src={photo.originalUrl || photo.url} className="w-full h-full object-cover" style={{ borderRadius: '2px' }} muted playsInline />
                          ) : (
                            <img src={photo.originalUrl || photo.url} alt="" className="w-full h-full object-cover" style={{ borderRadius: '2px' }} />
                          )
                        ) : null}
                        
                        {/* Mini Play Icon for minimized video */}
                        {showPlayIcon && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Play className="w-2 h-2 text-white" fill="white" />
                          </div>
                        )}
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
