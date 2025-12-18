import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuroraBackground from '@/components/AuroraBackground';
import PhotoUploadCard from '@/components/PhotoUploadCard';
import CameraUI from '@/components/CameraUI';

interface Photo {
  id: string;
  url: string;
  activity?: string;
}

const activities = [
  'Running', 'Cycling', 'Treking',
  'Swimming', 'Yoga', 'GYM',
  'Cricket', 'Badminton', 'Tennis',
  'Meditation', 'Boxing', 'Dance'
];

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Handle save from preview page
  useEffect(() => {
    if (location.state?.savePhoto && location.state?.imageUrl && location.state?.activity) {
      const newPhoto: Photo = {
        id: `photo-${Date.now()}`,
        url: location.state.imageUrl,
        activity: location.state.activity,
      };
      setPhotos((prev) => [...prev, newPhoto]);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Calculate week and day based on photos
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);
  const currentDay = (photos.length % 3) + 1;

  const handleCardClick = () => {
    if (photos.length < 12) {
      setShowActivitySheet(true);
    }
  };

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    setShowActivitySheet(false);
    setShowCamera(true);
  };

  const handleCapture = (file: File) => {
    // Convert to base64 for persistence across navigation
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      setShowCamera(false);
      // Navigate to preview page
      navigate('/preview', { 
        state: { imageUrl: base64Url, activity: selectedActivity } 
      });
      setSelectedActivity(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
    setSelectedActivity(null);
  };

  const handleOverlayClick = () => {
    setShowActivitySheet(false);
    setSelectedActivity(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Aurora Background */}
      <AuroraBackground />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Status Bar Space */}
        <div className="h-12" />
        
        {/* Spacer */}
        <div className="py-2" />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center py-6 -mt-[100px]">
          <PhotoUploadCard photos={photos} onCardClick={handleCardClick} />
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
            <div className="bg-white/10 backdrop-blur-xl rounded-t-3xl p-6 pb-10 border-t border-foreground/10 h-full">
              <div className="w-12 h-1 bg-foreground/20 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground text-center mb-8">Choose your activity</h3>
              <div className="grid grid-cols-3 gap-4 px-2">
                {activities.map((activity) => (
                  <button
                    key={activity}
                    onClick={() => handleActivitySelect(activity)}
                    className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-foreground/5 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-foreground/10 backdrop-blur-sm" />
                    <span className="text-sm font-semibold text-foreground italic">{activity}</span>
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
