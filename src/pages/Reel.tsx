import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp } from 'lucide-react';
import { JourneyActivity, ReactionType, toggleReaction, sendReaction, ActivityReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import DynamicBlurBackground from '@/components/DynamicBlurBackground';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import SendReactionSheet from '@/components/SendReactionSheet';

// Import 3D emoji assets for display
import clapEmoji from '@/assets/reactions/clap.png';
import fireEmoji from '@/assets/reactions/fire-cool.png';
import fistbumpEmoji from '@/assets/reactions/fistbump.png';
import wowEmoji from '@/assets/reactions/wow.png';

const DEFAULT_REACTIONS: Record<ReactionType, ActivityReaction> = {
  heart: { type: 'heart', count: 0, userReacted: false },
  clap: { type: 'clap', count: 0, userReacted: false },
  fistbump: { type: 'fistbump', count: 0, userReacted: false },
  wow: { type: 'wow', count: 0, userReacted: false },
  fire: { type: 'fire', count: 0, userReacted: false },
};

// Mock user avatars for demo
const MOCK_REACTORS = [
  { id: '1', name: 'Uttam', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
  { id: '2', name: 'Abhipsha', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
  { id: '3', name: 'Tavleen', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
  { id: '4', name: 'Sanya', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
];

const Reel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const activities: JourneyActivity[] = location.state?.activities || [];
  const initialIndex: number = location.state?.initialIndex || 0;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showReactsSheet, setShowReactsSheet] = useState(false);
  const [showSendReactionSheet, setShowSendReactionSheet] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<ReactionType | null>(null);
  const [localReactions, setLocalReactions] = useState<Record<string, {
    total: number;
    reactions: Record<ReactionType, ActivityReaction>;
  }>>({});

  const current = activities[currentIndex];
  const isOwnStory = user && current?.user_id === user.id;

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

  const [lastTap, setLastTap] = useState(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap < 300) {
      handleReact('heart');
    } else {
      goNext();
    }
    setLastTap(now);
  }, [lastTap, goNext]);

  const handleReact = async (type: ReactionType) => {
    if (!current) return;

    setFloatingReaction(type);
    setTimeout(() => setFloatingReaction(null), 1200);
    setShowSendReactionSheet(false);

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

    if (isOwnStory) {
      await toggleReaction(current.id, type);
    } else {
      await sendReaction(current.id, type);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  if (!activities.length || !current) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60">No content to display</div>
      </div>
    );
  }

  const isVideo = current.is_video || isVideoUrl(current.storage_url);
  const currentReactions = localReactions[current.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS } };
  
  const activeReactionTypes = Object.entries(currentReactions.reactions)
    .filter(([, r]) => r.count > 0)
    .map(([type]) => type as ReactionType);

  // Calculate week and day
  const week = Math.ceil(current.day_number / 3);
  const dayInWeek = ((current.day_number - 1) % 3) + 1;

  return (
    <DynamicBlurBackground imageUrl={current.storage_url}>
      {/* Floating 3D emojis around edges */}
      <Floating3DEmojis 
        reactions={activeReactionTypes}
        newReaction={floatingReaction}
      />

      {/* Header */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-8" />
        <span className="text-white font-semibold text-lg tracking-wide">
          Total Reaction • {String(currentReactions.total).padStart(2, '0')}
        </span>
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-7 h-7" strokeWidth={1.5} />
        </button>
      </motion.div>

      {/* Progress dots */}
      <div 
        className="absolute z-40 flex justify-center gap-1 left-0 right-0 px-6"
        style={{ top: 'calc(max(env(safe-area-inset-top, 16px), 16px) + 44px)' }}
      >
        {activities.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === currentIndex ? 20 : 6,
              background: i === currentIndex 
                ? 'linear-gradient(90deg, #a78bfa, #ec4899)' 
                : 'rgba(255, 255, 255, 0.3)',
            }}
          />
        ))}
      </div>

      {/* Main content area */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ 
          paddingTop: 'calc(max(env(safe-area-inset-top, 16px), 16px) + 70px)',
          paddingBottom: '200px',
          paddingInline: '24px',
        }}
      >
        {/* Card container */}
        <div className="relative w-full max-w-[360px]" onClick={handleTap}>
          {/* The main card - Magazine style with liquid glass */}
          <motion.div 
            className="relative w-full overflow-hidden"
            style={{ 
              borderRadius: 24,
              aspectRatio: '3 / 4.2',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          >
            {/* Card inner content with slight padding */}
            <div className="absolute inset-3 rounded-2xl overflow-hidden">
              {/* Full bleed image/video */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
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

              {/* Gradient overlay for text readability */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.5) 100%)',
                }}
              />

              {/* Magazine-style title overlay */}
              <div className="absolute top-4 left-4 z-10">
                <div className="text-white/80 text-xs font-medium italic tracking-wide">the</div>
                <div 
                  className="text-white font-black text-4xl leading-none"
                  style={{ 
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  Player
                </div>
                <div className="text-white/80 text-xs mt-1.5 font-medium">
                  Week {week} | Day {dayInWeek}
                </div>
              </div>

              {/* Stats at bottom */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
                <div className="flex gap-5">
                  {current.duration && (
                    <div>
                      <div className="text-white font-bold text-2xl">{current.duration.replace(/[^0-9]/g, '') || '2'}hrs</div>
                      <div className="text-white/70 text-xs">Duration</div>
                    </div>
                  )}
                  {current.pr && (
                    <div>
                      <div className="text-white font-bold text-2xl">{current.pr.replace(/[^0-9]/g, '') || '10'}</div>
                      <div className="text-white/70 text-xs">Rounds</div>
                    </div>
                  )}
                  {!current.duration && !current.pr && (
                    <>
                      <div>
                        <div className="text-white font-bold text-2xl">2hrs</div>
                        <div className="text-white/70 text-xs">Duration</div>
                      </div>
                      <div>
                        <div className="text-white font-bold text-2xl">10</div>
                        <div className="text-white/70 text-xs">Rounds</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation overlays */}
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-0 top-0 bottom-0 w-1/4 z-20"
              aria-label="Previous"
            />
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-0 top-0 bottom-0 w-1/4 z-20"
              aria-label="Next"
            />
          </motion.div>

          {/* User avatar overlapping card bottom */}
          <motion.div 
            className="absolute left-1/2 -translate-x-1/2 z-20"
            style={{ bottom: -40 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div 
              className="w-20 h-20 rounded-full overflow-hidden"
              style={{
                border: '4px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.display_name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer - Unified bottom pill */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 28px), 28px)',
          paddingInline: '20px',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          onClick={() => isOwnStory ? setShowReactsSheet(true) : setShowSendReactionSheet(true)}
          className="relative overflow-hidden"
          style={{
            minWidth: 200,
            height: 56,
            borderRadius: 28,
            background: 'rgba(45, 40, 55, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          layout
        >
          <AnimatePresence mode="wait">
            {isOwnStory ? (
              /* Owner view - shows avatars of reactors */
              <motion.div
                key="owner-pill"
                className="flex items-center justify-center gap-2 h-full px-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {currentReactions.total > 0 ? (
                  <>
                    <div className="flex -space-x-3">
                      {MOCK_REACTORS.slice(0, Math.min(currentReactions.total, 3)).map((reactor, i) => (
                        <motion.img
                          key={reactor.id}
                          src={reactor.avatar}
                          alt={reactor.name}
                          className="w-11 h-11 rounded-full object-cover"
                          style={{
                            border: '2px solid rgba(45, 40, 55, 0.95)',
                            zIndex: 10 - i,
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.08 }}
                        />
                      ))}
                      {currentReactions.total > 3 && (
                        <motion.div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white/90 text-sm font-semibold"
                          style={{
                            background: 'rgba(80, 75, 95, 0.9)',
                            border: '2px solid rgba(45, 40, 55, 0.95)',
                            zIndex: 7,
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.24 }}
                        >
                          +{currentReactions.total - 3}
                        </motion.div>
                      )}
                    </div>
                    <ChevronUp className="w-5 h-5 text-white/60 ml-1" />
                  </>
                ) : (
                  <span className="text-white/60 text-sm font-medium px-4">No reactions yet</span>
                )}
              </motion.div>
            ) : (
              /* Visitor view - shows SEND YOUR with emojis */
              <motion.div
                key="visitor-pill"
                className="flex items-center justify-center gap-3 h-full px-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <img src={clapEmoji} alt="clap" className="w-8 h-8 object-contain" />
                <span className="text-white font-bold text-base tracking-widest">SEND YOUR</span>
                <img src={fireEmoji} alt="fire" className="w-8 h-8 object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Reacts bottom sheet for own stories */}
      <AnimatePresence>
        {showReactsSheet && (
          <ReactsSoFarSheet
            total={currentReactions.total}
            reactions={currentReactions.reactions}
            reactors={MOCK_REACTORS}
            onClose={() => setShowReactsSheet(false)}
          />
        )}
      </AnimatePresence>

      {/* Send reaction sheet for other users' stories */}
      <AnimatePresence>
        {showSendReactionSheet && (
          <SendReactionSheet
            onReact={handleReact}
            onClose={() => setShowSendReactionSheet(false)}
          />
        )}
      </AnimatePresence>
    </DynamicBlurBackground>
  );
};

export default Reel;
