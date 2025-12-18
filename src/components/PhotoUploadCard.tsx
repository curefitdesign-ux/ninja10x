import { useState } from 'react';
import StackedPhotoCards from './StackedPhotoCards';
import WeekProgress from './WeekProgress';
import cardBackground from '@/assets/card-background.png';

interface Photo {
  id: string;
  url: string;
}

const PhotoUploadCard = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // Determine current week based on photos (3 photos per week = 12 total for 4 weeks)
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);

  // Calculate photos per week
  const photosPerWeek = [
    Math.min(photos.length, 3),
    Math.min(Math.max(photos.length - 3, 0), 3),
    Math.min(Math.max(photos.length - 6, 0), 3),
    Math.min(Math.max(photos.length - 9, 0), 3),
  ];

  // Get photos for current week only (max 3)
  const currentWeekStartIndex = (currentWeek - 1) * 3;
  const currentWeekPhotos = photos.slice(currentWeekStartIndex, currentWeekStartIndex + 3);

  const handleAddPhoto = (file: File) => {
    if (photos.length >= 12) return; // Max 12 photos (4 weeks x 3)
    
    const url = URL.createObjectURL(file);
    const newPhoto: Photo = {
      id: `photo-${Date.now()}`,
      url,
    };
    setPhotos((prev) => [...prev, newPhoto]);
  };

  return (
    <div 
      className="glass-card p-5 mx-4 relative overflow-hidden"
      style={{ backgroundImage: `url(${cardBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Title */}
      <h2 className="text-xl font-bold text-foreground text-center mb-6 relative z-10">
        CONQUER WILL POWER
      </h2>
      
      {/* Stacked Photo Cards */}
      <div className="relative z-10 mb-6">
        <StackedPhotoCards 
          photos={currentWeekPhotos} 
          onAddPhoto={handleAddPhoto}
          maxPhotos={3}
        />
      </div>
      
      {/* Week Progress */}
      <div className="relative z-10">
        <WeekProgress currentWeek={currentWeek} photosPerWeek={photosPerWeek} />
      </div>
    </div>
  );
};

export default PhotoUploadCard;
