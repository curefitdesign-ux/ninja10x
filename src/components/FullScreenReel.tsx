import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Heart, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { JourneyActivity, toggleReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';
import { useAuth } from '@/hooks/use-auth';

interface FullScreenReelProps {
  activities: JourneyActivity[];
  initialIndex: number;
  onClose: () => void;
  hasPublicActivity?: boolean;
  onUnlockRequest?: () => void;
}

export default function FullScreenReel({
  activities,
  initialIndex,
  onClose,
  hasPublicActivity = true,
  onUnlockRequest,
}: FullScreenReelProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showHeart, setShowHeart] = useState(false);
  const [localReactions, setLocalReactions] = useState<Record<string, { count: number; userReacted: boolean }>>({});
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const isDragging = useRef(false);
  const current = activities[currentIndex];
  
  // Check if current activity is from the logged-in user
  const isOwnActivity = user && current && current.user_id === user.id;
  // Show locked state for OTHER users' content when current user hasn't shared publicly
  const shouldShowLocked = !isOwnActivity && !hasPublicActivity;

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

  // Swipe handlers
  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 300;
    
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold) {
      if (info.offset.x > 0 || info.velocity.x > velocityThreshold) {
        // Swiped right - go to previous
        goPrev();
        setDragDirection('right');
      } else {
        // Swiped left - go to next
        goNext();
        setDragDirection('left');
      }
    }
    
    isDragging.current = false;
    setTimeout(() => setDragDirection(null), 300);
  }, [goNext, goPrev]);

  // Double-tap to heart
  const [lastTap, setLastTap] = useState(0);
  const handleTap = useCallback(() => {
    // Ignore taps right after dragging
    if (isDragging.current) return;
    
    if (shouldShowLocked) {
      onUnlockRequest?.();
      return;
    }
    
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap - toggle heart
      handleHeart();
    } else {
      // Single tap - advance
      goNext();
    }
    setLastTap(now);
  }, [lastTap, goNext, shouldShowLocked, onUnlockRequest]);

  const handleHeart = async () => {
    if (!current || shouldShowLocked) return;

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
          {shouldShowLocked ? 'Locked' : `Day ${current.day_number} • ${current.activity || 'Activity'}`}
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

      {/* Main content with swipe */}
      <motion.div
        className="flex-1 flex items-center justify-center relative touch-pan-y"
        onClick={handleTap}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={handleDragEnd}
        style={{ cursor: 'grab' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ 
              opacity: 0, 
              x: dragDirection === 'left' ? 100 : dragDirection === 'right' ? -100 : 0,
              scale: 1.02 
            }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              x: dragDirection === 'left' ? -100 : dragDirection === 'right' ? 100 : 0,
              scale: 0.98 
            }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {isVideo ? (
              <video
                src={current.storage_url}
                className="w-full h-full object-contain"
                style={{ filter: shouldShowLocked ? 'blur(20px)' : 'none' }}
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
                style={{ filter: shouldShowLocked ? 'blur(20px)' : 'none' }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Lock overlay for locked content */}
        {shouldShowLocked && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Frosted glass lock badge */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                <Lock className="w-7 h-7 text-white" />
              </div>
              
              <div className="text-center px-6">
                <p className="text-white font-semibold text-lg">Share to unlock</p>
                <p className="text-white/60 text-sm mt-1">
                  Make your progress public to view others
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockRequest?.();
                }}
                className="mt-2 px-6 py-2.5 rounded-full font-semibold text-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.95) 100%)',
                  color: '#000',
                  boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
                }}
              >
                Share my progress
              </button>
            </motion.div>
          </motion.div>
        )}

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
      </motion.div>

      {/* Footer with reactions */}
      {!shouldShowLocked && (
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
      )}
    </motion.div>
  );
}
