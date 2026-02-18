import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Play } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Photo {
  id: string;
  storageUrl: string;
  isVideo?: boolean;
  activity?: string;
  duration?: string;
  dayNumber: number;
}

interface DayCardSheetProps {
  isOpen: boolean;
  photo: Photo | null;       // null = empty slot
  dayNumber: number;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onViewActivity: (photo: Photo) => void;
  layoutId: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const DayCardSheet = ({
  isOpen,
  photo,
  dayNumber,
  onClose,
  onCamera,
  onGallery,
  onViewActivity,
  layoutId,
}: DayCardSheetProps) => {
  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0"
            style={{ zIndex: 9990, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={onClose}
          />

          {/* Morphing sheet — same layoutId as the card */}
          <motion.div
            key="sheet"
            layoutId={layoutId}
            className="fixed left-0 right-0 bottom-0 overflow-hidden"
            style={{
              zIndex: 9991,
              borderRadius: '28px 28px 0 0',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 100%)',
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderBottom: 'none',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 -20px 60px rgba(0,0,0,0.5)',
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Close button */}
            <motion.button
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full pressable"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.2 }}
            >
              <X className="w-4 h-4 text-white/70" />
            </motion.button>

            <div className="px-6 pt-2 pb-safe-bottom" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)' }}>
              {photo ? (
                /* Logged activity view */
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.28, ease: EASE }}
                  >
                    <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-1">Day {photo.dayNumber}</p>
                    <h3 className="text-white font-bold text-2xl mb-4">{photo.activity || 'Workout'}</h3>
                  </motion.div>

                  {/* Photo hero */}
                  <motion.div
                    className="rounded-2xl overflow-hidden mb-5"
                    style={{ aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.1)' }}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.32, ease: EASE }}
                  >
                    {photo.isVideo ? (
                      <video src={photo.storageUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    ) : (
                      <img src={photo.storageUrl} alt={photo.activity || ''} className="w-full h-full object-cover" />
                    )}
                  </motion.div>

                  {photo.duration && (
                    <motion.p
                      className="text-white/50 text-sm mb-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.22 }}
                    >
                      ⏱ {photo.duration}
                    </motion.p>
                  )}

                  {/* CTA */}
                  <motion.button
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm pressable"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      color: '#0a0720',
                    }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.28, ease: EASE }}
                    onClick={() => { onViewActivity(photo); onClose(); }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" />
                      View Activity
                    </span>
                  </motion.button>
                </>
              ) : (
                /* Empty slot — log new activity */
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.28, ease: EASE }}
                  >
                    <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-1">Day {dayNumber}</p>
                    <h3 className="text-white font-bold text-2xl mb-1">Log your workout</h3>
                    <p className="text-white/50 text-sm mb-6">Capture today's fitness moment.</p>
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    className="flex flex-col gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.28, ease: EASE }}
                  >
                    <button
                      className="flex items-center gap-4 p-4 rounded-2xl pressable"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onClick={() => { onCamera(); onClose(); }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #F97316, #EC4899)' }}
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">Take a Photo</p>
                        <p className="text-white/40 text-xs">Use camera to capture the moment</p>
                      </div>
                    </button>

                    <button
                      className="flex items-center gap-4 p-4 rounded-2xl pressable"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onClick={() => { onGallery(); onClose(); }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
                      >
                        <ImageIcon className="w-5 h-5 text-white/70" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">Choose from Gallery</p>
                        <p className="text-white/40 text-xs">Pick a photo from your library</p>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

export default DayCardSheet;
