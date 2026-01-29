import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { JourneyActivity, ReactionType, toggleReaction, sendReaction, ActivityReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';
import { useAuth } from '@/hooks/use-auth';
import StoryReactionBar from '@/components/StoryReactionBar';
import StoryReactionDisplay from '@/components/StoryReactionDisplay';
import FloatingReaction from '@/components/FloatingReaction';

const DEFAULT_REACTIONS: Record<ReactionType, ActivityReaction> = {
  heart: { type: 'heart', count: 0, userReacted: false },
  clap: { type: 'clap', count: 0, userReacted: false },
  fistbump: { type: 'fistbump', count: 0, userReacted: false },
  wow: { type: 'wow', count: 0, userReacted: false },
  fire: { type: 'fire', count: 0, userReacted: false },
};

const Reel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get activities and initial index from navigation state
  const activities: JourneyActivity[] = location.state?.activities || [];
  const initialIndex: number = location.state?.initialIndex || 0;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [floatingReaction, setFloatingReaction] = useState<ReactionType | null>(null);
  const [localReactions, setLocalReactions] = useState<Record<string, {
    total: number;
    reactions: Record<ReactionType, ActivityReaction>;
  }>>({});

  const current = activities[currentIndex];
  const isOwnStory = user && current?.user_id === user.id;

  // Initialize local reaction state from activities
  useEffect(() => {
    const map: Record<string, { total: number; reactions: Record<ReactionType, ActivityReaction> }> = {};
    for (const a of activities) {
      map[a.id] = {
        total: a.reaction_count || 0,
        reactions: a.reactions || { ...DEFAULT_REACTIONS },
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
      // Double tap - send heart reaction
      handleReact('heart');
    } else {
      // Single tap - advance
      goNext();
    }
    setLastTap(now);
  }, [lastTap, goNext]);

  const handleReact = async (type: ReactionType) => {
    if (!current) return;

    // Show floating reaction animation
    setFloatingReaction(type);

    // Optimistic update
    setLocalReactions(prev => {
      const existing = prev[current.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS } };
      const newReactions = { ...existing.reactions };
      newReactions[type] = {
        ...newReactions[type],
        count: newReactions[type].count + 1,
        userReacted: true,
      };
      return {
        ...prev,
        [current.id]: {
          total: existing.total + 1,
          reactions: newReactions,
        },
      };
    });

    // Send to backend (always add, don't toggle for other users)
    if (isOwnStory) {
      // For own story, toggle the reaction
      await toggleReaction(current.id, type);
    } else {
      // For other users' stories, just send (add) the reaction
      await sendReaction(current.id, type);
    }
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
  const currentReactions = localReactions[current.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS } };

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ 
        height: '100dvh',
        background: 'linear-gradient(180deg, #1a1520 0%, #0d0a12 100%)',
      }}
    >
      {/* Floating reaction animation */}
      <AnimatePresence>
        {floatingReaction && (
          <FloatingReaction 
            type={floatingReaction} 
            onComplete={() => setFloatingReaction(null)} 
          />
        )}
      </AnimatePresence>

      {/* Header with glassmorphism */}
      <motion.div 
        className="absolute top-0 left-0 right-0 z-20"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
          paddingBottom: '12px',
          paddingInline: '16px',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Glassmorphic header bar */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button 
            onClick={handleClose} 
            className="p-2 -ml-2 text-white/80 hover:text-white transition-colors rounded-full"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-white font-semibold text-sm">
              Day {current.day_number}
            </span>
            {current.activity && (
              <span className="text-white/50 text-xs">
                {current.activity}
              </span>
            )}
          </div>
          
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-3 px-4">
          {activities.map((_, i) => (
            <motion.div
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === currentIndex ? 24 : 6,
                background: i === currentIndex 
                  ? 'linear-gradient(90deg, #a78bfa, #ec4899)' 
                  : 'rgba(255, 255, 255, 0.25)',
              }}
              layoutId={`dot-${i}`}
            />
          ))}
        </div>
      </motion.div>

      {/* Main content area */}
      <div
        className="relative w-full flex-1 flex items-center justify-center px-4"
        style={{ 
          maxWidth: '430px',
          paddingTop: 'calc(max(env(safe-area-inset-top, 12px), 12px) + 100px)',
          paddingBottom: '160px',
        }}
        onClick={handleTap}
      >
        {/* Media container with glassmorphic frame */}
        <motion.div 
          className="relative w-full overflow-hidden"
          style={{ 
            borderRadius: 24,
            aspectRatio: '3 / 4',
            maxHeight: 'calc(100dvh - 280px)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
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

          {/* Navigation arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors rounded-full"
            style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors rounded-full"
            style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Day badge */}
          <div 
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-white font-semibold text-xs"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            Day {current.day_number}
          </div>
        </motion.div>
      </div>

      {/* Footer - different for own vs other stories */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-4"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
          paddingTop: '16px',
          paddingInline: '16px',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isOwnStory ? (
          // Own story - show reaction display (total + breakdown)
          <StoryReactionDisplay 
            reactions={currentReactions.reactions}
            totalCount={currentReactions.total}
          />
        ) : (
          // Other's story - show reaction bar to send reactions
          <div className="flex flex-col items-center gap-3">
            <span className="text-white/40 text-xs uppercase tracking-wider">
              Send a reaction
            </span>
            <StoryReactionBar 
              onReact={handleReact}
            />
          </div>
        )}

        {/* Activity details */}
        {(current.duration || current.pr) && (
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-full text-white/60 text-xs"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {current.duration && <span>⏱️ {current.duration}</span>}
            {current.pr && <span>🏆 PR: {current.pr}</span>}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Reel;
