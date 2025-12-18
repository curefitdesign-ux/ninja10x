import { useState, useRef } from 'react';
import AuroraBackground from '@/components/AuroraBackground';
import PhotoUploadCard from '@/components/PhotoUploadCard';

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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCardClick = () => {
    if (photos.length < 12) {
      setShowActivitySheet(true);
    }
  };

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    setShowActivitySheet(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedActivity) {
      const url = URL.createObjectURL(file);
      const newPhoto: Photo = {
        id: `photo-${Date.now()}`,
        url,
        activity: selectedActivity,
      };
      setPhotos((prev) => [...prev, newPhoto]);
      setSelectedActivity(null);
    }
    e.target.value = '';
  };

  const handleOverlayClick = () => {
    setShowActivitySheet(false);
    setSelectedActivity(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Aurora Background */}
      <AuroraBackground />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Status Bar Space */}
        <div className="h-12" />
        
        {/* Spacer */}
        <div className="py-2" />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center py-6">
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
            <div className="bg-background/80 backdrop-blur-xl rounded-t-3xl p-6 pb-10 border-t border-foreground/10 h-full">
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
    </div>
  );
};

export default Index;
