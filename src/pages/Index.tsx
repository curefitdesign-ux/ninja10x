import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, Film } from 'lucide-react';
import { toast } from 'sonner';
import AuroraBackground from '@/components/AuroraBackground';
import PhotoUploadCard from '@/components/PhotoUploadCard';
import WidgetLayout2 from '@/components/WidgetLayout2';
import WidgetLayout3 from '@/components/WidgetLayout3';
import ReelGenerationOverlay from '@/components/ReelGenerationOverlay';
import ReelPreviewScreen from '@/components/ReelPreviewScreen';
import ReelHistoryGallery from '@/components/ReelHistoryGallery';
import PullToRefresh from '@/components/PullToRefresh';
import { useFitnessReel } from '@/hooks/use-fitness-reel';
import { uploadToStorage } from '@/services/storage-service';
import SharedImageTransition from '@/components/SharedImageTransition';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import type { PillState } from '@/components/ReelProgressPill';
import weekRecapVideo from '@/assets/demo-videos/week-recap.mp4';

import CameraUI from '@/components/CameraUI';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Activity icons
import footballIcon from '@/assets/activities/football.png';
import cricketIcon from '@/assets/activities/cricket.png';
import racquetIcon from '@/assets/activities/racquet.png';
import basketballIcon from '@/assets/activities/basketball.png';
import cyclingIcon from '@/assets/activities/cycling.png';
import runningIcon from '@/assets/activities/running.png';
import trekkingIcon from '@/assets/activities/trekking.png';
import boxingIcon from '@/assets/activities/boxing.png';
import yogaIcon from '@/assets/activities/yoga.png';

import { ReactionType, ActivityReaction } from '@/services/journey-service';

// Photo interface - storage-first: only storageUrl is persisted
export interface Photo {
  id: string;
  storageUrl: string; // Public URL from Supabase Storage (required for persistence)
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  dayNumber: number; // 1-12, each upload = new day
  reactions?: Record<ReactionType, { count: number }>;
}

const MAX_DAYS = 12;

