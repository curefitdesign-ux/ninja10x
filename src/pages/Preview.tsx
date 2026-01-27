import { useLocation, useNavigate } from 'react-router-dom';
import { X, Check, Pencil, Trash2 } from 'lucide-react';
import ShareSheet from '@/components/ShareSheet';
import { useEffect, useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';
import WheelPicker from '@/components/WheelPicker';
// CameraUI is now in a separate page
import { useActivityDataPoints } from '@/hooks/use-activity-data-points';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ActivityBackgroundEffect from '@/components/ActivityBackgroundEffect';
import SyncHealthPopup from '@/components/SyncHealthPopup';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import { toast } from 'sonner';

// Activity icons for selection
import footballIcon from '@/assets/activities/football.png';
import cricketIcon from '@/assets/activities/cricket.png';
import racquetIcon from '@/assets/activities/racquet.png';
import basketballIcon from '@/assets/activities/basketball.png';
import cyclingIcon from '@/assets/activities/cycling.png';
import runningIcon from '@/assets/activities/running.png';
import trekkingIcon from '@/assets/activities/trekking.png';
import boxingIcon from '@/assets/activities/boxing.png';
import yogaIcon from '@/assets/activities/yoga.png';

const FRAMES = ['shaky', 'journal', 'vogue', 'fitness', 'ticket'] as const;
type FrameType = typeof FRAMES[number];

const activityOptions = [
  { name: 'Running', icon: runningIcon },
  { name: 'Cycling', icon: cyclingIcon },
  { name: 'Trekking', icon: trekkingIcon },
  { name: 'Basketball', icon: basketballIcon },
  { name: 'Yoga', icon: yogaIcon },
  { name: 'Football', icon: footballIcon },
  { name: 'Cricket', icon: cricketIcon },
  { name: 'Badminton', icon: racquetIcon },
  { name: 'Boxing', icon: boxingIcon },
];

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
type FlowStep = 'camera' | 'activity' | 'template';

// Generate hour options from 0 to 24
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Flow control (camera step moved to separate page)
  const [flowStep, setFlowStep] = useState<FlowStep>('template');
  
  // Template state
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
  
  // Micro celebration after save
  const [showMicroCelebration, setShowMicroCelebration] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [elementsHidden, setElementsHidden] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  // Get delete and upsert functions from hook
  const { deleteActivity, upsertActivity, refresh } = useJourneyActivities();

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

  // Check if we're coming with existing data (review mode or from camera/gallery pages)
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
      dayNumber?: number | string;
      startWithCamera?: boolean;
      fromCamera?: boolean;
      fromGallery?: boolean;
    } | null;

    const mediaUrl = state?.originalUrl || state?.imageUrl;

    console.info('[journey-debug] Preview: init', {
      hasState: !!state,
      dayNumber: state?.dayNumber,
      hasMediaUrl: !!mediaUrl,
      hasActivity: !!state?.activity,
      startWithCamera: state?.startWithCamera,
      fromCamera: state?.fromCamera,
      fromGallery: state?.fromGallery,
    });

    // Coming from camera or gallery with media - go directly to template
    if (mediaUrl && (state?.fromCamera || state?.fromGallery)) {
      setImageUrl(mediaUrl);
      setIsVideo(state.isVideo ?? isVideoUrl(mediaUrl));
      setActivity(state.activity || 'Running');
      setDuration(state.duration || '2hrs');
      setPr(state.pr || '');
      setIsReview(false);
      setPhotoId(null);
      setDayNumber(Number((state.dayNumber ?? 1) as number | string));
      setFlowStep('template');
      setTimeout(() => setIsLoaded(true), 100);
      return;
    }

    if (mediaUrl && state?.activity) {
      // Existing photo/video - go directly to template selection (review mode)
      setImageUrl(mediaUrl);
      setIsVideo(state.isVideo ?? isVideoUrl(mediaUrl));
      setActivity(state.activity);
      setDuration(state.duration || '2hrs');
      setPr(state.pr || '');
      setIsReview(state.isReview || false);
      setPhotoId(state.photoId || null);
      setDayNumber(Number((state.dayNumber ?? 1) as number | string));
      if (state.frame && FRAMES.includes(state.frame)) {
        setCurrentFrame(state.frame);
        setOriginalFrame(state.frame);
      }
      setFlowStep('template');
      setTimeout(() => setIsLoaded(true), 100);
    } else {
      // No existing data - redirect to gallery page (camera is now separate)
      const dayNum = state?.dayNumber != null ? Number(state.dayNumber as number | string) : 1;
      setDayNumber(dayNum);
      navigate('/gallery', { state: { dayNumber: dayNum }, replace: true });
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
    if (isVideo) return imageUrl;

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

  // Handle removing the current image - redirect to gallery
  const handleRemoveImage = () => {
    triggerHaptic('medium');
    navigate('/gallery', { state: { dayNumber }, replace: true });
  };

  // Handle deleting the activity from DB (only for review mode)
  const handleDeleteActivity = async () => {
    if (!isReview || !dayNumber) return;
    
    triggerHaptic('medium');
    setIsDeleting(true);
    
    const success = await deleteActivity(dayNumber);
    
    if (success) {
      toast.success(`Day ${dayNumber} removed`);
      navigate('/', { replace: true, state: null });
    } else {
      toast.error('Failed to delete. Please try again.');
    }
    
    setIsDeleting(false);
  };

  // Save with template - save to backend then show share screen
  const handleSaveWithTemplate = async () => {
    if (!imageUrl || !activity) return;

    triggerHaptic('light');
    handleTap('done-btn');
    setIsSaving(true);

    // Capture the framed image
    const finalUrl = await captureFramedImage();
    const shareAssetUrl = finalUrl || imageUrl;
    
    // Save to backend FIRST
    console.info('[journey-debug] Preview: saving with template to backend', {
      dayNumber,
      isVideo,
      activity,
      frame: currentFrame,
    });
    
    const saved = await upsertActivity({
      displayUrl: shareAssetUrl,
      originalUrl: imageUrl,
      isVideo,
      activity,
      frame: currentFrame,
      duration,
      pr,
      dayNumber,
    });
    
    setIsSaving(false);
    
    if (!saved) {
      toast.error('Failed to save. Please try again.');
      return;
    }
    
    console.info('[journey-debug] Preview: saved successfully', { 
      storageUrl: saved.storageUrl,
      dayNumber: saved.dayNumber,
    });
    
    // Update local state with the saved URL from storage
    setFramedImageUrl(saved.storageUrl);
    
    toast.success(`Day ${dayNumber} saved!`);
    
    // Open share sheet
    setShowShareSheet(true);
  };

  // Navigate back after share sheet (no need to save again, already saved)
  const handleFinalSave = () => {
    triggerHaptic('success');
    setIsExiting(true);
    setShowShareSheet(false);

    console.info('[journey-debug] Preview: navigating home after share');

    setTimeout(() => {
      navigate('/', { replace: true, state: null });
    }, 400);
  };

  // Save without template (cross button) - save to backend first
  const handleSaveWithoutTemplate = async () => {
    if (!imageUrl || !activity) return;

    triggerHaptic('light');
    handleTap('close-btn');
    setIsSaving(true);

    // Save to backend
    console.info('[journey-debug] Preview: saving without template to backend', {
      dayNumber,
      isVideo,
      activity,
    });
    
    const saved = await upsertActivity({
      displayUrl: imageUrl,
      originalUrl: imageUrl,
      isVideo,
      activity,
      frame: undefined,
      duration,
      pr,
      dayNumber,
    });
    
    setIsSaving(false);
    
    if (!saved) {
      toast.error('Failed to save. Please try again.');
      return;
    }
    
    toast.success(`Day ${dayNumber} saved!`);
    setIsExiting(true);

    setTimeout(() => {
      navigate('/', { replace: true, state: null });
    }, 400);
  };

  // Retake - navigate to gallery page
  const handleRetake = () => {
    triggerHaptic('light');
    handleTap('retake-btn');
    navigate('/gallery', { state: { dayNumber }, replace: true });
  };

  // Handle scroll to update current frame
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

  // Calculate week from dayNumber
  const calculatedWeek = Math.ceil(dayNumber / 3);

  const frameProps = {
    imageUrl: imageUrl || '',
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

  // Camera step is now a separate page - redirect if somehow reached
  if (flowStep === 'camera') {
    navigate('/gallery', { state: { dayNumber }, replace: true });
    return null;
  }

  // Template Selection Step
  return (
    <div 
      className="fixed inset-0 w-full bg-black touch-manipulation overflow-y-auto" 
      style={{ 
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Blurred background image with dynamic color overlay */}
      <div 
        className="fixed inset-0 scale-150 transition-all duration-500 animate-bg-drift pointer-events-none"
        style={{
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) brightness(0.7)',
        }}
      />
      
      {/* Subtle particle/dust animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
        className="fixed inset-0 transition-all duration-500 animate-color-pulse pointer-events-none"
        style={{ 
          backgroundColor: FRAME_COLORS[currentFrame].bg,
          backgroundImage: FRAME_COLORS[currentFrame].gradient 
        }}
      />
      <div className="fixed inset-0 bg-black/20 animate-subtle-pulse pointer-events-none" />
      
      {/* Activity-specific background effect */}
      {activity && <ActivityBackgroundEffect activity={activity} />}

      {/* Content - scrollable layout */}
      <div className="relative z-10 flex flex-col min-h-full">
        {/* Offscreen capture target (unscaled) for image saves */}
        <div
          ref={captureRef}
          aria-hidden
          className="fixed left-[-10000px] top-0 w-[360px] pointer-events-none"
        >
          {renderFrame()}
        </div>

        {/* Header - sticky */}
        <div 
          className={`sticky top-0 z-20 flex items-center justify-between py-4 px-5 transition-all duration-500 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'} ${elementsHidden ? 'opacity-0 -translate-y-8 pointer-events-none' : ''}`}
          style={{ paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)' }}
        >
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
        
        {/* Frame carousel - responsive height */}
        <div 
          className={`flex-shrink-0 flex items-center justify-center transition-all duration-700 ease-out ${isLoaded ? 'animate-frame-entrance' : 'opacity-0'} ${isExiting ? 'animate-template-transition' : ''}`}
          style={{ 
            minHeight: 'min(55vh, 420px)',
            maxHeight: '55vh',
          }}
        >
          {elementsHidden ? (
            <div className="flex items-center justify-center w-full h-full px-6 animate-scale-in">
              <div 
                className="w-full max-w-[280px]"
                style={{ maxHeight: '100%', aspectRatio: '9/16' }}
              >
                {currentFrame === 'shaky' && <ShakyFrame {...frameProps} />}
                {currentFrame === 'journal' && <JournalFrame {...frameProps} />}
                {currentFrame === 'vogue' && <VogueFrame {...frameProps} />}
                {currentFrame === 'fitness' && <FitnessFrame {...frameProps} />}
                {currentFrame === 'ticket' && <TicketFrame {...frameProps} />}
              </div>
            </div>
          ) : (
            <div 
              ref={containerRef}
              onScroll={handleScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full items-center py-2"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingLeft: 'calc((100vw - min(55vw, 220px)) / 2)',
                paddingRight: 'calc((100vw - min(55vw, 220px)) / 2)',
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
                    className={`flex-shrink-0 snap-center flex items-center justify-center ${
                      elementsHidden && isLeftOfCurrent ? 'opacity-0 -translate-x-full' : ''
                    } ${
                      elementsHidden && isRightOfCurrent ? 'opacity-0 translate-x-full' : ''
                    }`}
                    style={{ 
                      width: 'min(55vw, 220px)',
                      height: 'calc(min(55vw, 220px) * 16 / 9)',
                      maxHeight: 'calc(55vh - 16px)',
                      transform: `scale(${scale})`,
                      opacity: elementsHidden && !isActiveFrame ? 0 : opacity,
                      transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
                    }}
                  >
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ aspectRatio: '9/16', maxHeight: '100%' }}
                    >
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

        {/* Content section - scrollable */}
        <div 
          className={`flex-1 space-y-3 px-5 py-4 transition-all duration-500 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'} ${elementsHidden ? 'opacity-0 translate-y-full pointer-events-none' : ''}`} 
          style={{ 
            animationDelay: '0.3s',
            paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 16px))',
          }}
        >
          {/* Editable data points */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 relative overflow-hidden">
            <button 
              onClick={() => { handleTap('duration'); openEditSheet('duration'); }}
              className={`w-full flex justify-between items-center py-2 border-b border-white/10 tap-bounce min-h-[44px] ${tappedElement === 'duration' ? 'animate-liquid-tap' : ''}`}
            >
              <span className="text-white/80 text-sm flex items-center gap-2">
                {label2}
                <span className="text-[10px] text-white/40">tap to edit</span>
              </span>
              <span className={`font-semibold text-sm ${duration ? 'text-white' : 'text-white/50 italic'}`}>
                {duration || `e.g. ${label2.toLowerCase()}`}
              </span>
            </button>
            <button 
              onClick={() => { handleTap('pr'); openEditSheet('pr'); }}
              className={`w-full flex justify-between items-center py-2 tap-bounce min-h-[44px] ${tappedElement === 'pr' ? 'animate-liquid-tap' : ''}`}
            >
              <span className="text-white/80 text-sm flex items-center gap-2">
                {label1} <span className="text-white/40">(Optional)</span>
              </span>
              <span className={`font-semibold text-sm ${pr ? 'text-white' : 'text-white/50'}`}>
                {pr || '-'}
              </span>
            </button>
          </div>

          {/* Health sync widget */}
          <div 
            className={`bg-white/10 backdrop-blur-xl rounded-xl p-3 flex items-center gap-3 tap-bounce min-h-[60px] ${tappedElement === 'connect' ? 'animate-liquid-tap' : ''}`}
            onClick={() => { handleTap('connect'); setShowSyncPopup(true); }}
          >
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm">Auto sync with a device</h3>
              <p className="text-white/60 text-xs">Sync your health & fitness data</p>
            </div>
            <button className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-white font-semibold text-xs">CONNECT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      {!showShareSheet && (
        <div 
          className={`fixed bottom-0 left-0 right-0 z-[100] px-5 pt-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-500 ${elementsHidden ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}
          style={{ 
            paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 20px)',
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={handleSaveWithTemplate}
              disabled={isSaving || isDeleting}
              className={`w-full bg-white py-4 rounded-2xl disabled:opacity-50 tap-bounce ${tappedElement === 'done-btn' ? 'animate-liquid-tap' : ''}`}
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
            >
              <span className="text-black font-bold text-lg">
                {isSaving ? 'Saving...' : 'DONE'}
              </span>
            </button>
            
            {/* Delete button - only show in review mode (existing activity) */}
            {isReview && (
              <button
                onClick={handleDeleteActivity}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isDeleting ? 'Deleting...' : 'Remove Photo'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Sheet Keyboard Overlay */}
      {editingField && (
        <>
          <div 
            className="fixed inset-0 z-40 backdrop-blur-md bg-black/70"
            onClick={closeSheet}
          />
          
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 focus:outline-none focus-visible:outline-none" tabIndex={-1}>
            <div className="bg-white/10 backdrop-blur-2xl border-t border-white/20 rounded-t-3xl p-6 pb-10 focus:outline-none focus-visible:outline-none" tabIndex={-1}>
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-6" />
              
              <p className="text-white text-lg font-semibold text-center mb-4">
                {editingField === 'duration' ? `Select ${label2}` : `Enter ${label1}`}
              </p>
              
              {editingField === 'duration' ? (
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

      {/* Micro Celebration Overlay */}
      <AnimatePresence>
        {showMicroCelebration && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            {/* Celebration card */}
            <motion.div
              className="relative z-10 flex flex-col items-center gap-4"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <motion.p
                className="text-white text-xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Activity Logged!
              </motion.p>
              <motion.p
                className="text-white/60 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Day {dayNumber} complete
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Sheet */}
      {showShareSheet && framedImageUrl && (
        <ShareSheet
          imageUrl={framedImageUrl}
          isVideo={isVideo}
          onClose={() => setShowShareSheet(false)}
          onSaveWithTemplate={handleFinalSave}
          dayNumber={dayNumber}
          frameType={currentFrame}
          frameProps={frameProps}
        />
      )}
    </div>
  );
};

export default Preview;
