import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, X, Image } from 'lucide-react';
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

  // Show info popup and auto-trigger file picker
  useEffect(() => {
    if (isOpen && !hasTriggered) {
      setHasTriggered(true);
      setShowInfoPopup(true);
      
      // Auto-trigger file picker immediately
      const timer = setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
        }
      }, 300); // Small delay for popup to render
      
      return () => clearTimeout(timer);
    }
    
    if (!isOpen) {
      setHasTriggered(false);
      setShowInfoPopup(false);
      setShowWarning(false);
    }
  }, [isOpen, hasTriggered]);


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

      {/* Overlay with blur */}
      <div 
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      />

      {/* Info Popup */}
      {showInfoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="relative">
            {/* Close button outside box */}
            <button
              onClick={onClose}
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
            
            <div 
              className="rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(251, 191, 36, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                  }}
                >
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">24 Hour Photos Only</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Only photos taken in the last 24 hours can be uploaded. Take a new photo of your activity!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div 
            className="rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 40px rgba(239, 68, 68, 0.1)',
            }}
          >
            
            <div className="flex flex-col items-center text-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Photo Too Old</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {warningMessage}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowWarning(false);
                  setShowInfoPopup(true);
                }}
                className="w-full py-3 px-4 rounded-2xl font-medium text-sm text-white mt-2 transition-all active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                }}
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