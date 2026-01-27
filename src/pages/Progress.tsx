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

// Milestone markers for the journey - positioned at specific days
const milestones: Array<{ day: number; label: string; position: 'left' | 'right' }> = [
  { day: 3, label: 'CONQUER\nWILL POWER', position: 'left' },
  { day: 6, label: 'BUILD\nENERGY', position: 'right' },
  { day: 9, label: 'INCREASE\nSTAMINA', position: 'left' },
];

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

// Exact tile positions matching the reference screenshot (zigzag pattern)
// Measured from bottom-left, Y increases upward in the layout
const TILE_POSITIONS: Array<{ x: number; y: number }> = [
  // Day 1 - bottom center (active/start)
  { x: 172, y: 0 },
  // Day 2 - up-left
  { x: 130, y: 58 },
  // Day 3 - up-right (with user avatar, CONQUER WILL POWER milestone)
  { x: 210, y: 116 },
  // Day 4 - up-left
  { x: 155, y: 174 },
  // Day 5 - up-left more
  { x: 105, y: 232 },
  // Day 6 - up-right (BUILD ENERGY milestone)
  { x: 175, y: 290 },
  // Day 7 - up-right more
  { x: 225, y: 348 },
  // Day 8 - up-left
  { x: 165, y: 406 },
  // Day 9 - up-left more (INCREASE STAMINA milestone)
  { x: 115, y: 464 },
  // Day 10 - up-right
  { x: 175, y: 522 },
  // Day 11 - up-right more
  { x: 230, y: 580 },
  // Day 12 - top center (level complete ornament area)
  { x: 172, y: 638 },
];

