import { useLocation, useNavigate } from 'react-router-dom';
import { X, Check, Pencil, Trash2, ImagePlus, MoreHorizontal, Footprints, Bike, MountainSnow, PersonStanding, Dumbbell, Camera, Image as ImageIcon, Loader2, Waves, ArrowUpFromLine, SkipForward, Zap, Weight, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CricketBatBall, BoxingGlove, FootballIcon, Shuttlecock, BasketballIcon, TennisBall } from '@/components/SportIcons';
import ShareSheet from '@/components/ShareSheet';
import MediaSourceSheet from '@/components/MediaSourceSheet';
import { useEffect, useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';
import TokenFrame from '@/components/frames/TokenFrame';
import HolographicFrame from '@/components/frames/HolographicFrame';
import ContextualNumericKeyboard from '@/components/ContextualNumericKeyboard';
import { getActivityConfig } from '@/lib/activity-context';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ActivityBackgroundEffect from '@/components/ActivityBackgroundEffect';
import SyncHealthPopup from '@/components/SyncHealthPopup';
import ActivityLoggedCelebration from '@/components/ActivityLoggedCelebration';
import { useJourneyActivities } from '@/hooks/use-journey-activities';

import { toast } from 'sonner';

const FRAMES = ['token', 'holographic', 'shaky', 'journal', 'vogue', 'fitness', 'ticket'] as const;
type FrameType = typeof FRAMES[number];

// Activity options with minimal line icons
const activityOptions: Array<{
  name: string;
  icon: React.ComponentType<any>;
  isCustom?: boolean;
  primaryMetric: string;
  primaryUnit: string;
  primaryInputType: 'wheel' | 'number' | 'decimal' | 'none';
  secondaryMetric: string;
  secondaryUnit: string;
  secondaryInputType: 'wheel' | 'number' | 'decimal' | 'none';
}> = [
  { name: 'Running', icon: Footprints, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Distance', secondaryUnit: 'km', secondaryInputType: 'decimal' },
  { name: 'Cycling', icon: Bike, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Distance', secondaryUnit: 'km', secondaryInputType: 'decimal' },
  { name: 'Trekking', icon: MountainSnow, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Elevation', secondaryUnit: 'm', secondaryInputType: 'number' },
  { name: 'Yoga', icon: PersonStanding, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' },
  { name: 'GYM', icon: Dumbbell, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Sets', secondaryUnit: 'sets', secondaryInputType: 'number' },
  { name: 'Cricket', icon: CricketBatBall, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Runs', secondaryUnit: 'runs', secondaryInputType: 'number' },
  { name: 'Badminton', icon: Shuttlecock, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Games', secondaryUnit: 'games', secondaryInputType: 'number' },
  { name: 'Tennis', icon: TennisBall, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Sets', secondaryUnit: 'sets', secondaryInputType: 'number' },
  { name: 'Boxing', icon: BoxingGlove, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Rounds', secondaryUnit: 'rounds', secondaryInputType: 'number' },
  { name: 'Football', icon: FootballIcon, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' },
  { name: 'Basketball', icon: BasketballIcon, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' },
  { name: 'Swimming', icon: Waves, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Distance', secondaryUnit: 'km', secondaryInputType: 'decimal' },
  { name: 'Stair Climbing', icon: ArrowUpFromLine, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Floors', secondaryUnit: 'floors', secondaryInputType: 'number' },
  { name: 'Skipping Rope', icon: SkipForward, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Count', secondaryUnit: 'reps', secondaryInputType: 'number' },
  { name: 'HRX Session', icon: Zap, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Type', secondaryUnit: '', secondaryInputType: 'none' },
  { name: 'Strength', icon: Weight, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'PR', secondaryUnit: 'kg', secondaryInputType: 'decimal' },
  { name: 'Burn', icon: Flame, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' },
  { name: 'Other', icon: MoreHorizontal, isCustom: true, primaryMetric: 'Duration', primaryUnit: 'min', primaryInputType: 'wheel', secondaryMetric: 'Session', secondaryUnit: '', secondaryInputType: 'none' },
];

// Get activity-specific input config from centralized utility
const getActivityInputConfig = (activityName: string, customMetricsOverride?: { primaryMetric: string; primaryUnit: string; secondaryMetric: string; secondaryUnit: string } | null) => {
  if (customMetricsOverride) {
    return {
      primaryMetric: customMetricsOverride.primaryMetric,
      primaryUnit: customMetricsOverride.primaryUnit,
      primaryInputType: 'wheel' as const,
      secondaryMetric: customMetricsOverride.secondaryMetric,
      secondaryUnit: customMetricsOverride.secondaryUnit,
      secondaryInputType: customMetricsOverride.secondaryUnit ? 'number' as const : 'none' as const,
    };
  }
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

// Background tints per template - bolder so shift is obvious when scrolling
const FRAME_COLORS: Record<FrameType, { accent: string; gradient: string }> = {
  shaky: { 
    accent: 'rgba(80, 60, 160, 0.55)', 
    gradient: 'linear-gradient(160deg, rgba(90, 65, 180, 0.4) 0%, rgba(30, 20, 70, 0.6) 100%)'
  },
  journal: { 
    accent: 'rgba(20, 120, 90, 0.55)', 
    gradient: 'linear-gradient(160deg, rgba(25, 140, 105, 0.4) 0%, rgba(10, 55, 40, 0.6) 100%)'
  },
  vogue: { 
    accent: 'rgba(30, 30, 40, 0.65)', 
    gradient: 'linear-gradient(160deg, rgba(50, 50, 65, 0.5) 0%, rgba(10, 10, 18, 0.7) 100%)'
  },
  fitness: { 
    accent: 'rgba(200, 160, 20, 0.45)', 
    gradient: 'linear-gradient(160deg, rgba(220, 180, 25, 0.35) 0%, rgba(80, 65, 10, 0.6) 100%)'
  },
  ticket: { 
    accent: 'rgba(180, 80, 50, 0.45)', 
    gradient: 'linear-gradient(160deg, rgba(200, 90, 55, 0.35) 0%, rgba(80, 35, 20, 0.6) 100%)'
  },
  token: {
    accent: 'rgba(10, 82, 120, 0.45)',
    gradient: 'linear-gradient(160deg, rgba(15, 100, 145, 0.35) 0%, rgba(5, 40, 60, 0.6) 100%)'
  },
  holographic: {
    accent: 'rgba(120, 180, 200, 0.45)',
    gradient: 'linear-gradient(160deg, rgba(180, 200, 230, 0.35) 0%, rgba(200, 160, 140, 0.4) 100%)'
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
  const [showCricketSubOption, setShowCricketSubOption] = useState(false);
  const [isLoadingAiMetrics, setIsLoadingAiMetrics] = useState(false);
  const [customMetrics, setCustomMetrics] = useState<{ primaryMetric: string; primaryUnit: string; secondaryMetric: string; secondaryUnit: string } | null>(null);
  
  const [elementsHidden, setElementsHidden] = useState(false);
  const [mediaSource, setMediaSource] = useState<'camera' | 'gallery' | null>(null);
  const [isReview, setIsReview] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  // Get delete and upsert functions from hook
  const { deleteActivity, upsertActivity, refresh, activities } = useJourneyActivities();


  const frameItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRaf = useRef<number | null>(null);
  
  // Carousel state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasNudged, setHasNudged] = useState(false);
  const [lowResBackground, setLowResBackground] = useState<string | null>(null);

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
      setActivity(null);
      setMediaSource(state.fromCamera ? 'camera' : 'gallery');
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
      // scale: 1.5 keeps quality high while being ~2.7x faster than scale: 2
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 5000,
      });
      // JPEG at 0.92 quality — 40–60% smaller file, indistinguishable visually
      return canvas.toDataURL('image/jpeg', 0.92);
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
    
    // Show the celebration overlay (handles both regular days and week milestones)
    // The Index page effect will auto-trigger reel generation after refresh
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

  // Generate low-res background for performance
  useEffect(() => {
    if (!imageUrl || isVideo) return;
    const img = new Image();
    // Do NOT set crossOrigin for local blob/data URLs — it causes CORS errors and breaks rendering
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Tiny resolution - will be blurred anyway
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 32, 32);
        setLowResBackground(canvas.toDataURL('image/jpeg', 0.3));
      }
    };
    img.src = imageUrl;
  }, [imageUrl, isVideo]);

  // Scroll to the initially-selected frame on mount + nudge animation
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

        // Nudge animation: scroll all the way right then back to center to hint more templates
        if (!hasNudged) {
          setTimeout(() => {
            if (!container) return;
            // Scroll to the very end (rightmost position)
            const maxScroll = container.scrollWidth - container.clientWidth;
            container.scrollTo({ left: maxScroll, behavior: 'smooth' });
            setTimeout(() => {
              // Scroll back to the originally selected frame
              container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
              setHasNudged(true);
            }, 600);
          }, 800);
        }
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
  const activityLabels = getActivityInputConfig(activity || '', customMetrics);

  // AI-powered metric suggestion for custom activities
  const fetchAiMetrics = async (name: string) => {
    setIsLoadingAiMetrics(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-activity-metrics', {
        body: { activityName: name },
      });
      if (!error && data?.secondaryMetric) {
        setCustomMetrics(data);
      }
    } catch (e) {
      console.warn('AI metrics suggestion failed, using defaults', e);
    } finally {
      setIsLoadingAiMetrics(false);
    }
  };

  const frameProps = {
    imageUrl: imageUrl || '',
    isVideo,
    activity: activity || 'Activity',
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
      case 'token':
        return <TokenFrame {...frameProps} />;
      case 'holographic':
        return <HolographicFrame {...frameProps} />;
    }
  };

  // Camera step is now a separate page - redirect if somehow reached
  if (flowStep === 'camera') {
    navigate('/gallery', { state: { dayNumber }, replace: true });
    return null;
  }

  // Handle activity selection (including cricket sub-options)
  const handleActivitySelection = (selectedActivity: string) => {
    triggerHaptic('medium');
    setCustomMetrics(null); // Reset custom metrics for known activities
    setActivity(selectedActivity);
    setFlowStep('template');
  };

  // Handle cricket sub-option
  const handleCricketSubOption = (subType: 'batting' | 'bowling') => {
    triggerHaptic('medium');
    setShowCricketSubOption(false);
    if (subType === 'bowling') {
      setCustomMetrics({
        primaryMetric: 'Duration',
        primaryUnit: 'min',
        secondaryMetric: 'Wickets',
        secondaryUnit: 'wkts',
      });
    } else {
      setCustomMetrics(null); // Use default cricket config (Runs)
    }
    setActivity('Cricket');
    setFlowStep('template');
  };

  // Handle custom "Other" activity with AI suggestions
  const handleCustomActivityConfirm = (name: string) => {
    triggerHaptic('medium');
    setActivity(name);
    setShowCustomActivityInput(false);
    setFlowStep('template');
    // Fire and forget AI suggestion
    fetchAiMetrics(name);
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
        {/* Blurred background image - use img tag to avoid CSS bg blob URL issues */}
        {!isVideo && (
          <img
            src={lowResBackground || imageUrl || ''}
            alt=""
            className="fixed inset-0 w-full h-full scale-150 pointer-events-none"
            style={{ objectFit: 'cover', filter: 'blur(80px) brightness(0.5)', zIndex: 0 }}
          />
        )}
        
        {/* Dark gradient overlay */}
        <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 pointer-events-none" style={{ zIndex: 1 }} />
        
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

        {/* Media Preview - small peek above the 80% sheet */}
        <div className="relative z-10 flex items-end justify-center px-6" style={{ height: '20dvh', paddingBottom: '8px' }}>
          <motion.div 
            layoutId="preview-media-card"
            className="relative overflow-hidden rounded-xl"
            style={{ 
              width: 'min(28vw, 110px)',
              aspectRatio: '9/16',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
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
            {/* Edge reflection */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)', border: '1px solid rgba(255,255,255,0.14)' }} />
          </motion.div>
        </div>
        
        {/* Bottom Sheet for Activity Selection - Liquid Glass */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-30"
          style={{ height: '80dvh' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div 
            className="glass-sheet rounded-t-3xl px-5 pt-4 flex flex-col h-full"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
            }}
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-4" />
            
            {/* Title */}
            <h2 className="text-white text-xl font-bold text-center mb-4">Choose your activity</h2>
            
            {/* Activity Grid - 4 columns, fits all 18 activities without scroll */}
            <div className="flex-1 grid grid-cols-4 gap-x-3 gap-y-3 content-start overflow-hidden">
              {activityOptions.map((activityOption, index) => {
                const isOther = 'isCustom' in activityOption && activityOption.isCustom;
                return (
                  <motion.button
                    key={activityOption.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.015 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      if (isOther) {
                        triggerHaptic('medium');
                        setShowCustomActivityInput(true);
                        setCustomActivityName('');
                      } else if (activityOption.name === 'Cricket') {
                        triggerHaptic('medium');
                        setShowCricketSubOption(true);
                      } else {
                        handleActivitySelection(activityOption.name);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div 
                      className="w-[56px] h-[56px] rounded-[16px] flex items-center justify-center overflow-hidden"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 100%)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.15)',
                      }}
                    >
                      {(() => {
                        const IconComp = activityOption.icon;
                        return <IconComp className="w-6 h-6 text-white/80" strokeWidth={1.5} />;
                      })()}
                    </div>
                    <span className="text-white/90 text-[10px] font-semibold text-center leading-tight">
                      {activityOption.name}
                    </span>
                  </motion.button>
                );})}

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
                          handleCustomActivityConfirm(customActivityName.trim());
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (customActivityName.trim()) {
                          handleCustomActivityConfirm(customActivityName.trim());
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

            {/* Cricket Batting/Bowling Sub-option */}
            <AnimatePresence>
              {showCricketSubOption && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <p className="text-white/60 text-sm text-center mb-3">What did you play?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCricketSubOption('batting')}
                      className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      🏏 Batting
                    </button>
                    <button
                      onClick={() => handleCricketSubOption('bowling')}
                      className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      🎯 Bowling
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
      className="fixed inset-0 w-full touch-manipulation" 
      style={{ 
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        backgroundColor: '#252535',
        overflow: 'hidden',
      }}
    >
      {/* Blurred background — always the uploaded image, never a colour */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isVideo ? (
          <video
            src={imageUrl || ''}
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover scale-[1.3]"
            style={{ filter: 'blur(50px) brightness(0.75) saturate(1.2)' }}
          />
        ) : (
          <img
            src={lowResBackground || imageUrl || ''}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-[1.3]"
            style={{ filter: 'blur(50px) brightness(0.75) saturate(1.2)' }}
          />
        )}
        {/* 10% dark veil */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.10)' }} />
        {/* Subtle per-frame colour tint — sits on top of photo, very low opacity */}
        <div
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{ background: FRAME_COLORS[currentFrame].accent, opacity: 0.28 }}
        />
      </div>

      {/* Content - scrollable layout */}
      <div 
        className="relative z-10 flex flex-col h-full overflow-y-auto overscroll-y-contain"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', WebkitOverflowScrolling: 'touch' }}
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
            {mediaSource === 'camera' ? (
              <Camera className="w-5 h-5 text-white" />
            ) : (
              <ImageIcon className="w-5 h-5 text-white" />
            )}
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
                {currentFrame === 'token' && <TokenFrame {...frameProps} />}
                {currentFrame === 'holographic' && <HolographicFrame {...frameProps} />}
              </div>
            </div>
          ) : (
            <div 
              ref={containerRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full items-center touch-pan-x select-none"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                // Prevent long-press callout / context menu on touch devices
                WebkitTouchCallout: 'none',
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
                  <motion.div 
                    key={frame}
                    ref={(el) => {
                      frameItemRefs.current[index] = el;
                    }}
                    data-frame={frame}
                    {...(isActiveFrame && !hasNudged ? { layoutId: 'preview-media-card' } : {})}
                    initial={{ opacity: 0, y: 30, scale: 0.85 }}
                    animate={{ 
                      opacity: elementsHidden && !isActiveFrame ? 0 : opacity,
                      y: 0, 
                      scale: scale,
                    }}
                    transition={{ 
                      layout: { type: 'spring', stiffness: 280, damping: 28 },
                      delay: index * 0.08,
                      type: 'spring',
                      stiffness: 260,
                      damping: 22,
                    }}
                    className={`flex-shrink-0 snap-center flex items-center justify-center ${
                      elementsHidden && isLeftOfCurrent ? 'opacity-0 -translate-x-full' : ''
                    } ${
                      elementsHidden && isRightOfCurrent ? 'opacity-0 translate-x-full' : ''
                    }`}
                    style={{ 
                      width: 'min(65vw, 280px)',
                      height: 'calc(min(65vw, 280px) * 16 / 9)',
                      maxHeight: '480px',
                      willChange: 'transform, opacity',
                    }}
                    >
                      <div 
                        className="w-full h-full flex items-center justify-center relative"
                        style={{ aspectRatio: '9/16', maxHeight: '100%' }}
                      >
                        {frame === 'shaky' && <ShakyFrame {...frameProps} />}
                        {frame === 'journal' && <JournalFrame {...frameProps} />}
                        {frame === 'vogue' && <VogueFrame {...frameProps} />}
                        {frame === 'fitness' && <FitnessFrame {...frameProps} />}
                        {frame === 'ticket' && <TicketFrame {...frameProps} />}
                        {frame === 'token' && <TokenFrame {...frameProps} />}
                        {frame === 'holographic' && <HolographicFrame {...frameProps} />}
                      </div>
                    </motion.div>
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
            const config = getActivityInputConfig(activity || '', customMetrics);
            const isCricket = activity === 'Cricket';
            const cricketMode = customMetrics?.secondaryMetric === 'Wickets' ? 'bowling' : 'batting';

            return (
              <div 
                className="rounded-2xl px-5 py-1 relative overflow-hidden"
                style={{
                  background: 'rgba(0, 0, 0, 0.10)',
                  backdropFilter: 'blur(40px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {/* Top edge reflection */}
                <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.18) 70%, transparent)' }} />

                {/* Activity selector row */}
                <button 
                  onClick={() => { handleTap('activity'); setEditingField('activity'); }}
                  className={`w-full flex justify-between items-center py-3.5 border-b border-white/[0.1] tap-bounce min-h-[52px] ${tappedElement === 'activity' ? 'animate-liquid-tap' : ''}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/80 text-[15px] font-semibold">Activity</span>
                    <span className="text-[11px] text-white/40">tap to change</span>
                  </div>
                  <span className="font-bold text-[17px] text-white drop-shadow-sm">
                    {activity || 'Select'}
                  </span>
                </button>

                {/* Cricket batting/bowling inline switcher */}
                {isCricket && (
                  <div className="w-full flex justify-between items-center py-3 border-b border-white/[0.08] min-h-[52px]">
                    <span className="text-white/60 text-[15px] font-medium">Type</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setCustomMetrics(null); }}
                        className="px-3 py-1 rounded-lg text-[12px] font-semibold transition-all"
                        style={{
                          background: cricketMode === 'batting' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                          color: cricketMode === 'batting' ? '#fff' : 'rgba(255,255,255,0.45)',
                          border: cricketMode === 'batting' ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        Batting
                      </button>
                      <button
                        onClick={() => { setCustomMetrics({ primaryMetric: 'Duration', primaryUnit: 'min', secondaryMetric: 'Wickets', secondaryUnit: 'wkts' }); }}
                        className="px-3 py-1 rounded-lg text-[12px] font-semibold transition-all"
                        style={{
                          background: cricketMode === 'bowling' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                          color: cricketMode === 'bowling' ? '#fff' : 'rgba(255,255,255,0.45)',
                          border: cricketMode === 'bowling' ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        Bowling
                      </button>
                    </div>
                  </div>
                )}

                {/* Duration row */}
                <button 
                  onClick={() => { handleTap('duration'); openEditSheet('duration'); }}
                  className={`w-full flex justify-between items-center py-3.5 ${config.secondaryInputType !== 'none' ? 'border-b border-white/[0.1]' : ''} tap-bounce min-h-[52px] ${tappedElement === 'duration' ? 'animate-liquid-tap' : ''}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/85 text-[15px] font-semibold">{config.primaryMetric}</span>
                    <span className="text-[11px] text-white/40">tap to edit</span>
                  </div>
                  <span className={`font-bold text-[17px] ${duration ? 'text-white' : 'text-white/35'}`}>
                    {duration || '—'}
                  </span>
                </button>
                
                {/* Secondary metric row */}
                {config.secondaryInputType !== 'none' && (
                  <button 
                    onClick={() => { handleTap('pr'); openEditSheet('pr'); }}
                    className={`w-full flex justify-between items-center py-3.5 tap-bounce min-h-[52px] ${tappedElement === 'pr' ? 'animate-liquid-tap' : ''}`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-white/85 text-[15px] font-semibold">{config.secondaryMetric}</span>
                      {isLoadingAiMetrics ? (
                        <span className="text-[11px] text-white/40 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> AI suggesting...</span>
                      ) : (
                        <span className="text-[11px] text-white/40">(Optional)</span>
                      )}
                    </div>
                    <span className={`font-bold text-[17px] ${pr ? 'text-white' : 'text-white/35'}`}>
                      {pr || '—'}
                    </span>
                  </button>
                )}
              </div>
            );
          })()}

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
            const activityConfig = getActivityInputConfig(activity || '', customMetrics);
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
                className="glass-sheet rounded-t-3xl px-5 pt-4"
                style={{
                  paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
                }}
              >
                {/* Handle */}
                <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-4" />
                
                {/* Title */}
                <h2 className="text-white text-xl font-bold text-center mb-5">Change activity</h2>
                
                {/* Activity Grid - 4 columns */}
                <div className="grid grid-cols-4 gap-x-4 gap-y-5 max-h-64 overflow-y-auto pb-1">
                  {activityOptions.map((activityOption, index) => {
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
                            setShowCustomActivityInput(true);
                            setCustomActivityName('');
                          } else if (activityOption.name === 'Cricket') {
                            setShowCricketSubOption(true);
                          } else {
                            setCustomMetrics(null);
                            setActivity(activityOption.name);
                            setEditingField(null);
                          }
                        }}
                        className="flex flex-col items-center gap-2.5"
                      >
                        <div 
                          className="w-[68px] h-[68px] rounded-[20px] flex items-center justify-center overflow-hidden"
                          style={{ 
                            background: isSelected 
                              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%)'
                              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 100%)',
                            backdropFilter: 'blur(16px)',
                            border: isSelected ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.18)',
                            boxShadow: isSelected ? '0 4px 20px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.15)',
                          }}
                        >
                          {(() => {
                            const IconComp = activityOption.icon;
                            return <IconComp className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-white/80'}`} strokeWidth={1.5} />;
                          })()}
                        </div>
                        <span className={`text-xs font-semibold text-center leading-tight ${isSelected ? 'text-white' : 'text-white/90'}`}>
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
                              const name = customActivityName.trim();
                              setActivity(name);
                              setShowCustomActivityInput(false);
                              setEditingField(null);
                              fetchAiMetrics(name);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (customActivityName.trim()) {
                              triggerHaptic('medium');
                              const name = customActivityName.trim();
                              setActivity(name);
                              setShowCustomActivityInput(false);
                              setEditingField(null);
                              fetchAiMetrics(name);
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

                {/* Cricket Batting/Bowling Sub-option */}
                <AnimatePresence>
                  {showCricketSubOption && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <p className="text-white/60 text-sm text-center mb-3">What did you play?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { handleCricketSubOption('batting'); setEditingField(null); }}
                          className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          🏏 Batting
                        </button>
                        <button
                          onClick={() => { handleCricketSubOption('bowling'); setEditingField(null); }}
                          className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          🎯 Bowling
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
