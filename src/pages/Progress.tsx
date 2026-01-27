import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getPhotosStorageKey } from "@/hooks/use-device-id";
import ShakyFrame from "@/components/frames/ShakyFrame";
import JournalFrame from "@/components/frames/JournalFrame";
import VogueFrame from "@/components/frames/VogueFrame";
import FitnessFrame from "@/components/frames/FitnessFrame";
import TicketFrame from "@/components/frames/TicketFrame";

const STORAGE_KEY = getPhotosStorageKey();

// Mock other users' stories
const otherUsersStories = [
  { id: 'user1', name: 'Alex', avatar: 'https://i.pravatar.cc/80?img=1', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=400&fit=crop' },
  { id: 'user2', name: 'Jordan', avatar: 'https://i.pravatar.cc/80?img=2', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=400&fit=crop' },
  { id: 'user3', name: 'Sam', avatar: 'https://i.pravatar.cc/80?img=3', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&h=400&fit=crop' },
  { id: 'user4', name: 'Taylor', avatar: 'https://i.pravatar.cc/80?img=4', imageUrl: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=300&h=400&fit=crop' },
  { id: 'user5', name: 'Riley', avatar: 'https://i.pravatar.cc/80?img=5', imageUrl: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=300&h=400&fit=crop' },
];

// Milestone markers for the journey
const milestones = [
  { day: 3, label: 'CONQUER\nWILL POWER', position: 'left' },
  { day: 6, label: 'BUILD\nENERGY', position: 'right' },
  { day: 9, label: 'INCREASE\nSTAMINA', position: 'left' },
  { day: 12, label: 'BUILD\nSTRENGTH', position: 'right' },
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
  const transitionDayNumber = location.state?.dayNumber;

  // Load photos from localStorage
  const [photos, setPhotos] = useState<LoggedPhoto[]>(() => {
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
  const currentDay = photos.length;

  // Animation sequence
  useEffect(() => {
    // Start showing content after hero card animation
    const contentTimer = setTimeout(() => setShowContent(true), 400);
    const storiesTimer = setTimeout(() => setShowStories(true), 600);
    const tilesTimer = setTimeout(() => setShowTiles(true), 800);
    
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(storiesTimer);
      clearTimeout(tilesTimer);
    };
  }, []);

  const handleClose = () => {
    navigate('/', { replace: true });
  };

  // Get photo for a specific day
  const getPhotoForDay = (day: number) => {
    return photos.find(p => p.dayNumber === day);
  };

  // Determine tile state
  const getTileState = (day: number): 'logged' | 'active' | 'upcoming' | 'locked' => {
    if (getPhotoForDay(day)) return 'logged';
    if (day === currentDay + 1) return 'active';
    if (day <= currentDay) return 'logged';
    return 'locked';
  };

  // Render hero card (user's shared image)
  const renderHeroCard = () => {
    if (!transitionImage) return null;

    return (
      <motion.div
        className="relative w-28 h-40 rounded-xl overflow-hidden flex-shrink-0"
        initial={{ scale: 1.5, x: '50%', y: '100%' }}
        animate={{ scale: 1, x: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        style={{
          boxShadow: '0 8px 32px rgba(138, 43, 226, 0.4)',
          border: '2px solid rgba(138, 43, 226, 0.5)',
        }}
      >
        <img 
          src={transitionImage} 
          alt="Your activity" 
          className="w-full h-full object-cover"
        />
        {/* Decorative sticker */}
        <div className="absolute top-2 right-2 w-8 h-8 text-2xl">🏸</div>
      </motion.div>
    );
  };

  // Render isometric tile
  const renderTile = (day: number, index: number) => {
    const state = getTileState(day);
    const photo = getPhotoForDay(day);
    const milestone = milestones.find(m => m.day === day);
    
    // Calculate isometric position - zigzag pattern
    const row = Math.floor((day - 1) / 1);
    const isEvenRow = row % 2 === 0;
    
    // Zigzag positioning
    const xOffset = isEvenRow ? (day % 3) * 30 : ((day % 3) * 30) + 60;
    const yOffset = row * 45;

    return (
      <motion.div
        key={day}
        className="relative"
        initial={{ opacity: 0, y: 100, scale: 0.5 }}
        animate={showTiles ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 25,
          delay: index * 0.05 
        }}
        style={{
          marginLeft: `${xOffset}px`,
          marginTop: index === 0 ? 0 : '-25px',
        }}
      >
        {/* Milestone label */}
        {milestone && (
          <motion.div
            className={`absolute top-1/2 -translate-y-1/2 whitespace-pre-line text-xs font-bold tracking-wider ${
              milestone.position === 'left' ? 'right-full mr-6 text-right' : 'left-full ml-6 text-left'
            }`}
            style={{ color: 'rgba(255,255,255,0.7)' }}
            initial={{ opacity: 0, x: milestone.position === 'left' ? 20 : -20 }}
            animate={showTiles ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.05 + 0.2 }}
          >
            {milestone.label}
          </motion.div>
        )}

        {/* User avatars at current position */}
        {day === currentDay && (
          <motion.div
            className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={showTiles ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: index * 0.05 + 0.3 }}
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-500">
              <img 
                src="https://i.pravatar.cc/80?img=10" 
                alt="You" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="ml-2 text-white/70 text-sm font-medium">+2</span>
          </motion.div>
        )}

        {/* Tile */}
        <div
          className="relative w-14 h-14 rounded-xl transition-all"
          style={{
            background: state === 'active' 
              ? 'linear-gradient(135deg, rgba(0,200,200,0.3) 0%, rgba(100,100,200,0.2) 100%)'
              : state === 'logged'
              ? 'linear-gradient(135deg, rgba(60,60,80,1) 0%, rgba(40,40,60,1) 100%)'
              : 'linear-gradient(135deg, rgba(40,40,55,1) 0%, rgba(30,30,45,1) 100%)',
            boxShadow: state === 'active' 
              ? '0 0 20px rgba(0,200,200,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            border: state === 'active' 
              ? '1px solid rgba(0,200,200,0.5)' 
              : '1px solid rgba(255,255,255,0.05)',
            transform: 'perspective(500px) rotateX(10deg)',
          }}
        >
          {/* Inner circle/logo for locked tiles */}
          {state === 'locked' && (
            <div className="absolute inset-2 rounded-lg bg-black/30 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-white/20" />
            </div>
          )}
          
          {/* Photo thumbnail for logged tiles */}
          {state === 'logged' && photo && (
            <div className="absolute inset-1 rounded-lg overflow-hidden">
              <img 
                src={photo.storageUrl} 
                alt={`Day ${day}`}
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          )}

          {/* Active glow ring */}
          {state === 'active' && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                boxShadow: '0 0 15px rgba(0,200,200,0.6)',
              }}
            />
          )}
        </div>

        {/* Bottom highlight bar for tiles */}
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
          style={{
            background: state === 'active'
              ? 'linear-gradient(90deg, rgba(0,200,200,0.8), rgba(150,100,255,0.8))'
              : 'linear-gradient(90deg, rgba(80,60,120,0.6), rgba(60,40,100,0.4))',
          }}
        />
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a1a3a] via-[#0d0d1a] to-[#000000] overflow-hidden">
      {/* Close button */}
      <motion.button
        onClick={handleClose}
        className="absolute top-6 right-5 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <X className="w-5 h-5 text-white" />
      </motion.button>

      {/* Stories Row at Top */}
      <AnimatePresence>
        {showStories && (
          <motion.div
            className="absolute top-6 left-0 right-0 z-40"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
              {/* User's hero card */}
              {renderHeroCard()}
              
              {/* Other users' stories */}
              {otherUsersStories.map((user, index) => (
                <motion.div
                  key={user.id}
                  className="relative w-24 h-36 rounded-xl overflow-hidden flex-shrink-0"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  style={{
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <img 
                    src={user.imageUrl} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                  {/* User name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="text-white text-xs font-medium">{user.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Journey Ornament */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="absolute top-52 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.5 }}
          >
            {/* Abstract journey node */}
            <div className="relative w-36 h-36">
              {/* Background glow */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(100,80,180,0.3) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
              
              {/* Main ornament - 4 connected nodes */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Center diamond */}
                <rect 
                  x="35" y="35" width="30" height="30" 
                  rx="4"
                  fill="url(#ornamentGradient)"
                  transform="rotate(45 50 50)"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
                />
                
                {/* Connection dots */}
                {[0, 90, 180, 270].map((angle, i) => (
                  <circle
                    key={i}
                    cx={50 + 28 * Math.cos((angle * Math.PI) / 180)}
                    cy={50 + 28 * Math.sin((angle * Math.PI) / 180)}
                    r="8"
                    fill="rgba(100,80,160,0.8)"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                  />
                ))}
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="ornamentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(60,50,100,1)" />
                    <stop offset="100%" stopColor="rgba(40,30,70,1)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Platform base */}
              <div 
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 rounded-lg"
                style={{
                  background: 'linear-gradient(180deg, rgba(30,30,50,1) 0%, rgba(20,20,35,1) 100%)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Light strips */}
                <div className="absolute bottom-2 left-4 right-4 flex gap-1">
                  <div className="flex-1 h-0.5 rounded-full bg-gradient-to-r from-yellow-500/60 to-purple-500/60" />
                  <div className="flex-1 h-0.5 rounded-full bg-gradient-to-r from-purple-500/60 to-cyan-500/60" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Isometric Tile Grid - Scrollable */}
      <div className="absolute top-80 bottom-0 left-0 right-0 overflow-y-auto px-6 pb-20">
        <div className="flex flex-col items-center pt-16">
          {/* Horizontal divider lines */}
          {[0, 1, 2].map(i => (
            <div 
              key={i}
              className="absolute w-full h-px bg-white/5"
              style={{ top: `${280 + i * 150}px` }}
            />
          ))}

          {/* Tiles in reverse order (bottom to top visually) */}
          {Array.from({ length: totalDays }, (_, i) => totalDays - i).map((day, index) => 
            renderTile(day, index)
          )}

          {/* Start platform at bottom */}
          <motion.div
            className="mt-8 relative"
            initial={{ opacity: 0, y: 50 }}
            animate={showTiles ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
          >
            <div 
              className="w-32 h-16 rounded-xl"
              style={{
                background: 'linear-gradient(180deg, rgba(100,80,160,0.4) 0%, rgba(60,50,120,0.2) 100%)',
                boxShadow: '0 8px 32px rgba(100,80,160,0.3)',
                border: '1px solid rgba(100,80,160,0.3)',
                transform: 'perspective(500px) rotateX(20deg)',
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Progress;

