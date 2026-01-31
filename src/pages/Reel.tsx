import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ChevronUp, MapPin } from 'lucide-react';
import { ReactionType, toggleReaction, sendReaction, ActivityReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';
import { useAuth } from '@/hooks/use-auth';
import { fetchAllActivitiesGroupedByUser, UserStoryGroup, LocalActivity } from '@/hooks/use-journey-activities';
import DynamicBlurBackground from '@/components/DynamicBlurBackground';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import SendReactionSheet from '@/components/SendReactionSheet';

// Import 3D emoji assets for display
import clapEmoji from '@/assets/reactions/clap-3d.png';
import fireEmoji from '@/assets/reactions/fire-3d.png';
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

const SWIPE_THRESHOLD = 50;

const Reel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // State for user story groups
  const [userGroups, setUserGroups] = useState<UserStoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Current user index (horizontal swipe between users)
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  // Current activity index within current user (tap to cycle)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  
  const [showReactsSheet, setShowReactsSheet] = useState(false);
  const [showSendReactionSheet, setShowSendReactionSheet] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<ReactionType | null>(null);
  const [localReactions, setLocalReactions] = useState<Record<string, {
    total: number;
    reactions: Record<ReactionType, ActivityReaction>;
  }>>({});

  // Load all activities grouped by user
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const groups = await fetchAllActivitiesGroupedByUser();
      setUserGroups(groups);
      
      // Initialize reactions state
      const map: Record<string, { total: number; reactions: Record<ReactionType, ActivityReaction> }> = {};
      for (const group of groups) {
        for (const a of group.activities) {
          map[a.id] = {
            total: a.reactionCount || 0,
            reactions: a.reactions || { ...DEFAULT_REACTIONS },
          };
        }
      }
      setLocalReactions(map);
      
      // Check if we should start at a specific user (from navigation state)
      if (location.state?.userId && groups.length > 0) {
        const idx = groups.findIndex(g => g.userId === location.state.userId);
        if (idx >= 0) setCurrentUserIndex(idx);
      }
      
      setLoading(false);
    };
    loadData();
  }, [location.state?.userId]);

  const currentGroup = userGroups[currentUserIndex];
  const currentActivity = currentGroup?.activities[currentActivityIndex];
  const isOwnStory = user && currentGroup?.userId === user.id;

  // Navigate between users (horizontal swipe)
  const goNextUser = useCallback(() => {
    if (userGroups.length === 0) return;
    setCurrentActivityIndex(0); // Reset to first activity
    setCurrentUserIndex(prev => (prev + 1) % userGroups.length);
  }, [userGroups.length]);

  const goPrevUser = useCallback(() => {
    if (userGroups.length === 0) return;
    setCurrentActivityIndex(0); // Reset to first activity
    setCurrentUserIndex(prev => (prev - 1 + userGroups.length) % userGroups.length);
  }, [userGroups.length]);

  // Navigate between activities within current user (tap)
  const cycleActivity = useCallback(() => {
    if (!currentGroup || currentGroup.activities.length <= 1) return;
    setCurrentActivityIndex(prev => (prev + 1) % currentGroup.activities.length);
  }, [currentGroup]);

  // Swipe gesture handling
  const dragX = useMotionValue(0);
  const cardOpacity = useTransform(dragX, [-150, 0, 150], [0.6, 1, 0.6]);
  const cardRotate = useTransform(dragX, [-150, 0, 150], [-8, 0, 8]);
  const cardScale = useTransform(dragX, [-150, 0, 150], [0.95, 1, 0.95]);
  
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Check if swipe is strong enough
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500) {
      if (offset.x < 0) {
        goNextUser(); // Swipe left -> next user
      } else {
        goPrevUser(); // Swipe right -> previous user
      }
    }
  }, [goNextUser, goPrevUser]);

  const [lastTap, setLastTap] = useState(0);
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap -> heart reaction
      if (!isOwnStory) {
        handleReact('heart');
      }
    } else {
      // Single tap -> cycle to next activity
      if (currentGroup && currentGroup.activities.length > 1) {
        cycleActivity();
      }
    }
    setLastTap(now);
  }, [lastTap, cycleActivity, isOwnStory, currentGroup]);

  const handleNavigateToProgress = () => {
    navigate('/progress');
  };

  const handleReact = async (type: ReactionType) => {
    if (!currentActivity) return;

    setFloatingReaction(type);
    setTimeout(() => setFloatingReaction(null), 1200);
    setShowSendReactionSheet(false);

    setLocalReactions(prev => {
      const existing = prev[currentActivity.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS } };
      const newReactions = { ...existing.reactions };
      newReactions[type] = {
        ...newReactions[type],
        count: newReactions[type].count + 1,
        userReacted: true,
      };
      return {
        ...prev,
        [currentActivity.id]: {
          total: existing.total + 1,
          reactions: newReactions,
        },
      };
    });

    if (isOwnStory) {
      await toggleReaction(currentActivity.id, type);
    } else {
      await sendReaction(currentActivity.id, type);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') goNextUser();
      if (e.key === 'ArrowLeft') goPrevUser();
      if (e.key === ' ') cycleActivity();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNextUser, goPrevUser, cycleActivity]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60">Loading stories...</div>
      </div>
    );
  }

  if (!userGroups.length || !currentGroup || !currentActivity) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-white/60">No stories yet</div>
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-full text-white/80 bg-white/10"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isVideo = currentActivity.isVideo || isVideoUrl(currentActivity.storageUrl);
  const currentReactions = localReactions[currentActivity.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS } };
  
  const activeReactionTypes = Object.entries(currentReactions.reactions)
    .filter(([, r]) => r.count > 0)
    .map(([type]) => type as ReactionType);

  // Calculate week and day
  const week = Math.ceil(currentActivity.dayNumber / 3);
  const dayInWeek = ((currentActivity.dayNumber - 1) % 3) + 1;

  return (
    <DynamicBlurBackground imageUrl={currentActivity.storageUrl}>
      {/* Floating 3D emojis around edges */}
      <Floating3DEmojis 
        reactions={activeReactionTypes}
        newReaction={floatingReaction}
      />

      {/* Header */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* User info */}
        <div className="flex items-center gap-2">
          <div 
            className="w-9 h-9 rounded-full overflow-hidden"
            style={{ border: '2px solid rgba(255,255,255,0.3)' }}
          >
            {currentGroup.avatarUrl ? (
              <img 
                src={currentGroup.avatarUrl} 
                alt={currentGroup.displayName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {currentGroup.displayName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{currentGroup.displayName}</div>
            <div className="text-white/50 text-xs">
              {currentGroup.activities.length} {currentGroup.activities.length === 1 ? 'story' : 'stories'}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors p-2"
        >
          <X className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </motion.div>

      {/* User story dots (horizontal) - which activity within this user */}
      {currentGroup.activities.length > 1 && (
        <div 
          className="absolute z-40 flex justify-center gap-1.5 left-0 right-0 px-6"
          style={{ top: 'calc(max(env(safe-area-inset-top, 16px), 16px) + 52px)' }}
        >
          {currentGroup.activities.map((_, i) => (
            <motion.div
              key={i}
              className="h-1 rounded-full transition-all duration-300 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentActivityIndex(i);
              }}
              style={{
                width: i === currentActivityIndex ? 24 : 8,
                background: i === currentActivityIndex 
                  ? 'linear-gradient(90deg, #a78bfa, #ec4899)' 
                  : 'rgba(255, 255, 255, 0.3)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            />
          ))}
        </div>
      )}

      {/* Main content area */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ 
          paddingTop: 'calc(max(env(safe-area-inset-top, 16px), 16px) + 80px)',
          paddingBottom: '220px',
          paddingInline: '20px',
        }}
      >
        {/* Card container with swipe gestures */}
        <motion.div 
          className="relative w-full max-w-[340px] cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={handleTap}
          style={{ 
            x: dragX,
            opacity: cardOpacity,
            rotate: cardRotate,
            scale: cardScale,
          }}
        >
          {/* The main card */}
          <motion.div 
            className="relative w-full overflow-hidden"
            style={{ 
              borderRadius: 24,
              aspectRatio: '3 / 4',
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
            {/* Card inner content */}
            <div className="absolute inset-3 rounded-2xl overflow-hidden">
              {/* Full bleed image/video */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentActivity.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
                  {isVideo ? (
                    <video
                      src={currentActivity.storageUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentActivity.storageUrl}
                      alt={`Day ${currentActivity.dayNumber}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.retried) {
                          img.dataset.retried = "true";
                          img.src = currentActivity.storageUrl + "?t=" + Date.now();
                        }
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Gradient overlay */}
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
                  className="text-white font-black text-3xl leading-none"
                  style={{ 
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  Player
                </div>
                <div className="text-white/80 text-xs mt-1 font-medium">
                  Week {week} | Day {dayInWeek}
                </div>
              </div>

              {/* Activity badge */}
              {currentActivity.activity && (
                <div className="absolute top-4 right-4 z-10">
                  <div 
                    className="px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                  >
                    {currentActivity.activity}
                  </div>
                </div>
              )}

              {/* Stats at bottom */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
                <div className="flex gap-4">
                  {currentActivity.duration && (
                    <div>
                      <div className="text-white font-bold text-xl">{currentActivity.duration.replace(/[^0-9]/g, '') || '2'}hrs</div>
                      <div className="text-white/70 text-[10px]">Duration</div>
                    </div>
                  )}
                  {currentActivity.pr && (
                    <div>
                      <div className="text-white font-bold text-xl">{currentActivity.pr.replace(/[^0-9]/g, '') || '10'}</div>
                      <div className="text-white/70 text-[10px]">Rounds</div>
                    </div>
                  )}
                  {!currentActivity.duration && !currentActivity.pr && (
                    <>
                      <div>
                        <div className="text-white font-bold text-xl">Day</div>
                        <div className="text-white/70 text-[10px]">#{currentActivity.dayNumber}</div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Reaction count badge */}
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                >
                  <span>🔥</span>
                  <span className="text-white font-semibold text-sm">{currentReactions.total}</span>
                </div>
              </div>

              {/* Multi-story indicator */}
              {currentGroup.activities.length > 1 && (
                <div 
                  className="absolute top-1/2 right-3 -translate-y-1/2 flex flex-col items-center gap-1 z-10"
                >
                  <span className="text-white/60 text-[10px] font-medium">
                    {currentActivityIndex + 1}/{currentGroup.activities.length}
                  </span>
                  <span className="text-white/40 text-[8px]">tap</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* User thumbnails strip (horizontal scroll) */}
      <motion.div
        className="absolute z-40 left-0 right-0 flex justify-center"
        style={{ bottom: 'calc(max(env(safe-area-inset-bottom, 24px), 24px) + 100px)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
          {userGroups.map((group, idx) => (
            <motion.button
              key={group.userId}
              onClick={() => {
                setCurrentUserIndex(idx);
                setCurrentActivityIndex(0);
              }}
              className="relative"
              whileTap={{ scale: 0.9 }}
            >
              <div 
                className="w-10 h-10 rounded-full overflow-hidden transition-all"
                style={{ 
                  border: idx === currentUserIndex 
                    ? '2px solid #a78bfa' 
                    : '2px solid rgba(255,255,255,0.2)',
                  opacity: idx === currentUserIndex ? 1 : 0.6,
                }}
              >
                {group.avatarUrl ? (
                  <img 
                    src={group.avatarUrl} 
                    alt={group.displayName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {group.displayName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              {/* Activity count badge */}
              {group.activities.length > 1 && (
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}
                >
                  {group.activities.length}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Bottom area: Reaction pill + View Progress button */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-3"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
          paddingInline: '20px',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Reaction pill */}
        <motion.button
          onClick={() => isOwnStory ? setShowReactsSheet(true) : setShowSendReactionSheet(true)}
          className="relative overflow-hidden"
          style={{
            minWidth: 200,
            height: 52,
            borderRadius: 26,
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
              /* Owner view */
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
                          className="w-10 h-10 rounded-full object-cover"
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
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white/90 text-sm font-semibold"
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
              /* Visitor view */
              <motion.div
                key="visitor-pill"
                className="flex items-center justify-center gap-3 h-full px-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <img src={clapEmoji} alt="clap" className="w-7 h-7 object-contain" />
                <span className="text-white font-bold text-sm tracking-widest">SEND YOUR</span>
                <img src={fireEmoji} alt="fire" className="w-7 h-7 object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* View Progress button */}
        <motion.button
          onClick={handleNavigateToProgress}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white/80 hover:text-white transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">View Progress</span>
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
