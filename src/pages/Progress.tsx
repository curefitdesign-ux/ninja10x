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

// Tile positions - exact pixel positions from reference image
// Reference is 375px wide - perfect zigzag pattern going down-right then down-left
// Pattern: right-diagonal for 3 tiles, then left-diagonal for 3 tiles, repeat
const TILE_POSITIONS = [
  // Group 1: Engine → diagonal right-down (BUILD STRENGTH area)
  { left: 182, top: 200 },   // Tile 1 - first after engine
  { left: 230, top: 250 },   // Tile 2 - down-right
  { left: 278, top: 300 },   // Tile 3 - milestone, furthest right
  // Group 2: Zigzag back left-down (INCREASE STAMINA area)
  { left: 230, top: 360 },   // Tile 4 - step back left
  { left: 182, top: 420 },   // Tile 5 - continue left
  { left: 134, top: 480 },   // Tile 6 - milestone, furthest left
  // Group 3: Zigzag right-down again (BUILD ENERGY area)
  { left: 182, top: 540 },   // Tile 7 - step right
  { left: 230, top: 600 },   // Tile 8 - continue right
  { left: 278, top: 660 },   // Tile 9 - milestone, furthest right
  // Group 4: Final stretch left-down (CONQUER WILL POWER area)
  { left: 230, top: 720 },   // Tile 10 - step back left
  { left: 182, top: 780 },   // Tile 11 - continue left
  { left: 134, top: 840 },   // Tile 12 - active final milestone
];

// Labels anchored to specific tile groups - matching reference image
const LABELS = [
  { 
    tileIndex: 2, 
    text: ["BUILD", "STRENGTH"], 
    side: "right" as const,
    top: 280, // Near tile 3
    left: 290,
  },
  { 
    tileIndex: 5, 
    text: ["INCREASE", "STAMINA"], 
    side: "left" as const,
    top: 440, // Near tile 6
    left: 16,
  },
  { 
    tileIndex: 8, 
    text: ["BUILD", "ENERGY"], 
    side: "right" as const,
    top: 620, // Near tile 9
    left: 290,
  },
  { 
    tileIndex: 11, 
    text: ["CONQUER", "WILL POWER"], 
    side: "left" as const,
    top: 800, // Near tile 12
    left: 16,
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

  // Scale factor for responsive sizing (375px reference)
  const scale = (px: number) => `calc(${px} / 375 * 100vw)`;

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
          <motion.div
            className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <motion.div
              className="relative aspect-[9/16] rounded-2xl overflow-hidden"
              initial={{ 
                width: '70vw',
                scale: 1, 
                y: 0,
                x: 0,
              }}
              animate={{ 
                width: '11vw',
                scale: 0.5, 
                y: -280,
                x: -120,
                rotate: -6,
              }}
              transition={{ 
                type: 'spring',
                stiffness: 130,
                damping: 18,
              }}
              style={{
                boxShadow: '0 12px 40px rgba(100, 70, 180, 0.5)',
                border: '2px solid rgba(160, 120, 220, 0.35)',
              }}
            >
              <img 
                src={transitionImage} 
                alt="Transitioning to strip" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
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
      {/* Height = 16vh, tight to top, horizontal scroll with overlap */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="w-full overflow-x-auto scrollbar-hide"
            style={{
              paddingTop: "env(safe-area-inset-top, 2vh)",
              paddingInline: "4vw",
              marginTop: "2vh",
              height: "18vw",
              minHeight: "110px",
              maxHeight: "140px",
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <div className="flex items-end h-full" style={{ gap: "-2.5vw" }}>
              {/* User's hero card - first, slightly tilted */}
              <motion.div
                className="relative flex-shrink-0 overflow-hidden"
                style={{
                  width: "clamp(72px, 11vw, 92px)",
                  height: "clamp(108px, 16vw, 128px)",
                  borderRadius: "clamp(8px, 1.8vw, 12px)",
                  marginRight: "-2.5vw",
                  boxShadow: "0 12px 40px rgba(100, 70, 180, 0.5)",
                  background: "linear-gradient(145deg, rgba(100,80,150,0.4), rgba(60,40,100,0.6))",
                  border: "2px solid rgba(160, 120, 220, 0.35)",
                  transform: "rotate(-6deg)",
                }}
                initial={{ scale: 1.3, x: 80 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
              >
                {transitionImage ? (
                  <img 
                    src={transitionImage} 
                    alt="Your activity" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600/40 to-blue-600/40 flex items-center justify-center">
                    <span className="text-white/40 text-[8px]">Your Photo</span>
                  </div>
                )}
                {/* Interaction sticker */}
                <div 
                  className="absolute text-lg drop-shadow-lg"
                  style={{
                    width: "clamp(18px, 2.8vw, 24px)",
                    top: "-0.8vw",
                    left: "-0.8vw",
                  }}
                >
                  🏸
                </div>
              </motion.div>

              {/* Other story cards - overlapping */}
              {STORY_CARDS.map((card, index) => (
                <motion.div
                  key={card.id}
                  className="relative overflow-hidden flex-shrink-0"
                  style={{
                    width: "clamp(72px, 11vw, 92px)",
                    height: "clamp(108px, 16vw, 128px)",
                    borderRadius: "clamp(8px, 1.8vw, 12px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                    background: card.bg,
                    marginLeft: "-2.5vw",
                  }}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.06 }}
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-2">
                    <span 
                      className="font-semibold leading-tight"
                      style={{ 
                        fontSize: "clamp(8px, 2vw, 10px)",
                        color: card.id === "journal" || card.id === "cult" ? "#333" : "#fff" 
                      }}
                    >
                      {card.label}
                    </span>
                    <span 
                      className="opacity-70"
                      style={{ 
                        fontSize: "clamp(6px, 1.5vw, 8px)",
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
          marginTop: "4vh",
          height: scale(800),
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
                left: scale(68),
                top: 0,
                width: scale(153),
                height: scale(156),
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
                left: scale(93),
                top: scale(102),
                width: scale(104),
                height: scale(88),
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
                left: scale(pos.left),
                top: scale(pos.top),
                width: scale(60),
                height: scale(60),
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
              top: scale(label.top),
              left: scale(label.left),
              width: label.side === "left" ? scale(120) : scale(90),
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
                top: scale(36),
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
                top: scale(556),
                width: scale(192),
                height: scale(244),
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
