import { useState } from 'react';
import PhotoGrid from './PhotoGrid';
import WeekProgress from './WeekProgress';

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

  const handleAddPhoto = (file: File) => {
    const url = URL.createObjectURL(file);
    const newPhoto: Photo = {
      id: `photo-${Date.now()}`,
      url,
    };
    setPhotos((prev) => [...prev, newPhoto]);
  };

  return (
    <div className="glass-card p-5 mx-4">
      {/* Photo Grid */}
      <div className="mb-5">
        <PhotoGrid photos={photos} onAddPhoto={handleAddPhoto} />
      </div>
      
      {/* Week Progress */}
      <WeekProgress currentWeek={currentWeek} photosPerWeek={photosPerWeek} />
    </div>
  );
};

export default PhotoUploadCard;
