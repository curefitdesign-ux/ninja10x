import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import AuroraBackground from '@/components/AuroraBackground';
import PhotoUploadCard from '@/components/PhotoUploadCard';
import WidgetLayout2 from '@/components/WidgetLayout2';
import WidgetLayout3 from '@/components/WidgetLayout3';

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
  const [showActivityToast, setShowActivityToast] = useState(false);
  const [toastActivity, setToastActivity] = useState<string | null>(null);
  const [toastPhase, setToastPhase] = useState<'enter' | 'hold' | 'expand'>('enter');
  const [sheetExiting, setSheetExiting] = useState(false);
  const [cameraEntering, setCameraEntering] = useState(false);
  const [simulatedDate, setSimulatedDate] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('layout3');

  useEffect(() => {
    try {
      localStorage.setItem('cn_photos', JSON.stringify(photos));
    } catch {
      // ignore
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

      const newPhoto: Photo = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: incomingUrl,
        originalUrl: incomingOriginalUrl,
        isVideo: location.state.isVideo || false,
        activity: location.state.activity,
        frame: location.state.frame || 'shaky',
        duration: location.state.duration,
        pr: location.state.pr,
        uploadDate: today,
      };

      // Always add new photo
      setPhotos((prev) => [...prev, newPhoto]);

      // Clear the navigation state immediately to prevent re-adding
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.savePhoto, location.state?.imageUrl, location.state?.activity, simulatedDate]);

  // Calculate week and day based on photos
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);
  const currentDay = (photos.length % 3) + 1;

  const handleCardClick = () => {
    // Always open activity sheet to add new photo (allows multiple uploads)
    setShowActivitySheet(true);
  };

  // Handler specifically for Layout 3's add photo button
  const handleAddPhoto = () => {
    setShowActivitySheet(true);
  };

  const handleActivitySelect = useCallback((activity: string) => {
    setSelectedActivity(activity);
    setToastActivity(activity);
    
    // Phase 1: Sheet exit animation
    setSheetExiting(true);
    
    // Phase 2: Show toast rising from bottom (where sheet was)
    setTimeout(() => {
      setShowActivitySheet(false);
      setSheetExiting(false);
      setToastPhase('enter');
      setShowActivityToast(true);
    }, 250);
    
    // Phase 3: Toast holds briefly
    setTimeout(() => {
      setToastPhase('hold');
    }, 700);
    
    // Phase 4: Toast expands into camera
    setTimeout(() => {
      setToastPhase('expand');
    }, 1200);
    
    // Phase 5: Open camera and hide toast
    setTimeout(() => {
      setCameraEntering(true);
      setShowCamera(true);
    }, 1450);
    
    setTimeout(() => {
      setShowActivityToast(false);
      setToastPhase('enter');
    }, 1550);
    
    setTimeout(() => {
      setCameraEntering(false);
    }, 1900);
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
      {/* Aurora Background */}
      <AuroraBackground />
      
      {/* Content */}
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
            />
          )}
        </main>
        
        {/* Bottom Safe Area */}
        <div className="h-8" />
      </div>

      {/* Activity Selection Bottom Sheet */}
      {showActivitySheet && (
        <>
          <div 
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${sheetExiting ? 'opacity-0' : 'opacity-100'}`}
            onClick={handleOverlayClick}
          />
          <div 
            className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
              sheetExiting 
                ? 'translate-y-full opacity-0 scale-95' 
                : 'animate-slide-up'
            }`} 
            style={{ height: '90vh' }}
          >
            <div className="bg-black rounded-t-3xl p-6 pb-10 border-t border-white/10 h-full">
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
          </div>
        </>
      )}

      {/* Activity Logged Toast - Contextual Transition */}
      {showActivityToast && toastActivity && (
        <div 
          className={`fixed inset-0 z-[60] flex items-end justify-center pointer-events-none pb-32 transition-all duration-500 ease-out ${
            toastPhase === 'enter' ? 'items-end pb-32' : 
            toastPhase === 'hold' ? 'items-center pb-0' : 
            'items-center pb-0'
          }`}
        >
          <div 
            className={`relative backdrop-blur-2xl transition-all ease-out ${
              toastPhase === 'enter' 
                ? 'px-8 py-5 rounded-3xl animate-toast-rise' 
                : toastPhase === 'hold'
                ? 'px-8 py-5 rounded-3xl animate-toast-float'
                : 'px-12 py-8 rounded-[2rem] animate-toast-expand'
            }`}
            style={{
              background: toastPhase === 'expand' 
                ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: toastPhase === 'expand'
                ? '0 0 120px rgba(74,222,128,0.3), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 80px rgba(74,222,128,0.15)',
              border: '1px solid rgba(255,255,255,0.15)',
              transform: toastPhase === 'expand' ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            {/* Glow effect that intensifies on expand */}
            <div 
              className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${
                toastPhase === 'expand' ? 'opacity-70' : 'opacity-40'
              }`}
              style={{
                background: 'radial-gradient(ellipse at center, rgba(74,222,128,0.25) 0%, transparent 70%)',
              }}
            />
            
            {/* Content */}
            <div className={`relative flex flex-col items-center gap-3 transition-all duration-300 ${
              toastPhase === 'expand' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
            }`}>
              {/* Check icon */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(74,222,128,0.3) 0%, rgba(74,222,128,0.1) 100%)',
                  boxShadow: '0 0 20px rgba(74,222,128,0.3)',
                }}
              >
                <Check className="w-6 h-6 text-green-400" strokeWidth={3} />
              </div>
              
              {/* Text */}
              <div className="text-center">
                <p className="text-white/90 font-semibold text-lg tracking-tight">
                  {toastActivity} logged
                </p>
                <p className="text-white/50 text-sm mt-0.5">
                  Now make it memorable
                </p>
              </div>
            </div>
            
            {/* Camera icon appears on expand */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              toastPhase === 'expand' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-white/60" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera UI */}
      {showCamera && selectedActivity && (
        <div className={`transition-all duration-500 ease-out ${
          cameraEntering ? 'animate-camera-enter' : ''
        }`}>
          <CameraUI
            activity={selectedActivity}
            week={currentWeek}
            day={currentDay}
            onCapture={handleCapture}
            onClose={handleCameraClose}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
