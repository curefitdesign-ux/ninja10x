import { User, Plus, ScanFace, Play, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import cardBackground from '@/assets/card-background.png';
import filmstripBg from '@/assets/frames/filmstrip-bg.png';
import journeyVideo from '@/assets/journey-video.mp4';
import progressBar from '@/assets/frames/progress-bar.png';
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
  currentDate: string;
}

const WidgetLayout3 = ({ photos, onAddPhoto }: WidgetLayout3Props) => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [tappedElement, setTappedElement] = useState<string | null>(null);
  const prevPhotosLength = useRef(photos.length);
  const [newPhotoIndex, setNewPhotoIndex] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoClosing, setIsVideoClosing] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const hasThreePhotos = photos.length >= 3;

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

  // Handle video time update for progress
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  // Play video when overlay opens
  useEffect(() => {
    if (isVideoPlaying && !isVideoClosing && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [isVideoPlaying, isVideoClosing]);

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
    setIsVideoPlaying(true);
    setIsVideoClosing(false);
    setVideoProgress(0);
  };

  const handleCloseVideo = () => {
    triggerHaptic('light');
    setIsVideoClosing(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // Reverse animation - wait for it to complete
    setTimeout(() => {
      setIsVideoPlaying(false);
      setIsVideoClosing(false);
      setVideoProgress(0);
    }, 600);
  };

  return (
    <div className="px-5 pt-4">
      {/* Full Screen Video Player Overlay */}
      {isVideoPlaying && (
        <div 
          className={`fixed inset-0 z-50 bg-black flex flex-col ${isVideoClosing ? 'animate-video-close' : 'animate-video-open'}`}
        >
          {/* Close Button */}
          <button
            onClick={handleCloseVideo}
            className={`absolute top-10 right-6 z-60 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all duration-300 ${isVideoClosing ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
            style={{ transitionDelay: isVideoClosing ? '0ms' : '400ms' }}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Video Content Area */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div 
              className={`relative overflow-hidden rounded-3xl ${isVideoClosing ? 'animate-video-shrink' : 'animate-video-expand'}`}
              style={{ 
                aspectRatio: '9/16',
                maxHeight: 'calc(100vh - 160px)',
                width: 'auto',
                boxShadow: '0 25px 80px rgba(0,0,0,0.6)'
              }}
            >
              <video
                ref={videoRef}
                src={journeyVideo}
                className="w-full h-full object-cover"
                loop
                playsInline
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
          </div>

          {/* Fixed Film Strip at Bottom with Progress Bar Image Overlay */}
          <div className={`pb-8 pt-4 ${isVideoClosing ? 'animate-filmstrip-reverse' : 'animate-filmstrip-forward'}`}>
            <div className="relative w-full overflow-hidden">
              <img src={filmstripBg} alt="" className="w-full h-auto" style={{ display: 'block' }} />
              
              {/* Dashed progress bar image overlay - masked to first 3 cards */}
              <div 
                className="absolute pointer-events-none"
                style={{
                  top: '-4px',
                  left: '10px',
                  width: '25%',
                  height: 'calc(100% + 8px)',
                  overflow: 'hidden',
                  clipPath: `inset(0 ${100 - (videoProgress * 4)}% 0 0)`
                }}
              >
                <img 
                  src={progressBar} 
                  alt="" 
                  className="w-full h-full object-fill"
                />
              </div>
              
              <div 
                className="absolute inset-0 flex items-center justify-center gap-[10px]"
                style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '14px', paddingBottom: '6px' }}
              >
                {[0, 1, 2, 3].map((groupIndex) => (
                  <div key={groupIndex} className="flex gap-[2px]">
                    {[0, 1, 2].map((boxIndex) => {
                      const index = groupIndex * 3 + boxIndex;
                      const photo = photos[index];
                      return (
                        <div 
                          key={index}
                          className="overflow-hidden"
                          style={{ 
                            background: '#1a1a1a',
                            borderRadius: '2px',
                            width: '16px',
                            aspectRatio: '9/16'
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
                            <div 
                              className="w-full h-full"
                              style={{ background: '#1a1a1a' }}
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
      
        {/* Film Strip Section with Floating Play Button */}
        <div className={`relative z-10 -mt-5 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          {/* Floating Play Button - Liquid Glass Style */}
          {hasThreePhotos && (
            <button
              onClick={handlePlayVideo}
              className="absolute -top-14 left-2 z-20 w-12 h-12 rounded-full flex items-center justify-center tap-bounce animate-play-button-float"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(22, 163, 74, 0.15) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(34, 197, 94, 0.4)',
                boxShadow: '0 4px 24px rgba(34, 197, 94, 0.3), inset 0 1px 1px rgba(255,255,255,0.2), 0 0 40px rgba(34, 197, 94, 0.15)'
              }}
            >
              <Play className="w-5 h-5 text-green-400 ml-0.5 drop-shadow-lg" fill="rgba(74, 222, 128, 0.8)" />
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
                          <img src={photo.originalUrl || photo.url} alt="" className="w-full h-full object-cover" style={{ borderRadius: '2px' }} />
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
