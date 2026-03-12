import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// import { hasRecapCached, getRecapFromCache } from '@/hooks/use-recap-cache';
import { getNextDayNumber as getNextDay, getRealActivities, canLogActivity, getCurrentWeek, hasLoggedToday } from '@/lib/journey-rules';
import { toast } from 'sonner';
import ImmersiveHomeLayout from '@/components/ImmersiveHomeLayout';
import PullToRefresh from '@/components/PullToRefresh';

import SharedImageTransition from '@/components/SharedImageTransition';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
// import type { PillState } from '@/components/ReelProgressPill';

import CameraUI from '@/components/CameraUI';

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
  originalUrl?: string; // Raw source URL
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  dayNumber: number; // 1-12, each upload = new day
  createdAt?: string;
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



const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Load photos from backend (single source of truth)
  const { activities, loading: activitiesLoading, refresh: refreshActivities, userId } = useJourneyActivities();
  
  // Filter out recap entries — only real activities (day_number 1-12)
  const realActivities = useMemo(() => getRealActivities(activities), [activities]);
  
  // Convert backend activities to Photo shape for compatibility
  const photos: Photo[] = realActivities.map(a => ({
    id: a.id,
    storageUrl: a.storageUrl,
    originalUrl: a.originalUrl,
    isVideo: a.isVideo,
    activity: a.activity,
    frame: a.frame as Photo['frame'],
    duration: a.duration,
    pr: a.pr,
    dayNumber: a.dayNumber,
    createdAt: a.createdAt,
    reactions: a.reactions ? Object.fromEntries(
      Object.entries(a.reactions).map(([type, data]) => [type, { count: data.count }])
    ) as Record<ReactionType, { count: number }> : undefined,
  }));

  // Shared-element transition from ShareSheet (X) to Cult Ninja widget (this page)
  const [shareTransitionImage, setShareTransitionImage] = useState<string | null>(null);
  useEffect(() => {
    if (location.state?.fromShare && location.state?.transitionToWidget) {
      setShareTransitionImage(location.state.transitionImage || null);
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
  
  const [initialCaptureMode, setInitialCaptureMode] = useState<'photo' | 'video'>('photo');
  const [pendingMedia, setPendingMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [weekTransitionAnimation, setWeekTransitionAnimation] = useState(false);
  const [previousPhotoCount, setPreviousPhotoCount] = useState(photos.length);
  
  // Reel generation temporarily disabled
  const handleGenerateReel = useCallback((_photosToProcess: Photo[], _forceRegenerate = true) => {
    // No-op: reel generation disabled
  }, []);

  // Reel cache/pill temporarily disabled
  const cachedWeeks = new Set<number>();
  const handleWeekReelTap = useCallback((_weekNumber: number) => {
    // No-op: reel generation disabled
  }, []);
  const reelPill = null;
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
      
      navigate('/reel', { replace: true, state: null });
    }
  }, [location.state?.openCameraWithActivity, location.state?.captureMode, location.state?.instantCamera, navigate]);

  // Week completion detection (reel auto-trigger disabled)
  useEffect(() => {
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

  const getNextDayNumber = () => getNextDay(photos);

  const currentWeek = getCurrentWeek(photos);
  const currentDay = (photos.length % 3) + 1;

  const handleCardClick = () => {
    setShowActivitySheet(true);
  };

  const handleAddPhoto = () => {
    setEditingPhotoId(null);
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
    toast.info('Use the delete function to remove individual photos');
  };

  const handleRemovePhoto = (photoId: string) => {
    toast.info('Navigate to photo to delete');
  };

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

  const getHoursUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60));
  };

  const hasUploadedToday = () => false;

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

      {!instantCamera && (
        <PullToRefresh onRefresh={handleRefresh}>
          <ImmersiveHomeLayout
            photos={photos}
            onAddPhoto={handleAddPhoto}
            onOpenCamera={handleOpenCamera}
            currentDate={getCurrentDate()}
            onGenerateReel={handleGenerateReel}
            onRemovePhoto={handleRemovePhoto}
            onEditPhoto={handleEditPhoto}
            isGenerating={false}
            isUploading={isUploading}
            weekTransitionAnimation={weekTransitionAnimation}
            reelPill={reelPill}
            onWeekReelTap={handleWeekReelTap}
            cachedWeeks={cachedWeeks}
          />
        </PullToRefresh>
      )}

      {/* Activity Selection Bottom Sheet */}
      {showActivitySheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleOverlayClick} />
          
          <AnimatePresence mode="wait">
            {sheetPhase === 'select' && (
              <div className="relative bg-[#1a1a1f] rounded-t-3xl p-6 pb-10 animate-slide-up">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                <h3 className="text-white font-semibold text-lg mb-4">What did you do?</h3>
                <div className="grid grid-cols-3 gap-3">
                  {ACTIVITY_OPTIONS.map((activity) => (
                    <button
                      key={activity.name}
                      onClick={() => handleActivitySelect(activity.name)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        selectedActivity === activity.name
                          ? 'bg-white/20 scale-95'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <img src={activity.icon} alt={activity.name} className="w-10 h-10 object-contain" />
                      <span className="text-white/80 text-xs">{activity.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {sheetPhase === 'acknowledge' && acknowledgedActivity && (
              <div className="relative bg-[#1a1a1f] rounded-t-3xl p-8 pb-12 flex flex-col items-center animate-slide-up">
                <img 
                  src={acknowledgedActivity.icon} 
                  alt={acknowledgedActivity.name} 
                  className="w-16 h-16 object-contain mb-4 animate-bounce-in"
                />
                <h3 className="text-white font-bold text-xl">{acknowledgedActivity.name}</h3>
                <p className="text-white/40 text-sm mt-1">Let's capture your moment!</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Camera */}
      {showCamera && (
        <div className={`fixed inset-0 z-50 bg-black ${
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
    </div>
  );
};

export default Index;
