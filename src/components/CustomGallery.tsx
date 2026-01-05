import { useState, useEffect, useRef } from 'react';
import { X, Lock, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

interface GalleryPhoto {
  file: File;
  url: string;
  timestamp: number;
  isRecent: boolean;
}

interface CustomGalleryProps {
  onSelectPhoto: (file: File) => void;
  onClose: () => void;
}

const CustomGallery = ({ onSelectPhoto, onClose }: CustomGalleryProps) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const twentyFourHoursMs = 24 * 60 * 60 * 1000;

  useEffect(() => {
    // Automatically trigger file selection when component mounts
    fileInputRef.current?.click();
  }, []);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      onClose();
      return;
    }

    const now = Date.now();
    const photoList: GalleryPhoto[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const isRecent = now - file.lastModified <= twentyFourHoursMs;
        photoList.push({
          file,
          url,
          timestamp: file.lastModified,
          isRecent,
        });
      }
    });

    // Sort by timestamp (newest first)
    photoList.sort((a, b) => b.timestamp - a.timestamp);
    setPhotos(photoList);
    setLoading(false);
  };

  const handlePhotoClick = (photo: GalleryPhoto) => {
    if (!photo.isRecent) {
      const hoursAgo = Math.floor((Date.now() - photo.timestamp) / (1000 * 60 * 60));
      const daysAgo = Math.floor(hoursAgo / 24);
      
      toast.error('Photo too old', {
        description: daysAgo > 0 
          ? `This photo is ${daysAgo} day${daysAgo > 1 ? 's' : ''} old. Please select a photo from the last 24 hours.`
          : `This photo is ${hoursAgo} hours old. Please select a photo from the last 24 hours.`,
        icon: <Lock className="w-5 h-5" />,
      });
      return;
    }
    setSelectedPhoto(photo);
  };

  const handleConfirmSelection = () => {
    if (selectedPhoto) {
      onSelectPhoto(selectedPhoto.file);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const recentPhotos = photos.filter(p => p.isRecent);
  const olderPhotos = photos.filter(p => !p.isRecent);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach(photo => URL.revokeObjectURL(photo.url));
    };
  }, [photos]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Header - Apple style */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-[#0A84FF] text-[17px] font-normal"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Cancel</span>
        </button>
        <h1 className="text-white text-[17px] font-semibold">Recents</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Photo Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-center">
              <p className="text-lg mb-2">Select photos from your gallery</p>
              <p className="text-sm text-white/40">Hold to select multiple</p>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-center px-8">
              <p className="text-lg mb-2">No photos selected</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-6 py-2 bg-[#0A84FF] text-white rounded-full text-sm font-medium"
              >
                Select Photos
              </button>
            </div>
          </div>
        ) : (
          <div className="pb-20">
            {/* Recent Photos Section (Last 24 Hours) */}
            {recentPhotos.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-black/50 sticky top-0 z-10 backdrop-blur-sm">
                  <h2 className="text-white text-[15px] font-semibold">
                    Last 24 Hours
                  </h2>
                  <p className="text-white/50 text-[13px]">{recentPhotos.length} items</p>
                </div>
                <div className="grid grid-cols-3 gap-[2px]">
                  {recentPhotos.map((photo, index) => (
                    <button
                      key={`recent-${index}`}
                      onClick={() => handlePhotoClick(photo)}
                      className={`relative aspect-square overflow-hidden ${
                        selectedPhoto?.url === photo.url ? 'ring-2 ring-[#0A84FF] ring-inset' : ''
                      }`}
                    >
                      {photo.file.type.startsWith('video/') ? (
                        <video
                          src={photo.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {/* Time badge */}
                      <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                        {formatTimeAgo(photo.timestamp)}
                      </div>
                      {/* Video indicator */}
                      {photo.file.type.startsWith('video/') && (
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white">
                          VIDEO
                        </div>
                      )}
                      {/* Selection checkmark */}
                      {selectedPhoto?.url === photo.url && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-[#0A84FF] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Older Photos Section (Locked) */}
            {olderPhotos.length > 0 && (
              <div className="mt-4">
                <div className="px-4 py-3 bg-black/50 sticky top-0 z-10 backdrop-blur-sm">
                  <h2 className="text-white/50 text-[15px] font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Older Photos
                  </h2>
                  <p className="text-white/30 text-[13px]">Not available for upload</p>
                </div>
                <div className="grid grid-cols-3 gap-[2px]">
                  {olderPhotos.map((photo, index) => (
                    <button
                      key={`older-${index}`}
                      onClick={() => handlePhotoClick(photo)}
                      className="relative aspect-square overflow-hidden"
                    >
                      {photo.file.type.startsWith('video/') ? (
                        <video
                          src={photo.url}
                          className="w-full h-full object-cover blur-[6px] brightness-50"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover blur-[6px] brightness-50"
                          loading="lazy"
                        />
                      )}
                      {/* Lock overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white/70" />
                        </div>
                      </div>
                      {/* Time badge */}
                      <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white/50 font-medium">
                        {formatTimeAgo(photo.timestamp)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No recent photos message */}
            {recentPhotos.length === 0 && olderPhotos.length > 0 && (
              <div className="px-4 py-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
                  <Lock className="w-8 h-8 text-white/50" />
                </div>
                <p className="text-white/60 text-lg font-medium mb-2">No recent photos</p>
                <p className="text-white/40 text-sm">
                  You can only upload photos taken in the last 24 hours
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {selectedPhoto && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
          <button
            onClick={handleConfirmSelection}
            className="w-full py-3.5 bg-[#0A84FF] text-white rounded-xl text-[17px] font-semibold"
          >
            Use This Photo
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomGallery;
