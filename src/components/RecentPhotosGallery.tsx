import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Image as ImageIcon, RefreshCw, Camera } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { nativeGalleryService, GalleryPhoto } from '@/services/native-gallery-service';
import { Capacitor } from '@capacitor/core';

interface RecentPhotosGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoDataUrl: string) => void;
}

const RecentPhotosGallery = ({ isOpen, onClose, onSelectPhoto }: RecentPhotosGalleryProps) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if running on native platform
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // Auto-fetch photos when opened
  const fetchPhotos = useCallback(async () => {
    if (isNative) {
      // Native: Use Capacitor Camera plugin
      setIsLoading(true);
      try {
        const hasPermission = await nativeGalleryService.checkPermissions();
        if (!hasPermission) {
          await nativeGalleryService.requestPermissions();
        }
        
        // Pick multiple photos from gallery
        const galleryPhotos = await nativeGalleryService.pickMultiplePhotos(20);
        setPhotos(galleryPhotos);
      } catch (error) {
        console.error('Failed to fetch photos:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Web: Trigger file picker
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    }
  }, [isNative]);

  useEffect(() => {
    if (isOpen && !hasTriggered) {
      setPhotos([]);
      setSelectedPhoto(null);
      setHasTriggered(true);
      
      // Auto-trigger photo fetch
      requestAnimationFrame(() => {
        fetchPhotos();
      });
    }
    
    if (!isOpen) {
      setHasTriggered(false);
    }
  }, [isOpen, hasTriggered, fetchPhotos]);

  // Web fallback: Handle file input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      if (photos.length === 0) {
        onClose();
      }
      return;
    }

    setIsProcessing(true);
    const validPhotos: GalleryPhoto[] = [];
    let processedCount = 0;
    const totalFiles = files.length;

    Array.from(files).forEach((file, index) => {
      const fileDate = new Date(file.lastModified);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          validPhotos.push({
            id: `photo-${index}-${Date.now()}`,
            dataUrl: event.target.result as string,
            webPath: '',
            timestamp: fileDate,
          });
          
          validPhotos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setPhotos([...validPhotos]);
        }
        
        processedCount++;
        if (processedCount === totalFiles) {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        processedCount++;
        if (processedCount === totalFiles) {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    });

    if (totalFiles === 0) {
      setIsProcessing(false);
    }
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

  const handleTakePhoto = async () => {
    if (isNative) {
      const photo = await nativeGalleryService.takePhoto();
      if (photo) {
        triggerHaptic('medium');
        onSelectPhoto(photo.dataUrl);
      }
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
      {/* Hidden file input for web fallback */}
      {!isNative && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

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
              <h3 className="text-lg font-bold text-foreground">Gallery</h3>
              <p className="text-xs text-foreground/50">Select a photo</p>
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
            {isLoading || isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
                <p className="text-foreground/50 text-sm">
                  {isLoading ? 'Loading gallery...' : 'Processing photos...'}
                </p>
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
                <div className="w-20 h-20 rounded-full bg-foreground/10 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-semibold mb-1">No Photos</p>
                  <p className="text-foreground/50 text-sm">
                    Select photos from your gallery or take a new one.
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  {isNative && (
                    <button
                      onClick={handleTakePhoto}
                      className="px-6 py-3 bg-green-500 rounded-full text-white font-medium flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </button>
                  )}
                  <button
                    onClick={fetchPhotos}
                    className="px-6 py-3 bg-foreground/10 rounded-full text-foreground font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Select Photos
                  </button>
                </div>
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

          {/* Footer */}
          <div className="p-4 border-t border-foreground/10 bg-foreground/5 flex items-center justify-between">
            <p className="text-xs text-foreground/40">
              {photos.length > 0 
                ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} selected`
                : 'Select photos'
              }
            </p>
            <div className="flex gap-2">
              {isNative && (
                <button
                  onClick={handleTakePhoto}
                  className="px-4 py-2 bg-green-500/20 rounded-full text-xs text-green-400 font-medium flex items-center gap-1.5"
                >
                  <Camera className="w-3 h-3" />
                  Camera
                </button>
              )}
              {photos.length > 0 && (
                <button
                  onClick={fetchPhotos}
                  className="px-4 py-2 bg-foreground/10 rounded-full text-xs text-foreground font-medium flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Add More
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentPhotosGallery;
