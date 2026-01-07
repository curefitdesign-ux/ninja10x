import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Film } from 'lucide-react';
import { toast } from 'sonner';
import AuroraBackground from '@/components/AuroraBackground';
import PhotoUploadCard from '@/components/PhotoUploadCard';
import WidgetLayout2 from '@/components/WidgetLayout2';
import WidgetLayout3 from '@/components/WidgetLayout3';
import RecentPhotosGallery from '@/components/RecentPhotosGallery';
import ReelGenerationOverlay from '@/components/ReelGenerationOverlay';
import ReelPreviewScreen from '@/components/ReelPreviewScreen';
import ReelHistoryGallery from '@/components/ReelHistoryGallery';
import PullToRefresh from '@/components/PullToRefresh';
import { useFitnessReel } from '@/hooks/use-fitness-reel';
import { uploadToStorage } from '@/services/storage-service';

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
}

const MAX_DAYS = 12;
const STORAGE_KEY = 'cn_photos_v2';

const activities = [
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
  
  // Load photos from localStorage - storage-first (only metadata + storageUrl)
  const [photos, setPhotos] = useState<Photo[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Filter out any photos without storageUrl (invalid)
      return Array.isArray(parsed) ? parsed.filter((p: Photo) => p.storageUrl) : [];
    } catch {
      return [];
    }
  });
  
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [sheetPhase, setSheetPhase] = useState<'select' | 'acknowledge' | 'exit'>('select');
  const [acknowledgedActivity, setAcknowledgedActivity] = useState<{ name: string; icon: string } | null>(null);
  const [cameraEntering, setCameraEntering] = useState(false);
  const [simulatedDate, setSimulatedDate] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('layout3');
  const [initialCaptureMode, setInitialCaptureMode] = useState<'photo' | 'video'>('photo');
  const [showRecentGallery, setShowRecentGallery] = useState(false);
  const [showReelHistoryGallery, setShowReelHistoryGallery] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  
  // Fitness reel generation
  const { 
    generateReel, 
    isGenerating, 
    currentStep, 
    reelHistory, 
    currentReelIndex, 
    setCurrentReelIndex,
    clearHistory 
  } = useFitnessReel();
  const [showReelPreview, setShowReelPreview] = useState(false);
  const [lastGeneratedPhotos, setLastGeneratedPhotos] = useState<typeof photos>([]);
  const [isUploading, setIsUploading] = useState(false);
  
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

  // Persist photos to localStorage (storage-first: only metadata + storageUrl)
  useEffect(() => {
    try {
      // Only persist photos with storageUrl
      const validPhotos = photos.filter(p => p.storageUrl);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validPhotos));
    } catch (e) {
      console.error('Failed to save photos to localStorage:', e);
    }
  }, [photos]);

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

  // Handle save from preview page - upload ORIGINAL to storage (not the framed version)
  useEffect(() => {
    if (location.state?.savePhoto && location.state?.activity) {
      // IMPORTANT: Use originalUrl (the raw photo/video) for storage, NOT imageUrl (which may be framed)
      const originalUrl = location.state.originalUrl || location.state.imageUrl;
      const isReview = location.state.isReview;
      const photoId = location.state.photoId;
      const isVideo = location.state.isVideo || false;

      if (!originalUrl) {
        toast.error('No media to save');
        navigate('/', { replace: true, state: null });
        return;
      }

      const uploadAndSave = async () => {
        // Only upload if it's a data URI
        let storageUrl: string | null = null;
        if (originalUrl.startsWith('data:')) {
          setIsUploading(true);
          
          storageUrl = await uploadToStorage(
            originalUrl,
            `journey-${Date.now()}`,
            isVideo
          );
          
          setIsUploading(false);
          
          if (!storageUrl) {
            toast.error('Upload failed. Please try again.');
            navigate('/', { replace: true, state: null });
            return;
          }
        } else if (originalUrl.startsWith('http')) {
          // Already a storage URL - use as-is
          storageUrl = originalUrl;
        } else {
          toast.error('Invalid image format');
          navigate('/', { replace: true, state: null });
          return;
        }

        if (isReview && photoId) {
          // EDIT: Update existing photo (same day, don't add new)
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === photoId
                ? {
                    ...photo,
                    storageUrl: storageUrl!,
                    frame: location.state.frame || photo.frame,
                    duration: location.state.duration || photo.duration,
                    pr: location.state.pr || photo.pr,
                    // Keep the same dayNumber
                  }
                : photo
            )
          );
          toast.success(`Day ${photos.find(p => p.id === photoId)?.dayNumber || ''} updated!`);
        } else {
          // NEW: Add new photo as next day
          const nextDay = getNextDayNumber();
          if (nextDay > MAX_DAYS && photos.length >= MAX_DAYS) {
            toast.error('Maximum 12 days reached. Edit existing days instead.');
            navigate('/', { replace: true, state: null });
            return;
          }

          const newPhoto: Photo = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            storageUrl: storageUrl!,
            isVideo,
            activity: location.state.activity,
            frame: location.state.frame || 'shaky',
            duration: location.state.duration,
            pr: location.state.pr,
            dayNumber: nextDay,
          };
          setPhotos((prev) => [...prev, newPhoto]);
          toast.success(`Day ${nextDay} added!`);
        }
      };

      uploadAndSave();
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.savePhoto, location.state?.originalUrl, location.state?.imageUrl, location.state?.activity, navigate, photos]);

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
    setShowRecentGallery(true);
  };

  const handleOpenCamera = () => {
    setEditingPhotoId(null);
    setCameraEntering(true);
    setShowCamera(true);
    setTimeout(() => setCameraEntering(false), 500);
  };

  const handleGalleryPhotoSelect = (photoDataUrl: string, isVideo?: boolean) => {
    setShowRecentGallery(false);
    setPendingMedia({ url: photoDataUrl, isVideo: isVideo || false });
    setShowActivitySheet(true);
  };

  const handleActivitySelect = useCallback((activity: string) => {
    const activityData = activities.find(a => a.name === activity);
    if (!activityData) return;
    
    setSelectedActivity(activity);
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
            activity,
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
  }, [pendingMedia, navigate, editingPhotoId]);

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
    setPhotos([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== photoId);
      // Re-number days after removal
      return filtered.map((p, idx) => ({ ...p, dayNumber: idx + 1 }));
    });
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
    await new Promise(resolve => setTimeout(resolve, 800));
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPhotos(parsed.filter((p: Photo) => p.storageUrl));
        }
      } catch {
        // ignore
      }
    }
  }, []);

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
                <h3 className="text-xl font-bold italic text-white text-center mb-8">Choose your activity</h3>
                <div className="grid grid-cols-3 gap-4 px-2">
                  {activities.map((activity) => (
                    <button
                      key={activity.name}
                      onClick={() => handleActivitySelect(activity.name)}
                      className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden">
                        <img 
                          src={activity.icon} 
                          alt={activity.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">{activity.name}</span>
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

      <RecentPhotosGallery
        isOpen={showRecentGallery}
        onClose={() => setShowRecentGallery(false)}
        onSelectPhoto={handleGalleryPhotoSelect}
      />

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
