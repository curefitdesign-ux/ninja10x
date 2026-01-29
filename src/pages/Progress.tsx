import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useJourneyActivities, fetchPublicFeed, LocalActivity } from "@/hooks/use-journey-activities";
import { useAuth } from "@/hooks/use-auth";
import { JourneyActivity, ReactionType, ActivityReaction } from "@/services/journey-service";

// Import tile assets
import tileActiveImg from "@/assets/progress/tile-active-new.png";
import tileInactiveImg from "@/assets/progress/tile-inactive.png";
import basePlatformImg from "@/assets/progress/base-platform.png";
import engineBadgeImg from "@/assets/progress/engine-badge.png";
import SharedImageTransition from "@/components/SharedImageTransition";
import { isVideoUrl } from "@/lib/media";

// Tile positions - REVERSED order (Day 12 at top, Day 1 at bottom)
const TILE_POSITIONS = [
  { left: 32, top: 28 },
  { left: 40, top: 36 },
  { left: 48, top: 44 },
  { left: 56, top: 53 },
  { left: 48, top: 61 },
  { left: 40, top: 69 },
  { left: 32, top: 77 },
  { left: 40, top: 85 },
  { left: 48, top: 93 },
  { left: 56, top: 102 },
  { left: 48, top: 110 },
  { left: 40, top: 118 },
];

const LABELS = [
  { tileIndex: 0, text: ["CONQUER", "WILL POWER"], side: "left" as const, top: 28, left: 4 },
  { tileIndex: 3, text: ["BUILD", "ENERGY"], side: "right" as const, top: 53, left: 68 },
  { tileIndex: 6, text: ["INCREASE", "STAMINA"], side: "left" as const, top: 77, left: 4 },
  { tileIndex: 11, text: ["BUILD", "STRENGTH"], side: "right" as const, top: 110, left: 68 },
];

