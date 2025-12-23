import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuroraBackground from '@/components/AuroraBackground';
import PhotoUploadCard from '@/components/PhotoUploadCard';
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

interface Photo {
  id: string;
  url: string;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue';
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

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [simulatedDate, setSimulatedDate] = useState<string | null>(null); // For testing

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
      const existingTodayPhotoIndex = photos.findIndex(p => p.uploadDate === today);
      
      const newPhoto: Photo = {
        id: `photo-${Date.now()}`,
        url: location.state.imageUrl,
        activity: location.state.activity,
        frame: location.state.frame || 'shaky',
        duration: location.state.duration,
        pr: location.state.pr,
        uploadDate: today,
      };

      if (existingTodayPhotoIndex >= 0) {
        // Replace existing photo for today (edit mode)
        setPhotos((prev) => {
          const updated = [...prev];
          updated[existingTodayPhotoIndex] = newPhoto;
          return updated;
        });
      } else {
        // Add new photo
        setPhotos((prev) => [...prev, newPhoto]);
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, simulatedDate]);

  // Calculate week and day based on photos
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);
  const currentDay = (photos.length % 3) + 1;

  const handleCardClick = () => {
    const todaysPhoto = getTodaysPhoto();
    if (todaysPhoto) {
      // Edit existing photo
      navigate('/preview', { 
        state: { 
          imageUrl: todaysPhoto.url, 
          activity: todaysPhoto.activity,
          frame: todaysPhoto.frame,
          duration: todaysPhoto.duration,
          pr: todaysPhoto.pr,
          isReview: true
        } 
      });
    } else {
      // New upload
      setShowActivitySheet(true);
    }
  };

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    setShowActivitySheet(false);
    setShowCamera(true);
  };

  const handleCapture = (imageDataUrl: string) => {
    setShowCamera(false);
    // Navigate to preview page with the image data URL
    navigate('/preview', { 
      state: { imageUrl: imageDataUrl, activity: selectedActivity } 
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Aurora Background */}
      <AuroraBackground />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Status Bar Space */}
        <div className="h-12" />
        
        {/* Test Controls */}
        <div className="absolute top-14 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={simulateNextDay}
            className="px-3 py-1.5 text-xs bg-foreground/10 backdrop-blur-sm rounded-full text-foreground/70 hover:bg-foreground/20 transition-colors"
          >
            Test: Next Day
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
        
        {/* Spacer */}
        <div className="py-2" />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center py-6 -mt-[100px]">
          <PhotoUploadCard 
            photos={photos} 
            onCardClick={handleCardClick}
            hasUploadedToday={hasUploadedToday()}
            hoursUntilNextUpload={getHoursUntilMidnight()}
            currentDate={getCurrentDate()}
          />
        </main>
        
        {/* Bottom Safe Area */}
        <div className="h-8" />
      </div>

      {/* Activity Selection Bottom Sheet */}
      {showActivitySheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleOverlayClick}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up" style={{ height: '90vh' }}>
            <div className="bg-black rounded-t-3xl p-6 pb-10 border-t border-white/10 h-full">
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white text-center mb-8">Choose your activity</h3>
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

      {/* Camera UI */}
      {showCamera && selectedActivity && (
        <CameraUI
          activity={selectedActivity}
          week={currentWeek}
          day={currentDay}
          onCapture={handleCapture}
          onClose={handleCameraClose}
        />
      )}
    </div>
  );
};

export default Index;
