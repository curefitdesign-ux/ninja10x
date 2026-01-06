import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Camera, ImageIcon, X } from 'lucide-react';
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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Show info popup when opened
  useEffect(() => {
    if (isOpen && !hasTriggered) {
      setHasTriggered(true);
      setShowInfoPopup(true);
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
      setShowInfoPopup(true);
      return;
    }

    const file = files[0];
    const fileDate = new Date(file.lastModified);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const isRecent = fileDate >= twentyFourHoursAgo;

    if (!isRecent) {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        triggerHaptic('medium');
        onSelectPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryClick = () => {
    triggerHaptic('light');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleCameraClick = () => {
    triggerHaptic('light');
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Full-screen blur overlay */}
      <div 
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      />

      {/* Info Popup - Full screen experience */}
      {showInfoPopup && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
            {/* Icon */}
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2))',
                boxShadow: '0 0 60px rgba(251, 191, 36, 0.3)',
              }}
            >
              <Camera className="w-12 h-12 text-amber-400" />
            </div>

            {/* Highlight text */}
            <span 
              className="text-sm font-semibold tracking-wider uppercase mb-4"
              style={{ color: '#F59E0B' }}
            >
              Fresh Moments Only
            </span>

            {/* Main headline */}
            <h1 className="text-3xl font-bold text-white text-center mb-4 leading-tight">
              Capture Your<br />Activity Now!
            </h1>

            {/* Subtitle */}
            <p className="text-white/50 text-center text-base leading-relaxed max-w-xs mb-12">
              Share a photo from the last 24 hours to log your activity. Fresh content keeps your journey authentic!
            </p>
          </div>

          {/* CTAs at bottom */}
          <div className="px-6 pb-10 space-y-4">
            {/* Primary CTA - From Gallery */}
            <button
              onClick={handleGalleryClick}
              className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              style={{
                background: '#1a1a1a',
                color: 'white',
              }}
            >
              <ImageIcon className="w-5 h-5" />
              From Gallery
            </button>

            {/* Secondary CTA - Camera */}
            <button
              onClick={handleCameraClick}
              className="w-full py-4 font-medium text-base text-white/60 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Open Camera
            </button>
          </div>
        </div>
      )}

      {/* Warning Popup - Full screen */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
            {/* Icon */}
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2))',
                boxShadow: '0 0 60px rgba(239, 68, 68, 0.3)',
              }}
            >
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>

            {/* Highlight text */}
            <span 
              className="text-sm font-semibold tracking-wider uppercase mb-4"
              style={{ color: '#EF4444' }}
            >
              Photo Too Old
            </span>

            {/* Main headline */}
            <h1 className="text-3xl font-bold text-white text-center mb-4 leading-tight">
              Try a Recent<br />Photo Instead
            </h1>

            {/* Subtitle */}
            <p className="text-white/50 text-center text-base leading-relaxed max-w-xs mb-12">
              {warningMessage}
            </p>
          </div>

          {/* CTAs at bottom */}
          <div className="px-6 pb-10 space-y-4">
            {/* Primary CTA - From Gallery */}
            <button
              onClick={() => {
                setShowWarning(false);
                handleGalleryClick();
              }}
              className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              style={{
                background: '#1a1a1a',
                color: 'white',
              }}
            >
              <ImageIcon className="w-5 h-5" />
              Try Another Photo
            </button>

            {/* Secondary CTA - Camera */}
            <button
              onClick={() => {
                setShowWarning(false);
                handleCameraClick();
              }}
              className="w-full py-4 font-medium text-base text-white/60 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Take New Photo
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RecentPhotosGallery;