const TILE_SIZE = 56; // Tile width/height in pixels

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

  const totalDays = 12;
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
    navigate('/', { 
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
  const getTileState = (day: number): 'logged' | 'active' | 'locked' => {
    if (getPhotoForDay(day)) return 'logged';
    if (day === currentDay) return 'active';
    if (day < currentDay) return 'logged';
    return 'locked';
  };

  // Story cards for the top carousel
  const storyCards = [
    { id: 'vogue', label: 'the Player', sublabel: '2hrs • 10', bg: '#8B6914' },
    { id: 'journal', label: 'Lawn Tennis', sublabel: '02hrs • 10 • 400', bg: '#E8E4DC' },
    { id: 'fitness', label: 'CULT NINJA', sublabel: '1/3 Activity', bg: '#9CB526' },
    { id: 'instagram', label: 'NINJA JOURNEY', sublabel: 'WEEK 1 / DAY 4', bg: '#1B5E3D' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #2D2259 0%, #1A1538 25%, #111118 50%, #0A0A0F 100%)',
      }}
    >
      {/* Close button */}
      <motion.button
        onClick={handleClose}
        className="absolute top-5 right-5 z-50 w-9 h-9 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <X className="w-6 h-6 text-white/80" strokeWidth={1.5} />
      </motion.button>

      {/* Stories Row at Top */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="absolute top-8 left-0 right-0 z-40"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="flex gap-2.5 px-3 overflow-x-auto scrollbar-hide pb-3">
              {/* User's hero card - larger with tilt */}
              <motion.div
                className="relative flex-shrink-0"
                initial={{ scale: 1.3, x: 80 }}
                animate={{ scale: 1, x: 0, rotate: -6 }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              >
                <div 
                  className="relative w-36 h-48 rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: '0 12px 40px rgba(100, 70, 180, 0.5)',
                    background: 'linear-gradient(145deg, rgba(100,80,150,0.4), rgba(60,40,100,0.6))',
                    border: '2px solid rgba(160, 120, 220, 0.35)',
                  }}
                >
                  {transitionImage ? (
                    <img 
                      src={transitionImage} 
                      alt="Your activity" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/40 to-blue-600/40 flex items-center justify-center">
                      <span className="text-white/40 text-xs">Your Photo</span>
                    </div>
                  )}
                  {/* Decorative sticker */}
                  <div className="absolute top-3 right-3 text-2xl drop-shadow-lg">🏸</div>
                </div>
              </motion.div>

              {/* Template story cards */}
              {storyCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  className="relative w-[88px] h-[140px] rounded-xl overflow-hidden flex-shrink-0"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.06 }}
                  style={{
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    background: card.bg,
                  }}
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-2">
                    <span 
                      className="text-[9px] font-semibold leading-tight"
                      style={{ color: card.id === 'journal' ? '#333' : '#fff' }}
                    >
                      {card.label}
                    </span>
                    <span 
                      className="text-[7px] opacity-70"
                      style={{ color: card.id === 'journal' ? '#333' : '#fff' }}
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

      {/* Main Journey Area */}
      <div className="absolute inset-0 overflow-y-auto pt-[220px]">
        <div className="relative w-full" style={{ height: '920px' }}>
          
          {/* Level Complete Ornament at Top */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                className="absolute z-30"
                style={{ 
                  top: 20,
                  left: '50%', 
                  transform: 'translateX(-60%)',
                }}
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.5 }}
              >
                <img 
                  src={levelCompleteImg} 
                  alt="Level complete" 
                  className="w-40 h-auto object-contain"
                />
                {/* BUILD STRENGTH label */}
                <div 
                  className="absolute top-10 -right-16 text-right whitespace-pre-line"
                >
                  <span 
                    className="text-[11px] font-bold tracking-wider leading-tight"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    BUILD{'\n'}STRENGTH
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Horizontal divider lines */}
          {[260, 410, 560].map((top, i) => (
            <div 
              key={i}
              className="absolute left-0 right-0 h-px pointer-events-none"
              style={{ 
                top: `${top}px`,
                background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.05) 50%, transparent 95%)',
              }}
            />
          ))}

          {/* Tiles Container - positioned from bottom */}
          <div 
            className="absolute w-full"
            style={{ bottom: 100, height: '700px' }}
          >
            {TILE_POSITIONS.map((pos, index) => {
              const day = index + 1;
              const state = getTileState(day);
              const milestone = milestones.find(m => m.day === day);
              const isUserPosition = day === currentDay;
              const isDay12 = day === 12;

              // Skip Day 12 tile since it's covered by the ornament
              if (isDay12) return null;

              return (
                <motion.div
                  key={day}
                  className="absolute"
                  style={{ 
                    left: pos.x - TILE_SIZE / 2,
                    bottom: pos.y,
                  }}
                  initial={{ opacity: 0, y: 40, scale: 0.7 }}
                  animate={showTiles ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ 
                    type: 'spring',
                    stiffness: 200,
                    damping: 22,
                    delay: day * 0.04
                  }}
                >
                  {/* Milestone label */}
                  {milestone && (
                    <motion.div
                      className={`absolute top-1/2 -translate-y-1/2 whitespace-pre-line ${
                        milestone.position === 'left' 
                          ? 'right-full mr-5 text-right' 
                          : 'left-full ml-5 text-left'
                      }`}
                      initial={{ opacity: 0, x: milestone.position === 'left' ? 12 : -12 }}
                      animate={showTiles ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: day * 0.04 + 0.15 }}
                    >
                      <span 
                        className="text-[11px] font-bold tracking-wider leading-tight block"
                        style={{ color: 'rgba(255,255,255,0.8)' }}
                      >
                        {milestone.label}
                      </span>
                    </motion.div>
                  )}

                  {/* User avatar at current position (Day 3 in reference) */}
                  {isUserPosition && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 flex items-center"
                      style={{ right: 'calc(100% + 8px)' }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={showTiles ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: day * 0.04 + 0.2 }}
                    >
                      {/* Main avatar */}
                      <div 
                        className="relative w-11 h-11 rounded-full overflow-hidden"
                        style={{
                          boxShadow: '0 0 0 2px rgba(180, 130, 255, 0.7), 0 0 20px rgba(180, 130, 255, 0.4)',
                        }}
                      >
                        <img 
                          src="https://i.pravatar.cc/80?img=32" 
                          alt="You" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Secondary avatar + count */}
                      <div className="flex items-center -ml-2">
                        <div 
                          className="w-6 h-6 rounded-full overflow-hidden"
                          style={{ border: '2px solid #1a1538' }}
                        >
                          <img 
                            src="https://i.pravatar.cc/80?img=15" 
                            alt="Friend" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="ml-1 text-white/70 text-sm font-medium">+2</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Tile image */}
                  <img 
                    src={state === 'active' ? tileActiveImg : tileLockedImg}
                    alt={`Day ${day}`}
                    className="object-contain"
                    style={{
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      filter: state === 'active' 
                        ? 'drop-shadow(0 0 14px rgba(0,220,220,0.55))' 
                        : 'none',
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Base platform at bottom */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: 0 }}
            initial={{ opacity: 0, y: 30 }}
            animate={showTiles ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
          >
            <img 
              src={basePlatformImg} 
              alt="Start platform" 
              className="w-72 h-auto object-contain"
              style={{
                filter: 'drop-shadow(0 10px 30px rgba(100,80,160,0.25))',
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
