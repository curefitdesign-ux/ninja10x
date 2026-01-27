import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, AlertTriangle, Plus } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ImageCropper from './ImageCropper';
import VideoTrimmer from './VideoTrimmer';

interface GalleryPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoDataUrl: string, isVideo?: boolean) => void;
  onCameraCapture?: () => void;
}

interface GalleryItem {
  id: string;
  dataUrl: string;
  isVideo: boolean;
  timestamp: number;
}

const GALLERY_STORAGE_KEY = 'gallery_items_cache';

const GalleryPickerSheet = ({
  isOpen,
  onClose,
  onSelectPhoto,
  onCameraCapture
}: GalleryPickerSheetProps) => {
  // Load cached gallery items from localStorage
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    try {
      const cached = localStorage.getItem(GALLERY_STORAGE_KEY);
      if (cached) {
        const items = JSON.parse(cached);
        // Filter to only show items from last 24 hours
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        return items.filter((item: GalleryItem) => item.timestamp >= twentyFourHoursAgo);
      }
    } catch (e) {
      console.error('Failed to load cached gallery:', e);
    }
    return [];
  });
  
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Cropper and trimmer states
  const [showCropper, setShowCropper] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [mediaToEdit, setMediaToEdit] = useState<string | null>(null);
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Persist gallery items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleryItems));
    } catch (e) {
      console.error('Failed to cache gallery:', e);
    }
  }, [galleryItems]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
      setShowWarning(false);
      setShowCropper(false);
      setShowTrimmer(false);
      setMediaToEdit(null);
    }
  }, [isOpen]);

  const validateFileDate = (file: File): { isValid: boolean; message?: string } => {
    const fileDate = new Date(file.lastModified);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (fileDate >= twentyFourHoursAgo) {
      return { isValid: true };
    }
    
    const diffHours = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const message = diffDays > 0 
      ? `This photo is ${diffDays} day${diffDays > 1 ? 's' : ''} old. Only photos from the last 24 hours are allowed.`
      : `This photo is ${diffHours} hours old. Only photos from the last 24 hours are allowed.`;
    
    return { isValid: false, message };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isFromCamera: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate date for gallery uploads (not camera - camera is always "now")
    if (!isFromCamera) {
      const validation = validateFileDate(file);
      if (!validation.isValid) {
        triggerHaptic('heavy');
        setWarningMessage(validation.message || 'Photo too old');
        setShowWarning(true);
        return;
      }
    }

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    
    reader.onload = event => {
      if (event.target?.result) {
        triggerHaptic('medium');
        const mediaDataUrl = event.target.result as string;
        
        // Add to gallery items for display (cache for future)
        const newItem: GalleryItem = {
          id: Date.now().toString(),
          dataUrl: mediaDataUrl,
          isVideo,
          timestamp: isFromCamera ? Date.now() : file.lastModified,
        };
        
        setGalleryItems(prev => {
          // Prevent duplicates and limit cache size
          const filtered = prev.filter(p => p.dataUrl !== mediaDataUrl);
          return [newItem, ...filtered].slice(0, 20);
        });
        
        // Auto-select and proceed to edit
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
    
    // Reset input
    e.target.value = '';
  };

  const handleCameraCapture = () => {
    triggerHaptic('light');
    // If onCameraCapture callback provided, use it for full camera flow
    if (onCameraCapture) {
      onCameraCapture();
    } else {
      // Fallback to input capture
      cameraInputRef.current?.click();
    }
  };

  const handleGallerySelect = () => {
    triggerHaptic('light');
    fileInputRef.current?.click();
  };

  const handleItemTap = (item: GalleryItem) => {
    triggerHaptic('light');
    setSelectedItem(item);
    setMediaToEdit(item.dataUrl);
    setIsVideoMedia(item.isVideo);
    
    if (item.isVideo) {
      setShowTrimmer(true);
    } else {
      setShowCropper(true);
    }
  };

  const handleCropConfirm = (croppedImageUrl: string) => {
    setShowCropper(false);
    setMediaToEdit(null);
    onSelectPhoto(croppedImageUrl, false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setMediaToEdit(null);
  };

  const handleTrimConfirm = (trimmedVideoUrl: string) => {
    setShowTrimmer(false);
    setMediaToEdit(null);
    onSelectPhoto(trimmedVideoUrl, true);
  };

  const handleTrimCancel = () => {
    setShowTrimmer(false);
    setMediaToEdit(null);
  };

  const handleRetake = () => {
    setShowCropper(false);
    setShowTrimmer(false);
    setMediaToEdit(null);
    fileInputRef.current?.click();
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

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, false)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e, true)}
      />

      {/* Full screen overlay with translucent blur */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-manipulation"
          style={{
            background: 'rgba(15, 15, 25, 0.85)',
            backdropFilter: 'blur(40px) saturate(150%)',
            WebkitBackdropFilter: 'blur(40px) saturate(150%)',
            height: '100dvh',
            minHeight: '-webkit-fill-available',
          }}
        >
          {/* Header */}
          <div 
            className="relative pb-5 px-4 flex-shrink-0"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 56px), 56px)' }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute left-4 p-2 -ml-2"
              style={{ top: 'max(env(safe-area-inset-top, 56px), 56px)' }}
            >
              <ChevronLeft className="w-7 h-7 text-white/70" />
            </motion.button>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white tracking-tight">Camera roll</h1>
              <p className="text-sm text-white/45 mt-1.5">Photo taken in last 24hours</p>
            </div>
          </div>

          {/* Simple Clean Grid */}
          <div className="flex-1 px-3 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 20px))' }}>
            <div className="grid grid-cols-3 gap-1.5">
              {/* Camera Button - First Item */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCameraCapture}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  }}
                >
                  <Camera className="w-6 h-6 text-white/70" strokeWidth={1.5} />
                </div>
              </motion.button>

              {/* Cached Gallery Items */}
              {galleryItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleItemTap(item)}
                  className="aspect-square rounded-xl overflow-hidden relative"
                >
                  {item.isVideo ? (
                    <video
                      src={item.dataUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={item.dataUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.isVideo && (
                    <div 
                      className="absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      Video
                    </div>
                  )}
                </motion.button>
              ))}

              {/* Add More Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGallerySelect}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1.5px dashed rgba(255, 255, 255, 0.15)',
                }}
              >
                <Plus className="w-7 h-7 text-white/25" strokeWidth={1.5} />
              </motion.button>
            </div>
            
            {/* Empty state hint - centered in available space */}
            {galleryItems.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute left-0 right-0 top-1/2 -translate-y-1/2 text-center px-6 pointer-events-none"
              >
                <p className="text-white/40 text-sm">
                  Tap the camera or + button to add photos
                </p>
                <p className="text-white/25 text-xs mt-2">
                  Previously selected photos will appear here
                </p>
              </motion.div>
            )}
          </div>

          {/* Bottom Select Button */}
          <div 
            className="fixed bottom-0 left-0 right-0 p-5"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
              background: 'linear-gradient(to top, rgba(15, 15, 25, 1) 0%, rgba(15, 15, 25, 0.9) 60%, transparent 100%)',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGallerySelect}
              className="w-full py-4 rounded-2xl font-semibold text-base tracking-wide"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              SELECT
            </motion.button>
          </div>

          {/* Warning Popup */}
          <AnimatePresence>
            {showWarning && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60]"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                  onClick={() => setShowWarning(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-0 z-[70] flex items-center justify-center p-6"
                >
                  <div
                    className="rounded-3xl p-6 max-w-sm w-full"
                    style={{
                      background: 'rgba(30, 30, 45, 0.95)',
                      backdropFilter: 'blur(40px)',
                      WebkitBackdropFilter: 'blur(40px)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                        }}
                      >
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Photo Too Old</h3>
                        <p className="text-white/55 text-sm leading-relaxed">
                          {warningMessage}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowWarning(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full py-3.5 px-4 rounded-2xl font-medium text-sm text-white mt-2 transition-all active:scale-95"
                        style={{
                          background: 'rgba(255, 255, 255, 0.12)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                        }}
                      >
                        Try Another Photo
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default GalleryPickerSheet;
