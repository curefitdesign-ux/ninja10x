import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import AuroraBackground from '@/components/AuroraBackground';
import PhotoUploadCard from '@/components/PhotoUploadCard';
import WidgetLayout2 from '@/components/WidgetLayout2';
import WidgetLayout3 from '@/components/WidgetLayout3';
import RecentPhotosGallery from '@/components/RecentPhotosGallery';
import ReelGenerationOverlay from '@/components/ReelGenerationOverlay';
import ReelPreviewScreen from '@/components/ReelPreviewScreen';
import { useFitnessReel } from '@/hooks/use-fitness-reel';

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

interface Photo {
  id: string;
  url: string; // Framed/template image URL
  originalUrl?: string; // Original photo for film strip
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  uploadDate: string; // YYYY-MM-DD format
}

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
  const [photos, setPhotos] = useState<Photo[]>(() => {
    try {
      const raw = localStorage.getItem('cn_photos');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
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
  
  // Show preview when reel is ready
  useEffect(() => {
    if (reelHistory.length > 0 && !isGenerating && currentStep === 'complete') {
      setShowReelPreview(true);
    }
  }, [reelHistory, isGenerating, currentStep]);
  
  const handleGenerateReel = useCallback((photosToProcess: typeof photos) => {
    setLastGeneratedPhotos(photosToProcess);
    // Transform photos to the format expected by the API
    const photoData = photosToProcess.map((photo, index) => ({
      id: photo.id,
      imageUrl: photo.originalUrl || photo.url,
      activity: photo.activity || 'Activity',
      duration: photo.duration,
      pr: photo.pr,
      uploadDate: photo.uploadDate,
      dayNumber: index + 1,
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

  useEffect(() => {
    try {
      const data = JSON.stringify(photos);
      localStorage.setItem('cn_photos', data);
    } catch (e) {
      console.error('Failed to save photos to localStorage:', e);
      // Storage might be full - we could notify user or compress images
    }
  }, [photos]);

  // Get current date (or simulated date for testing)
  const getCurrentDate = () => {
    if (simulatedDate) return simulatedDate;
    return new Date().toISOString().split('T')[0];
  };

  // Check if user has already uploaded today
  const hasUploadedToday = () => {
    const today = getCurrentDate();
    return photos.some(photo => photo.uploadDate === today);
  };

  // Get today's photo if exists
  const getTodaysPhoto = () => {
    const today = getCurrentDate();
    return photos.find(photo => photo.uploadDate === today);
  };

  // Calculate hours left until midnight
  const getHoursUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60));
  };

  // Handle save from preview page
  useEffect(() => {
    if (location.state?.savePhoto && location.state?.imageUrl && location.state?.activity) {
      const today = getCurrentDate();
      const incomingUrl = location.state.imageUrl;
      const incomingOriginalUrl = location.state.originalUrl || incomingUrl;
      const isReview = location.state.isReview;
      const photoId = location.state.photoId;

      if (isReview && photoId) {
        // Update existing photo (reviewing/editing)
        setPhotos((prev) => prev.map(photo => 
          photo.id === photoId 
            ? {
                ...photo,
                url: incomingUrl,
                originalUrl: incomingOriginalUrl,
                frame: location.state.frame || photo.frame,
                duration: location.state.duration || photo.duration,
                pr: location.state.pr || photo.pr,
              }
            : photo
        ));
      } else {
        // Add new photo - each photo gets a unique "day" by calculating based on photo count
        // This treats each upload as a separate day entry
        setPhotos((prev) => {
          const uniqueDate = new Date();
          uniqueDate.setDate(uniqueDate.getDate() + prev.length); // Each photo gets a "future" unique day
          const uniqueDateStr = uniqueDate.toISOString().split('T')[0];
          
          const newPhoto: Photo = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: incomingUrl,
            originalUrl: incomingOriginalUrl,
            isVideo: location.state.isVideo || false,
            activity: location.state.activity,
            frame: location.state.frame || 'shaky',
            duration: location.state.duration,
            pr: location.state.pr,
            uploadDate: uniqueDateStr,
          };
          return [...prev, newPhoto];
        });
      }

      // Clear the navigation state immediately to prevent re-adding
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.savePhoto, location.state?.imageUrl, location.state?.activity, simulatedDate]);

  // Handle retake from preview - open camera directly with the activity and capture mode
  const [instantCamera, setInstantCamera] = useState(() => {
    // Check if we should show camera immediately on mount
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
      
      // Clear the navigation state
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.openCameraWithActivity, location.state?.captureMode, location.state?.instantCamera]);

  // Calculate week and day based on photos
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);
  const currentDay = (photos.length % 3) + 1;

  const handleCardClick = () => {
    // Always open activity sheet to add new photo (allows multiple uploads)
    setShowActivitySheet(true);
  };

  // Handler specifically for Layout 3's add photo button - opens gallery directly
  const handleAddPhoto = () => {
    setShowRecentGallery(true);
  };

  // Handle photo selected from gallery
  const handleGalleryPhotoSelect = (photoDataUrl: string) => {
    setShowRecentGallery(false);
    // Navigate to preview with default activity - user can change in preview
    navigate('/preview', { 
      state: { imageUrl: photoDataUrl, isVideo: false, activity: 'Activity' } 
    });
  };

  const handleActivitySelect = useCallback((activity: string) => {
    const activityData = activities.find(a => a.name === activity);
    if (!activityData) return;
    
    setSelectedActivity(activity);
    setAcknowledgedActivity(activityData);
    
    // Phase 1: Morph sheet into acknowledgement
    setSheetPhase('acknowledge');
    
    // Phase 2: After showing acknowledgement, prepare exit (increased time)
    setTimeout(() => {
      setSheetPhase('exit');
    }, 2200);
    
    // Phase 3: Open camera with entrance animation (more delay)
    setTimeout(() => {
      setCameraEntering(true);
      setShowCamera(true);
    }, 2600);
    
    // Phase 4: Close sheet and reset
    setTimeout(() => {
      setShowActivitySheet(false);
      setSheetPhase('select');
      setAcknowledgedActivity(null);
    }, 2700);
    
    setTimeout(() => {
      setCameraEntering(false);
    }, 3100);
  }, []);

  const handleCapture = (mediaDataUrl: string, isVideo?: boolean) => {
    setShowCamera(false);
    // Navigate to preview page with the media data URL
    navigate('/preview', { 
      state: { imageUrl: mediaDataUrl, isVideo, activity: selectedActivity } 
    });
    setSelectedActivity(null);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
    setSelectedActivity(null);
  };

  const handleOverlayClick = () => {
    setShowActivitySheet(false);
    setSelectedActivity(null);
  };

  // Simulate next day for testing
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
    localStorage.removeItem('cn_photos');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Aurora Background - hidden when instant camera */}
      {!instantCamera && <AuroraBackground />}
      
      {/* Content - hidden when instant camera */}
      {!instantCamera && (
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Status Bar Space */}
          <div className="h-12" />
          
          {/* Top Controls Row */}
          <div className="flex justify-between items-start px-4">
            {/* Layout Dropdown */}
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

            {/* Test Controls */}
            <div className="flex flex-col gap-2 items-end">
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
          
          {/* Spacer */}
          <div className="py-2" />
          
          {/* Main Content */}
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
                currentDate={getCurrentDate()}
                onGenerateReel={handleGenerateReel}
              />
            )}
          </main>
          
          {/* Bottom Safe Area */}
          <div className="h-8" />
        </div>
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
              {/* Select Phase - Activity Grid */}
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
              
              {/* Acknowledge Phase - Icon centered with tick */}
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
                    {/* Activity Icon with animated entry */}
                    <div className="relative animate-acknowledge-icon">
                      <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                        <img 
                          src={acknowledgedActivity.icon} 
                          alt={acknowledgedActivity.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Animated Check Badge - positioned better */}
                      <div 
                        className="absolute bottom-0 right-0 w-11 h-11 rounded-full flex items-center justify-center animate-check-pop shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                          boxShadow: '0 4px 20px rgba(74, 222, 128, 0.5)',
                          transform: 'translate(4px, 4px)',
                        }}
                      >
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    
                    {/* Text */}
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
                    
                    {/* Ripple effect - positioned around icon */}
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

      {/* Recent Photos Gallery */}
      <RecentPhotosGallery
        isOpen={showRecentGallery}
        onClose={() => setShowRecentGallery(false)}
        onSelectPhoto={handleGalleryPhotoSelect}
      />

      {/* Camera UI */}
      {showCamera && selectedActivity && (
        <div className={`transition-all duration-500 ease-out ${
          cameraEntering && !instantCamera ? 'animate-camera-enter' : ''
        }`}>
          <CameraUI
            activity={selectedActivity}
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

      {/* Reel Generation Overlay */}
      <ReelGenerationOverlay 
        isVisible={isGenerating} 
        currentStep={currentStep} 
      />

      {/* Reel Preview Screen */}
      <ReelPreviewScreen
        isVisible={showReelPreview}
        reelHistory={reelHistory}
        currentIndex={currentReelIndex}
        onIndexChange={setCurrentReelIndex}
        onClose={handleCloseReelPreview}
        onRecreate={handleRecreateReel}
      />
    </div>
  );
};

export default Index;
