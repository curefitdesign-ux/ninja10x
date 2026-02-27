import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { ReactionType, ActivityReaction } from '@/services/journey-service';
import StoryFrameRenderer from '@/components/StoryFrameRenderer';

import fireImg from '@/assets/reactions/fire-3d.png';
import clapImg from '@/assets/reactions/clap-3d.png';
import fistbumpImg from '@/assets/reactions/fistbump.png';
import wowImg from '@/assets/reactions/wow.png';
import flexImg from '@/assets/reactions/flex.png';
import energyImg from '@/assets/reactions/energy.png';
import runnerImg from '@/assets/reactions/runner.png';
import heartImg from '@/assets/reactions/heart-workout.png';
import stopwatchImg from '@/assets/reactions/stopwatch.png';
import dumbbellsImg from '@/assets/reactions/dumbbells.png';

const REACTION_IMAGES: Record<string, string> = {
  fire: fireImg,
  clap: clapImg,
  fistbump: fistbumpImg,
  wow: wowImg,
  flex: flexImg,
  energy: energyImg,
  runner: runnerImg,
  heart: heartImg,
  timer: stopwatchImg,
  trophy: dumbbellsImg,
};

interface GalleryActivity {
  id: string;
  storageUrl: string;
  originalUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  dayNumber: number;
  reactionCount?: number;
  reactions?: Record<ReactionType, ActivityReaction>;
  isPlaceholder?: boolean;
}

interface ActivityGalleryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activities: GalleryActivity[];
  initialIndex?: number;
  onLogActivity?: () => void;
}

export default function ActivityGalleryOverlay({
  isOpen,
  onClose,
  activities,
  initialIndex = 0,
  onLogActivity,
}: ActivityGalleryOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const portalContainer = usePortalContainer();
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  if (!isOpen || activities.length === 0) return null;

  const current = activities[currentIndex];
  const totalReactions = current?.reactionCount || 0;
  const reactions = current?.reactions;

  // Get non-zero reactions sorted by count
  const activeReactions = reactions
    ? Object.values(reactions).filter(r => r.count > 0).sort((a, b) => b.count - a.count)
    : [];

  const goNext = () => setCurrentIndex(i => Math.min(i + 1, activities.length - 1));
  const goPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    if (touchDeltaX.current > 60) goPrev();
    else if (touchDeltaX.current < -60) goNext();
  };

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Close button */}
          <motion.button
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
              top: 'max(env(safe-area-inset-top, 12px), 16px)',
            }}
            onClick={onClose}
            whileTap={{ scale: 0.85 }}
          >
            <X className="w-5 h-5 text-white/80" />
          </motion.button>

          {/* Counter */}
          <div
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white/70 text-xs font-medium"
            style={{
              background: 'rgba(255,255,255,0.08)',
              top: 'max(env(safe-area-inset-top, 12px), 16px)',
            }}
          >
            {currentIndex + 1} / {activities.length}
          </div>

          {/* Main content */}
          <motion.div
            className="relative w-full max-w-[380px] mx-4 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Activity image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                className="relative w-full overflow-hidden"
                style={{
                  aspectRatio: '9/16',
                  maxHeight: '55vh',
                  maxWidth: '100%',
                  borderRadius: '20px',
                  border: 'none',
                }}
                initial={{ opacity: 0, scale: 0.95, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -30 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {current.isPlaceholder ? (
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onLogActivity?.();
                    }}
                    style={{
                      background: 'linear-gradient(180deg, rgba(28,28,32,1) 0%, rgba(18,18,22,1) 100%)',
                      borderRadius: 20,
                    }}
                  >
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }} />
                    <div className="text-center px-6 mb-10 relative z-10">
                      <h2 className="text-foreground font-black text-2xl tracking-tight uppercase leading-tight">
                        Log Your
                      </h2>
                      <h2 className="text-foreground font-black text-2xl tracking-tight uppercase leading-tight">
                        Today's Activity
                      </h2>
                      <p className="text-muted-foreground text-sm mt-3 tracking-[0.2em] uppercase">
                        Day {current.dayNumber}
                      </p>
                    </div>
                    <div className="relative flex items-center justify-center z-10" style={{ width: 64, height: 64 }}>
                      <div className="absolute inset-0 rounded-full" style={{
                        background: 'radial-gradient(circle, rgba(15,228,152,0.4) 0%, transparent 65%)',
                        filter: 'blur(16px)',
                        transform: 'scale(2.5)',
                      }} />
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="20" y="6" width="8" height="36" rx="4" fill="#0FE498" />
                        <rect x="6" y="20" width="36" height="8" rx="4" fill="#0FE498" />
                      </svg>
                    </div>
                  </div>
                ) : current.frame ? (
                  <StoryFrameRenderer
                    imageUrl={current.originalUrl || current.storageUrl}
                    isVideo={current.isVideo}
                    activity={current.activity}
                    frame={current.frame}
                    duration={current.duration}
                    pr={current.pr}
                    dayNumber={current.dayNumber}
                  />
                ) : current.isVideo ? (
                  <video
                    src={current.originalUrl || current.storageUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                ) : (
                  <img
                    src={current.storageUrl}
                    alt={`Day ${current.dayNumber}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Reactions section */}
            {activeReactions.length > 0 && (
              <motion.div
                className="w-full px-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {activeReactions.map((reaction) => (
                    <div
                      key={reaction.type}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <img
                        src={REACTION_IMAGES[reaction.type] || heartImg}
                        alt={reaction.type}
                        className="w-5 h-5 object-contain"
                      />
                      <span className="text-white/80 text-xs font-medium">{reaction.count}</span>
                    </div>
                  ))}
                </div>
                {totalReactions > 0 && (
                  <p className="text-white/40 text-[10px] text-center mt-2 font-medium tracking-wide">
                    {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
                  </p>
                )}
              </motion.div>
            )}

            {activeReactions.length === 0 && (
              <p className="text-white/30 text-xs text-center">No reactions yet</p>
            )}

            {/* Dot indicators */}
            {activities.length > 1 && (
              <div className="flex items-center gap-1.5 mt-1">
                {activities.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === currentIndex ? 16 : 6,
                      height: 6,
                      background: i === currentIndex
                        ? 'linear-gradient(90deg, #F97316, #EC4899)'
                        : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, portalContainer);
}
