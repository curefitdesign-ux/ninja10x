import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { ReactionType, ActivityReaction } from '@/services/journey-service';

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
  duration?: string;
  pr?: string;
  dayNumber: number;
  reactionCount?: number;
  reactions?: Record<ReactionType, ActivityReaction>;
}

interface ActivityGalleryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activities: GalleryActivity[];
  initialIndex?: number;
}

export default function ActivityGalleryOverlay({
  isOpen,
  onClose,
  activities,
  initialIndex = 0,
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
            background: 'rgba(0, 0, 0, 0.85)',
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
                className="relative w-full rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: '3/4',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
                initial={{ opacity: 0, scale: 0.95, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -30 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {current.isVideo ? (
                  <video
                    src={current.originalUrl || current.storageUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                ) : (
                  <img
                    src={current.storageUrl}
                    alt={`Day ${current.dayNumber}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Day badge */}
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white font-bold text-xs"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Day {current.dayNumber}
                </div>

                {/* Activity type badge */}
                {current.activity && (
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-white/90 font-medium text-xs capitalize"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {current.activity}
                  </div>
                )}

                {/* Metrics row at bottom */}
                {(current.duration || current.pr) && (
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-center gap-3"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    }}
                  >
                    {current.duration && (
                      <span className="text-white/90 text-xs font-medium">⏱ {current.duration}</span>
                    )}
                    {current.pr && (
                      <span className="text-white/90 text-xs font-medium">🏅 {current.pr}</span>
                    )}
                  </div>
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
