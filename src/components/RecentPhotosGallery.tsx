import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ImageCropper from './ImageCropper';
import VideoTrimmer from './VideoTrimmer';

interface RecentPhotosGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoDataUrl: string, isVideo?: boolean) => void;
}

const RecentPhotosGallery = ({
  isOpen,
  onClose,
  onSelectPhoto
}: RecentPhotosGalleryProps) => {
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [hasTriggered, setHasTriggered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cropper and trimmer states
  const [showCropper, setShowCropper] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [mediaToEdit, setMediaToEdit] = useState<string | null>(null);
  const [isVideoMedia, setIsVideoMedia] = useState(false);

  // Immediately trigger file picker when opened
  useEffect(() => {
    if (isOpen && !hasTriggered) {
      setHasTriggered(true);
      // Immediately open file picker
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    }
    if (!isOpen) {
      setHasTriggered(false);
      setShowWarning(false);
      setShowCropper(false);
      setShowTrimmer(false);
      setMediaToEdit(null);
    }
  }, [isOpen, hasTriggered]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setWarningMessage(diffDays > 0 ? `This photo is ${diffDays} day${diffDays > 1 ? 's' : ''} old. Only photos from the last 24 hours are allowed.` : `This photo is ${diffHours} hours old. Only photos from the last 24 hours are allowed.`);
      setShowWarning(true);
      return;
    }

    // File is valid, read and show cropper/trimmer
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        triggerHaptic('medium');
        const mediaDataUrl = event.target.result as string;
        setMediaToEdit(mediaDataUrl);
        setIsVideoMedia(isVideo);
        
        if (isVideo) {
          setShowTrimmer(true);
        } else {
          setShowCropper(true);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedImageUrl: string) => {
    setShowCropper(false);
    setMediaToEdit(null);
    onSelectPhoto(croppedImageUrl, false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setMediaToEdit(null);
    onClose();
  };

  const handleTrimConfirm = (trimmedVideoUrl: string) => {
    setShowTrimmer(false);
    setMediaToEdit(null);
    onSelectPhoto(trimmedVideoUrl, true);
  };

  const handleTrimCancel = () => {
    setShowTrimmer(false);
    setMediaToEdit(null);
    onClose();
  };

  const handleRetake = () => {
    setShowCropper(false);
    setShowTrimmer(false);
    setMediaToEdit(null);
    // Trigger file picker again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  if (!isOpen) return null;

  // Show cropper for images
  if (showCropper && mediaToEdit) {
    return (
      <ImageCropper
        mediaSrc={mediaToEdit}
        isVideo={false}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
        onRetake={handleRetake}
      />
    );
  }

  // Show trimmer for videos
  if (showTrimmer && mediaToEdit) {
    return (
      <VideoTrimmer
        videoSrc={mediaToEdit}
        onConfirm={handleTrimConfirm}
        onCancel={handleTrimCancel}
        maxDuration={3}
      />
    );
  }

  // Only show overlay when warning is visible
  if (!showWarning) {
    return (
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*,video/*" 
        className="hidden" 
        onChange={handleFileSelect} 
      />
    );
  }

  return (
    <>
      {/* Hidden file input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*,video/*" 
        className="hidden" 
        onChange={handleFileSelect} 
      />

      {/* Overlay with blur - only shown with warning */}
      <div 
        className="fixed inset-0 z-40 transition-all duration-300" 
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }} 
        onClick={onClose} 
      />

      {/* Warning Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div 
          className="rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300" 
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 40px rgba(239, 68, 68, 0.1)'
          }}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center" 
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
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
                // Re-trigger file picker
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }} 
              className="w-full py-3 px-4 rounded-2xl font-medium text-sm text-white mt-2 transition-all active:scale-95" 
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              Try Another Photo
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentPhotosGallery;
