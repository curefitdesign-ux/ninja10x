import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { JourneyActivity, toggleReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';

interface FullScreenReelProps {
  activities: JourneyActivity[];
  initialIndex: number;
  onClose: () => void;
}

export default function FullScreenReel({
  activities,
  initialIndex,
  onClose,
}: FullScreenReelProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showHeart, setShowHeart] = useState(false);
  const [localReactions, setLocalReactions] = useState<Record<string, { count: number; userReacted: boolean }>>({});

  const current = activities[currentIndex];

  // Initialize local reaction state from activities
  useEffect(() => {
    const map: Record<string, { count: number; userReacted: boolean }> = {};
    for (const a of activities) {
      map[a.id] = {
        count: a.reaction_count || 0,
        userReacted: a.user_reacted || false,
      };
    }
    setLocalReactions(map);
  }, [activities]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % activities.length);
  }, [activities.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + activities.length) % activities.length);
  }, [activities.length]);

  // Double-tap to heart
  const [lastTap, setLastTap] = useState(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap - toggle heart
      handleHeart();
    } else {
      // Single tap - advance
      goNext();
    }
    setLastTap(now);
  }, [lastTap, goNext]);

  const handleHeart = async () => {
    if (!current) return;

    // Optimistic update
    setLocalReactions(prev => {
      const existing = prev[current.id] || { count: 0, userReacted: false };
      return {
        ...prev,
        [current.id]: {
          count: existing.userReacted ? existing.count - 1 : existing.count + 1,
          userReacted: !existing.userReacted,
        },
      };
    });

    // Show heart animation
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);

    // Persist to backend
    await toggleReaction(current.id);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  if (!current) return null;

  const isVideo = current.is_video || isVideoUrl(current.storage_url);
  const reaction = localReactions[current.id] || { count: 0, userReacted: false };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="text-white/80 text-sm font-medium">
          Day {current.day_number} • {current.activity || 'Activity'}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Progress dots */}
      <div className="absolute top-14 left-0 right-0 z-20 flex justify-center gap-1 px-4">
        {activities.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === currentIndex ? 'bg-white w-6' : 'bg-white/40 w-1.5'
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex items-center justify-center relative"
        onClick={handleTap}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isVideo ? (
              <video
                src={current.storage_url}
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={current.storage_url}
                alt={`Day ${current.day_number}`}
                className="w-full h-full object-contain"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Heart animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              className="absolute z-30 pointer-events-none"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Heart className="w-24 h-24 text-red-500 fill-red-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation arrows (desktop) */}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white hidden md:block"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white hidden md:block"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Footer with reactions */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 py-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleHeart(); }}
            className="flex items-center gap-2 text-white"
          >
            <Heart
              className={`w-7 h-7 transition-colors ${
                reaction.userReacted ? 'text-red-500 fill-red-500' : 'text-white'
              }`}
            />
            {reaction.count > 0 && (
              <span className="text-white/80 text-sm">{reaction.count}</span>
            )}
          </button>

          <div className="ml-auto text-white/60 text-xs">
            {current.duration && <span>{current.duration}</span>}
            {current.pr && <span className="ml-2">PR: {current.pr}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
