import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { useRef, forwardRef } from 'react';
import { Camera, Image, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import goRunningSticker from '@/assets/stickers/go-running.png';
import liftWeightsSticker from '@/assets/stickers/lift-weights.png';
import playBasketballSticker from '@/assets/stickers/play-basketball.png';

interface MediaSourceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dayNumber: number;
  activity?: string;
  preserveActivity?: boolean;
  zIndex?: number;
}

const MediaSourceSheet = forwardRef<HTMLDivElement, MediaSourceSheetProps>(function MediaSourceSheet({ isOpen, onClose, dayNumber, activity, preserveActivity, zIndex = 50 }, _ref) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portalContainer = usePortalContainer();

  const handleCameraSelect = () => {
    triggerHaptic('medium');
    onClose();
    navigate('/camera', { 
      state: { 
        dayNumber,
        activity: preserveActivity ? activity : undefined,
        returnToPreview: preserveActivity,
      } 
    });
  };

  const handleGallerySelect = () => {
    triggerHaptic('medium');
    // Directly trigger file picker
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      onClose();
      navigate('/preview', {
        state: {
          imageUrl: url,
          originalUrl: url,
          isVideo,
          dayNumber,
          activity: preserveActivity ? activity : undefined,
          fromGallery: true,
          file,
        },
      });
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />

          {/* Sheet - fixed to viewport bottom with highest z-index */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed left-0 right-0 rounded-t-3xl overflow-hidden"
            style={{
              bottom: 0,
              zIndex: 50,
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <X className="w-4 h-4 text-white/70" />
            </button>

            {/* Content - Always show stickers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="px-6 pt-4 pb-6"
            >
              {/* Stickers Collage */}
              <div className="relative h-48 mb-6 flex items-center justify-center">
                {/* Lift Weights - Left */}
                <motion.img
                  src={liftWeightsSticker}
                  alt="Lift Weights"
                  className="absolute w-32 h-auto drop-shadow-lg"
                  style={{ left: '5%', bottom: '10%' }}
                  initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: -5 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                />
                {/* Play Basketball - Right */}
                <motion.img
                  src={playBasketballSticker}
                  alt="Play Basketball"
                  className="absolute w-28 h-auto drop-shadow-lg"
                  style={{ right: '5%', top: '0%' }}
                  initial={{ opacity: 0, scale: 0.5, rotate: 15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 5 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                />
                {/* Go Running - Center Bottom */}
                <motion.img
                  src={goRunningSticker}
                  alt="Go Running"
                  className="absolute w-28 h-auto drop-shadow-lg"
                  style={{ right: '20%', bottom: '0%' }}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                />
              </div>

              {/* Text */}
              <div className="text-center mb-6">
                <h2 className="text-white text-xl font-bold mb-2">
                  Capture your fitness and workout moment.
                </h2>
                <p className="text-white/50 text-sm">
                  Last 24 hours only.
                </p>
              </div>
            </motion.div>

            {/* Hidden file input for direct gallery access */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Options */}
            <div className="px-6 pb-6 flex gap-3">
              {/* Camera Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleCameraSelect}
                className="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Camera className="w-6 h-6 text-white/90" />
                </div>
                <span className="text-white font-medium text-sm">Camera</span>
              </motion.button>

              {/* Gallery Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleGallerySelect}
                className="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Image className="w-6 h-6 text-white/90" />
                </div>
                <span className="text-white font-medium text-sm">Gallery</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalContainer
  );
});

export default MediaSourceSheet;
