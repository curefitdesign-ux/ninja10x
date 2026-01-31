import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, ChevronDown, Lock } from "lucide-react";
import { useJourneyActivities, fetchPublicFeed, LocalActivity } from "@/hooks/use-journey-activities";
import { useAuth } from "@/hooks/use-auth";
import { JourneyActivity, ReactionType, ActivityReaction } from "@/services/journey-service";
import ProfileAvatar from "@/components/ProfileAvatar";
import MakePublicSheet from "@/components/MakePublicSheet";

// Import tile assets
import tileActiveImg from "@/assets/progress/tile-active-new.png";
import tileInactiveImg from "@/assets/progress/tile-inactive.png";
import basePlatformImg from "@/assets/progress/base-platform.png";
import engineBadgeImg from "@/assets/progress/engine-badge.png";
import SharedImageTransition from "@/components/SharedImageTransition";
import { isVideoUrl } from "@/lib/media";

// Tile positions - optimized for mobile viewport with percentage-based layout
const TILE_POSITIONS = [
  { left: 34, top: 8 },
  { left: 42, top: 13 },
  { left: 50, top: 18 },
  { left: 58, top: 23 },
  { left: 50, top: 28 },
  { left: 42, top: 33 },
  { left: 34, top: 38 },
  { left: 42, top: 43 },
  { left: 50, top: 48 },
  { left: 58, top: 53 },
  { left: 50, top: 58 },
  { left: 42, top: 63 },
];

const LABELS = [
  { tileIndex: 0, text: ["BUILD", "STRENGTH"], side: "right" as const, top: 8, left: 70 },
  { tileIndex: 3, text: ["INCREASE", "STAMINA"], side: "left" as const, top: 23, left: 6 },
  { tileIndex: 6, text: ["BUILD", "ENERGY"], side: "right" as const, top: 38, left: 70 },
  { tileIndex: 11, text: ["CONQUER", "WILL POWER"], side: "left" as const, top: 63, left: 6 },
];

const Progress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [showTiles, setShowTiles] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [showTransitionIn, setShowTransitionIn] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

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

  // Load public feed on mount
  useEffect(() => {
    const loadFeed = async () => {
      setFeedLoading(true);
      const feed = await fetchPublicFeed();
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

  const handleStoryStripTap = (index: number, userId?: string) => {
    // Animate out then navigate to reel
    setIsExiting(true);
    setTimeout(() => {
      navigate('/reel', {
        state: {
          userId: userId,
          fromProgress: true,
        }
      });
    }, 200);
  };

  // Animation sequence - smoother and faster
  useEffect(() => {
    // Show transition animation immediately if coming from share
    if (transitionToProgress && transitionImage) {
      setShowTransitionIn(true);
      // Extend transition duration for smoother feel
      setTimeout(() => setShowTransitionIn(false), 600);
      
      // Show make public prompt if coming from share and activity is not public
      const currentActivity = myActivities.find(a => a.dayNumber === transitionDayNumber);
      if (currentActivity && !currentActivity.isPublic) {
        setTimeout(() => {
          setPendingDayNumber(transitionDayNumber);
          setShowMakePublicSheet(true);
        }, 800);
      }
    }
    
    // Stagger content animations
    const contentTimer = setTimeout(() => setShowContent(true), 100);
    const storiesTimer = setTimeout(() => setShowStories(true), 150);
    const tilesTimer = setTimeout(() => setShowTiles(true), 250);
    
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(storiesTimer);
      clearTimeout(tilesTimer);
    };
  }, [transitionToProgress, transitionImage, transitionDayNumber, myActivities]);

  // Handle making activity public
  const handleMakePublic = async () => {
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

  // Tile state - based on user's own activities
  const getDayFromIndex = (index: number) => 12 - index;
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
      initial={transitionToProgress ? { opacity: 0.8, y: 80, scale: 0.95 } : { opacity: 1 }}
      animate={{ 
        opacity: isExiting ? 0 : 1, 
        y: isExiting ? 80 : 0,
        scale: isExiting ? 0.95 : 1,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 32, mass: 0.8 }}
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
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <div className="flex items-end gap-3">
              {feedLoading ? (
                // Loading state - shimmer placeholders
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="relative flex-shrink-0 overflow-hidden"
                      style={{
                        width: "72px",
                        height: "100px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ 
                        delay: i * 0.1, 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut" 
                      }}
                    >
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                          animation: "shimmer 1.5s infinite",
                        }}
                      />
                    </motion.div>
                  ))}
                </>
              ) : publicFeed.length > 0 ? (
                // Show public feed - blur if user has no public activity
                publicFeed.map((photo, index) => {
                  const isOwnStory = user && photo.userId === user.id;
                  const shouldBlur = !hasPublicActivity && !isOwnStory;
                  
                  return (
                    <motion.button
                      key={photo.id}
                      data-shared-element={index === 0 ? "progress-hero-card" : undefined}
                      className="relative flex-shrink-0 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                      style={{
                        width: "72px",
                        height: "100px",
                        borderRadius: "14px",
                        boxShadow: index === 0 ? "0 12px 40px rgba(100, 70, 180, 0.5)" : "0 4px 16px rgba(0,0,0,0.25)",
                        border: index === 0 ? "2px solid rgba(160, 120, 220, 0.35)" : "1px solid rgba(255,255,255,0.1)",
                      }}
                      onClick={() => {
                        if (shouldBlur) {
                          // Prompt to make public
                          const latestActivity = myActivities[myActivities.length - 1];
                          if (latestActivity) {
                            setPendingDayNumber(latestActivity.dayNumber);
                            setShowMakePublicSheet(true);
                          }
                        } else {
                          handleStoryStripTap(index, photo.userId);
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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Lock className="w-5 h-5 text-white/80" />
                        </div>
                      )}
                      
                      {/* User avatar overlay with fallback */}
                      {!shouldBlur && (
                        <div className="absolute bottom-1.5 left-1.5">
                          <ProfileAvatar
                            src={photo.avatarUrl}
                            name={photo.displayName}
                            size={24}
                            style={{ border: '2px solid rgba(255,255,255,0.6)' }}
                          />
                        </div>
                      )}
                      
                      {/* Day badge */}
                      {!shouldBlur && (
                        <div 
                          className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-white font-semibold text-[9px]"
                          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                        >
                          D{photo.dayNumber}
                        </div>
                      )}
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
        {/* Engine Badge */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute"
              style={{ left: "10%", top: "-1%", width: "32%", aspectRatio: "1" }}
              initial={{ opacity: 0, scale: 0.6, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.4 }}
            >
              <img src={engineBadgeImg} alt="Engine Badge" className="w-full h-full object-contain" style={{ opacity: 0.7 }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diagonal Progress Tiles */}
        {TILE_POSITIONS.map((pos, index) => {
          const day = getDayFromIndex(index);
          const isActive = isTileActive(day);

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

        {/* Bottom Base Platform */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute"
              style={{ left: 0, bottom: "2%", width: "40%", aspectRatio: "1.2" }}
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
      />
    </motion.div>
  );
};

export default Progress;