const ACTIVITY_OPTIONS = [
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

type LayoutType = 'layout1' | 'layout2' | 'layout3';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Load photos from backend (single source of truth)
  const { activities, loading: activitiesLoading, refresh: refreshActivities } = useJourneyActivities();
  
  // Convert backend activities to Photo shape for compatibility
  const photos: Photo[] = activities.map(a => ({
    id: a.id,
    storageUrl: a.storageUrl,
    isVideo: a.isVideo,
    activity: a.activity,
    frame: a.frame as Photo['frame'],
    duration: a.duration,
    pr: a.pr,
    dayNumber: a.dayNumber,
    reactions: a.reactions ? Object.fromEntries(
      Object.entries(a.reactions).map(([type, data]) => [type, { count: data.count }])
    ) as Record<ReactionType, { count: number }> : undefined,
  }));

  // Shared-element transition from ShareSheet (X) to Cult Ninja widget (this page)
  const [shareTransitionImage, setShareTransitionImage] = useState<string | null>(null);
  useEffect(() => {
    if (location.state?.fromShare && location.state?.transitionToWidget) {
      setShareTransitionImage(location.state.transitionImage || null);

      // Clear navigation state without leaving the page
      navigate('/create', { replace: true, state: null });

      const t = setTimeout(() => setShareTransitionImage(null), 900);
      return () => clearTimeout(t);
    }
  }, [location.state?.fromShare, location.state?.transitionToWidget, navigate]);
  
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [sheetPhase, setSheetPhase] = useState<'select' | 'acknowledge' | 'exit'>('select');
  const [acknowledgedActivity, setAcknowledgedActivity] = useState<{ name: string; icon: string } | null>(null);
  const [cameraEntering, setCameraEntering] = useState(false);
  const [simulatedDate, setSimulatedDate] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('layout3');
  const [initialCaptureMode, setInitialCaptureMode] = useState<'photo' | 'video'>('photo');
  const [showReelHistoryGallery, setShowReelHistoryGallery] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  
  // Fitness reel generation
  const { 
    generateReel, 
    isGenerating, 
    currentStep, 
    reelHistory, 
    currentReel,
    currentReelIndex, 
    setCurrentReelIndex,
    clearHistory 
  } = useFitnessReel();
  const [showReelPreview, setShowReelPreview] = useState(false);
  const [lastGeneratedPhotos, setLastGeneratedPhotos] = useState<typeof photos>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [weekTransitionAnimation, setWeekTransitionAnimation] = useState(false);
  const [previousPhotoCount, setPreviousPhotoCount] = useState(photos.length);
  
  // Show preview when reel is ready
  useEffect(() => {
    if (reelHistory.length > 0 && !isGenerating && currentStep === 'complete') {
      setShowReelPreview(true);
    }
  }, [reelHistory, isGenerating, currentStep]);
  
  // Generate reel from latest 3 photos
  const handleGenerateReel = useCallback((photosToProcess: typeof photos) => {
    // Use latest 3 photos
    const latest3 = photosToProcess.slice(-3);
    
    // Check if all photos have storage URLs
    const missingStorage = latest3.filter(p => !p.storageUrl);
    if (missingStorage.length > 0) {
      toast.error('Some photos are still uploading. Please wait...');
      return;
    }

    setLastGeneratedPhotos(latest3);
    // Transform photos to the format expected by the API
    const photoData = latest3.map((photo) => ({
      id: photo.id,
      imageUrl: photo.storageUrl,
      activity: photo.activity || 'Activity',
      duration: photo.duration,
      pr: photo.pr,
      uploadDate: new Date().toISOString().split('T')[0],
      dayNumber: photo.dayNumber,
    }));
    
    generateReel(photoData);
  }, [generateReel]);

  const handleCloseReelPreview = useCallback(() => {
    setShowReelPreview(false);
  }, []);

  const handleRecreateReel = useCallback(() => {
    if (lastGeneratedPhotos.length >= 3) {
      handleGenerateReel(lastGeneratedPhotos);
    }
  }, [lastGeneratedPhotos, handleGenerateReel]);

  const handleSelectReelFromGallery = useCallback((index: number) => {
    setCurrentReelIndex(index);
    setShowReelHistoryGallery(false);
    setShowReelPreview(true);
  }, [setCurrentReelIndex]);

  // Photos are now loaded from backend - no localStorage persistence needed

  // Detect week completion and trigger animation
  useEffect(() => {
    const previousWeek = Math.ceil(previousPhotoCount / 3);
    const newWeek = Math.ceil(photos.length / 3);
    
    // If we just completed a week (photo count crossed a multiple of 3)
    if (photos.length > previousPhotoCount && photos.length % 3 === 0 && photos.length > 0) {
      setWeekTransitionAnimation(true);
      setTimeout(() => setWeekTransitionAnimation(false), 2000);
    }
    
    setPreviousPhotoCount(photos.length);
  }, [photos.length, previousPhotoCount]);

  // Get current date (or simulated date for testing)
  const getCurrentDate = () => {
    if (simulatedDate) return simulatedDate;
    return new Date().toISOString().split('T')[0];
  };

  // Get next available day number (1-12)
  const getNextDayNumber = () => {
    if (photos.length >= MAX_DAYS) return MAX_DAYS;
    return photos.length + 1;
  };

  // Calculate week and day based on photos
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);
  const currentDay = (photos.length % 3) + 1;

  // Weekly Reel Progress Pill (3 states)
  const reelPill = (() => {
    const completedWeeks = Math.floor(photos.length / 3);
    if (completedWeeks <= 0) return null;

    const weekStart = (completedWeeks - 1) * 3;
    const weekPhotos = photos.slice(weekStart, weekStart + 3);

    const totalReactions = weekPhotos.reduce((sum, p) => {
      const reactions = p.reactions ? Object.values(p.reactions) : [];
      const photoTotal = reactions.reduce((s, r) => s + (r?.count ?? 0), 0);
      return sum + photoTotal;
    }, 0);

    const isTransitioning = !!currentReel?.videoTaskId && !currentReel?.videoUrl;
    const isUploading = isGenerating;
    const isReady = !isUploading && !isTransitioning;

    const state: PillState = isUploading ? 'creating' : isTransitioning ? 'completing' : 'complete';

    const progress = (() => {
      if (state === 'complete') return 100;
      if (isTransitioning) return 92;
      switch (currentStep) {
        case 'narration':
          return 20;
        case 'voiceover':
          return 45;
        case 'video':
          return 70;
        case 'complete':
          return 88;
        default:
          return 10;
      }
    })();

    return {
      weekNumber: completedWeeks,
      state,
      progress,
      totalReactions,
      onPlay: isReady
        ? () => {
            navigate('/reel', {
              state: {
                weekRecapVideo: currentReel?.videoUrl || weekRecapVideo,
                weekNumber: completedWeeks,
              },
            });
          }
        : undefined,
    };
  })();

  // Save is now handled directly in Preview.tsx via upsertActivity - just navigate home

  // Handle retake from preview
  const [instantCamera, setInstantCamera] = useState(() => {
    return !!(location.state?.openCameraWithActivity && location.state?.instantCamera);
  });

  useEffect(() => {
    if (location.state?.openCameraWithActivity) {
      const activityName = location.state.openCameraWithActivity;
      const captureMode = location.state.captureMode || 'photo';
      const isInstant = location.state.instantCamera;
      
      setSelectedActivity(activityName);
      setInitialCaptureMode(captureMode);
      setShowCamera(true);
      
      if (!isInstant) {
        setCameraEntering(true);
        setTimeout(() => {
          setCameraEntering(false);
        }, 500);
      }
      
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.openCameraWithActivity, location.state?.captureMode, location.state?.instantCamera, navigate]);

  const handleCardClick = () => {
    setShowActivitySheet(true);
  };

  const handleAddPhoto = () => {
    setEditingPhotoId(null);
    // Open dedicated Gallery page (no overlay)
    navigate('/gallery', {
      state: { dayNumber: getNextDayNumber() },
    });
  };

  const handleOpenCamera = () => {
    setEditingPhotoId(null);
    setCameraEntering(true);
    setShowCamera(true);
    setTimeout(() => setCameraEntering(false), 500);
  };

  const handleActivitySelect = useCallback((activityName: string) => {
    const activityData = ACTIVITY_OPTIONS.find(a => a.name === activityName);
    if (!activityData) return;
    
    setSelectedActivity(activityName);
    setAcknowledgedActivity(activityData);
    
    setSheetPhase('acknowledge');
    
    setTimeout(() => {
      setSheetPhase('exit');
    }, 1200);
    
    setTimeout(() => {
      setShowActivitySheet(false);
      setSheetPhase('select');
      setAcknowledgedActivity(null);
      
      if (pendingMedia) {
        // For new uploads, calculate next day; for edits, use existing photo's day
        const editingPhoto = editingPhotoId ? photos.find(p => p.id === editingPhotoId) : null;
        const targetDayNumber = editingPhoto ? editingPhoto.dayNumber : getNextDayNumber();
        
        navigate('/preview', { 
          state: { 
            imageUrl: pendingMedia.url, 
            isVideo: pendingMedia.isVideo, 
            activity: activityName,
            isReview: !!editingPhotoId,
            photoId: editingPhotoId,
            dayNumber: targetDayNumber,
          } 
        });
        setPendingMedia(null);
        setEditingPhotoId(null);
      }
      setSelectedActivity(null);
    }, 1600);
  }, [pendingMedia, navigate, editingPhotoId, photos, getNextDayNumber]);

  const handleCapture = (mediaDataUrl: string, isVideo?: boolean) => {
    setShowCamera(false);
    setPendingMedia({ url: mediaDataUrl, isVideo: isVideo || false });
    setShowActivitySheet(true);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
    setSelectedActivity(null);
    setPendingMedia(null);
    setEditingPhotoId(null);
  };

  const handleOverlayClick = () => {
    setShowActivitySheet(false);
    setSelectedActivity(null);
    setPendingMedia(null);
    setEditingPhotoId(null);
  };

  const simulateNextDay = () => {
    const current = simulatedDate ? new Date(simulatedDate) : new Date();
    current.setDate(current.getDate() + 1);
    setSimulatedDate(current.toISOString().split('T')[0]);
  };

  const resetSimulation = () => {
    setSimulatedDate(null);
  };

  const clearAllPhotos = () => {
    // Clear photos is now a no-op since photos come from backend
    // User should use the delete functionality instead
    toast.info('Use the delete function to remove individual photos');
  };

  const handleRemovePhoto = (photoId: string) => {
    // This would need to call deleteActivity from the hook
    // For now, navigate to preview for editing
    toast.info('Navigate to photo to delete');
  };

  // Handle edit photo - opens preview to re-edit same day
  const handleEditPhoto = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    navigate('/preview', {
      state: {
        imageUrl: photo.storageUrl,
        originalUrl: photo.storageUrl,
        isVideo: photo.isVideo,
        activity: photo.activity,
        frame: photo.frame,
        duration: photo.duration,
        pr: photo.pr,
        isReview: true,
        photoId: photo.id,
        dayNumber: photo.dayNumber,
      },
    });
  };

  const handleRefresh = useCallback(async () => {
    await refreshActivities();
  }, [refreshActivities]);

  // Calculate hours left until midnight
  const getHoursUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60));
  };

  const hasUploadedToday = () => false; // Not used in new logic

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatePresence>
        {shareTransitionImage && (
          <SharedImageTransition
            imageUrl={shareTransitionImage}
            targetSelector='[data-shared-element="cult-ninja-widget"]'
            onComplete={() => setShareTransitionImage(null)}
          />
        )}
      </AnimatePresence>

      {!instantCamera && <AuroraBackground />}
      
      {!instantCamera && (
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="relative z-10 flex flex-col min-h-screen">
            <div className="h-12" />
          
            {/* Top Controls Row */}
            <div className="flex justify-between items-start px-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-foreground/10 backdrop-blur-sm rounded-full text-foreground/70 hover:bg-foreground/20 transition-colors">
                    {selectedLayout === 'layout1' ? 'Layout 1' : selectedLayout === 'layout2' ? 'Layout 2' : 'Layout 3'}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl z-50"
                  align="start"
                >
                  <DropdownMenuItem 
                    onClick={() => setSelectedLayout('layout1')}
                    className={`text-white/80 hover:text-white hover:bg-white/10 cursor-pointer ${selectedLayout === 'layout1' ? 'bg-white/10' : ''}`}
                  >
                    Layout 1
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedLayout('layout2')}
                    className={`text-white/80 hover:text-white hover:bg-white/10 cursor-pointer ${selectedLayout === 'layout2' ? 'bg-white/10' : ''}`}
                  >
                    Layout 2
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedLayout('layout3')}
                    className={`text-white/80 hover:text-white hover:bg-white/10 cursor-pointer ${selectedLayout === 'layout3' ? 'bg-white/10' : ''}`}
                  >
                    Layout 3
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex flex-col gap-2 items-end">
                {reelHistory.length > 0 && (
                  <button
                    onClick={() => setShowReelHistoryGallery(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/15 backdrop-blur-sm rounded-full text-white/80 hover:bg-white/25 transition-colors"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Film className="w-3 h-3" />
                    Reels ({reelHistory.length})
                  </button>
                )}
                <button
                  onClick={simulateNextDay}
                  className="px-3 py-1.5 text-xs bg-foreground/10 backdrop-blur-sm rounded-full text-foreground/70 hover:bg-foreground/20 transition-colors"
                >
                  Test: Next Day
                </button>
                <button
                  onClick={clearAllPhotos}
                  className="px-3 py-1.5 text-xs bg-red-500/20 backdrop-blur-sm rounded-full text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Clear Photos
                </button>
                {simulatedDate && (
                  <>
                    <span className="text-[10px] text-foreground/50 text-center">
                      {simulatedDate}
                    </span>
                    <button
                      onClick={resetSimulation}
                      className="px-3 py-1 text-[10px] text-foreground/50 hover:text-foreground/70 transition-colors"
                    >
                      Reset
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="py-2" />
            
            <main className="flex-1 flex flex-col justify-center py-6 -mt-[100px]">
              {selectedLayout === 'layout1' ? (
                <PhotoUploadCard 
                  photos={photos} 
                  onCardClick={handleCardClick}
                  hasUploadedToday={hasUploadedToday()}
                  hoursUntilNextUpload={getHoursUntilMidnight()}
                  currentDate={getCurrentDate()}
                />
              ) : selectedLayout === 'layout2' ? (
                <WidgetLayout2 
                  photos={photos} 
                  onCardClick={handleCardClick}
                  hasUploadedToday={hasUploadedToday()}
                  hoursUntilNextUpload={getHoursUntilMidnight()}
                  currentDate={getCurrentDate()}
                />
              ) : (
                <WidgetLayout3 
                  photos={photos} 
                  onAddPhoto={handleAddPhoto}
                  onOpenCamera={handleOpenCamera}
                  currentDate={getCurrentDate()}
                  onGenerateReel={handleGenerateReel}
                  onRemovePhoto={handleRemovePhoto}
                  onEditPhoto={handleEditPhoto}
                  isGenerating={isGenerating}
                  isUploading={isUploading}
                  weekTransitionAnimation={weekTransitionAnimation}
                  reelPill={reelPill}
                />
              )}
            </main>
            
            <div className="h-8" />
          </div>
        </PullToRefresh>
      )}

      {/* Activity Selection Bottom Sheet */}
      {showActivitySheet && (
        <>
          <div 
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-500 ${
              sheetPhase === 'exit' ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={sheetPhase === 'select' ? handleOverlayClick : undefined}
          />
          <div 
            className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
              sheetPhase === 'exit' 
                ? 'translate-y-full opacity-0' 
                : 'animate-slide-up'
            }`} 
            style={{ 
              height: sheetPhase === 'acknowledge' ? '50vh' : '90vh',
              transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s ease-out, opacity 0.5s ease-out',
            }}
          >
            <div className="bg-black rounded-t-3xl border-t border-white/10 h-full overflow-hidden">
              <div 
                className={`absolute inset-0 p-6 pb-10 transition-all duration-500 ${
                  sheetPhase === 'select' 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 -translate-y-8 pointer-events-none'
                }`}
              >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-bold italic text-foreground text-center mb-8">Choose your activity</h3>
                <div className="grid grid-cols-3 gap-4 px-2">
                  {ACTIVITY_OPTIONS.map((activityOption) => (
                    <button
                      key={activityOption.name}
                      onClick={() => handleActivitySelect(activityOption.name)}
                      className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden">
                        <img 
                          src={activityOption.icon} 
                          alt={activityOption.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{activityOption.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div 
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
                  sheetPhase === 'acknowledge' 
                    ? 'opacity-100 scale-100' 
                    : sheetPhase === 'exit'
                    ? 'opacity-0 scale-110'
                    : 'opacity-0 scale-90 pointer-events-none'
                }`}
              >
                {acknowledgedActivity && (
                  <div className="flex flex-col items-center">
                    <div className="relative animate-acknowledge-icon">
                      <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                        <img 
                          src={acknowledgedActivity.icon} 
                          alt={acknowledgedActivity.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div 
                        className="absolute bottom-0 right-0 w-11 h-11 rounded-full flex items-center justify-center animate-check-pop shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                          boxShadow: '0 4px 20px rgba(74, 222, 128, 0.5)',
                          transform: 'translate(4px, 4px)',
                        }}
                      >
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="mt-8 text-center animate-acknowledge-text">
                      <p className="text-white text-2xl font-bold tracking-tight">
                        {acknowledgedActivity.name} activity logged
                      </p>
                      <p className="text-white/70 text-base mt-3">
                        Capture your moment
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2 text-white/50 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>Camera opening...</span>
                      </div>
                    </div>
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ marginTop: '-24px' }}>
                      <div 
                        className="w-48 h-48 rounded-full border-2 border-green-400/30 animate-ripple-out"
                        style={{ animationDelay: '0.3s' }}
                      />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ marginTop: '-24px' }}>
                      <div 
                        className="w-48 h-48 rounded-full border-2 border-green-400/20 animate-ripple-out"
                        style={{ animationDelay: '0.6s' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Gallery selection uses /gallery route (no overlay) */}

      {showCamera && (
        <div className={`transition-all duration-500 ease-out ${
          cameraEntering && !instantCamera ? 'animate-camera-enter' : ''
        }`}>
          <CameraUI
            activity={selectedActivity || 'Activity'}
            week={currentWeek}
            day={currentDay}
            onCapture={(imageUrl, mode) => {
              handleCapture(imageUrl, mode);
              setInstantCamera(false);
            }}
            onClose={() => {
              handleCameraClose();
              setInstantCamera(false);
            }}
            initialCaptureMode={initialCaptureMode}
          />
        </div>
      )}

      {/* Reel Generation Overlay - shows on play button tap */}
      <ReelGenerationOverlay 
        isVisible={isGenerating} 
        currentStep={currentStep}
      />

      <ReelPreviewScreen
        isVisible={showReelPreview}
        reelHistory={reelHistory}
        currentIndex={currentReelIndex}
        onIndexChange={setCurrentReelIndex}
        onClose={handleCloseReelPreview}
        onRecreate={handleRecreateReel}
      />

      <ReelHistoryGallery
        isOpen={showReelHistoryGallery}
        reelHistory={reelHistory}
        onClose={() => setShowReelHistoryGallery(false)}
        onSelectReel={handleSelectReelFromGallery}
        onClearHistory={clearHistory}
      />
    </div>
  );
};

export default Index;
