import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { JourneyActivity, toggleReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';

const Reel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get activities and initial index from navigation state
  const activities: JourneyActivity[] = location.state?.activities || [];
  const initialIndex: number = location.state?.initialIndex || 0;
  
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
      handleHeart();
    } else {
      goNext();
    }
    setLastTap(now);
  }, [lastTap, goNext]);

  const handleHeart = async () => {
    if (!current) return;

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

    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);

    await toggleReaction(current.id);
  };

  const handleClose = () => {
    navigate(-1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // Redirect if no activities
  if (!activities.length || !current) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60">No content to display</div>
      </div>
    );
  }

  const isVideo = current.is_video || isVideoUrl(current.storage_url);
  const reaction = localReactions[current.id] || { count: 0, userReacted: false };

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col items-center justify-center"
      style={{ height: '100dvh' }}
    >
      {/* Header */}
      <div 
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
          paddingBottom: '8px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)'
        }}
      >
        <button onClick={handleClose} className="p-2 text-white/80 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="text-white/80 text-sm font-medium">
          Day {current.day_number} • {current.activity || 'Activity'}
        </div>
        <div className="w-10" />
      </div>

      {/* Progress dots */}
      <div 
        className="absolute z-20 flex justify-center gap-1 px-4"
        style={{ top: 'calc(max(env(safe-area-inset-top, 12px), 12px) + 48px)' }}
      >
        {activities.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === currentIndex ? 'bg-white w-6' : 'bg-white/40 w-1.5'
            }`}
          />
        ))}
      </div>

      {/* Main content - Fixed 16:9 aspect ratio container */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ 
          maxWidth: '430px',
          height: 'calc(100dvh - 160px)', // Leave room for header and footer
        }}
        onClick={handleTap}
      >
        {/* 16:9 aspect ratio wrapper */}
        <div 
          className="relative w-full overflow-hidden rounded-2xl"
          style={{ 
            aspectRatio: '16 / 9',
            maxHeight: 'calc(100dvh - 200px)',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {isVideo ? (
                <video
                  src={current.storage_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={current.storage_url}
                  alt={`Day ${current.day_number}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.retried) {
                      img.dataset.retried = "true";
                      img.src = current.storage_url + "?t=" + Date.now();
                    }
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Heart animation */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Heart className="w-20 h-20 text-red-500 fill-red-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Footer with reactions */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20 px-4"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
          paddingTop: '16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)'
        }}
      >
        <div className="flex items-center gap-3 max-w-[430px] mx-auto">
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
    </div>
  );
};

export default Reel;
