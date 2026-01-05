import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Image as ImageIcon, RefreshCw, AlertTriangle } from 'lucide-react';
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
  isRecent: boolean; // Within last 24 hours
}

const RecentPhotosGallery = ({ isOpen, onClose, onSelectPhoto }: RecentPhotosGalleryProps) => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-trigger file picker immediately when opened
  const triggerFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset to allow re-selection
      fileInputRef.current.click();
    }
  }, []);

  useEffect(() => {
    if (isOpen && !hasTriggered) {
      setPhotos([]);
      setSelectedPhoto(null);
      setWarningMessage(null);
      setHasTriggered(true);
      
      // Immediate trigger for file picker
      requestAnimationFrame(() => {
        triggerFilePicker();
      });
    }
    
    if (!isOpen) {
      setHasTriggered(false);
    }
  }, [isOpen, hasTriggered, triggerFilePicker]);

  // Auto-hide warning after 3 seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      // User cancelled - close if no photos loaded
      if (photos.length === 0) {
        onClose();
      }
      return;
    }

    setIsProcessing(true);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const allPhotos: GalleryPhoto[] = [];
    let processedCount = 0;
    const totalFiles = files.length;
    let oldPhotosCount = 0;

    Array.from(files).forEach((file, index) => {
      const fileDate = new Date(file.lastModified);
      const isRecent = fileDate >= twentyFourHoursAgo;
      
      if (!isRecent) {
        oldPhotosCount++;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          allPhotos.push({
            id: `photo-${index}-${Date.now()}`,
            dataUrl: event.target.result as string,
            timestamp: fileDate,
            isRecent,
          });
          
          // Sort by most recent first
          allPhotos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setPhotos([...allPhotos]);
        }
        
        processedCount++;
        if (processedCount === totalFiles) {
          setIsProcessing(false);
          // Show warning if some photos are older than 24 hours
          if (oldPhotosCount > 0) {
            setWarningMessage(
              oldPhotosCount === totalFiles
                ? 'All selected photos are older than 24 hours'
                : `${oldPhotosCount} photo${oldPhotosCount > 1 ? 's' : ''} older than 24 hours`
            );
          }
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

    // If no files to process
    if (totalFiles === 0) {
      setIsProcessing(false);
    }
  };

  const handlePhotoTap = (photo: GalleryPhoto) => {
    if (!photo.isRecent) {
      triggerHaptic('heavy');
      setWarningMessage('This photo is older than 24 hours and cannot be selected');
      return;
    }
    triggerHaptic('light');
    setSelectedPhoto(photo.id === selectedPhoto ? null : photo.id);
  };

  const handleConfirm = () => {
    const photo = photos.find(p => p.id === selectedPhoto);
    if (photo && photo.isRecent) {
      triggerHaptic('medium');
      onSelectPhoto(photo.dataUrl);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return `${diffDays}d ago`;
  };

  const recentPhotos = photos.filter(p => p.isRecent);

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file input - auto triggers on open */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
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

          {/* Warning Toast */}
          {warningMessage && (
            <div className="absolute top-20 left-4 right-4 z-10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-amber-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{warningMessage}</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
                <p className="text-foreground/50 text-sm">Processing photos...</p>
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
                  onClick={triggerFilePicker}
                  className="mt-4 px-6 py-3 bg-foreground/10 rounded-full text-foreground font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
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
                      className={`w-full h-full object-cover transition-all ${
                        !photo.isRecent ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    
                    {/* Time badge */}
                    <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] ${
                      photo.isRecent 
                        ? 'bg-black/60 text-white' 
                        : 'bg-amber-500/90 text-white'
                    }`}>
                      {formatTimeAgo(photo.timestamp)}
                    </div>

                    {/* Old photo warning overlay */}
                    {!photo.isRecent && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-amber-500 rounded-full p-2">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Selection indicator - only for recent photos */}
                    {photo.isRecent && (
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
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer with add more button */}
          <div className="p-4 border-t border-foreground/10 bg-foreground/5 flex items-center justify-between">
            <p className="text-xs text-foreground/40">
              {photos.length > 0 
                ? `${recentPhotos.length} of ${photos.length} photo${photos.length !== 1 ? 's' : ''} eligible`
                : 'Select recent photos'
              }
            </p>
            {photos.length > 0 && (
              <button
                onClick={triggerFilePicker}
                className="px-4 py-2 bg-foreground/10 rounded-full text-xs text-foreground font-medium flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Add More
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentPhotosGallery;