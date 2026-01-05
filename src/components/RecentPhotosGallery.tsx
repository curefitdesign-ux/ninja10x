import { useState, useEffect, useRef } from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface RecentPhotosGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoDataUrl: string) => void;
}

interface GalleryPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

const RecentPhotosGallery = ({ isOpen, onClose, onSelectPhoto }: RecentPhotosGalleryProps) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Request access to device photos and filter last 24 hours
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setPhotos([]);
      setSelectedPhoto(null);
      
      // Auto-trigger file picker on open
      setTimeout(() => {
        fileInputRef.current?.click();
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const validPhotos: GalleryPhoto[] = [];

    Array.from(files).forEach((file, index) => {
      // Check if file was modified/created within last 24 hours
      const fileDate = new Date(file.lastModified);
      
      if (fileDate >= twentyFourHoursAgo) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            validPhotos.push({
              id: `photo-${index}-${Date.now()}`,
              dataUrl: event.target.result as string,
              timestamp: fileDate,
            });
            
            // Sort by most recent first
            validPhotos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setPhotos([...validPhotos]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    setIsLoading(false);
    setHasPermission(true);
  };

  const handlePhotoTap = (photo: GalleryPhoto) => {
    triggerHaptic('light');
    setSelectedPhoto(photo.id === selectedPhoto ? null : photo.id);
  };

  const handleConfirm = () => {
    const photo = photos.find(p => p.id === selectedPhoto);
    if (photo) {
      triggerHaptic('medium');
      onSelectPhoto(photo.dataUrl);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file input for gallery access */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture={undefined}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Gallery Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
        style={{ height: '85vh' }}
      >
        <div className="bg-background rounded-t-3xl border-t border-foreground/10 h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-foreground/10">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Recent Photos</h3>
              <p className="text-xs text-foreground/50">Last 24 hours only</p>
            </div>
            
            <button
              onClick={handleConfirm}
              disabled={!selectedPhoto}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                selectedPhoto 
                  ? 'bg-green-500 text-white' 
                  : 'bg-foreground/10 text-foreground/30'
              }`}
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
                <p className="text-foreground/50 text-sm">Loading photos...</p>
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
                <div className="w-20 h-20 rounded-full bg-foreground/10 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-semibold mb-1">No Recent Photos</p>
                  <p className="text-foreground/50 text-sm">
                    Only photos taken in the last 24 hours can be uploaded. 
                    Take a new photo of your activity!
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-6 py-3 bg-foreground/10 rounded-full text-foreground font-medium"
                >
                  Select Photos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handlePhotoTap(photo)}
                    className="relative aspect-square overflow-hidden rounded-lg"
                  >
                    <img
                      src={photo.dataUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Time badge */}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                      {formatTimeAgo(photo.timestamp)}
                    </div>
                    
                    {/* Selection indicator */}
                    <div className={`absolute inset-0 transition-all ${
                      selectedPhoto === photo.id 
                        ? 'bg-green-500/30 ring-2 ring-green-500 ring-inset' 
                        : ''
                    }`}>
                      {selectedPhoto === photo.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="p-4 border-t border-foreground/10 bg-foreground/5">
            <p className="text-center text-xs text-foreground/40">
              {photos.length > 0 
                ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} from the last 24 hours`
                : 'Capture your fitness moments while they\'re fresh!'
              }
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentPhotosGallery;
