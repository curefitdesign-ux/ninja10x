import { useLocation, useNavigate } from 'react-router-dom';
import { X, Check, Pencil, Share2 } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';
import WheelPicker from '@/components/WheelPicker';
import { useActivityDataPoints } from '@/hooks/use-activity-data-points';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ActivityBackgroundEffect from '@/components/ActivityBackgroundEffect';
import SyncHealthPopup from '@/components/SyncHealthPopup';


const FRAMES = ['shaky', 'journal', 'vogue', 'fitness', 'ticket'] as const;
type FrameType = typeof FRAMES[number];

const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

// Background colors matched from each template - dark gradient shades
const FRAME_COLORS: Record<FrameType, { bg: string; gradient: string }> = {
  shaky: { 
    bg: 'rgba(20, 20, 30, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(30, 30, 40, 0.9) 0%, rgba(10, 10, 15, 0.95) 100%)'
  },
  journal: { 
    bg: 'rgba(15, 60, 50, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(25, 80, 65, 0.9) 0%, rgba(10, 40, 35, 0.95) 100%)'
  },
  vogue: { 
    bg: 'rgba(40, 40, 45, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(50, 50, 55, 0.9) 0%, rgba(20, 20, 25, 0.95) 100%)'
  },
  fitness: { 
    bg: 'rgba(50, 50, 20, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(60, 60, 25, 0.9) 0%, rgba(35, 35, 15, 0.95) 100%)'
  },
  ticket: { 
    bg: 'rgba(55, 50, 45, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(65, 60, 55, 0.9) 0%, rgba(40, 35, 30, 0.95) 100%)'
  },
};

type EditingField = 'duration' | 'pr' | null;

