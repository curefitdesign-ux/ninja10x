import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getPhotosStorageKey } from "@/hooks/use-device-id";

// Import tile assets
import tileLockedImg from "@/assets/progress/tile-locked.png";
import tileActiveImg from "@/assets/progress/tile-active.png";
import basePlatformImg from "@/assets/progress/base.png";
import levelCompleteImg from "@/assets/progress/level-complete.png";

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

// Diagonal progress path - tiles flow top-left to bottom-right
// Using percentage positions that match reference exactly
// Engine at top → tiles flow diagonally down → final tile at bottom
const TILE_POSITIONS = [
  // Start directly below engine, then zigzag down-right
  { xPercent: 42, yPercent: 0 },     // Tile 1 - near engine
  { xPercent: 48, yPercent: 6 },     // Tile 2
  { xPercent: 54, yPercent: 12 },    // Tile 3 - milestone ring
  { xPercent: 38, yPercent: 18 },    // Tile 4 - step left
  { xPercent: 44, yPercent: 24 },    // Tile 5
  { xPercent: 56, yPercent: 30 },    // Tile 6 - milestone ring
  { xPercent: 36, yPercent: 36 },    // Tile 7 - step left
  { xPercent: 42, yPercent: 42 },    // Tile 8
  { xPercent: 50, yPercent: 48 },    // Tile 9 - milestone ring
  { xPercent: 34, yPercent: 54 },    // Tile 10 - step left
  { xPercent: 40, yPercent: 60 },    // Tile 11
  { xPercent: 46, yPercent: 66 },    // Tile 12 - final active glow
];

// Labels anchored to specific tiles (not viewport edges)
const LABELS = [
  { tileIndex: 2, text: ["BUILD", "STRENGTH"], side: "right" as const },
  { tileIndex: 4, text: ["INCREASE", "STAMINA"], side: "left" as const },
  { tileIndex: 6, text: ["BUILD", "ENERGY"], side: "right" as const },
  { tileIndex: 10, text: ["CONQUER", "WILL POWER"], side: "left" as const },
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

  // Get transition data from navigation state
  const transitionImage = location.state?.transitionImage;
  const transitionDayNumber = location.state?.dayNumber || 1;

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
    const contentTimer = setTimeout(() => setShowContent(true), 300);
    const storiesTimer = setTimeout(() => setShowStories(true), 400);
    const tilesTimer = setTimeout(() => setShowTiles(true), 600);
    
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(storiesTimer);
      clearTimeout(tilesTimer);
    };
  }, []);

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

  // Get photo for a specific day
  const getPhotoForDay = (day: number) => {
    return photos.find(p => p.dayNumber === day);
  };

  // Determine tile state
  const getTileState = (day: number): "logged" | "active" | "locked" => {
    if (getPhotoForDay(day)) return "logged";
    if (day === currentDay) return "active";
    if (day < currentDay) return "logged";
    return "locked";
  };

  // Check if tile is a milestone (with ring)
  const isMilestone = (index: number) => [2, 5, 8, 11].includes(index);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto"
      style={{
        paddingTop: "env(safe-area-inset-top, 2vh)",
        paddingBottom: "env(safe-area-inset-bottom, 4vh)",
        paddingInline: "4vw",
        background: "linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)",
      }}
    >
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
      {/* Height = 16% viewport, tight to top, horizontal scroll with overlap */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="w-full overflow-x-auto scrollbar-hide"
            style={{
              marginTop: "2vh",
              height: "16vh",
              minHeight: "110px",
              maxHeight: "140px",
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <div className="flex items-end h-full" style={{ gap: 0 }}>
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

      {/* === CORE ENGINE NODE === */}
      {/* Directly below activity strip, stays in top third */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="relative mx-auto"
            style={{ 
              marginTop: "4vh",
              width: "clamp(80px, 22vw, 104px)",
              aspectRatio: "1/1",
            }}
            initial={{ opacity: 0, scale: 0.6, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.5 }}
          >
            {/* Base platform with glow lines */}
            <img 
              src={basePlatformImg} 
              alt="Base" 
              className="absolute w-[130%] left-1/2 -translate-x-1/2"
              style={{ bottom: "-20%", opacity: 0.8 }}
            />
            
            {/* Engine icon */}
            <img 
              src={levelCompleteImg} 
              alt="Engine" 
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: "clamp(60px, 16vw, 76px)",
                top: "-4vw",
                opacity: 0.6,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* === DIAGONAL PROGRESS PATH === */}
      {/* Fixed diagonal slope: flows from engine down-right */}
      <div 
        className="relative w-full"
        style={{ 
          marginTop: "6vh",
          height: "80vh",
          minHeight: "500px",
        }}
      >
        {/* Horizontal divider lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <div 
            key={i}
            className="absolute left-0 right-0 h-px pointer-events-none"
            style={{ 
              top: `${ratio * 100}%`,
              background: "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.05) 50%, transparent 95%)",
            }}
          />
        ))}

        {/* Tiles positioned along diagonal path */}
        {TILE_POSITIONS.map((pos, index) => {
          const day = index + 1;
          const state = getTileState(day);
          const isActive = day === currentDay || day === 12;
          const hasMilestone = isMilestone(index);
          const label = LABELS.find(l => l.tileIndex === index);

          return (
            <motion.div
              key={day}
              className="absolute"
              style={{ 
                left: `${pos.xPercent}%`,
                top: `${pos.yPercent}%`,
                transform: "translateX(-50%)",
                width: "clamp(36px, 9vw, 46px)",
                aspectRatio: "1/1",
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
                    background: "radial-gradient(circle, rgba(0, 229, 255, 0.4) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }}
                />
              )}
              
              {/* Milestone ring indicator */}
              {hasMilestone && !isActive && (
                <div 
                  className="absolute inset-[-15%] rounded-xl"
                  style={{
                    border: "2px solid rgba(123, 92, 255, 0.3)",
                    boxShadow: "0 0 12px rgba(123, 92, 255, 0.3)",
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
                    ? "drop-shadow(0 0 12px rgba(0, 229, 255, 0.6))" 
                    : hasMilestone 
                      ? "drop-shadow(0 0 8px rgba(123, 92, 255, 0.4))"
                      : "none",
                }}
              />

              {/* Social indicator on current day */}
              {day === currentDay && (
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

              {/* Milestone label anchored to tile */}
              {label && (
                <motion.div
                  className={`absolute whitespace-nowrap ${label.side === "left" ? "text-right" : "text-left"}`}
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    ...(label.side === "left" 
                      ? { right: "calc(100% + 4vw)" }
                      : { left: "calc(100% + 4vw)" }
                    ),
                  }}
                  initial={{ opacity: 0, x: label.side === "left" ? 12 : -12 }}
                  animate={showTiles ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: index * 0.04 + 0.15 }}
                >
                  {label.text.map((line, i) => (
                    <div 
                      key={i}
                      className="font-bold uppercase"
                      style={{ 
                        fontSize: "clamp(12px, 3.2vw, 14px)",
                        letterSpacing: "0.18em",
                        color: "#B8B8C5",
                        lineHeight: 1.3,
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom margin for scroll */}
      <div style={{ marginBottom: "6vh" }} />
    </div>
  );
};

export default Progress;
