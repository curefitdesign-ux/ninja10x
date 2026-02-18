import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, ChevronDown, Lock } from "lucide-react";
import { useJourneyActivities, fetchPublicFeed, LocalActivity } from "@/hooks/use-journey-activities";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { JourneyActivity, ReactionType, ActivityReaction } from "@/services/journey-service";
import ProfileAvatar from "@/components/ProfileAvatar";
import MakePublicSheet, { hasUserChosenPublic } from "@/components/MakePublicSheet";
import { StoryCardSkeleton } from "@/components/SkeletonLoaders";

// Import tile assets
import tileActiveImg from "@/assets/progress/tile-active-new.png";
import tileInactiveImg from "@/assets/progress/tile-inactive.png";
import basePlatformImg from "@/assets/progress/base-platform.png";
import engineBadgeImg from "@/assets/progress/engine-badge.png";
import SharedImageTransition from "@/components/SharedImageTransition";
import { isVideoUrl } from "@/lib/media";

// Tile positions — Day 1 at TOP, Day 12 at BOTTOM (journey flows downward)
// S-curve diagonal: Week 1 sweeps right, Week 2 sweeps back left, etc.
const TILE_POSITIONS = [
  // Week 1 — right side of screen, sweeping right→left
  { left: 68, top: 3  },  // Day 1
  { left: 57, top: 10 },  // Day 2
  { left: 46, top: 17 },  // Day 3
  // Week 2 — center, continuing left→right
  { left: 38, top: 24 },  // Day 4
  { left: 48, top: 31 },  // Day 5
  { left: 60, top: 38 },  // Day 6
  // Week 3 — right side, sweeping right→left
  { left: 68, top: 45 },  // Day 7
  { left: 57, top: 52 },  // Day 8
  { left: 46, top: 59 },  // Day 9
  // Week 4 — center-left, continuing down
  { left: 38, top: 66 },  // Day 10
  { left: 48, top: 73 },  // Day 11
  { left: 58, top: 80 },  // Day 12
];

const LABELS = [
  { tileIndex: 0, text: ["BUILD", "STRENGTH"],    side: "right" as const, top: 3,  left: 74 },
  { tileIndex: 3, text: ["INCREASE", "STAMINA"],  side: "left"  as const, top: 24, left: 2  },
  { tileIndex: 6, text: ["BUILD", "ENERGY"],      side: "right" as const, top: 45, left: 74 },
  { tileIndex: 9, text: ["CONQUER", "WILL POWER"],side: "left"  as const, top: 66, left: 2  },
];

