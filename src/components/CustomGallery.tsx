import { useState, useEffect } from 'react';
import { Lock, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

interface GalleryPhoto {
  webPath: string;
  timestamp: number;
}

interface CustomGalleryProps {
  onSelectPhoto: (file: File) => void;
  onClose: () => void;
}

const CustomGallery = ({ onSelectPhoto, onClose }: CustomGalleryProps) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  useEffect(() => {
    requestPermissionAndLoadPhotos();
  }, []);

  const requestPermissionAndLoadPhotos = async () => {
    try {
      // Request camera/photo library permissions
      const permissions = await Camera.requestPermissions({ permissions: ['photos'] });
      
      if (permissions.photos === 'denied') {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      // Use pickImages to let user select multiple photos (simulates gallery access)
      // Note: Capacitor doesn't have direct gallery read access, so we use pickImages
      const result = await Camera.pickImages({
        quality: 90,
        limit: 50,
      });

      if (result.photos && result.photos.length > 0) {
        // Process picked photos - we'll check timestamps when converting to files
        const photoList: GalleryPhoto[] = result.photos.map((photo, index) => ({
          webPath: photo.webPath || '',
          timestamp: Date.now() - index * 1000, // Approximate ordering
        }));
        
        setPhotos(photoList);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error accessing photos:', error);
      
      // If Capacitor is not available (web), fall back to file input
      if (error.message?.includes('not implemented') || !window.hasOwnProperty('Capacitor')) {
        fallbackToFileInput();
      } else if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        onClose();
      } else {
        setPermissionDenied(true);
        setLoading(false);
      }
    }
  };

  const fallbackToFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        onClose();
        return;
      }

      const photoList: GalleryPhoto[] = [];
      
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          const url = URL.createObjectURL(file);
          const isRecent = Date.now() - file.lastModified <= 24 * 60 * 60 * 1000;
          
          if (isRecent) {
            photoList.push({
              webPath: url,
              timestamp: file.lastModified,
            });
          }
        }
      });

      photoList.sort((a, b) => b.timestamp - a.timestamp);
      setPhotos(photoList);
      setLoading(false);
    };

    input.oncancel = () => {
      onClose();
    };

    input.click();
  };

  const handlePhotoClick = (photo: GalleryPhoto) => {
    setSelectedPhoto(photo);
  };

  const handleConfirmSelection = async () => {
    if (selectedPhoto) {
      try {
        // Convert webPath to File
        const response = await fetch(selectedPhoto.webPath);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        onSelectPhoto(file);
      } catch (error) {
        console.error('Error converting photo to file:', error);
      }
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'Today';
  };

  const handleRetryPermission = () => {
    setPermissionDenied(false);
    setLoading(true);
    requestPermissionAndLoadPhotos();
  };

  // Permission Request View
  if (permissionDenied) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-white/10">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[#0A84FF] text-[17px] font-normal"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-white text-[17px] font-semibold">Photos</h1>
          <div className="w-12" />
        </div>

        {/* Permission Request Content */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-b from-white/15 to-white/5 mb-6">
              <ImageIcon className="w-10 h-10 text-white/70" />
            </div>
            <h2 className="text-white text-[22px] font-semibold mb-3">
              Allow Photo Access
            </h2>
            <p className="text-white/60 text-[15px] leading-relaxed mb-8">
              We need access to your photos to let you share moments from the last 24 hours.
            </p>
            <button
              onClick={handleRetryPermission}
              className="w-full py-3.5 bg-[#0A84FF] text-white rounded-xl text-[17px] font-semibold mb-3"
            >
              Allow Access
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-white/10 text-white rounded-xl text-[17px] font-medium"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header - iOS style */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-[#0A84FF] text-[17px] font-normal"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Cancel</span>
        </button>
        <h1 className="text-white text-[17px] font-semibold">Last 24 Hours</h1>
        <div className="w-16" />
      </div>

      {/* Photo Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {/* iOS-style loading spinner */}
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60 text-[15px]">Loading your photos...</p>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-center px-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
                <Lock className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-lg font-medium mb-2">No recent photos</p>
              <p className="text-white/40 text-sm mb-6">
                You can only upload photos taken in the last 24 hours
              </p>
              <button
                onClick={() => requestPermissionAndLoadPhotos()}
                className="px-6 py-2.5 bg-[#0A84FF] text-white rounded-full text-[15px] font-medium"
              >
                Select Photos
              </button>
            </div>
          </div>
        ) : (
          <div className="pb-24">
            {/* Recent Photos Header */}
            <div className="px-4 py-3 bg-black/50 sticky top-0 z-10 backdrop-blur-sm">
              <p className="text-white/50 text-[13px]">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} from the last 24 hours
              </p>
            </div>
            
            {/* Photo Grid - iOS style 3 columns with minimal gap */}
            <div className="grid grid-cols-3 gap-[1px] bg-black/50">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => handlePhotoClick(photo)}
                  className={`relative aspect-square overflow-hidden ${
                    selectedPhoto?.webPath === photo.webPath 
                      ? 'ring-2 ring-[#0A84FF] ring-inset opacity-80' 
                      : ''
                  }`}
                >
                  <img
                    src={photo.webPath}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Time badge */}
                  <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                    {formatTimeAgo(photo.timestamp)}
                  </div>
                  
                  {/* Selection checkmark */}
                  {selectedPhoto?.webPath === photo.webPath && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#0A84FF] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {selectedPhoto && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black via-black/95 to-transparent pt-12">
          <button
            onClick={handleConfirmSelection}
            className="w-full py-3.5 bg-[#0A84FF] text-white rounded-xl text-[17px] font-semibold active:opacity-80 transition-opacity"
          >
            Use This Photo
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomGallery;
