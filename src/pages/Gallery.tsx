import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import ImageCropper from '@/components/ImageCropper';
import VideoTrimmer from '@/components/VideoTrimmer';

// Import sticker images
import liftWeightsSticker from '@/assets/stickers/lift-weights.png';
import playBasketballSticker from '@/assets/stickers/play-basketball.png';
import goRunningSticker from '@/assets/stickers/go-running.png';

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

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    try {
      const cached = localStorage.getItem(GALLERY_STORAGE_KEY);
      if (cached) {
        // Return all cached items without 24-hour filter
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to load cached gallery:', e);
    }
    return [];
  });
  
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [mediaToEdit, setMediaToEdit] = useState<string | null>(null);
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Removed 24-hour validation - all photos are now allowed
  const validateFileDate = (_file: File): { isValid: boolean; message?: string } => {
    return { isValid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateFileDate(file);
    if (!validation.isValid) {
      triggerHaptic('heavy');
      setWarningMessage(validation.message || 'Photo too old');
      setShowWarning(true);
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    
    reader.onload = event => {
      if (event.target?.result) {
        triggerHaptic('medium');
        const mediaDataUrl = event.target.result as string;
        
        const newItem: GalleryItem = {
          id: Date.now().toString(),
          dataUrl: mediaDataUrl,
          isVideo,
          timestamp: file.lastModified,
        };
        
        setGalleryItems(prev => {
          const filtered = prev.filter(p => p.dataUrl !== mediaDataUrl);
          // Keep up to 50 items for better gallery experience
          return [newItem, ...filtered].slice(0, 50);
        });
        
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
    e.target.value = '';
  };

  const handleGallerySelect = () => {
    triggerHaptic('light');
    fileInputRef.current?.click();
  };

  const handleItemTap = (item: GalleryItem) => {
    triggerHaptic('light');
    setSelectedItem(item);
  };

  const handleItemSelect = () => {
    if (!selectedItem) return;
    setMediaToEdit(selectedItem.dataUrl);
    setIsVideoMedia(selectedItem.isVideo);
    
    if (selectedItem.isVideo) {
      setShowTrimmer(true);
    } else {
      setShowCropper(true);
    }
  };

  const handleCropConfirm = (croppedImageUrl: string) => {
    setShowCropper(false);
    setMediaToEdit(null);
    setSelectedItem(null);
    handleSelectPhoto(croppedImageUrl, false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setMediaToEdit(null);
  };

  const handleTrimConfirm = (trimmedVideoUrl: string) => {
    setShowTrimmer(false);
    setMediaToEdit(null);
    setSelectedItem(null);
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Full screen with blurred gradient background */}
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-manipulation"
        style={{
          height: '100dvh',
          minHeight: '-webkit-fill-available',
        }}
      >
        {/* Animated blurred gradient background - matching reference */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, hsl(200, 25%, 45%) 0%, hsl(250, 35%, 35%) 40%, hsl(260, 30%, 30%) 70%, hsl(180, 25%, 35%) 100%)',
            }}
          />
          
          {/* Floating gradient orbs with heavy blur */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(270, 50%, 55%) 0%, transparent 60%)',
              filter: 'blur(120px)',
              top: '5%',
              left: '10%',
              opacity: 0.6,
            }}
            animate={{
              x: [0, 40, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(200, 40%, 50%) 0%, transparent 60%)',
              filter: 'blur(100px)',
              top: '-5%',
              right: '-10%',
              opacity: 0.5,
            }}
            animate={{
              x: [0, -30, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-[450px] h-[450px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(180, 35%, 45%) 0%, transparent 60%)',
              filter: 'blur(110px)',
              bottom: '10%',
              right: '5%',
              opacity: 0.4,
            }}
            animate={{
              x: [0, -25, 0],
              y: [0, -35, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-[350px] h-[350px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(220, 40%, 50%) 0%, transparent 60%)',
              filter: 'blur(90px)',
              bottom: '30%',
              left: '-5%',
              opacity: 0.35,
            }}
            animate={{
              x: [0, 35, 0],
              y: [0, -25, 0],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Back Button - Top Left */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="absolute z-20 p-2.5 rounded-xl"
          style={{ 
            top: 'max(env(safe-area-inset-top, 16px), 16px)',
            left: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <ChevronLeft className="w-5 h-5 text-white/80" />
        </motion.button>

        {/* Main Content */}
        <div 
          className="flex-1 flex flex-col relative z-10 overflow-hidden"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 56px), 56px)' }}
        >
          {/* Hero Section with Animated Stickers */}
          <div className="flex-shrink-0 pt-6 pb-4 px-4 relative">
            {/* Stickers Collage with floating animations - larger, less overlap */}
            <div className="relative w-full h-[260px] flex items-center justify-center mb-4">
              {/* Lift Weights Sticker - Left, floating animation */}
              <motion.img
                src={liftWeightsSticker}
                alt="Lift Weights"
                className="absolute w-44 h-auto object-contain z-10"
                style={{
                  left: '2%',
                  top: '20%',
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))',
                }}
                initial={{ opacity: 0, x: -30, rotate: -8 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  rotate: -5,
                  y: [0, -8, 0],
                }}
                transition={{ 
                  opacity: { duration: 0.6, delay: 0.1 },
                  x: { duration: 0.6, delay: 0.1 },
                  rotate: { duration: 0.6, delay: 0.1 },
                  y: { 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                }}
              />
              
              {/* Play Basketball Sticker - Right top, floating animation */}
              <motion.img
                src={playBasketballSticker}
                alt="Play Basketball"
                className="absolute w-48 h-auto object-contain z-20"
                style={{
                  right: '0%',
                  top: '-5%',
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))',
                }}
                initial={{ opacity: 0, y: -30, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: [0, -10, 0],
                  scale: 1,
                }}
                transition={{ 
                  opacity: { duration: 0.6, delay: 0.2 },
                  scale: { duration: 0.6, delay: 0.2 },
                  y: { 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }
                }}
              />
              
              {/* Go Running Sticker - Bottom Right, floating animation */}
              <motion.img
                src={goRunningSticker}
                alt="Go Running"
                className="absolute w-40 h-auto object-contain z-15"
                style={{
                  right: '8%',
                  bottom: '-5%',
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))',
                }}
                initial={{ opacity: 0, x: 30, rotate: 8 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  rotate: 5,
                  y: [0, -6, 0],
                }}
                transition={{ 
                  opacity: { duration: 0.6, delay: 0.3 },
                  x: { duration: 0.6, delay: 0.3 },
                  rotate: { duration: 0.6, delay: 0.3 },
                  y: { 
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }
                }}
              />
            </div>

            {/* Title and Subtitle */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">
                Capture your fitness and
                <br />
                workout moment.
              </h1>
              <p className="text-white/50 text-sm mt-2.5">
                Select from your gallery.
              </p>
            </motion.div>
          </div>

          {/* Photo Grid Section - Horizontal scroll with liquid glass cards */}
          <motion.div 
            className="px-4 pb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div 
              className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
              style={{ 
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Camera Button - First Item with liquid glass, no shadow */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCameraCapture}
                className="flex-shrink-0 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  width: '110px',
                  height: '155px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                {/* Camera focus corners */}
                <div className="absolute inset-5 pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-sm" />
                </div>
                <Camera className="w-8 h-8 text-white/60" strokeWidth={1.5} />
              </motion.button>

              {/* Gallery Items - Liquid glass cards */}
              {galleryItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleItemTap(item)}
                  className="flex-shrink-0 rounded-2xl overflow-hidden relative"
                  style={{
                    width: '110px',
                    height: '155px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: selectedItem?.id === item.id 
                      ? '2px solid rgba(255, 255, 255, 0.7)' 
                      : '1px solid rgba(255, 255, 255, 0.15)',
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
                  
                  {/* Video indicator badge with glass effect */}
                  {item.isVideo && (
                    <div 
                      className="absolute bottom-2 left-2 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      Video
                    </div>
                  )}

                  {/* Selection overlay */}
                  {selectedItem?.id === item.id && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                      }}
                    />
                  )}
                </motion.button>
              ))}

              {/* Tap to Upload Card - Always visible */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGallerySelect}
                className="flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2"
                style={{
                  width: '110px',
                  height: '155px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px dashed rgba(255, 255, 255, 0.2)',
                }}
              >
                <span className="text-white/40 text-xs text-center px-2">Tap to add photos</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Bottom spacer to account for fixed button */}
          <div style={{ height: 'calc(100px + env(safe-area-inset-bottom, 24px))' }} />
        </div>

        {/* Bottom Select Button - Fixed floating at bottom, never cropped */}
        <motion.div 
          className="fixed left-0 right-0 px-4 z-30"
          style={{
            bottom: 0,
            paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
            paddingTop: '16px',
            background: 'linear-gradient(to top, rgba(37, 37, 53, 1) 0%, rgba(37, 37, 53, 0.95) 50%, rgba(37, 37, 53, 0.7) 80%, transparent 100%)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={selectedItem ? handleItemSelect : handleGallerySelect}
            className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wider relative overflow-hidden"
            style={{
              background: selectedItem 
                ? 'rgba(255, 255, 255, 0.15)' 
                : 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              color: selectedItem ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: `
                inset 0 1px 1px rgba(255, 255, 255, 0.12),
                0 8px 32px rgba(0, 0, 0, 0.2)
              `,
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
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
            <span className="relative z-10">
              {selectedItem ? 'SELECT' : 'SELECT FROM GALLERY'}
            </span>
          </motion.button>
        </motion.div>

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
