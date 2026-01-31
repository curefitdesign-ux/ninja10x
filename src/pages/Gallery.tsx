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

  // Load cached gallery items from localStorage
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    try {
      const cached = localStorage.getItem(GALLERY_STORAGE_KEY);
      if (cached) {
        const items = JSON.parse(cached);
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
        
        const newItem: GalleryItem = {
          id: Date.now().toString(),
          dataUrl: mediaDataUrl,
          isVideo,
          timestamp: isFromCamera ? Date.now() : file.lastModified,
        };
        
        setGalleryItems(prev => {
          const filtered = prev.filter(p => p.dataUrl !== mediaDataUrl);
          return [newItem, ...filtered].slice(0, 20);
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
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(250, 60%, 45%) 0%, transparent 70%)',
              filter: 'blur(100px)',
              top: '-10%',
              left: '-10%',
              opacity: 0.4,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-[350px] h-[350px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(280, 50%, 40%) 0%, transparent 70%)',
              filter: 'blur(90px)',
              bottom: '20%',
              right: '-15%',
              opacity: 0.35,
            }}
            animate={{
              x: [0, -25, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(220, 60%, 40%) 0%, transparent 70%)',
              filter: 'blur(80px)',
              top: '40%',
              left: '30%',
              opacity: 0.25,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.35, 0.25],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Main Glass Container */}
        <div 
          className="flex-1 mx-3 mt-3 mb-3 rounded-3xl overflow-hidden relative z-10 flex flex-col"
          style={{
            marginTop: 'max(env(safe-area-inset-top, 12px), 12px)',
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `
              inset 0 1px 1px rgba(255, 255, 255, 0.1),
              0 8px 32px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          {/* Back Button - Top Left */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="absolute top-4 left-4 z-20 p-2 rounded-full"
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white/80" />
          </motion.button>

          {/* Hero Section with Stickers */}
          <div className="flex-shrink-0 pt-14 pb-4 px-4">
            {/* Stickers Collage */}
            <div className="relative w-full h-[200px] flex items-center justify-center mb-4">
              {/* Lift Weights Sticker - Left */}
              <motion.img
                src={liftWeightsSticker}
                alt="Lift Weights"
                className="absolute w-32 h-auto object-contain z-10 drop-shadow-2xl"
                style={{
                  left: '5%',
                  top: '15%',
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
                }}
                initial={{ opacity: 0, x: -30, rotate: -5 }}
                animate={{ opacity: 1, x: 0, rotate: -3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              />
              
              {/* Play Basketball Sticker - Center/Right */}
              <motion.img
                src={playBasketballSticker}
                alt="Play Basketball"
                className="absolute w-36 h-auto object-contain z-20 drop-shadow-2xl"
                style={{
                  right: '8%',
                  top: '0%',
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
                }}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              
              {/* Go Running Sticker - Bottom Right */}
              <motion.img
                src={goRunningSticker}
                alt="Go Running"
                className="absolute w-28 h-auto object-contain z-15 drop-shadow-2xl"
                style={{
                  right: '12%',
                  bottom: '0%',
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
                }}
                initial={{ opacity: 0, x: 30, rotate: 5 }}
                animate={{ opacity: 1, x: 0, rotate: 3 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
            </div>

            {/* Title and Subtitle */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">
                Capture your fitness and
                <br />
                workout moment.
              </h1>
              <p className="text-white/50 text-sm mt-2">
                Last 24 hours only.
              </p>
            </div>
          </div>

          {/* Photo Grid Section - Instagram Story Style */}
          <div 
            className="flex-1 px-3 pb-4 overflow-y-auto overscroll-contain"
            style={{ 
              paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 20px))',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {/* Camera Button - First Item */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCameraCapture}
                className="flex-shrink-0 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  width: '110px',
                  height: '150px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Camera focus corners */}
                <div className="absolute inset-4 pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/30 rounded-br-sm" />
                </div>
                <Camera className="w-8 h-8 text-white/50" strokeWidth={1.5} />
              </motion.button>

              {/* Gallery Items - Horizontal scroll like Instagram */}
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
                    height: '150px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    border: selectedItem?.id === item.id 
                      ? '2px solid rgba(255, 255, 255, 0.6)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
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
                  
                  {/* Video indicator badge */}
                  {item.isVideo && (
                    <div 
                      className="absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      Video
                    </div>
                  )}

                  {/* Selection indicator */}
                  {selectedItem?.id === item.id && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-white/10"
                    />
                  )}
                </motion.button>
              ))}

              {/* Empty state - show upload hint if no items */}
              {galleryItems.length === 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGallerySelect}
                  className="flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2"
                  style={{
                    width: '110px',
                    height: '150px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1.5px dashed rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <span className="text-white/30 text-xs text-center px-2">Tap to add photos</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Bottom Select Button */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-4 z-20"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
              background: 'linear-gradient(to top, rgba(10, 10, 18, 0.9) 0%, transparent 100%)',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={selectedItem ? handleItemSelect : handleGallerySelect}
              className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wider relative overflow-hidden"
              style={{
                background: selectedItem 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                color: selectedItem ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: `
                  inset 0 1px 1px rgba(255, 255, 255, 0.1),
                  0 4px 20px rgba(0, 0, 0, 0.2)
                `,
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
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
          </div>
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
