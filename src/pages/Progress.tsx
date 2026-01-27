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

// Milestone markers for the journey
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

// Responsive tile positions using percentage of container width
// These create the zigzag pattern from bottom to top
const getTilePositions = (): Array<{ xPercent: number; yVw: number }> => [
  // Day 1 - bottom center (active/start)
  { xPercent: 50, yVw: 0 },
  // Day 2 - up-left
  { xPercent: 38, yVw: 14 },
  // Day 3 - up-right (milestone)
  { xPercent: 58, yVw: 28 },
  // Day 4 - up-left
  { xPercent: 43, yVw: 42 },
  // Day 5 - up-left more
  { xPercent: 30, yVw: 56 },
  // Day 6 - up-right (milestone)
  { xPercent: 48, yVw: 70 },
  // Day 7 - up-right more
  { xPercent: 62, yVw: 84 },
  // Day 8 - up-left
  { xPercent: 46, yVw: 98 },
  // Day 9 - up-left more (milestone)
  { xPercent: 32, yVw: 112 },
  // Day 10 - up-right
  { xPercent: 48, yVw: 126 },
  // Day 11 - up-right more
  { xPercent: 62, yVw: 140 },
  // Day 12 - top center (under engine)
  { xPercent: 50, yVw: 154 },
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
  const tilePositions = getTilePositions();

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
    { id: 'tennis', label: 'TENNIS', sublabel: '20 • 2HRS', bg: '#2D4A3E' },
    { id: 'cult', label: 'CULT NINJA', sublabel: 'Duration 2HRS', bg: '#F5F5F5' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top, 2vh)',
        paddingBottom: 'env(safe-area-inset-bottom, 4vh)',
        background: 'linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)',
      }}
    >
      {/* Close button - responsive */}
      <motion.button
        onClick={handleClose}
        className="fixed z-50 flex items-center justify-center"
        style={{
          top: '2vh',
          right: '4vw',
          width: 'clamp(24px, 6vw, 28px)',
          height: 'clamp(24px, 6vw, 28px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <X className="w-full h-full text-white/80" strokeWidth={1.5} />
      </motion.button>

      {/* Top Activity Strip */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="absolute left-0 right-0 z-40 overflow-x-auto scrollbar-hide"
            style={{
              marginTop: '2vh',
              height: 'clamp(110px, 18vw, 140px)',
              paddingInline: '4vw',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div 
              className="flex items-end"
              style={{ gap: '-2.5vw' }}
            >
              {/* User's hero card - larger with tilt */}
              <motion.div
                className="relative flex-shrink-0"
                style={{ marginRight: '-2.5vw' }}
                initial={{ scale: 1.3, x: 80 }}
                animate={{ scale: 1, x: 0, rotate: -6 }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              >
                <div 
                  className="relative overflow-hidden"
                  style={{
                    width: 'clamp(72px, 11vw, 92px)',
                    height: 'clamp(108px, 16vw, 128px)',
                    borderRadius: 'clamp(8px, 1.8vw, 12px)',
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
                      <span className="text-white/40 text-[8px]">Your Photo</span>
                    </div>
                  )}
                  {/* Interaction sticker */}
                  <div 
                    className="absolute text-lg drop-shadow-lg"
                    style={{
                      width: 'clamp(18px, 2.8vw, 24px)',
                      top: '-0.8vw',
                      left: '-0.8vw',
                    }}
                  >
                    🏸
                  </div>
                </div>
              </motion.div>

              {/* Template story cards */}
              {storyCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  className="relative overflow-hidden flex-shrink-0"
                  style={{
                    width: 'clamp(72px, 11vw, 92px)',
                    height: 'clamp(108px, 16vw, 128px)',
                    borderRadius: 'clamp(8px, 1.8vw, 12px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    background: card.bg,
                    marginLeft: index === 0 ? '0' : '-2.5vw',
                  }}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.06 }}
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-2">
                    <span 
                      className="font-semibold leading-tight"
                      style={{ 
                        fontSize: 'clamp(8px, 2vw, 10px)',
                        color: card.id === 'journal' || card.id === 'cult' ? '#333' : '#fff' 
                      }}
                    >
                      {card.label}
                    </span>
                    <span 
                      className="opacity-70"
                      style={{ 
                        fontSize: 'clamp(6px, 1.5vw, 8px)',
                        color: card.id === 'journal' || card.id === 'cult' ? '#333' : '#fff' 
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

      {/* Separation Space */}
      <div style={{ marginTop: '4vh' }} />

      {/* Main Journey Area - Scrollable */}
      <div 
        className="absolute inset-x-0 overflow-y-auto"
        style={{ 
          top: 'calc(env(safe-area-inset-top, 2vh) + clamp(110px, 18vw, 140px) + 4vh)',
          bottom: 0,
          paddingInline: '4vw',
        }}
      >
        {/* Container for path - scales with viewport */}
        <div 
          className="relative w-full"
          style={{ height: '200vw', minHeight: '700px' }}
        >
          {/* Core Engine Node at Top */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                className="absolute left-1/2 z-30"
                style={{ 
                  top: 0,
                  transform: 'translateX(-50%)',
                }}
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.5 }}
              >
                {/* Base block */}
                <div
                  className="relative"
                  style={{
                    width: 'clamp(80px, 22vw, 104px)',
                    aspectRatio: '1/1',
                    borderRadius: 'clamp(12px, 4vw, 20px)',
                  }}
                >
                  <img 
                    src={levelCompleteImg} 
                    alt="Level complete" 
                    className="w-full h-auto object-contain"
                    style={{ 
                      opacity: 0.6,
                      position: 'absolute',
                      top: '-4vw',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 'clamp(60px, 16vw, 76px)',
                    }}
                  />
                </div>
                
                {/* BUILD STRENGTH label */}
                <div 
                  className="absolute whitespace-pre-line text-right"
                  style={{
                    top: '50%',
                    left: 'calc(100% + 4vw)',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <span 
                    style={{ 
                      fontSize: 'clamp(12px, 3.2vw, 14px)',
                      letterSpacing: '0.18em',
                      color: '#B8B8C5',
                      fontWeight: 700,
                    }}
                  >
                    BUILD{'\n'}STRENGTH
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Horizontal divider lines */}
          {[0.3, 0.5, 0.7].map((ratio, i) => (
            <div 
              key={i}
              className="absolute left-0 right-0 h-px pointer-events-none"
              style={{ 
                top: `${ratio * 100}%`,
                background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.05) 50%, transparent 95%)',
              }}
            />
          ))}

          {/* Diagonal Progress Path - Tiles */}
          <div 
            className="absolute w-full"
            style={{ 
              top: 'calc(clamp(80px, 22vw, 104px) + 6vh)',
              height: 'calc(100% - clamp(80px, 22vw, 104px) - 6vh)',
            }}
          >
            {tilePositions.map((pos, index) => {
              const day = index + 1;
              const state = getTileState(day);
              const milestone = milestones.find(m => m.day === day);
              const isUserPosition = day === currentDay;
              const isDay12 = day === 12;

              // Skip Day 12 tile (under engine)
              if (isDay12) return null;

              return (
                <motion.div
                  key={day}
                  className="absolute"
                  style={{ 
                    left: `${pos.xPercent}%`,
                    bottom: `${pos.yVw}vw`,
                    transform: 'translateX(-50%)',
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
                      className={`absolute whitespace-pre-line ${
                        milestone.position === 'left' 
                          ? 'text-right' 
                          : 'text-left'
                      }`}
                      style={{
                        top: '50%',
                        transform: 'translateY(-50%)',
                        ...(milestone.position === 'left' 
                          ? { right: 'calc(100% + 4vw)' }
                          : { left: 'calc(100% + 4vw)' }
                        ),
                      }}
                      initial={{ opacity: 0, x: milestone.position === 'left' ? 12 : -12 }}
                      animate={showTiles ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: day * 0.04 + 0.15 }}
                    >
                      <span 
                        style={{ 
                          fontSize: 'clamp(12px, 3.2vw, 14px)',
                          letterSpacing: '0.18em',
                          color: '#B8B8C5',
                          fontWeight: 700,
                          lineHeight: 1.3,
                        }}
                      >
                        {milestone.label}
                      </span>
                    </motion.div>
                  )}

                  {/* Social contribution indicator at current position */}
                  {isUserPosition && (
                    <motion.div
                      className="absolute flex items-center"
                      style={{ 
                        top: '-3vw',
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={showTiles ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: day * 0.04 + 0.2 }}
                    >
                      {/* Avatar stack */}
                      <div 
                        className="relative rounded-full overflow-hidden"
                        style={{
                          width: 'clamp(24px, 7vw, 30px)',
                          height: 'clamp(24px, 7vw, 30px)',
                          border: '2px solid #7B5CFF',
                        }}
                      >
                        <img 
                          src="https://i.pravatar.cc/80?img=32" 
                          alt="You" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Overlapping avatar */}
                      <div 
                        className="relative rounded-full overflow-hidden"
                        style={{
                          width: 'clamp(20px, 5vw, 24px)',
                          height: 'clamp(20px, 5vw, 24px)',
                          marginLeft: '-2vw',
                          border: '2px solid #7B5CFF',
                        }}
                      >
                        <img 
                          src="https://i.pravatar.cc/80?img=15" 
                          alt="Friend" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* +N badge */}
                      <span 
                        className="text-white font-medium"
                        style={{
                          fontSize: 'clamp(10px, 2.8vw, 12px)',
                          marginLeft: '1.2vw',
                        }}
                      >
                        +2
                      </span>
                    </motion.div>
                  )}

                  {/* Tile image */}
                  <img 
                    src={state === 'active' ? tileActiveImg : tileLockedImg}
                    alt={`Day ${day}`}
                    className="object-contain"
                    style={{
                      width: 'clamp(36px, 9vw, 46px)',
                      aspectRatio: '1/1',
                      borderRadius: 'clamp(6px, 2vw, 10px)',
                      filter: state === 'active' 
                        ? 'drop-shadow(0 0 2vw rgba(123, 92, 255, 0.6))' 
                        : 'none',
                      background: state === 'locked' ? '#1A1A1F' : 'transparent',
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Base platform at bottom */}
          <motion.div
            className="absolute left-1/2"
            style={{ 
              bottom: '6vh',
              transform: 'translateX(-50%)',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={showTiles ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
          >
            <img 
              src={basePlatformImg} 
              alt="Start platform" 
              className="object-contain"
              style={{
                width: 'clamp(200px, 55vw, 280px)',
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