const Progress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [showContent, setShowContent] = useState(true);
  const [showTiles, setShowTiles] = useState(true);
  const [showStories, setShowStories] = useState(true);
  const [showTransitionIn, setShowTransitionIn] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Track if we've already handled the transition to prevent double execution
  const transitionHandledRef = useRef(false);

  // Current user's activities (for tile state)
  const { activities: myActivities, loading, hasPublicActivity, makeActivityPublic } = useJourneyActivities();

  // Public feed for top strip (all users)
  const [publicFeed, setPublicFeed] = useState<LocalActivity[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  
  // Privacy sheet state
  const [showMakePublicSheet, setShowMakePublicSheet] = useState(false);
  const [pendingDayNumber, setPendingDayNumber] = useState<number | null>(null);

  // Get transition data from navigation state
  const transitionImage = location.state?.transitionImage;
  const transitionDayNumber = location.state?.dayNumber || 1;
  const transitionToProgress = location.state?.transitionToProgress;
  const fromReel = location.state?.fromReel;

  // Pull-down gesture to go back to reel
  const dragY = useMotionValue(0);
  const headerOpacity = useTransform(dragY, [0, 100], [1, 0.5]);
  const storyStripScale = useTransform(dragY, [0, 100], [1, 1.1]);
  const contentOpacity = useTransform(dragY, [0, 80], [1, 0.3]);

  // Load public feed on mount - show ALL activities (including private from others for blurred view)
  useEffect(() => {
    const loadFeed = async () => {
      setFeedLoading(true);
      const feed = await fetchPublicFeed(true); // Pass true to include private activities
      setPublicFeed(feed);
      setFeedLoading(false);
    };
    loadFeed();
  }, []);

  // Default reactions shape
  const defaultReactions: Record<ReactionType, ActivityReaction> = {
    heart: { type: 'heart', count: 0, userReacted: false },
    clap: { type: 'clap', count: 0, userReacted: false },
    fistbump: { type: 'fistbump', count: 0, userReacted: false },
    wow: { type: 'wow', count: 0, userReacted: false },
    fire: { type: 'fire', count: 0, userReacted: false },
    flex: { type: 'flex', count: 0, userReacted: false },
    trophy: { type: 'trophy', count: 0, userReacted: false },
    runner: { type: 'runner', count: 0, userReacted: false },
    energy: { type: 'energy', count: 0, userReacted: false },
    timer: { type: 'timer', count: 0, userReacted: false },
  };

  // Convert to JourneyActivity shape for reel navigation with reactions
  const feedAsActivities: JourneyActivity[] = publicFeed.map(p => ({
    id: p.id,
    user_id: p.userId || '',
    storage_url: p.storageUrl,
    original_url: p.originalUrl || null,
    is_video: p.isVideo || false,
    activity: p.activity || null,
    frame: p.frame || null,
    duration: p.duration || null,
    pr: p.pr || null,
    day_number: p.dayNumber,
    is_public: p.isPublic || false,
    created_at: '',
    updated_at: '',
    reaction_count: p.reactionCount || 0,
    user_reacted: false,
    reactions: p.reactions || defaultReactions,
    is_own: user ? p.userId === user.id : false,
  }));

  const handleStoryStripTap = (index: number, userId?: string, activityId?: string) => {
    // Animate out then navigate to reel with specific activity
    setIsExiting(true);
    setTimeout(() => {
      navigate('/reel', {
        state: {
          userId: userId,
          activityId: activityId, // Open specific story, not latest
          fromProgress: true,
        }
      });
    }, 200);
  };

  // Animation sequence - instant content, no staggered delays
  // Handle transition from share - run once only
  useEffect(() => {
    // Prevent double execution
    if (transitionHandledRef.current) return;
    
    // Show transition animation if coming from share (brief overlay)
    if (transitionToProgress && transitionImage) {
      transitionHandledRef.current = true;
      setShowTransitionIn(true);
      setTimeout(() => setShowTransitionIn(false), 300);
      
      // Skip public prompt if profile is already set to public OR user previously chose public
      const isProfilePublic = profile?.stories_public === true;
      const currentActivity = myActivities.find(a => a.dayNumber === transitionDayNumber);
      
      if (currentActivity && !currentActivity.isPublic) {
        if (isProfilePublic || hasUserChosenPublic()) {
          // Auto-make public without prompting
          makeActivityPublic(transitionDayNumber);
        } else {
          // Show prompt for private profiles
          setTimeout(() => {
            setPendingDayNumber(transitionDayNumber);
            setShowMakePublicSheet(true);
          }, 400);
        }
      }
    }
  }, [transitionToProgress, transitionImage, transitionDayNumber, myActivities, makeActivityPublic, profile?.stories_public]);

  // Handle making activity public
  const handleMakePublic = async () => {
    // Ensure profile visibility is public so the community feed unlocks.
    try {
      if (profile?.stories_public === false) {
        await updateProfile({ stories_public: true });
      }
    } catch (e) {
      console.error('Failed to set profile public:', e);
    }

    if (pendingDayNumber) {
      await makeActivityPublic(pendingDayNumber);
    }
    setShowMakePublicSheet(false);
    setPendingDayNumber(null);
  };

  const handleKeepPrivate = () => {
    setShowMakePublicSheet(false);
    setPendingDayNumber(null);
  };

  const handleClose = () => {
    navigate("/", { 
      replace: true,
      state: {
        fromProgress: true,
        transitionImage,
        dayNumber: transitionDayNumber,
      }
    });
  };

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 80 && fromReel) {
      // Pull down to return to reel with exit animation
      setIsExiting(true);
      setTimeout(() => {
        navigate('/reel', { state: { fromProgress: true } });
      }, 200);
    }
  }, [navigate, fromReel]);

  // Day 1 = index 0 (top), Day 12 = index 11 (bottom)
  const getDayFromIndex = (index: number) => index + 1;
  const isTileActive = (dayNumber: number) => myActivities.some(a => a.dayNumber === dayNumber);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-manipulation"
      style={{ 
        background: "linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)",
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
      drag={fromReel ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.3 }}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: isExiting ? 0 : 1, 
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Background aurora */}
      <div 
        className="absolute pointer-events-none"
        style={{ left: "-53px", top: "-40px", width: "131vw", height: "auto" }}
      >
        <div 
          className="w-full h-[400px] opacity-40 mix-blend-screen"
          style={{ background: "radial-gradient(ellipse at center, rgba(138, 100, 200, 0.4) 0%, transparent 70%)" }}
        />
      </div>

      {/* Transition-in animation */}
      <AnimatePresence>
        {showTransitionIn && transitionImage && (
          <motion.div key="shared-image-transition">
            <SharedImageTransition
              imageUrl={transitionImage}
              targetSelector='[data-shared-element="progress-hero-card"]'
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with close/pull indicator */}
      <motion.div
        className="flex-shrink-0 w-full flex items-center justify-between px-4"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
          opacity: headerOpacity,
        }}
      >
        {fromReel ? (
          <motion.div 
            className="flex items-center gap-2 text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ChevronDown className="w-5 h-5" />
            <span className="text-xs font-medium">Pull down for stories</span>
          </motion.div>
        ) : (
          <div />
        )}
        
        <motion.button
          onClick={handleClose}
          className="flex items-center justify-center text-white/80 active:scale-95 transition-transform"
          style={{ width: '36px', height: '36px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <X className="w-6 h-6" strokeWidth={1.5} />
        </motion.button>
      </motion.div>

      {/* === TOP STORY STRIP - clickable to go back to reel === */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="flex-shrink-0 w-full overflow-x-auto scrollbar-hide overscroll-x-contain cursor-pointer"
            style={{
              paddingTop: "12px",
              paddingInline: "4vw",
              paddingBottom: "16px",
              minHeight: "130px",
              scale: storyStripScale,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-end gap-3">
              {feedLoading ? (
                // Loading state - skeleton placeholders
                <div className="flex items-end gap-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <StoryCardSkeleton size="lg" />
                    </motion.div>
                  ))}
                </div>
              ) : publicFeed.length > 0 ? (
                // Show all users' stories - blur others if current user hasn't made anything public
                publicFeed.map((photo, index) => {
                  const isOwnStory = user && photo.userId === user.id;
                  // Lock content if user's profile is private OR they haven't shared any public activity
                  const shouldBlur = !isOwnStory && (!profile?.stories_public || !hasPublicActivity);
                  
                  return (
                    <motion.button
                      key={photo.id}
                      data-shared-element={index === 0 ? "progress-hero-card" : undefined}
                      className="relative flex-shrink-0 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                      style={{
                        width: "72px",
                        height: "100px",
                        borderRadius: "14px",
                        boxShadow: isOwnStory ? "0 12px 40px rgba(100, 70, 180, 0.5)" : "0 4px 16px rgba(0,0,0,0.25)",
                        border: isOwnStory ? "2px solid rgba(160, 120, 220, 0.35)" : "1px solid rgba(255,255,255,0.1)",
                      }}
                      onClick={() => {
                        if (shouldBlur) {
                          // Prompt to make public - use the most recent activity
                          const latestActivity = myActivities[myActivities.length - 1];
                          if (latestActivity) {
                            setPendingDayNumber(latestActivity.dayNumber);
                            setShowMakePublicSheet(true);
                          }
                        } else {
                          // Pass activity ID to open this exact story
                          handleStoryStripTap(index, photo.userId, photo.id);
                        }
                      }}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      {photo.isVideo || isVideoUrl(photo.storageUrl) ? (
                        <video
                          src={photo.storageUrl}
                          className="w-full h-full object-cover"
                          style={{ filter: shouldBlur ? 'blur(12px)' : 'none' }}
                          muted
                          playsInline
                          loop
                          autoPlay
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={photo.storageUrl}
                          alt={`Day ${photo.dayNumber}`}
                          className="w-full h-full object-cover"
                          style={{ filter: shouldBlur ? 'blur(12px)' : 'none' }}
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.dataset.retried) {
                              img.dataset.retried = "true";
                              img.src = photo.storageUrl + "?t=" + Date.now();
                            }
                          }}
                        />
                      )}
                      
                      {/* Lock overlay for blurred content */}
                      {shouldBlur && (
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                          style={{
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
                            backdropFilter: 'blur(2px)',
                          }}
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              background: 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}
                          >
                            <Lock className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Activity tag pill - top left - always show with fallback */}
                      <div 
                        className="absolute top-1.5 left-1.5 px-2 py-px rounded-full z-30 flex items-center justify-center"
                        style={{
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          lineHeight: 1,
                        }}
                      >
                        <span className="text-white font-semibold text-[10px] drop-shadow-sm leading-none">
                          {photo.activity || 'Workout'}
                        </span>
                      </div>
                      
                      {/* User avatar overlay - ALWAYS clear, never locked */}
                      <div className="absolute bottom-1.5 left-1.5">
                        <ProfileAvatar
                          src={photo.avatarUrl}
                          name={photo.displayName}
                          size={24}
                          style={{ border: '2px solid rgba(255,255,255,0.6)' }}
                        />
                      </div>
                      
                      {/* Day badge */}
                      <div 
                        className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-white font-semibold text-[9px]"
                        style={{ 
                          background: "rgba(0,0,0,0.5)", 
                          backdropFilter: "blur(4px)",
                          opacity: shouldBlur ? 0.5 : 1,
                        }}
                      >
                        D{photo.dayNumber}
                      </div>
                    </motion.button>
                  );
                })
              ) : (
                // Empty state
                <motion.div
                  className="flex items-center gap-3 w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="relative flex-shrink-0 flex flex-col items-center justify-center"
                      style={{
                        width: "72px",
                        height: "100px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px dashed rgba(255,255,255,0.15)",
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                    >
                      <span className="text-xl mb-1">🏃</span>
                    </motion.div>
                  ))}
                  
                  <motion.div
                    className="flex-1 flex flex-col justify-center ml-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="text-white/70 text-sm font-medium">
                      No activities yet
                    </span>
                    <span className="text-white/40 text-xs mt-0.5">
                      Be the first to log!
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MAIN PROGRESS AREA - fills remaining space === */}
      <motion.div 
        className="flex-1 relative w-full overflow-hidden" 
        style={{ 
          maxWidth: "430px", 
          marginInline: "auto",
          opacity: contentOpacity,
        }}
      >
        {/* Engine Badge - positioned close to first tile */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute"
              style={{ left: "6%", top: "2%", width: "22%", aspectRatio: "1" }}
              initial={{ opacity: 0, scale: 0.6, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.4 }}
            >
              <img src={engineBadgeImg} alt="Engine Badge" className="w-full h-full object-contain" style={{ opacity: 0.7 }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diagonal Progress Tiles with user profile on LATEST tile only */}
        {TILE_POSITIONS.map((pos, index) => {
          const day = getDayFromIndex(index);
          const isActive = isTileActive(day);
          // Find the latest (highest) day number the user has completed
          const latestCompletedDay = myActivities.length > 0 
            ? Math.max(...myActivities.map(a => a.dayNumber)) 
            : 0;
          // Only show avatar on the latest completed tile
          const isLatestTile = day === latestCompletedDay;

          return (
            <motion.div
              key={day}
              className="absolute"
              style={{ 
                left: `${pos.left}%`, 
                top: `${pos.top}%`, 
                width: "11%", 
                aspectRatio: "1",
                transform: 'translateX(-50%)',
              }}
              initial={{ opacity: 0, y: 40, scale: 0.7 }}
              animate={showTiles ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 200, damping: 22, delay: index * 0.035 }}
            >
              <img src={isActive ? tileActiveImg : tileInactiveImg} alt={`Day ${day}`} className="w-full h-full object-contain relative z-10" />
              
              {/* User profile avatar ONLY on the latest completed tile - positioned on TOP of tile */}
              {isLatestTile && profile && (
                <motion.div
                  className="absolute"
                  style={{
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 20,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ProfileAvatar
                    src={profile.avatar_url}
                    name={profile.display_name}
                    size={28}
                    style={{ 
                      border: '2.5px solid rgba(160, 120, 220, 0.9)',
                      boxShadow: '0 4px 16px rgba(100, 70, 180, 0.6)',
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Milestone Labels */}
        {LABELS.map((label, idx) => (
          <motion.div
            key={idx}
            className={`absolute ${label.side === "left" ? "text-left" : "text-right"}`}
            style={{ top: `${label.top}%`, left: `${label.left}%`, width: label.side === "left" ? "26%" : "22%" }}
            initial={{ opacity: 0, x: label.side === "left" ? -20 : 20 }}
            animate={showTiles ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 + idx * 0.08 }}
          >
            {label.text.map((line, i) => (
              <div 
                key={i}
                className="font-bold uppercase"
                style={{ fontSize: "clamp(9px, 2.5vw, 12px)", letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.3 }}
              >
                {line}
              </div>
            ))}
            <div 
              className="absolute h-px"
              style={{
                top: "32px",
                ...(label.side === "left" 
                  ? { left: 0, right: "-150%", background: "linear-gradient(90deg, #FFF 0%, rgba(255,255,255,0) 100%)" }
                  : { right: 0, left: "-150%", background: "linear-gradient(270deg, #FFF 0%, rgba(255,255,255,0) 100%)" }
                ),
                opacity: 0.2,
              }}
            />
          </motion.div>
        ))}

        {/* Bottom Base Platform - increased size and positioned near last tile */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute"
              style={{ left: "35%", bottom: "3%", width: "46%", aspectRatio: "2.5" }}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <img src={basePlatformImg} alt="Base Platform" className="w-full h-full object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Make Public Sheet */}
      <MakePublicSheet
        isOpen={showMakePublicSheet}
        onClose={() => setShowMakePublicSheet(false)}
        onMakePublic={handleMakePublic}
        onKeepPrivate={handleKeepPrivate}
        thumbnailUrl={pendingDayNumber ? myActivities.find(a => a.dayNumber === pendingDayNumber)?.storageUrl : undefined}
      />
    </motion.div>
  );
};

export default Progress;
