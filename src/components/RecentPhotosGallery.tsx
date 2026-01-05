import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface RecentPhotosGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoDataUrl: string) => void;
}

const RecentPhotosGallery = ({ isOpen, onClose, onSelectPhoto }: RecentPhotosGalleryProps) => {
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [hasTriggered, setHasTriggered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show info popup, then trigger file picker
  useEffect(() => {
    if (isOpen && !hasTriggered) {
      setHasTriggered(true);
      setShowInfoPopup(true);
      
      // Auto-trigger file picker after showing info
      const timer = setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
        }
      }, 2000); // Show info for 2 seconds before opening picker
      
      return () => clearTimeout(timer);
    }
    
    if (!isOpen) {
      setHasTriggered(false);
      setShowInfoPopup(false);
      setShowWarning(false);
    }
  }, [isOpen, hasTriggered]);

  // Auto-hide warning after 3 seconds
  useEffect(() => {
    if (showWarning) {
      const timer = setTimeout(() => {
        setShowWarning(false);
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWarning, onClose]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowInfoPopup(false);
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      onClose();
      return;
    }

    const file = files[0];
    const fileDate = new Date(file.lastModified);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const isRecent = fileDate >= twentyFourHoursAgo;

    if (!isRecent) {
      // Calculate how old the photo is
      const diffHours = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      triggerHaptic('heavy');
      setWarningMessage(
        diffDays > 0 
          ? `This photo is ${diffDays} day${diffDays > 1 ? 's' : ''} old. Only photos from the last 24 hours are allowed.`
          : `This photo is ${diffHours} hours old. Only photos from the last 24 hours are allowed.`
      );
      setShowWarning(true);
      return;
    }

    // Photo is valid, read and proceed
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        triggerHaptic('medium');
        onSelectPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Info Popup */}
      {showInfoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="bg-background/95 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-foreground/10 animate-in zoom-in-95 fade-in duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">24 Hour Photos Only</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  Only photos taken in the last 24 hours can be uploaded. Take a new photo of your activity!
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-foreground/10 text-foreground font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-foreground text-background font-medium text-sm"
                >
                  Select Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="bg-background/95 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-500/30 animate-in zoom-in-95 fade-in duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Photo Too Old</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  {warningMessage}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowWarning(false);
                  setShowInfoPopup(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-foreground text-background font-medium text-sm mt-2"
              >
                Try Another Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecentPhotosGallery;