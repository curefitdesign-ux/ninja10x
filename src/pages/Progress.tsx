import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getPhotosStorageKey } from "@/hooks/use-device-id";

// Import tile assets
import tileLockedImg from "@/assets/progress/tile-locked.png";
import tileActiveImg from "@/assets/progress/tile-active.png";
import basePlatformImg from "@/assets/progress/base-platform.png";
import engineBadgeImg from "@/assets/progress/engine-badge.png";
import SharedImageTransition from "@/components/SharedImageTransition";

const STORAGE_KEY = getPhotosStorageKey();

interface LoggedPhoto {
  id: string;
  storageUrl: string;
  isVideo?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  dayNumber: number;
}

// Tile positions - stair-step diagonal pattern matching reference
// Pattern: 2 tiles per "step" going down-right, then down-left
// Using vw-based values for proper scaling
const TILE_POSITIONS = [
  // Group 1: Start center → diagonal right-down (BUILD STRENGTH)
  { left: 40, top: 15 },    // Tile 1 - first, center-left
  { left: 48, top: 23 },    // Tile 2 - step down-right
  { left: 56, top: 31 },    // Tile 3 - milestone, furthest right
  // Group 2: Zigzag left-down (INCREASE STAMINA)
  { left: 48, top: 40 },    // Tile 4 - step back left
  { left: 40, top: 48 },    // Tile 5 - continue left
  { left: 32, top: 56 },    // Tile 6 - milestone, furthest left
  // Group 3: Zigzag right-down (BUILD ENERGY)
  { left: 40, top: 64 },    // Tile 7 - step right
  { left: 48, top: 72 },    // Tile 8 - continue right
  { left: 56, top: 80 },    // Tile 9 - milestone, furthest right
  // Group 4: Final stretch left-down (CONQUER WILL POWER)
  { left: 48, top: 89 },    // Tile 10 - step back left
  { left: 40, top: 97 },    // Tile 11 - continue left
  { left: 32, top: 105 },   // Tile 12 - active final milestone
];

// Labels anchored to specific tile groups - matching reference image
const LABELS = [
  { 
    tileIndex: 2, 
    text: ["BUILD", "STRENGTH"], 
    side: "right" as const,
    top: 25, // Near tile 3
    left: 72,
  },
  { 
    tileIndex: 5, 
    text: ["INCREASE", "STAMINA"], 
    side: "left" as const,
    top: 50, // Near tile 6
    left: 4,
  },
  { 
    tileIndex: 8, 
    text: ["BUILD", "ENERGY"], 
    side: "right" as const,
    top: 75, // Near tile 9
    left: 72,
  },
  { 
    tileIndex: 11, 
    text: ["CONQUER", "WILL POWER"], 
    side: "left" as const,
    top: 100, // Near tile 12
    left: 4,
  },
];

// Story cards for top activity strip
const STORY_CARDS = [
  { id: "vogue", label: "the Player", sublabel: "2hrs • 10", bg: "#8B6914" },
  { id: "journal", label: "Lawn Tennis", sublabel: "02hrs • 10 • 400", bg: "#E8E4DC" },
  { id: "fitness", label: "CULT NINJA", sublabel: "1/3 Activity", bg: "#9CB526" },
  { id: "instagram", label: "NINJA JOURNEY", sublabel: "WEEK 1 / DAY 4", bg: "#1B5E3D" },
  { id: "tennis", label: "TENNIS", sublabel: "20 • 2HRS", bg: "#2D4A3E" },
  { id: "cult", label: "CULT NINJA", sublabel: "Duration 2HRS", bg: "#F5F5F5" },
];

const Progress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [showTiles, setShowTiles] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [showTransitionIn, setShowTransitionIn] = useState(false);

  // Get transition data from navigation state
  const transitionImage = location.state?.transitionImage;
  const transitionDayNumber = location.state?.dayNumber || 1;
  const transitionToProgress = location.state?.transitionToProgress;

  // Load photos from localStorage
  const [photos] = useState<LoggedPhoto[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((p: LoggedPhoto) => p.storageUrl) : [];
    } catch {
      return [];
    }
  });

  const currentDay = Math.max(photos.length, transitionDayNumber);

  // Animation sequence
  useEffect(() => {
    // Show transition-in animation if coming from share with transitionToProgress
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

  // Determine tile state
  const getTileState = (day: number): "logged" | "active" | "locked" => {
    if (day < currentDay) return "logged";
    if (day === currentDay || day === 12) return "active";
    return "locked";
  };

  // Check if tile is a milestone (with ring)
  const isMilestone = (index: number) => [2, 5, 8, 11].includes(index);

  // Convert vw values to CSS
  const vw = (val: number) => `${val}vw`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)",
      }}
    >
      {/* Background aurora effects */}
      <div 
        className="absolute pointer-events-none"
        style={{
          left: "-53px",
          top: "-40px",
          width: "131vw",
          height: "auto",
        }}
      >
        <div 
          className="w-full h-[525px] opacity-40 mix-blend-screen"
          style={{
            background: "radial-gradient(ellipse at center, rgba(138, 100, 200, 0.4) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Transition-in animation - Image from Share screen animating to top strip */}
      <AnimatePresence>
        {showTransitionIn && transitionImage && (
          <SharedImageTransition
            imageUrl={transitionImage}
            targetSelector='[data-shared-element="progress-hero-card"]'
          />
        )}
      </AnimatePresence>

      {/* Close button - fixed top right */}
      <motion.button
        onClick={handleClose}
        className="fixed z-50 flex items-center justify-center text-white/80"
        style={{
          top: "2vh",
          right: "4vw",
          width: "clamp(24px, 6vw, 28px)",
          height: "clamp(24px, 6vw, 28px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <X className="w-full h-full" strokeWidth={1.5} />
      </motion.button>

      {/* === TOP ACTIVITY STRIP === */}
      {/* Horizontal scroll with user's logged photos + placeholder cards */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="w-full overflow-x-auto scrollbar-hide"
            style={{
              paddingTop: "env(safe-area-inset-top, 2vh)",
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
              {/* User's logged photos - render actual photos from localStorage */}
              {photos.length > 0 ? (
                photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    data-shared-element={index === photos.length - 1 ? "progress-hero-card" : undefined}
                    className="relative flex-shrink-0 overflow-hidden"
                    style={{
                      width: "clamp(80px, 22vw, 100px)",
                      height: "clamp(120px, 33vw, 150px)",
                      borderRadius: "clamp(10px, 2.5vw, 14px)",
                      boxShadow: index === 0 
                        ? "0 12px 40px rgba(100, 70, 180, 0.5)" 
                        : "0 4px 16px rgba(0,0,0,0.25)",
                      border: index === 0 ? "2px solid rgba(160, 120, 220, 0.35)" : "none",
                      transform: index === 0 ? "rotate(-3deg)" : "none",
                    }}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.06 }}
                  >
                    <img 
                      src={photo.storageUrl} 
                      alt={`Day ${photo.dayNumber}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.retried) {
                          img.dataset.retried = 'true';
                          img.src = photo.storageUrl + '?t=' + Date.now();
                        }
                      }}
                    />
                    {/* Day indicator */}
                    <div 
                      className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-white font-semibold"
                      style={{
                        fontSize: "clamp(8px, 2vw, 10px)",
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      D{photo.dayNumber}
                    </div>
                  </motion.div>
                ))
              ) : transitionImage ? (
                // Fallback to transition image if no photos yet
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
                  <img 
                    src={transitionImage} 
                    alt="Your activity" 
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : null}

              {/* Placeholder story cards for visual balance */}
              {STORY_CARDS.slice(0, Math.max(0, 6 - photos.length)).map((card, index) => (
                <motion.div
                  key={card.id}
                  className="relative overflow-hidden flex-shrink-0"
                  style={{
                    width: "clamp(80px, 22vw, 100px)",
                    height: "clamp(120px, 33vw, 150px)",
                    borderRadius: "clamp(10px, 2.5vw, 14px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                    background: card.bg,
                  }}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + (photos.length + index) * 0.06 }}
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-2">
                    <span 
                      className="font-semibold leading-tight"
                      style={{ 
                        fontSize: "clamp(9px, 2.2vw, 11px)",
                        color: card.id === "journal" || card.id === "cult" ? "#333" : "#fff" 
                      }}
                    >
                      {card.label}
                    </span>
                    <span 
                      className="opacity-70"
                      style={{ 
                        fontSize: "clamp(7px, 1.7vw, 9px)",
                        color: card.id === "journal" || card.id === "cult" ? "#333" : "#fff" 
                      }}
                    >
                      {card.sublabel}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MAIN PROGRESS AREA === */}
      {/* This is the canvas for tiles, engine, labels - all positioned absolutely */}
      <div 
        className="relative w-full"
        style={{
          marginTop: "2vh",
          height: vw(130),
          maxWidth: "430px",
          marginInline: "auto",
        }}
      >
        {/* === ENGINE BADGE === */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute"
              style={{ 
                left: vw(18),
                top: 0,
                width: vw(40),
                height: vw(40),
              }}
              initial={{ opacity: 0, scale: 0.6, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.5 }}
            >
              <img 
                src={engineBadgeImg} 
                alt="Engine Badge" 
                className="w-full h-full object-contain"
                style={{ opacity: 0.7 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* === BADGE PLATFORM === */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute"
              style={{
                left: vw(24),
                top: vw(28),
                width: vw(28),
                height: vw(24),
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {/* Platform lines SVG would go here - using CSS approximation */}
              <div 
                className="w-full h-full"
                style={{
                  background: "linear-gradient(180deg, rgba(100,100,100,0.3) 0%, rgba(20,20,20,0.5) 100%)",
                  borderRadius: "8px",
                  transform: "perspective(100px) rotateX(20deg)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* === DIAGONAL PROGRESS TILES === */}
        {TILE_POSITIONS.map((pos, index) => {
          const day = index + 1;
          const state = getTileState(day);
          const isActive = state === "active";
          const hasMilestone = isMilestone(index);

          return (
            <motion.div
              key={day}
              className="absolute"
              style={{ 
                left: vw(pos.left),
                top: vw(pos.top),
                width: vw(12),
                height: vw(12),
              }}
              initial={{ opacity: 0, y: 40, scale: 0.7 }}
              animate={showTiles ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 22,
                delay: index * 0.04
              }}
            >
              {/* Active tile glow */}
              {isActive && (
                <div 
                  className="absolute inset-[-50%] rounded-2xl animate-pulse"
                  style={{
                    background: "radial-gradient(circle, rgba(0, 229, 255, 0.5) 0%, transparent 70%)",
                    filter: "blur(12px)",
                  }}
                />
              )}
              
              {/* Milestone ring indicator */}
              {hasMilestone && !isActive && (
                <div 
                  className="absolute inset-[-10%] rounded-xl"
                  style={{
                    border: "2px solid rgba(123, 92, 255, 0.3)",
                    boxShadow: "0 0 16px rgba(123, 92, 255, 0.4)",
                  }}
                />
              )}
              
              {/* Tile image */}
              <img
                src={isActive ? tileActiveImg : tileLockedImg}
                alt={`Day ${day}`}
                className="w-full h-full object-contain relative z-10"
                style={{
                  filter: isActive 
                    ? "drop-shadow(0 0 16px rgba(0, 229, 255, 0.7))" 
                    : hasMilestone 
                      ? "drop-shadow(0 0 10px rgba(123, 92, 255, 0.5))"
                      : "none",
                }}
              />

              {/* Social indicator on current active day */}
              {isActive && day === currentDay && (
                <motion.div
                  className="absolute flex items-center z-20"
                  style={{ 
                    top: "-3vw",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={showTiles ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.04 + 0.2 }}
                >
                  <div 
                    className="rounded-full overflow-hidden"
                    style={{
                      width: "clamp(24px, 7vw, 30px)",
                      height: "clamp(24px, 7vw, 30px)",
                      border: "2px solid #7B5CFF",
                    }}
                  >
                    <img 
                      src="https://i.pravatar.cc/80?img=32" 
                      alt="You" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div 
                    className="rounded-full overflow-hidden"
                    style={{
                      width: "clamp(20px, 5vw, 24px)",
                      height: "clamp(20px, 5vw, 24px)",
                      marginLeft: "-2vw",
                      border: "2px solid #7B5CFF",
                    }}
                  >
                    <img 
                      src="https://i.pravatar.cc/80?img=15" 
                      alt="Friend" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span 
                    className="text-white font-medium"
                    style={{
                      fontSize: "clamp(10px, 2.8vw, 12px)",
                      marginLeft: "1.2vw",
                    }}
                  >
                    +2
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* === MILESTONE LABELS === */}
        {LABELS.map((label, idx) => (
          <motion.div
            key={idx}
            className={`absolute ${label.side === "left" ? "text-left" : "text-right"}`}
            style={{
              top: vw(label.top),
              left: vw(label.left),
              width: label.side === "left" ? vw(28) : vw(24),
            }}
            initial={{ opacity: 0, x: label.side === "left" ? -20 : 20 }}
            animate={showTiles ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 + idx * 0.1 }}
          >
            {label.text.map((line, i) => (
              <div 
                key={i}
                className="font-bold uppercase"
                style={{ 
                  fontSize: "clamp(12px, 3.2vw, 14px)",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.6)",
                  lineHeight: 1.3,
                }}
              >
                {line}
              </div>
            ))}
            
            {/* Horizontal divider line */}
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

        {/* === BOTTOM BASE PLATFORM === */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute"
              style={{
                left: 0,
                top: vw(105),
                width: vw(50),
                height: vw(60),
              }}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <img 
                src={basePlatformImg} 
                alt="Base Platform" 
                className="w-full h-full object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom margin for scroll */}
      <div style={{ height: "6vh" }} />
    </div>
  );
};

export default Progress;
