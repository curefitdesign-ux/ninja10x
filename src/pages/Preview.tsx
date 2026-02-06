import { useLocation, useNavigate } from 'react-router-dom';
import { X, Check, Pencil, Trash2, Bike, Footprints, Mountain, Waves, Dumbbell, Dribbble, Trophy, Swords, Music, Brain, CircleDot, ImagePlus, MoreHorizontal } from 'lucide-react';
import ShareSheet from '@/components/ShareSheet';
import MediaSourceSheet from '@/components/MediaSourceSheet';
import { useEffect, useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';
import ContextualNumericKeyboard from '@/components/ContextualNumericKeyboard';
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
  { name: 'Other', icon: MoreHorizontal, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel' as const, secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' as const, isCustom: true },
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

type EditingField = 'duration' | 'pr' | 'activity' | null;
type FlowStep = 'camera' | 'activity' | 'template';

// Generate hour options from 0 to 24
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);

// Session storage key for preserving state during background/foreground
const PREVIEW_STATE_KEY = 'preview_session_state';

interface PreviewSessionState {
  imageUrl: string;
  isVideo: boolean;
  activity: string | null;
  duration: string;
  pr: string;
  dayNumber: number;
  currentFrame: FrameType;
  flowStep: FlowStep;
  framedImageUrl: string | null;
  showShareSheet: boolean;
  showMicroCelebration: boolean;
}

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
  const [showMediaSourceSheet, setShowMediaSourceSheet] = useState(false);
  const [showCustomActivityInput, setShowCustomActivityInput] = useState(false);
  const [customActivityName, setCustomActivityName] = useState('');
  
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
        setReelProgress(30);
        break;
      case 'video':
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
  // Also restore from sessionStorage if app was backgrounded
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
      // Clear any stale session state
      sessionStorage.removeItem(PREVIEW_STATE_KEY);
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
      // Clear any stale session state
      sessionStorage.removeItem(PREVIEW_STATE_KEY);
      setTimeout(() => setIsLoaded(true), 100);
      return;
    }
    
    // No router state - try to restore from sessionStorage (app was backgrounded)
    try {
      const savedState = sessionStorage.getItem(PREVIEW_STATE_KEY);
      if (savedState) {
        const parsed: PreviewSessionState = JSON.parse(savedState);
        console.info('[journey-debug] Preview: restoring from session storage', parsed);
        
        setImageUrl(parsed.imageUrl);
        setIsVideo(parsed.isVideo);
        setActivity(parsed.activity);
        setDuration(parsed.duration);
        setPr(parsed.pr);
        setDayNumber(parsed.dayNumber);
        setCurrentFrame(parsed.currentFrame);
        setFlowStep(parsed.flowStep);
        setFramedImageUrl(parsed.framedImageUrl);
        setShowShareSheet(parsed.showShareSheet);
        setShowMicroCelebration(parsed.showMicroCelebration);
        setTimeout(() => setIsLoaded(true), 100);
        return;
      }
    } catch (e) {
      console.warn('[journey-debug] Preview: failed to restore session state', e);
    }
    
    // No existing data and no session state - redirect to home
    navigate('/', { replace: true });
  }, []);

  // Persist state to sessionStorage ALWAYS when we have image and activity
  // This ensures state survives app backgrounding at any step
  useEffect(() => {
    if (imageUrl && activity && flowStep === 'template') {
      const stateToSave: PreviewSessionState = {
        imageUrl,
        isVideo,
        activity,
        duration,
        pr,
        dayNumber,
        currentFrame,
        flowStep,
        framedImageUrl,
        showShareSheet,
        showMicroCelebration,
      };
      sessionStorage.setItem(PREVIEW_STATE_KEY, JSON.stringify(stateToSave));
      console.info('[journey-debug] Preview: persisted state to session storage');
    }
  }, [imageUrl, isVideo, activity, duration, pr, dayNumber, currentFrame, flowStep, framedImageUrl, showShareSheet, showMicroCelebration]);

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

    // Clear session state since we're done
    sessionStorage.removeItem(PREVIEW_STATE_KEY);
    
    setTimeout(() => {
      navigate('/', { replace: true, state: null });
    }, 400);
  };

  // Close without saving (cross button) - just discard and go home
  const handleCloseWithoutSaving = () => {
    triggerHaptic('light');
    handleTap('close-btn');
    
    console.info('[journey-debug] Preview: discarding without save');
    
    // Clear session state
    sessionStorage.removeItem(PREVIEW_STATE_KEY);
    
    setIsExiting(true);
    setTimeout(() => {
      navigate('/', { replace: true, state: null });
    }, 400);
  };

  // Retake - open media source sheet to change photo
  const handleRetake = () => {
    triggerHaptic('light');
    handleTap('retake-btn');
    setShowMediaSourceSheet(true);
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
      setTempValue(numValue > 0 ? String(numValue) : '');
    } else if (field === 'pr') {
      const numValue = parseFloat(pr.replace(/[^0-9.]/g, '')) || 0;
      setTempValue(numValue > 0 ? String(numValue) : '');
    }
    setEditingField(field);
  };

  const confirmEdit = () => {
    const activityConfig = getActivityInputConfig(activity || '');
    const isDuration = editingField === 'duration';
    const fieldUnit = isDuration ? activityConfig.primaryUnit : activityConfig.secondaryUnit;
    
    if (isDuration) {
      const numValue = parseInt(tempValue) || 0;
      setDuration(numValue > 0 ? `${numValue} ${fieldUnit}` : '');
    } else {
      const numValue = parseFloat(tempValue) || 0;
      setPr(numValue > 0 ? `${numValue} ${fieldUnit}` : '');
    }
    setEditingField(null);
  };

  const closeSheet = () => {
    setEditingField(null);
  };

  // Get contextual presets based on activity and field
  const getPresets = (field: EditingField): number[] => {
    if (field === 'duration') {
      // Duration presets in minutes
      return [15, 30, 45, 60, 90];
    }
    
    // Secondary metric presets based on activity
    const activityLower = activity?.toLowerCase() || '';
    if (activityLower.includes('running') || activityLower.includes('cycling')) {
      return [3, 5, 10, 15, 20]; // Distance in km
    }
    if (activityLower.includes('swimming')) {
      return [10, 20, 30, 50]; // Laps
    }
    if (activityLower.includes('gym') || activityLower.includes('boxing')) {
      return [3, 5, 8, 10, 12]; // Sets/Rounds
    }
    if (activityLower.includes('trekking')) {
      return [200, 500, 800, 1000]; // Elevation in m
    }
    return [5, 10, 15, 20]; // Generic
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
                const isOther = 'isCustom' in activityOption && activityOption.isCustom;
                return (
                  <motion.button
                    key={activityOption.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      if (isOther) {
                        triggerHaptic('medium');
                        setShowCustomActivityInput(true);
                        setCustomActivityName('');
                      } else {
                        handleActivitySelection(activityOption.name);
                      }
                    }}
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

            {/* Custom Activity Name Input */}
            <AnimatePresence>
              {showCustomActivityInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customActivityName}
                      onChange={(e) => setCustomActivityName(e.target.value)}
                      placeholder="Enter activity name..."
                      autoFocus
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-base focus:outline-none focus:border-white/40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customActivityName.trim()) {
                          handleActivitySelection(customActivityName.trim());
                          setShowCustomActivityInput(false);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (customActivityName.trim()) {
                          triggerHaptic('medium');
                          handleActivitySelection(customActivityName.trim());
                          setShowCustomActivityInput(false);
                        }
                      }}
                      disabled={!customActivityName.trim()}
                      className="bg-white/20 hover:bg-white/30 disabled:opacity-40 px-4 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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

      {/* Content - scrollable layout */}
      <div 
        className="relative z-10 flex flex-col h-full overflow-y-auto"
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
            onClick={handleCloseWithoutSaving}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm tap-bounce ${tappedElement === 'close-btn' ? 'animate-liquid-tap' : ''}`}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-white/80 text-base font-semibold">Select your frame</h2>
          <button 
            onClick={handleRetake}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm tap-bounce ${tappedElement === 'retake-btn' ? 'animate-liquid-tap' : ''}`}
          >
            <ImagePlus className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Frame carousel - larger templates */}
        <div 
          className={`flex-shrink-0 flex items-center justify-center transition-all duration-700 ease-out py-4 ${isLoaded ? 'animate-frame-entrance' : 'opacity-0'} ${isExiting ? 'animate-template-transition' : ''}`}
          style={{ 
            minHeight: 'min(65vw * 16 / 9, 480px)',
          }}
        >
          {elementsHidden ? (
            <div className="flex items-center justify-center w-full h-full px-6 animate-scale-in">
              <div 
                className="w-full"
                style={{ 
                  maxWidth: 'min(70vw, 300px)',
                  aspectRatio: '9/16',
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
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full items-center touch-pan-x"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                // Reduced card width to show ~20% of adjacent templates on each side
                paddingLeft: 'calc((100vw - min(65vw, 280px)) / 2)',
                paddingRight: 'calc((100vw - min(65vw, 280px)) / 2)',
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
                      // Card takes ~65% width, leaving ~17.5% visible on each side for adjacent cards
                      width: 'min(65vw, 280px)',
                      height: 'calc(min(65vw, 280px) * 16 / 9)',
                      maxHeight: '480px',
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

        {/* Content section - scrollable */}
        <div 
          className={`flex-shrink-0 space-y-3 px-5 py-4 transition-all duration-500 ${isLoaded ? 'animate-content-stagger' : 'opacity-0'} ${elementsHidden ? 'opacity-0 translate-y-full pointer-events-none' : ''}`} 
          style={{ animationDelay: '0.3s', paddingBottom: '140px' }}
        >
          {/* Editable data points - contextual to activity */}
          {(() => {
            const config = getActivityInputConfig(activity || '');
            const activityOption = activityOptions.find(a => a.name === activity);
            const ActivityIcon = activityOption?.icon || Dumbbell;
            
            return (
              <div 
                className="rounded-2xl p-3 relative overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Activity selector - editable */}
                <button 
                  onClick={() => { handleTap('activity'); setEditingField('activity'); }}
                  className={`w-full flex justify-between items-center py-2 border-b border-white/10 tap-bounce min-h-[44px] ${tappedElement === 'activity' ? 'animate-liquid-tap' : ''}`}
                >
                  <span className="text-white/70 text-base flex items-center gap-2">
                    Activity
                    <span className="text-xs text-white/40">tap to change</span>
                  </span>
                  <span className="font-bold text-lg text-white">
                    {activity || 'Select'}
                  </span>
                </button>

                {/* Primary: Duration (always shown) */}
                <button 
                  onClick={() => { handleTap('duration'); openEditSheet('duration'); }}
                  className={`w-full flex justify-between items-center py-2 ${config.secondaryInputType !== 'none' ? 'border-b border-white/10' : ''} tap-bounce min-h-[44px] ${tappedElement === 'duration' ? 'animate-liquid-tap' : ''}`}
                >
                  <span className="text-white/70 text-base flex items-center gap-2">
                    {config.primaryMetric}
                    <span className="text-xs text-white/40">tap to edit</span>
                  </span>
                  <span className={`font-bold text-lg ${duration ? 'text-white' : 'text-white/40 italic'}`}>
                    {duration || '-'}
                  </span>
                </button>
                
                {/* Secondary: Contextual metric (only if activity has one) */}
                {config.secondaryInputType !== 'none' && (
                  <button 
                    onClick={() => { handleTap('pr'); openEditSheet('pr'); }}
                    className={`w-full flex justify-between items-center py-2 tap-bounce min-h-[44px] ${tappedElement === 'pr' ? 'animate-liquid-tap' : ''}`}
                  >
                    <span className="text-white/70 text-base flex items-center gap-2">
                      {config.secondaryMetric} <span className="text-white/40 text-xs">(Optional)</span>
                    </span>
                    <span className={`font-bold text-lg ${pr ? 'text-white' : 'text-white/40'}`}>
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

      {/* Contextual Numeric Keyboard */}
      <AnimatePresence>
        {editingField && editingField !== 'activity' && (
          (() => {
            const activityConfig = getActivityInputConfig(activity || '');
            const isDuration = editingField === 'duration';
            const fieldLabel = isDuration ? activityConfig.primaryMetric : activityConfig.secondaryMetric;
            const fieldUnit = isDuration ? activityConfig.primaryUnit : activityConfig.secondaryUnit;
            const inputType = isDuration ? activityConfig.primaryInputType : activityConfig.secondaryInputType;
            const useDecimal = inputType === 'decimal';
            
            return (
              <ContextualNumericKeyboard
                value={tempValue}
                onChange={setTempValue}
                onConfirm={confirmEdit}
                onClose={closeSheet}
                label={isDuration ? `Enter ${fieldLabel}` : `Enter ${fieldLabel}`}
                unit={fieldUnit}
                presets={getPresets(editingField)}
                allowDecimal={useDecimal}
                maxLength={useDecimal ? 6 : 4}
              />
            );
          })()
        )}
      </AnimatePresence>

      {/* Activity Selection Bottom Sheet */}
      <AnimatePresence>
        {editingField === 'activity' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={() => setEditingField(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0"
              onClick={(e) => e.stopPropagation()}
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
                <h2 className="text-white text-xl font-bold text-center mb-5">Change activity</h2>
                
                {/* Activity Grid - 4 columns */}
                <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                  {activityOptions.map((activityOption, index) => {
                    const IconComponent = activityOption.icon;
                    const isSelected = activity === activityOption.name || (activityOption.name === 'Other' && !activityOptions.slice(0, -1).some(a => a.name === activity) && activity);
                    const isOther = 'isCustom' in activityOption && activityOption.isCustom;
                    return (
                      <motion.button
                        key={activityOption.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          triggerHaptic('medium');
                          if (isOther) {
                            // Show custom activity input
                            setShowCustomActivityInput(true);
                            setCustomActivityName('');
                          } else {
                            setActivity(activityOption.name);
                            setEditingField(null);
                          }
                        }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ 
                            background: isSelected 
                              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%)'
                              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                            backdropFilter: 'blur(10px)',
                            border: isSelected ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: isSelected ? '0 4px 20px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.1)',
                          }}
                        >
                          <IconComponent className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-white/80'}`} strokeWidth={1.8} />
                        </div>
                        <span className={`text-[11px] font-semibold text-center leading-tight ${isSelected ? 'text-white' : 'text-white/90'}`}>
                          {activityOption.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Custom Activity Name Input */}
                <AnimatePresence>
                  {showCustomActivityInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customActivityName}
                          onChange={(e) => setCustomActivityName(e.target.value)}
                          placeholder="Enter activity name..."
                          autoFocus
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 text-base focus:outline-none focus:border-white/40"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customActivityName.trim()) {
                              setActivity(customActivityName.trim());
                              setShowCustomActivityInput(false);
                              setEditingField(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (customActivityName.trim()) {
                              triggerHaptic('medium');
                              setActivity(customActivityName.trim());
                              setShowCustomActivityInput(false);
                              setEditingField(null);
                            }
                          }}
                          disabled={!customActivityName.trim()}
                          className="bg-white/20 hover:bg-white/30 disabled:opacity-40 px-4 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Check className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      
      {/* Media Source Sheet for changing photo */}
      <MediaSourceSheet
        isOpen={showMediaSourceSheet}
        onClose={() => setShowMediaSourceSheet(false)}
        dayNumber={dayNumber}
        activity={activity || undefined}
        preserveActivity={!!activity}
      />
    </div>
  );
};

export default Preview;
