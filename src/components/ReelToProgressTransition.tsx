import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import { isVideoUrl } from '@/lib/media';
import tileActiveImg from '@/assets/progress/tile-active-new.png';
import tileInactiveImg from '@/assets/progress/tile-inactive.png';
import engineBadgeImg from '@/assets/progress/engine-badge.png';
import basePlatformImg from '@/assets/progress/base-platform.png';

// Tile positions for progress view
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

interface Activity {
  id: string;
  storageUrl: string;
  originalUrl?: string;
  isVideo?: boolean;
  dayNumber: number;
  avatarUrl?: string;
  displayName?: string;
  userId?: string;
}

interface ReelToProgressTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  currentActivity: Activity | null;
  publicFeed: Activity[];
  myActivities: { dayNumber: number }[];
  onStoryTap: (index: number, userId?: string) => void;
}

export default function ReelToProgressTransition({
  isOpen,
  onClose,
  currentActivity,
  publicFeed,
  myActivities,
  onStoryTap,
}: ReelToProgressTransitionProps) {
  const [showTiles, setShowTiles] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation values for pull-down gesture
  const dragY = useMotionValue(0);
  const progressOpacity = useTransform(dragY, [0, 150], [1, 0]);
  const progressScale = useTransform(dragY, [0, 150], [1, 0.85]);
  const progressY = useTransform(dragY, [0, 150], [0, 100]);

  // Stagger animations when opening
  useEffect(() => {
    if (isOpen) {
      const storiesTimer = setTimeout(() => setShowStories(true), 150);
      const tilesTimer = setTimeout(() => setShowTiles(true), 250);
      return () => {
        clearTimeout(storiesTimer);
        clearTimeout(tilesTimer);
      };
    } else {
      setShowTiles(false);
      setShowStories(false);
    }
  }, [isOpen]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }, [onClose]);

  const getDayFromIndex = (index: number) => 12 - index;
  const isTileActive = (dayNumber: number) => myActivities.some(a => a.dayNumber === dayNumber);

  const mediaUrl = currentActivity?.originalUrl || currentActivity?.storageUrl || '';
  const isVideo = currentActivity?.isVideo || isVideoUrl(mediaUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-manipulation"
          style={{
            background: "linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)",
            height: '100dvh',
            minHeight: '-webkit-fill-available',
          }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* No pull-down - just static content */}
          <motion.div className="flex-1 flex flex-col">
            {/* Background aurora effect */}
            <div 
              className="absolute pointer-events-none"
              style={{ left: "-53px", top: "-40px", width: "131vw", height: "auto" }}
            >
              <div 
                className="w-full h-[400px] opacity-40 mix-blend-screen"
                style={{ background: "radial-gradient(ellipse at center, rgba(138, 100, 200, 0.4) 0%, transparent 70%)" }}
              />
            </div>

            {/* Header - minimal, just close button */}
            <motion.div
              className="flex-shrink-0 w-full flex items-center justify-end px-4"
              style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <motion.button
                onClick={onClose}
                className="flex items-center justify-center text-white/80 active:scale-95 transition-transform"
                style={{ width: '36px', height: '36px' }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </motion.button>
            </motion.div>

            {/* Story strip with current activity transitioning into first position */}
            <AnimatePresence>
              {showStories && (
                <motion.div
                  className="flex-shrink-0 w-full overflow-x-auto scrollbar-hide overscroll-x-contain"
                  style={{
                    paddingTop: "12px",
                    paddingInline: "4vw",
                    paddingBottom: "16px",
                    minHeight: "130px",
                  }}
                  initial={{ opacity: 0, y: -40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -60, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                  <div className="flex items-end gap-3">
                    {/* Transition card - current activity as hero with layoutId for shared-element */}
                    {currentActivity && (
                      <motion.button
                        className="relative flex-shrink-0 overflow-hidden cursor-pointer"
                        style={{
                          width: "72px",
                          height: "100px",
                          borderRadius: "14px",
                          boxShadow: "0 12px 40px rgba(100, 70, 180, 0.5)",
                          border: "2px solid rgba(160, 120, 220, 0.35)",
                        }}
                        layoutId="reel-hero-card"
                        onClick={() => onStoryTap(0, currentActivity.userId)}
                        initial={{ scale: 2.5, y: 80, opacity: 0.5 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 2.5, y: 80, opacity: 0 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 350, 
                          damping: 35,
                          mass: 0.6,
                        }}
                      >
                        {isVideo ? (
                          <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            loop
                            autoPlay
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt="Current activity"
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {currentActivity.avatarUrl && (
                          <div className="absolute bottom-1.5 left-1.5">
                            <ProfileAvatar
                              src={currentActivity.avatarUrl}
                              name={currentActivity.displayName || ''}
                              size={24}
                              style={{ border: '2px solid rgba(255,255,255,0.6)' }}
                            />
                          </div>
                        )}
                        
                        <div 
                          className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-white font-semibold text-[9px]"
                          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                        >
                          D{currentActivity.dayNumber}
                        </div>
                      </motion.button>
                    )}

                    {/* Other feed items */}
                    {publicFeed.slice(0, 6).map((photo, index) => (
                      <motion.button
                        key={photo.id}
                        className="relative flex-shrink-0 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                        style={{
                          width: "72px",
                          height: "100px",
                          borderRadius: "14px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        onClick={() => onStoryTap(index + 1, photo.userId)}
                        initial={{ opacity: 0, x: 40, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={{ delay: 0.1 + index * 0.04 }}
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
                          />
                        )}
                        
                        {photo.avatarUrl && (
                          <div className="absolute bottom-1.5 left-1.5">
                            <ProfileAvatar
                              src={photo.avatarUrl}
                              name={photo.displayName || ''}
                              size={24}
                              style={{ border: '2px solid rgba(255,255,255,0.6)' }}
                            />
                          </div>
                        )}
                        
                        <div 
                          className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-white font-semibold text-[9px]"
                          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                        >
                          D{photo.dayNumber}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress tiles area */}
            <motion.div 
              className="flex-1 relative w-full overflow-hidden" 
              style={{ maxWidth: "430px", marginInline: "auto" }}
            >
              {/* Engine Badge */}
              <AnimatePresence>
                {showTiles && (
                  <motion.div
                    className="absolute"
                    style={{ left: "10%", top: "-1%", width: "32%", aspectRatio: "1" }}
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 50 }}
                    transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.15 }}
                  >
                    <img src={engineBadgeImg} alt="Engine Badge" className="w-full h-full object-contain" style={{ opacity: 0.7 }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Diagonal Progress Tiles with cascade animation */}
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
                    initial={{ opacity: 0, y: -80, scale: 0.5, rotate: -20 }}
                    animate={showTiles ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : {}}
                    exit={{ opacity: 0, y: -50, scale: 0.7, rotate: -10, transition: { duration: 0.15, delay: index * 0.01 } }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 24, 
                      delay: index * 0.025 
                    }}
                  >
                    <motion.img 
                      src={isActive ? tileActiveImg : tileInactiveImg} 
                      alt={`Day ${day}`} 
                      className="w-full h-full object-contain relative z-10"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    />
                  </motion.div>
                );
              })}

              {/* Milestone Labels */}
              {LABELS.map((label, idx) => (
                <motion.div
                  key={idx}
                  className="absolute flex flex-col"
                  style={{
                    left: `${label.left}%`,
                    top: `${label.top}%`,
                    textAlign: label.side === "left" ? "right" : "left",
                    alignItems: label.side === "left" ? "flex-end" : "flex-start",
                  }}
                  initial={{ opacity: 0, x: label.side === "left" ? -30 : 30 }}
                  animate={showTiles ? { opacity: 1, x: 0 } : {}}
                  exit={{ opacity: 0, x: label.side === "left" ? -20 : 20 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.3 + idx * 0.08 }}
                >
                  <span className="text-white/50 text-[10px] font-bold tracking-widest">{label.text[0]}</span>
                  <span className="text-white/80 text-xs font-bold">{label.text[1]}</span>
                </motion.div>
              ))}

              {/* Base platform */}
              <AnimatePresence>
                {showTiles && (
                  <motion.div
                    className="absolute"
                    style={{ left: "10%", bottom: "2%", width: "80%", maxWidth: "320px" }}
                    initial={{ opacity: 0, y: 60, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.35 }}
                  >
                    <img src={basePlatformImg} alt="Base" className="w-full object-contain" style={{ opacity: 0.85 }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