const Progress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [showTiles, setShowTiles] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [showTransitionIn, setShowTransitionIn] = useState(false);

  // Current user's activities (for tile state)
  const { activities: myActivities, loading } = useJourneyActivities();

  // Public feed for top strip (all users)
  const [publicFeed, setPublicFeed] = useState<LocalActivity[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // Get transition data from navigation state
  const transitionImage = location.state?.transitionImage;
  const transitionDayNumber = location.state?.dayNumber || 1;
  const transitionToProgress = location.state?.transitionToProgress;

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
    created_at: '',
    updated_at: '',
    reaction_count: p.reactionCount || 0,
    user_reacted: false,
    reactions: p.reactions || defaultReactions,
    is_own: user ? p.userId === user.id : false,
  }));

  const handlePhotoCardTap = (index: number) => {
    // Navigate to dedicated reel page
    navigate('/reel', {
      state: {
        activities: feedAsActivities,
        initialIndex: index,
      }
    });
  };

  // Animation sequence
  useEffect(() => {
    if (transitionToProgress && transitionImage) {
      setShowTransitionIn(true);
      setTimeout(() => setShowTransitionIn(false), 800);
    }
    const contentTimer = setTimeout(() => setShowContent(true), 300);
    const storiesTimer = setTimeout(() => setShowStories(true), 400);
    const tilesTimer = setTimeout(() => setShowTiles(true), 600);
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(storiesTimer);
      clearTimeout(tilesTimer);
    };
  }, [transitionToProgress, transitionImage]);

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

  // Tile state - based on user's own activities
  const getDayFromIndex = (index: number) => 12 - index;
  const isTileActive = (dayNumber: number) => myActivities.some(a => a.dayNumber === dayNumber);

  const vw = (val: number) => `${val}vw`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto touch-manipulation overscroll-contain"
      style={{ 
        background: "linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)",
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Background aurora */}
      <div 
        className="absolute pointer-events-none"
        style={{ left: "-53px", top: "-40px", width: "131vw", height: "auto" }}
      >
        <div 
          className="w-full h-[525px] opacity-40 mix-blend-screen"
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

      {/* Close button */}
      <motion.button
        onClick={handleClose}
        className="fixed z-50 flex items-center justify-center text-white/80 active:scale-95 transition-transform"
        style={{ 
          top: 'max(env(safe-area-inset-top, 8px), 8px)', 
          right: '4vw', 
          width: 'clamp(32px, 8vw, 40px)', 
          height: 'clamp(32px, 8vw, 40px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <X className="w-full h-full" strokeWidth={1.5} />
      </motion.button>

      {/* === TOP ACTIVITY STRIP (PUBLIC FEED) === */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="w-full overflow-x-auto scrollbar-hide overscroll-x-contain"
            style={{
              paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
              paddingInline: "4vw",
              marginTop: "2vh",
              height: "24vh",
              minHeight: "140px",
              maxHeight: "180px",
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <div className="flex items-end h-full gap-3">
              {feedLoading ? (
                <div className="flex items-center justify-center w-full">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                </div>
              ) : publicFeed.length > 0 ? (
                publicFeed.map((photo, index) => (
                  <motion.button
                    key={photo.id}
                    data-shared-element={index === 0 ? "progress-hero-card" : undefined}
                    className="relative flex-shrink-0 overflow-hidden cursor-pointer"
                    style={{
                      width: "clamp(80px, 22vw, 100px)",
                      height: "clamp(120px, 33vw, 150px)",
                      borderRadius: "clamp(10px, 2.5vw, 14px)",
                      boxShadow: index === 0 ? "0 12px 40px rgba(100, 70, 180, 0.5)" : "0 4px 16px rgba(0,0,0,0.25)",
                      border: index === 0 ? "2px solid rgba(160, 120, 220, 0.35)" : "none",
                    }}
                    onClick={() => handlePhotoCardTap(index)}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.06 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {photo.isVideo || isVideoUrl(photo.storageUrl) ? (
                      <video
                        src={photo.storageUrl}
                        className="w-full h-full object-cover"
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
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (!img.dataset.retried) {
                            img.dataset.retried = "true";
                            img.src = photo.storageUrl + "?t=" + Date.now();
                          }
                        }}
                      />
                    )}
                    <div 
                      className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-white font-semibold"
                      style={{ fontSize: "clamp(8px, 2vw, 10px)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                    >
                      D{photo.dayNumber}
                    </div>
                  </motion.button>
                ))
              ) : transitionImage ? (
                <motion.div
                  data-shared-element="progress-hero-card"
                  className="relative flex-shrink-0 overflow-hidden"
                  style={{
                    width: "clamp(80px, 22vw, 100px)",
                    height: "clamp(120px, 33vw, 150px)",
                    borderRadius: "clamp(10px, 2.5vw, 14px)",
                    boxShadow: "0 12px 40px rgba(100, 70, 180, 0.5)",
                    border: "2px solid rgba(160, 120, 220, 0.35)",
                    transform: "rotate(-3deg)",
                  }}
                  initial={{ scale: 1.3, x: 80 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                >
                  <img src={transitionImage} alt="Your activity" className="w-full h-full object-cover" />
                </motion.div>
              ) : (
                <motion.div
                  className="relative flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: "clamp(80px, 22vw, 100px)",
                    height: "clamp(120px, 33vw, 150px)",
                    borderRadius: "clamp(10px, 2.5vw, 14px)",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px dashed rgba(255,255,255,0.2)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-white/40 text-xs text-center px-2">
                    Activities will appear here
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MAIN PROGRESS AREA === */}
      <div 
        className="relative w-full"
        style={{ marginTop: "2vh", height: vw(130), maxWidth: "430px", marginInline: "auto" }}
      >
        {/* Engine Badge */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute"
              style={{ left: vw(18), top: 0, width: vw(40), height: vw(40) }}
              initial={{ opacity: 0, scale: 0.6, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.5 }}
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
              style={{ left: vw(pos.left), top: vw(pos.top), width: vw(12), height: vw(12) }}
              initial={{ opacity: 0, y: 40, scale: 0.7 }}
              animate={showTiles ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 200, damping: 22, delay: index * 0.04 }}
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
            style={{ top: vw(label.top), left: vw(label.left), width: label.side === "left" ? vw(28) : vw(24) }}
            initial={{ opacity: 0, x: label.side === "left" ? -20 : 20 }}
            animate={showTiles ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 + idx * 0.1 }}
          >
            {label.text.map((line, i) => (
              <div 
                key={i}
                className="font-bold uppercase"
                style={{ fontSize: "clamp(12px, 3.2vw, 14px)", letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.3 }}
              >
                {line}
              </div>
            ))}
            <div 
              className="absolute h-px"
              style={{
                top: "40px",
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
              style={{ left: 0, top: vw(105), width: vw(50), height: vw(60) }}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <img src={basePlatformImg} alt="Base Platform" className="w-full h-full object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ height: "6vh" }} />
    </div>
  );
};

export default Progress;
