import { useLocation, useNavigate } from 'react-router-dom';
import { X, Check, Pencil, Trash2, Bike, Footprints, Mountain, Waves, Dumbbell, Dribbble, Trophy, Swords, Music, Brain, CircleDot } from 'lucide-react';
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
import { getActivityConfig } from '@/lib/activity-context';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ActivityBackgroundEffect from '@/components/ActivityBackgroundEffect';
import SyncHealthPopup from '@/components/SyncHealthPopup';
import ActivityLoggedCelebration from '@/components/ActivityLoggedCelebration';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import { useFitnessReel } from '@/hooks/use-fitness-reel';
import { toast } from 'sonner';

const FRAMES = ['shaky', 'journal', 'vogue', 'fitness', 'ticket'] as const;
type FrameType = typeof FRAMES[number];

// Activity options with Lucide icons and contextual data inputs
const activityOptions = [
  { name: 'Running', icon: Footprints, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Distance', secondaryUnit: 'km', secondaryInputType: 'decimal' as const },
  { name: 'Cycling', icon: Bike, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Distance', secondaryUnit: 'km', secondaryInputType: 'decimal' as const },
  { name: 'Trekking', icon: Mountain, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Elevation', secondaryUnit: 'm', secondaryInputType: 'number' as const },
  { name: 'Swimming', icon: Waves, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Laps', secondaryUnit: 'laps', secondaryInputType: 'number' as const },
  { name: 'Yoga', icon: Brain, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' as const },
  { name: 'GYM', icon: Dumbbell, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Sets', secondaryUnit: 'sets', secondaryInputType: 'number' as const },
  { name: 'Cricket', icon: Trophy, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Runs', secondaryUnit: 'runs', secondaryInputType: 'number' as const },
  { name: 'Badminton', icon: CircleDot, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Games', secondaryUnit: 'games', secondaryInputType: 'number' as const },
  { name: 'Tennis', icon: CircleDot, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Sets', secondaryUnit: 'sets', secondaryInputType: 'number' as const },
  { name: 'Meditation', icon: Brain, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' as const },
  { name: 'Boxing', icon: Swords, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Rounds', secondaryUnit: 'rounds', secondaryInputType: 'number' as const },
  { name: 'Dance', icon: Music, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' as const },
];

// Get activity-specific input config from centralized utility
const getActivityInputConfig = (activityName: string) => {
  const config = getActivityConfig(activityName);
  return {
    primaryMetric: config.primaryMetric,
    primaryUnit: config.primaryUnit,
    primaryInputType: config.primaryInputType,
    secondaryMetric: config.secondaryMetric,
    secondaryUnit: config.secondaryUnit,
    secondaryInputType: config.secondaryInputType,
  };
};

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
  const [flowStep, setFlowStep] = useState<FlowStep>('activity');
  
  // Template state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  // Start with empty values - only show on card if user enters data
  const [duration, setDuration] = useState('');
  const [pr, setPr] = useState('');
  const [currentFrame, setCurrentFrame] = useState<FrameType>('shaky');
  const [originalFrame, setOriginalFrame] = useState<FrameType | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1.0);

  
  
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
  const { deleteActivity, upsertActivity, refresh, activities } = useJourneyActivities();

  // Reel generation hook
  const { 
    generateReel, 
    isGenerating: isGeneratingReel, 
    currentStep: reelStep,
    currentReel,
    reelHistory,
  } = useFitnessReel();

  // Track reel generation progress
  const [reelProgress, setReelProgress] = useState(0);

  // Calculate progress based on reel step
  useEffect(() => {
    if (!isGeneratingReel) {
      if (currentReel?.videoUrl) {
        setReelProgress(100);
      }
      return;
    }
    
    switch (reelStep) {
      case 'narration':
        setReelProgress(25);
        break;
      case 'voiceover':
        setReelProgress(50);
        break;
      case 'video':
        setReelProgress(75);
        break;
      case 'complete':
        setReelProgress(100);
        break;
      default:
        setReelProgress(0);
    }
  }, [reelStep, isGeneratingReel, currentReel]);

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

    // Coming from camera or gallery with media - go to activity selection first
    if (mediaUrl && (state?.fromCamera || state?.fromGallery)) {
      setImageUrl(mediaUrl);
      setIsVideo(state.isVideo ?? isVideoUrl(mediaUrl));
      setActivity(null); // Don't set default - let user select
      // Start with empty values - only show on card if user enters data
      setDuration(state.duration || '');
      setPr(state.pr || '');
      setIsReview(false);
      setPhotoId(null);
      setDayNumber(Number((state.dayNumber ?? 1) as number | string));
      setFlowStep('activity'); // Start with activity selection
      setTimeout(() => setIsLoaded(true), 100);
      return;
    }

    if (mediaUrl && state?.activity) {
      // Existing photo/video - go directly to template selection (review mode)
      // Preserve existing values from DB
      setImageUrl(mediaUrl);
      setIsVideo(state.isVideo ?? isVideoUrl(mediaUrl));
      setActivity(state.activity);
      setDuration(state.duration || ''); // Preserve existing or empty
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
      // No existing data - redirect to home
      navigate('/', { replace: true });
    }
  }, []);

  // Focus input when bottom sheet opens
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);


  // Capture framed image for sharing (works for both images and videos)
  const captureFramedImage = async (): Promise<string | null> => {
    if (!captureRef.current) return null;

    try {
      // For videos, we still capture the template frame (showing the video's first frame)
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

  // Handle removing the current image - redirect to home
  const handleRemoveImage = () => {
    triggerHaptic('medium');
    navigate('/', { replace: true });
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

  // Save with template - save to backend then show confirmation screen
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
    
    // Toast removed - celebration overlay handles success feedback
    
    // Show the celebration overlay first, then share sheet
    setShowMicroCelebration(true);
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
    
    // Toast removed - exit animation handles success feedback
    setIsExiting(true);

    setTimeout(() => {
      navigate('/', { replace: true, state: null });
    }, 400);
  };

  // Retake - navigate to home to select new media
  const handleRetake = () => {
    triggerHaptic('light');
    handleTap('retake-btn');
    navigate('/', { replace: true });
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

  // Get activity-specific labels for the frame
  const activityLabels = getActivityInputConfig(activity || '');

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
    label1: activityLabels.secondaryMetric, // The secondary metric (e.g., Distance, Laps)
    label2: activityLabels.primaryMetric, // The primary metric (Duration)
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

  // Handle activity selection
  const handleActivitySelection = (selectedActivity: string) => {
    triggerHaptic('medium');
    setActivity(selectedActivity);
    setFlowStep('template');
  };

  // Activity Selection Step - Show as bottom sheet over media preview
  if (flowStep === 'activity') {
    return (
      <div 
        className="fixed inset-0 w-full bg-black touch-manipulation overflow-hidden" 
        style={{ 
          height: '100dvh',
          minHeight: '-webkit-fill-available',
        }}
      >
        {/* Blurred background image */}
        <div 
          className="fixed inset-0 scale-150 transition-all duration-500 pointer-events-none"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) brightness(0.5)',
          }}
        />
        
        {/* Dark gradient overlay */}
        <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 pointer-events-none" />
        
        {/* Header */}
        <div 
          className="relative z-20 flex items-center justify-between px-5 py-4"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)' }}
        >
          <button 
            onClick={() => navigate('/gallery', { state: { dayNumber }, replace: true })}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>

        {/* Media Preview - Centered, larger */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6" style={{ height: 'calc(100dvh - 400px)' }}>
          <motion.div 
            className="relative overflow-hidden rounded-2xl"
            style={{ 
              width: 'min(70vw, 260px)',
              aspectRatio: '9/16',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {isVideo ? (
              <video
                src={imageUrl || ''}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={imageUrl || ''}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
          </motion.div>
        </div>
        
        {/* Bottom Sheet for Activity Selection - Liquid Glass */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-30"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div 
            className="rounded-t-3xl px-5 pt-4"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 -10px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
            }}
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-4" />
            
            {/* Title */}
            <h2 className="text-white text-xl font-bold text-center mb-5">Choose your activity</h2>
            
            {/* Activity Grid - 4 columns, larger icons */}
            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              {activityOptions.map((activityOption, index) => {
                const IconComponent = activityOption.icon;
                return (
                  <motion.button
                    key={activityOption.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleActivitySelection(activityOption.name)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                      }}
                    >
                      <IconComponent className="w-7 h-7 text-white" strokeWidth={1.8} />
                    </div>
                    <span className="text-white/90 text-[11px] font-semibold text-center leading-tight">
                      {activityOption.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }


  // Template Selection Step (confirmation is now a popup on ShareSheet)
  return (
    <div 
      className="fixed inset-0 w-full touch-manipulation overflow-hidden" 
      style={{ 
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        backgroundColor: '#252535',
      }}
    >
      {/* Blurred background image with dynamic color overlay - edge to edge */}
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
      
      {/* Dynamic gradient overlay based on current frame - edge to edge */}
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

      {/* Content - fixed height layout */}
      <div 
        className="relative z-10 flex flex-col h-full"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Offscreen capture target (unscaled) for image saves */}
        <div
          ref={captureRef}
          aria-hidden
          className="fixed left-[-10000px] top-0 w-[360px] pointer-events-none"
        >
          {renderFrame()}
        </div>

        {/* Header - fixed height */}
        <div 
          className={`flex-shrink-0 flex items-center justify-between py-3 px-5 transition-all duration-500 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'} ${elementsHidden ? 'opacity-0 -translate-y-8 pointer-events-none' : ''}`}
        >
          <button 
            onClick={handleSaveWithoutTemplate}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm tap-bounce ${tappedElement === 'close-btn' ? 'animate-liquid-tap' : ''}`}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-white/80 text-base font-semibold">Select your frame</h2>
          <button 
            onClick={handleRetake}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm tap-bounce ${tappedElement === 'retake-btn' ? 'animate-liquid-tap' : ''}`}
          >
            <Pencil className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Frame carousel - larger templates */}
        <div 
          className={`flex-1 flex items-center justify-center transition-all duration-700 ease-out ${isLoaded ? 'animate-frame-entrance' : 'opacity-0'} ${isExiting ? 'animate-template-transition' : ''}`}
          style={{ 
            minHeight: 0,
            maxHeight: 'calc(100dvh - 220px)', // More space for larger templates
          }}
        >
          {elementsHidden ? (
            <div className="flex items-center justify-center w-full h-full px-6 animate-scale-in">
              <div 
                className="w-full"
                style={{ 
                  maxWidth: 'min(65vw, 280px)',
                  aspectRatio: '9/16',
                  maxHeight: '100%',
                }}
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
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full items-center touch-pan-x"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                paddingLeft: 'calc((100vw - min(60vw, 260px)) / 2)',
                paddingRight: 'calc((100vw - min(60vw, 260px)) / 2)',
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
                      width: 'min(60vw, 260px)',
                      height: 'calc(min(60vw, 260px) * 16 / 9)',
                      maxHeight: 'calc(100dvh - 260px)',
                      transform: `scale(${scale})`,
                      opacity: elementsHidden && !isActiveFrame ? 0 : opacity,
                      transition: 'transform 0.12s ease-out, opacity 0.12s ease-out',
                      willChange: 'transform, opacity',
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

        {/* Content section - fixed, no scroll */}
        <div 
          className={`flex-shrink-0 space-y-2 px-5 py-2 transition-all duration-500 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'} ${elementsHidden ? 'opacity-0 translate-y-full pointer-events-none' : ''}`} 
          style={{ animationDelay: '0.3s' }}
        >
          {/* Editable data points - contextual to activity */}
          {(() => {
            const config = getActivityInputConfig(activity || '');
            return (
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 relative overflow-hidden">
                {/* Primary: Duration (always shown) */}
                <button 
                  onClick={() => { handleTap('duration'); openEditSheet('duration'); }}
                  className={`w-full flex justify-between items-center py-2 ${config.secondaryInputType !== 'none' ? 'border-b border-white/10' : ''} tap-bounce min-h-[44px] ${tappedElement === 'duration' ? 'animate-liquid-tap' : ''}`}
                >
                  <span className="text-white/80 text-sm flex items-center gap-2">
                    {config.primaryMetric}
                    <span className="text-[10px] text-white/40">tap to edit</span>
                  </span>
                  <span className={`font-semibold text-sm ${duration ? 'text-white' : 'text-white/50 italic'}`}>
                    {duration || '-'}
                  </span>
                </button>
                
                {/* Secondary: Contextual metric (only if activity has one) */}
                {config.secondaryInputType !== 'none' && (
                  <button 
                    onClick={() => { handleTap('pr'); openEditSheet('pr'); }}
                    className={`w-full flex justify-between items-center py-2 tap-bounce min-h-[44px] ${tappedElement === 'pr' ? 'animate-liquid-tap' : ''}`}
                  >
                    <span className="text-white/80 text-sm flex items-center gap-2">
                      {config.secondaryMetric} <span className="text-white/40">(Optional)</span>
                    </span>
                    <span className={`font-semibold text-sm ${pr ? 'text-white' : 'text-white/50'}`}>
                      {pr || '-'}
                    </span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Health sync widget - compact */}
          <div 
            className={`bg-white/10 backdrop-blur-xl rounded-xl p-2.5 flex items-center gap-2 tap-bounce min-h-[50px] ${tappedElement === 'connect' ? 'animate-liquid-tap' : ''}`}
            onClick={() => { handleTap('connect'); setShowSyncPopup(true); }}
          >
            <div className="flex-1">
              <h3 className="text-white font-medium text-xs">Auto sync with a device</h3>
              <p className="text-white/60 text-[10px]">Sync your health & fitness data</p>
            </div>
            <button className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <span className="text-white font-semibold text-[10px]">CONNECT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating DONE CTA - fixed at bottom with proper safe-area */}
      {!showShareSheet && (
        <div 
          className={`fixed left-0 right-0 z-30 px-5 transition-all duration-500 ${elementsHidden ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}
          style={{ 
            bottom: 0,
            paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
            paddingTop: 20,
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
          }}
        >
          <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
            <button 
              onClick={handleSaveWithTemplate}
              disabled={isSaving || isDeleting}
              className={`w-full bg-white py-4 rounded-2xl disabled:opacity-50 tap-bounce ${tappedElement === 'done-btn' ? 'animate-liquid-tap' : ''}`}
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
            >
              <span className="text-black font-bold text-base">
                {isSaving ? 'Saving...' : 'DONE'}
              </span>
            </button>
            
            {/* Delete button - only show in review mode for the latest activity */}
            {(() => {
              const maxDayNumber = activities.length > 0 ? Math.max(...activities.map(a => a.dayNumber)) : 0;
              const isLatestActivity = dayNumber === maxDayNumber;
              return isReview && isLatestActivity && (
                <button
                  onClick={handleDeleteActivity}
                  disabled={isDeleting || isSaving}
                  className="flex items-center gap-2 px-4 py-1.5 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {isDeleting ? 'Deleting...' : 'Remove Photo'}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* Bottom Sheet Keyboard Overlay - iOS Liquid Glass Style */}
      {editingField && (
        <>
          {/* Backdrop with heavy blur like iOS */}
          <div 
            className="fixed inset-0 z-40"
            style={{
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
            }}
            onClick={closeSheet}
          />
          
          {/* iOS-style bottom sheet with liquid glass */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 focus:outline-none focus-visible:outline-none" tabIndex={-1}>
            <div 
              className="rounded-t-[28px] p-6 pb-10 focus:outline-none focus-visible:outline-none"
              style={{
                background: 'linear-gradient(180deg, rgba(60, 60, 67, 0.85) 0%, rgba(45, 45, 48, 0.92) 100%)',
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 -10px 40px rgba(0, 0, 0, 0.3)',
              }}
              tabIndex={-1}
            >
              {/* iOS-style drag handle */}
              <div 
                className="w-9 h-1 rounded-full mx-auto mb-5"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
              />
              
              {(() => {
                const activityConfig = getActivityInputConfig(activity || '');
                const isDuration = editingField === 'duration';
                const fieldLabel = isDuration ? activityConfig.primaryMetric : activityConfig.secondaryMetric;
                const fieldUnit = isDuration ? activityConfig.primaryUnit : activityConfig.secondaryUnit;
                const inputType = isDuration ? activityConfig.primaryInputType : activityConfig.secondaryInputType;
                const useWheel = inputType === 'wheel';
                const useDecimal = inputType === 'decimal';
                
                return (
                  <>
                    <p className="text-white text-lg font-semibold text-center mb-5">
                      {isDuration ? `Select ${fieldLabel}` : `Enter ${fieldLabel}`}
                    </p>
                    
                    {useWheel ? (
                      <div className="flex items-center justify-center gap-6 mb-6">
                        <div className="flex-1 max-w-[200px]">
                          <WheelPicker
                            items={Array.from({ length: 181 }, (_, i) => i)}
                            value={parseInt(tempValue) || 0}
                            onChange={(value) => {
                              const numValue = Number(value);
                              setTempValue(String(numValue));
                              if (isDuration) {
                                setDuration(numValue > 0 ? `${numValue} ${fieldUnit}` : '');
                              } else {
                                setPr(numValue > 0 ? `${numValue} ${fieldUnit}` : '');
                              }
                            }}
                            itemHeight={52}
                            visibleItems={5}
                          />
                        </div>
                        <span className="text-white text-xl font-medium">{fieldUnit}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-6">
                        <div 
                          className="flex-1 flex items-center rounded-xl"
                          style={{
                            background: 'rgba(120, 120, 128, 0.24)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <input
                            ref={inputRef}
                            type="text"
                            inputMode={useDecimal ? 'decimal' : 'numeric'}
                            pattern={useDecimal ? '[0-9]*\\.?[0-9]*' : '[0-9]*'}
                            value={tempValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempValue(val);
                              if (isDuration) {
                                setDuration(val ? `${val} ${fieldUnit}` : '');
                              } else {
                                setPr(val ? `${val} ${fieldUnit}` : '');
                              }
                            }}
                            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                            className="flex-1 bg-transparent text-white text-xl font-medium px-4 py-4 outline-none placeholder:text-white/40"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                confirmEdit();
                              }
                            }}
                          />
                          {fieldUnit && <span className="pr-4 text-white/50 text-lg">{fieldUnit}</span>}
                        </div>
                      </div>
                    )}
                    
                    {/* iOS-style confirm button */}
                    <button
                      onClick={confirmEdit}
                      className="mx-auto px-10 py-2.5 flex items-center justify-center rounded-full"
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <span className="text-black font-semibold text-sm">Confirm</span>
                    </button>
                  </>
                );
              })()}
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

      {/* Activity Logged Celebration */}
      <ActivityLoggedCelebration
        isVisible={showMicroCelebration}
        onClose={() => {
          setShowMicroCelebration(false);
          setShowShareSheet(true);
        }}
        activity={activity || ''}
        dayNumber={dayNumber}
        currentWeek={calculatedWeek}
      />

      {/* Share Sheet */}
      {showShareSheet && framedImageUrl && (
        <ShareSheet
          imageUrl={framedImageUrl}
          isVideo={isVideo}
          onClose={() => setShowShareSheet(false)}
          onEdit={() => {
            // Close share sheet and return to template selection
            setShowShareSheet(false);
            setFramedImageUrl(null);
          }}
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