// Generate hour options from 0 to 24
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [duration, setDuration] = useState('2hrs');
  const [pr, setPr] = useState('');
  const [currentFrame, setCurrentFrame] = useState<FrameType>('shaky');
  const [originalFrame, setOriginalFrame] = useState<FrameType | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1.0);

  const { label1, label2 } = useActivityDataPoints(activity || '');
  
  // Bottom sheet keyboard state
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [tappedElement, setTappedElement] = useState<string | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [framedImageUrl, setFramedImageUrl] = useState<string | null>(null);
  const [isConnectingHealth, setIsConnectingHealth] = useState(false);
  const [healthConnected, setHealthConnected] = useState<string | null>(null);
  
  const [elementsHidden, setElementsHidden] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const frameItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRaf = useRef<number | null>(null);
  
  // Carousel state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Handle tap animation with haptic feedback
  const handleTap = (id: string) => {
    triggerHaptic('light');
    setTappedElement(id);
    setTimeout(() => setTappedElement(null), 400);
  };

  // Single set of frames - no duplicates

  useEffect(() => {
    const state = location.state as {
      imageUrl?: string;
      originalUrl?: string;
      isVideo?: boolean;
      activity?: string;
      frame?: FrameType;
      duration?: string;
      pr?: string;
      isReview?: boolean;
      photoId?: string;
      dayNumber?: number;
    } | null;

    const mediaUrl = state?.originalUrl || state?.imageUrl;

    if (mediaUrl && state?.activity) {
      setImageUrl(mediaUrl);
      setIsVideo(state.isVideo ?? isVideoUrl(mediaUrl));
      setActivity(state.activity);
      setDuration(state.duration || '2hrs');
      setPr(state.pr || '');
      setIsReview(state.isReview || false);
      setPhotoId(state.photoId || null);
      setDayNumber(state.dayNumber || 1);
      if (state.frame && FRAMES.includes(state.frame)) {
        setCurrentFrame(state.frame);
        setOriginalFrame(state.frame);
      }

      // Trigger entrance animation after a brief delay
      setTimeout(() => setIsLoaded(true), 100);
    } else {
      navigate('/');
    }
  }, []);

  // Focus input when bottom sheet opens
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  // Capture framed image for sharing
  const captureFramedImage = async (): Promise<string | null> => {
    if (isVideo) return imageUrl; // For videos, use original

    if (!captureRef.current) return null;

    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  };

  // Open native share sheet
  const handleSaveClick = async () => {
    if (!imageUrl || !activity) return;

    setIsSaving(true);
    triggerHaptic('light');
    handleTap('share-btn');

    const capturedUrl = await captureFramedImage();
    setFramedImageUrl(capturedUrl);
    
    // Start hiding animations
    setElementsHidden(true);
    
    // After animation, trigger native share
    setTimeout(async () => {
      setIsSaving(false);
      
      try {
        const urlToShare = capturedUrl || imageUrl;
        
        // Convert data URL to blob for native share
        const response = await fetch(urlToShare);
        const blob = await response.blob();
        const file = new File([blob], isVideo ? 'cult-ninja.mp4' : 'cult-ninja.png', { 
          type: isVideo ? 'video/mp4' : 'image/png' 
        });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Cult Ninja',
            text: `My ${activity} moment 💪`,
          });
          // After successful share, save and go back
          handleSaveWithTemplate();
        } else {
          // Fallback: download the file
          const link = document.createElement('a');
          link.href = urlToShare;
          link.download = isVideo ? 'cult-ninja.mp4' : 'cult-ninja.png';
          link.click();
          handleSaveWithTemplate();
        }
      } catch (error) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed:', error);
        setElementsHidden(false);
      }
    }, 500);
  };

  // Save with template (from share sheet or directly)
  const handleSaveWithTemplate = async () => {
    if (!imageUrl || !activity) return;

    triggerHaptic('success');
    setIsExiting(true);
    setShowShareSheet(false);

    const finalUrl = framedImageUrl || (await captureFramedImage());

    setTimeout(() => {
      navigate('/', {
        state: {
          savePhoto: true,
          imageUrl: finalUrl || imageUrl, // framed/template image
          originalUrl: imageUrl, // original media for filmstrip + edits
          isVideo,
          activity,
          frame: currentFrame,
          duration,
          pr,
          isReview,
          photoId,
        },
      });
    }, 400);
  };

  // Save without template (cross button)
  const handleSaveWithoutTemplate = () => {
    if (!imageUrl || !activity) return;

    triggerHaptic('light');
    handleTap('close-btn');
    setIsExiting(true);

    setTimeout(() => {
      navigate('/', {
        state: {
          savePhoto: true,
          imageUrl, // original image without template
          originalUrl: imageUrl,
          isVideo,
          activity,
          frame: undefined, // no frame
          duration,
          pr,
          isReview,
          photoId,
        },
      });
    }, 400);
  };

  // Retake - go back to camera with same activity and capture mode
  const handleRetake = () => {
    triggerHaptic('light');
    handleTap('retake-btn');
    // Navigate back to home which will trigger camera with the activity
    setTimeout(() => {
      navigate('/', {
        state: {
          openCameraWithActivity: activity,
          captureMode: isVideo ? 'video' : 'photo',
          instantCamera: true,
        },
      });
    }, 200);
  };

  // Handle scroll to update current frame and calculate scale
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    if (scrollRaf.current) {
      cancelAnimationFrame(scrollRaf.current);
    }

    scrollRaf.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      const centerX = container.scrollLeft + container.clientWidth / 2;
      let closestFrame: FrameType = currentFrame;
      let closestDistance = Number.POSITIVE_INFINITY;

      FRAMES.forEach((frame, index) => {
        const el = frameItemRefs.current[index];
        if (!el) return;
        const itemCenter = el.offsetLeft + el.offsetWidth / 2;
        const distance = Math.abs(itemCenter - centerX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestFrame = frame;
        }
      });

      if (closestFrame !== currentFrame) {
        setCurrentFrame(closestFrame);
      }

      setScrollProgress(container.scrollLeft);
    });
  }, [currentFrame]);

  // Scroll to the initially-selected frame on mount
  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    // Wait a tick so refs/measurements are available
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const index = FRAMES.indexOf(currentFrame);
        const el = frameItemRefs.current[index];
        if (!el) return;

        const targetScroll = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2;
        container.scrollLeft = Math.max(0, targetScroll);
      });
    });
  }, [isLoaded]);

  // Calculate scale for each frame based on distance from center
  const getFrameScale = (index: number): { scale: number; opacity: number } => {
    if (!containerRef.current) {
      return { scale: index === 0 ? 1 : 0.85, opacity: index === 0 ? 1 : 0.6 };
    }

    const container = containerRef.current;
    const el = frameItemRefs.current[index];
    if (!el) {
      return { scale: 0.85, opacity: 0.6 };
    }

    const centerX = container.scrollLeft + container.clientWidth / 2;
    const itemCenter = el.offsetLeft + el.offsetWidth / 2;
    const distance = Math.abs(itemCenter - centerX);

    const maxDistance = el.offsetWidth;
    const t = Math.min(distance / maxDistance, 1);

    const scale = Math.max(0.85, 1 - t * 0.15);
    const opacity = Math.max(0.6, 1 - t * 0.4);

    return { scale, opacity };
  };

  const openEditSheet = (field: EditingField) => {
    if (field === 'duration') {
      // Extract just the number from duration (remove 'hrs')
      const numValue = parseInt(duration.replace(/[^0-9]/g, '')) || 0;
      setTempValue(String(numValue));
    } else if (field === 'pr') {
      setTempValue(pr);
    }
    setEditingField(field);
  };

  const handleWheelChange = (value: string | number) => {
    const numValue = Number(value);
    setTempValue(String(numValue));
    setDuration(numValue > 0 ? `${numValue}hrs` : '');
  };

  const handleInputChange = (value: string) => {
    setTempValue(value);
    setPr(value);
  };

  const confirmEdit = () => {
    setEditingField(null);
  };

  const closeSheet = () => {
    setEditingField(null);
  };

  if (!imageUrl) {
    return null;
  }

  // Calculate week from dayNumber (1-3 = week 1, 4-6 = week 2, etc.)
  const calculatedWeek = Math.ceil(dayNumber / 3);

  const frameProps = {
    imageUrl,
    isVideo,
    activity: activity || '',
    week: calculatedWeek,
    day: dayNumber,
    duration,
    pr,
    imagePosition,
    imageScale,
    label1,
    label2,
  };

  const renderFrame = () => {
    switch (currentFrame) {
      case 'shaky':
        return <ShakyFrame {...frameProps} />;
      case 'journal':
        return <JournalFrame {...frameProps} />;
      case 'vogue':
        return <VogueFrame {...frameProps} />;
      case 'fitness':
        return <FitnessFrame {...frameProps} />;
      case 'ticket':
        return <TicketFrame {...frameProps} />;
    }
  };

  const currentIndex = FRAMES.indexOf(currentFrame);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Blurred background image with dynamic color overlay */}
      <div 
        className="absolute inset-0 scale-150 transition-all duration-500 animate-bg-drift"
        style={{
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) brightness(0.7)',
        }}
      />
      
      {/* Subtle particle/dust animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating dust particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20 animate-particle-float"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
        {/* Floating orbs for depth */}
        <div 
          className="absolute w-64 h-64 rounded-full animate-orb-float-1"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            top: '10%',
            left: '-10%',
          }}
        />
        <div 
          className="absolute w-48 h-48 rounded-full animate-orb-float-2"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
            top: '60%',
            right: '-5%',
          }}
        />
        <div 
          className="absolute w-32 h-32 rounded-full animate-orb-float-3"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            bottom: '20%',
            left: '20%',
          }}
        />
      </div>
      
      {/* Dynamic gradient overlay based on current frame */}
      <div 
        className="absolute inset-0 transition-all duration-500 animate-color-pulse"
        style={{ 
          backgroundColor: FRAME_COLORS[currentFrame].bg,
          backgroundImage: FRAME_COLORS[currentFrame].gradient 
        }}
      />
      <div className="absolute inset-0 bg-black/20 animate-subtle-pulse" />
      
      {/* Activity-specific background effect */}
      {activity && <ActivityBackgroundEffect activity={activity} />}

      {/* Content - with extra bottom padding for floating buttons */}
      <div className="relative z-10 flex flex-col min-h-screen pb-32">
        {/* Offscreen capture target (unscaled) for image saves */}
        <div
          ref={captureRef}
          aria-hidden
          className="fixed left-[-10000px] top-0 w-[360px] pointer-events-none"
        >
          {renderFrame()}
        </div>

        {/* Header - minimal, hide when elements are hidden */}
        <div className={`flex items-center justify-between py-4 px-5 transition-all duration-500 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'} ${elementsHidden ? 'opacity-0 -translate-y-8 pointer-events-none' : ''}`}>
          <button 
            onClick={handleSaveWithoutTemplate}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm tap-bounce ${tappedElement === 'close-btn' ? 'animate-liquid-tap' : ''}`}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-white/80 text-lg font-semibold">Select your frame</h2>
          <button 
            onClick={handleRetake}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm tap-bounce ${tappedElement === 'retake-btn' ? 'animate-liquid-tap' : ''}`}
          >
            <Pencil className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Frame carousel - horizontal scroll with smooth liquid transitions */}
        <div className={`flex-1 flex items-center overflow-hidden transition-all duration-700 ease-out ${isLoaded ? 'animate-frame-entrance' : 'opacity-0'} ${isExiting ? 'animate-template-transition' : ''}`}>
          {elementsHidden ? (
            /* When elements are hidden, show only the current frame centered */
            <div className="flex items-center justify-center w-full px-6 animate-scale-in">
              <div className="w-[70vw] max-w-[320px]">
                {currentFrame === 'shaky' && <ShakyFrame {...frameProps} />}
                {currentFrame === 'journal' && <JournalFrame {...frameProps} />}
                {currentFrame === 'vogue' && <VogueFrame {...frameProps} />}
                {currentFrame === 'fitness' && <FitnessFrame {...frameProps} />}
                {currentFrame === 'ticket' && <TicketFrame {...frameProps} />}
              </div>
            </div>
          ) : (
            /* Normal carousel view with smooth transitions */
            <div 
              ref={containerRef}
              onScroll={handleScroll}
              className="flex gap-0 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full items-center px-[12.5vw]"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {FRAMES.map((frame, index) => {
                const { scale, opacity } = getFrameScale(index);
                const isActiveFrame = frame === currentFrame;
                const activeIndex = FRAMES.indexOf(currentFrame);
                const isLeftOfCurrent = index < activeIndex;
                const isRightOfCurrent = index > activeIndex;
                
                return (
                  <div 
                    key={frame}
                    ref={(el) => {
                      frameItemRefs.current[index] = el;
                    }}
                    data-frame={frame}
                    className={`flex-shrink-0 snap-center h-fit flex items-center justify-center ${
                      elementsHidden && isLeftOfCurrent ? 'opacity-0 -translate-x-full' : ''
                    } ${
                      elementsHidden && isRightOfCurrent ? 'opacity-0 translate-x-full' : ''
                    }`}
                    style={{ 
                      width: 'calc(75vw)',
                      transform: `scale(${scale})`,
                      opacity: elementsHidden && !isActiveFrame ? 0 : opacity,
                      transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
                    }}
                  >
                    <div className="w-full">
                      {frame === 'shaky' && <ShakyFrame {...frameProps} />}
                      {frame === 'journal' && <JournalFrame {...frameProps} />}
                      {frame === 'vogue' && <VogueFrame {...frameProps} />}
                      {frame === 'fitness' && <FitnessFrame {...frameProps} />}
                      {frame === 'ticket' && <TicketFrame {...frameProps} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content section - hide when elements are hidden */}
        <div 
          className={`space-y-4 px-5 mt-4 transition-all duration-500 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'} ${elementsHidden ? 'opacity-0 translate-y-full pointer-events-none' : ''}`} 
          style={{ animationDelay: '0.3s' }}
        >
          {/* Editable data points - now tappable */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 relative overflow-hidden animate-input-focus-pulse">
            {/* Subtle animated border glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none animate-border-glow" />
            
            <button 
              onClick={() => { handleTap('duration'); openEditSheet('duration'); }}
              className={`w-full flex justify-between items-center py-2 border-b border-white/10 tap-bounce ${tappedElement === 'duration' ? 'animate-liquid-tap' : ''}`}
            >
              <span className="text-white/80 flex items-center gap-2">
                {label2}
                <span className="text-xs text-white/40 animate-pulse">tap to edit</span>
              </span>
              <span className={`font-semibold text-lg ${duration ? 'text-white' : 'text-white/50 italic'}`}>
                {duration || `e.g. ${label2.toLowerCase()}`}
              </span>
            </button>
            <button 
              onClick={() => { handleTap('pr'); openEditSheet('pr'); }}
              className={`w-full flex justify-between items-center py-2 tap-bounce ${tappedElement === 'pr' ? 'animate-liquid-tap' : ''}`}
            >
              <span className="text-white/80 flex items-center gap-2">
                {label1} <span className="text-white/40">(Optional)</span>
                <span className="text-xs text-white/40 animate-pulse">tap to edit</span>
              </span>
              <span className={`font-semibold text-lg ${pr ? 'text-white' : 'text-white/50'}`}>
                {pr || '-'}
              </span>
            </button>
          </div>

          {/* Health sync widget */}
          <div 
            className={`bg-white/10 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 tap-bounce ${tappedElement === 'connect' ? 'animate-liquid-tap' : ''}`}
            onClick={() => { handleTap('connect'); setShowSyncPopup(true); }}
          >
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">Auto sync with a device</h3>
              <p className="text-white/60 text-sm">Sync your health & fitness data</p>
            </div>
            <button className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white font-semibold text-sm">CONNECT</span>
            </button>
          </div>

          {/* Bottom spacer for floating buttons */}
          <div className="h-24" />
        </div>
      </div>

      {/* Floating CTA - Always visible with DONE and Share */}
      <div 
        className="fixed left-0 right-0 z-[100] px-5 pt-4"
        style={{ 
          bottom: 0,
          paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 24px)',
          background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.6) 80%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* DONE Button */}
          <button 
            onClick={handleSaveWithTemplate}
            disabled={isSaving}
            className={`flex-1 bg-white py-4 rounded-2xl disabled:opacity-50 tap-bounce ${tappedElement === 'done-btn' ? 'animate-liquid-tap' : ''}`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          >
            <span className="text-black font-bold text-lg">
              {isSaving ? 'Saving...' : 'DONE'}
            </span>
          </button>
          
          {/* Share Icon Button */}
          <button 
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-white/25 backdrop-blur-md border border-white/30 tap-bounce ${tappedElement === 'share-btn' ? 'animate-liquid-tap' : ''}`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
          >
            <Share2 className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>


      {/* Bottom Sheet Keyboard Overlay */}
      {editingField && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 z-40 backdrop-blur-md bg-black/70"
            onClick={closeSheet}
          />
          
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 focus:outline-none focus-visible:outline-none" tabIndex={-1}>
            <div className="bg-white/10 backdrop-blur-2xl border-t border-white/20 rounded-t-3xl p-6 pb-10 focus:outline-none focus-visible:outline-none" tabIndex={-1}>
              {/* Handle bar */}
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-6" />
              
              {/* Label */}
              <p className="text-white text-lg font-semibold text-center mb-4">
                {editingField === 'duration' ? `Select ${label2}` : `Enter ${label1}`}
              </p>
              
              {editingField === 'duration' ? (
                /* Wheel Picker for Duration */
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex-1 max-w-[200px]">
                    <WheelPicker
                      items={HOUR_OPTIONS}
                      value={parseInt(tempValue) || 0}
                      onChange={handleWheelChange}
                      itemHeight={50}
                      visibleItems={5}
                    />
                  </div>
                  <span className="text-white text-2xl font-semibold">hrs</span>
                </div>
              ) : (
                /* Text Input for PR */
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 flex items-center bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 focus-within:border-white/40">
                    <input
                      ref={inputRef}
                      type="text"
                      value={tempValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={`e.g. ${label1}`}
                      className="flex-1 bg-transparent text-white text-xl font-semibold px-4 py-4 outline-none placeholder:text-white/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          confirmEdit();
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Confirm button - small white pill */}
              <button
                onClick={confirmEdit}
                className="mx-auto px-8 py-2 flex items-center justify-center rounded-full bg-white"
              >
                <span className="text-black font-semibold text-sm">Confirm</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sync Popup */}
      {showSyncPopup && (
        <SyncHealthPopup
          onClose={() => setShowSyncPopup(false)}
          isConnecting={isConnectingHealth}
          setIsConnecting={setIsConnectingHealth}
          healthConnected={healthConnected}
          setHealthConnected={setHealthConnected}
        />
      )}
    </div>
  );
};

export default Preview;