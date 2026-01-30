import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, AlertTriangle, Plus } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ImageCropper from '@/components/ImageCropper';
import VideoTrimmer from '@/components/VideoTrimmer';

interface GalleryItem {
  id: string;
  dataUrl: string;
  isVideo: boolean;
  timestamp: number;
}

const GALLERY_STORAGE_KEY = 'gallery_items_cache';

const Gallery = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as {
    dayNumber?: number;
  } | null;
  
  const dayNumber = state?.dayNumber ?? 1;

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
  
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Cropper and trimmer states
  const [showCropper, setShowCropper] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [mediaToEdit, setMediaToEdit] = useState<string | null>(null);
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist gallery items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleryItems));
    } catch (e) {
      console.error('Failed to cache gallery:', e);
    }
  }, [galleryItems]);

  const handleClose = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleSelectPhoto = useCallback((photoDataUrl: string, isVideo?: boolean) => {
    navigate('/preview', {
      state: {
        imageUrl: photoDataUrl,
        originalUrl: photoDataUrl,
        isVideo: isVideo || false,
        dayNumber,
        fromGallery: true,
      },
      replace: true,
    });
  }, [navigate, dayNumber]);

  const handleCameraCapture = useCallback(() => {
    navigate('/camera', {
      state: { dayNumber },
      replace: true,
    });
  }, [navigate, dayNumber]);

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

  const handleGallerySelect = () => {
    triggerHaptic('light');
    fileInputRef.current?.click();
  };

  const handleItemTap = (item: GalleryItem) => {
    triggerHaptic('light');
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
    handleSelectPhoto(croppedImageUrl, false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setMediaToEdit(null);
  };

  const handleTrimConfirm = (trimmedVideoUrl: string) => {
    setShowTrimmer(false);
    setMediaToEdit(null);
    handleSelectPhoto(trimmedVideoUrl, true);
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

      {/* Full screen page with liquid glass background */}
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-manipulation"
        style={{
          background: '#0a0a12',
          height: '100dvh',
          minHeight: '-webkit-fill-available',
        }}
      >
        {/* Animated gradient orbs background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[350px] h-[350px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(160, 84%, 39%) 0%, transparent 70%)',
              filter: 'blur(80px)',
              top: '-15%',
              left: '-20%',
              opacity: 0.35,
            }}
            animate={{
              x: [0, 40, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(172, 66%, 50%) 0%, transparent 70%)',
              filter: 'blur(70px)',
              bottom: '10%',
              right: '-15%',
              opacity: 0.3,
            }}
            animate={{
              x: [0, -30, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-[250px] h-[250px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(280, 60%, 50%) 0%, transparent 70%)',
              filter: 'blur(60px)',
              top: '35%',
              right: '5%',
              opacity: 0.2,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Header - Glassmorphic */}
        <div 
          className="relative pb-5 px-4 flex-shrink-0 z-10"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 56px), 56px)' }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="absolute left-4 p-2.5 -ml-2 rounded-full"
            style={{ 
              top: 'max(env(safe-area-inset-top, 56px), 56px)',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white/80" />
          </motion.button>
          
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white tracking-tight">Camera Roll</h1>
            <p className="text-sm text-white/45 mt-1.5">Photos from last 24 hours</p>
          </div>
        </div>

        {/* Grid Container - Liquid Glass Card */}
        <div 
          className="flex-1 mx-3 mb-3 rounded-3xl overflow-hidden relative z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              inset 0 1px 1px rgba(255, 255, 255, 0.1),
              0 8px 32px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          <div 
            className="h-full px-3 py-4 overflow-y-auto overscroll-contain"
            style={{ 
              paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 20px))',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="grid grid-cols-3 gap-2">
              {/* Camera Button - First Item with liquid glass */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCameraCapture}
                className="aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Inner glow */}
                <div 
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(52, 211, 153, 0.15) 0%, transparent 60%)',
                  }}
                />
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%)',
                    border: '1.5px solid rgba(52, 211, 153, 0.3)',
                    boxShadow: '0 4px 16px rgba(52, 211, 153, 0.2)',
                  }}
                >
                  <Camera className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
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
                  className="aspect-square rounded-2xl overflow-hidden relative"
                  style={{
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
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
                  {/* Hover overlay */}
                  <div 
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                    style={{
                      background: 'linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, 0.4) 100%)',
                    }}
                  />
                  {item.isVideo && (
                    <div 
                      className="absolute bottom-1.5 right-1.5 rounded-lg px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      Video
                    </div>
                  )}
                </motion.button>
              ))}

              {/* Add More Button - Liquid glass dashed */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGallerySelect}
                className="aspect-square rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1.5px dashed rgba(255, 255, 255, 0.12)',
                }}
              >
                <Plus className="w-7 h-7 text-white/30" strokeWidth={1.5} />
              </motion.button>
            </div>
            
            {/* Empty state hint */}
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
        </div>

        {/* Bottom Select Button - Liquid glass */}
        <div 
          className="fixed bottom-0 left-0 right-0 p-4 z-20"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGallerySelect}
            className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wider relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              color: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: `
                inset 0 1px 1px rgba(255, 255, 255, 0.15),
                0 8px 32px rgba(0, 0, 0, 0.3)
              `,
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              }}
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 4,
              }}
            />
            <span className="relative z-10">SELECT FROM GALLERY</span>
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
      </div>
    </>
  );
};

export default Gallery;
