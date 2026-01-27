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
const milestones = [
  { day: 3, label: 'CONQUER\nWILL POWER', position: 'left' as const },
  { day: 6, label: 'BUILD\nENERGY', position: 'right' as const },
  { day: 9, label: 'INCREASE\nSTAMINA', position: 'left' as const },
  { day: 12, label: 'BUILD\nSTRENGTH', position: 'right' as const },
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

// Tile positions matching the reference screenshot exactly (zigzag pattern)
const TILE_POSITIONS: Array<{ x: number; y: number }> = [
  // Day 1 - bottom center (start)
  { x: 165, y: 1100 },
  // Day 2 - up-left
  { x: 120, y: 1030 },
  // Day 3 - up-right (with avatar + milestone)
  { x: 200, y: 960 },
  // Day 4 - up-left
  { x: 140, y: 890 },
  // Day 5 - up-left more
  { x: 100, y: 820 },
  // Day 6 - up-right
  { x: 180, y: 750 },
  // Day 7 - up-right
  { x: 220, y: 680 },
  // Day 8 - up-left
  { x: 160, y: 610 },
  // Day 9 - up-left
  { x: 110, y: 540 },
  // Day 10 - up-right
  { x: 175, y: 470 },
  // Day 11 - up-right
  { x: 225, y: 400 },
  // Day 12 - top (end, with level complete ornament above)
  { x: 165, y: 320 },
];

const Progress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [showTiles, setShowTiles] = useState(false);
  const [showStories, setShowStories] = useState(false);

  // Get transition data from navigation state
  const transitionImage = location.state?.transitionImage;
  const transitionFrame = location.state?.frameType;
  const transitionFrameProps = location.state?.frameProps;
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
    const storiesTimer = setTimeout(() => setShowStories(true), 500);
    const tilesTimer = setTimeout(() => setShowTiles(true), 700);
    
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(storiesTimer);
      clearTimeout(tilesTimer);
    };
  }, []);

  const handleClose = () => {
    // Navigate to home with transition data for shared-element animation
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

  // Frame templates for stories carousel
  const storyTemplates = [
    { id: 'vogue', bg: 'bg-amber-900', label: 'the Player', sublabel: '2hrs • 10' },
    { id: 'journal', bg: 'bg-gray-100', label: 'Lawn Tennis', sublabel: '02hrs • 10 • 400' },
    { id: 'fitness', bg: 'bg-lime-500', label: 'CULT NINJA', sublabel: '1/3 Activity' },
    { id: 'instagram', bg: 'bg-emerald-700', label: 'NINJA JOURNEY', sublabel: 'WEEK 1 / DAY 4' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #2a1f4e 0%, #151525 30%, #0a0a12 100%)',
      }}
    >
      {/* Close button */}
      <motion.button
        onClick={handleClose}
        className="absolute top-6 right-5 z-50 w-10 h-10 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <X className="w-6 h-6 text-white" />
      </motion.button>

      {/* Stories Row at Top */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="absolute top-10 left-0 right-0 z-40"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-4">
              {/* User's hero card - larger with tilt */}
              <motion.div
                className="relative flex-shrink-0"
                initial={{ scale: 1.5, x: 100 }}
                animate={{ scale: 1, x: 0, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              >
                <div 
                  className="relative w-32 h-44 rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: '0 12px 40px rgba(138, 43, 226, 0.5)',
                    border: '3px solid rgba(180, 130, 255, 0.4)',
                    background: 'linear-gradient(145deg, rgba(100,80,150,0.3), rgba(60,40,100,0.5))',
                  }}
                >
                  {transitionImage ? (
                    <img 
                      src={transitionImage} 
                      alt="Your activity" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/50 to-blue-600/50" />
                  )}
                  {/* Decorative sticker */}
                  <div className="absolute top-3 right-3 text-2xl drop-shadow-lg">🏸</div>
                </div>
              </motion.div>

              {/* Template story cards */}
              {storyTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  className="relative w-24 h-40 rounded-xl overflow-hidden flex-shrink-0"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className={`w-full h-full ${template.bg} flex flex-col justify-end p-2`}>
                    <span className="text-white text-[10px] font-semibold leading-tight">{template.label}</span>
                    <span className="text-white/60 text-[8px]">{template.sublabel}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Complete Ornament */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="absolute z-30"
            style={{ top: 240, left: '50%', transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.6 }}
          >
            <img 
              src={levelCompleteImg} 
              alt="Level complete" 
              className="w-44 h-auto object-contain"
            />
            {/* BUILD STRENGTH label */}
            <div 
              className="absolute top-12 -right-20 text-right whitespace-pre-line"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              <span className="text-[11px] font-bold tracking-wider leading-tight">BUILD{'\n'}STRENGTH</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal divider lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[420, 590, 780, 950].map((top, i) => (
          <div 
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{ 
              top: `${top}px`,
              background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)',
            }}
          />
        ))}
      </div>

      {/* Tile Grid - Absolute positioned */}
      <div className="absolute inset-0 overflow-y-auto" style={{ paddingTop: '380px' }}>
        <div className="relative w-full" style={{ height: '900px' }}>
          {/* Render tiles based on positions */}
          {TILE_POSITIONS.map((pos, index) => {
            const day = index + 1;
            const state = getTileState(day);
            const milestone = milestones.find(m => m.day === day);
            const isUserPosition = day === currentDay;

            return (
              <motion.div
                key={day}
                className="absolute"
                style={{ 
                  left: pos.x - 30, // Center tile (tile is ~60px)
                  top: pos.y - 380, // Offset for container padding
                }}
                initial={{ opacity: 0, y: 60, scale: 0.6 }}
                animate={showTiles ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ 
                  type: 'spring',
                  stiffness: 180,
                  damping: 22,
                  delay: (totalDays - day) * 0.04 // Bottom-up animation
                }}
              >
                {/* Milestone label */}
                {milestone && (
                  <motion.div
                    className={`absolute top-1/2 -translate-y-1/2 whitespace-pre-line text-[11px] font-bold tracking-wider leading-tight ${
                      milestone.position === 'left' ? 'right-full mr-4 text-right' : 'left-full ml-4 text-left'
                    }`}
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                    initial={{ opacity: 0, x: milestone.position === 'left' ? 15 : -15 }}
                    animate={showTiles ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: (totalDays - day) * 0.04 + 0.15 }}
                  >
                    {milestone.label}
                  </motion.div>
                )}

                {/* User avatar at current position */}
                {isUserPosition && (
                  <motion.div
                    className="absolute -left-20 top-1/2 -translate-y-1/2 flex items-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={showTiles ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: (totalDays - day) * 0.04 + 0.2 }}
                  >
                    <div 
                      className="relative w-11 h-11 rounded-full overflow-hidden"
                      style={{
                        boxShadow: '0 0 0 2px rgba(180, 130, 255, 0.6), 0 0 15px rgba(180, 130, 255, 0.4)',
                      }}
                    >
                      <img 
                        src="https://i.pravatar.cc/80?img=32" 
                        alt="You" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-1 flex items-center">
                      <div 
                        className="w-7 h-7 rounded-full overflow-hidden -ml-3"
                        style={{ border: '2px solid #1a1a3a' }}
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
                  className="w-16 h-16 object-contain"
                  style={{
                    filter: state === 'active' ? 'drop-shadow(0 0 12px rgba(0,200,200,0.5))' : 'none',
                  }}
                />

                {/* Photo overlay for logged tiles */}
                {state === 'logged' && getPhotoForDay(day) && (
                  <div 
                    className="absolute top-2 left-2 w-8 h-8 rounded-md overflow-hidden"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                  >
                    <img 
                      src={getPhotoForDay(day)?.storageUrl}
                      alt={`Day ${day} photo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Base platform at bottom */}
        <motion.div
          className="flex justify-center pb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={showTiles ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
        >
          <img 
            src={basePlatformImg} 
            alt="Start platform" 
            className="w-64 h-auto object-contain"
            style={{
              filter: 'drop-shadow(0 8px 24px rgba(100,80,160,0.3))',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Progress;
