import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { X } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import { isVideoUrl } from '@/lib/media';
import tileActiveImg from '@/assets/progress/tile-active-new.png';
import tileInactiveImg from '@/assets/progress/tile-inactive.png';
import engineBadgeImg from '@/assets/progress/engine-badge.png';
import basePlatformImg from '@/assets/progress/base-platform.png';

// Tile positions for progress view
const TILE_POSITIONS = [
  { left: 34, top: 18 },
  { left: 42, top: 23 },
  { left: 50, top: 28 },
  { left: 58, top: 33 },
  { left: 50, top: 38 },
  { left: 42, top: 43 },
  { left: 34, top: 48 },
  { left: 42, top: 53 },
  { left: 50, top: 58 },
  { left: 58, top: 63 },
  { left: 50, top: 68 },
  { left: 42, top: 73 },
];

const LABELS = [
  { tileIndex: 0, text: ["BUILD", "STRENGTH"], side: "right" as const, top: 18, left: 70 },
  { tileIndex: 3, text: ["INCREASE", "STAMINA"], side: "left" as const, top: 33, left: 6 },
  { tileIndex: 6, text: ["BUILD", "ENERGY"], side: "right" as const, top: 48, left: 70 },
  { tileIndex: 11, text: ["CONQUER", "WILL POWER"], side: "left" as const, top: 73, left: 6 },
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
  createdAt?: string;
}

interface ReelToProgressTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  currentActivity: Activity | null;
  publicFeed: Activity[];
  myActivities: { dayNumber: number }[];
  onStoryTap: (index: number, userId?: string, activityId?: string) => void;
  isInline?: boolean;
}

export default function ReelToProgressTransition({
  isOpen,
  onClose,
  currentActivity,
  publicFeed,
  myActivities,
  onStoryTap,
  isInline = false,
}: ReelToProgressTransitionProps) {
  const [showTiles, setShowTiles] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [expandingCardId, setExpandingCardId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine current activity with public feed and sort by latest first
  const allStories = (() => {
    const stories: Activity[] = [];
    
    // Add public feed items first
    publicFeed.forEach(item => {
      if (!stories.some(s => s.id === item.id)) {
        stories.push(item);
      }
    });
    
    // Add current activity if not already in list
    if (currentActivity && !stories.some(s => s.id === currentActivity.id)) {
      stories.unshift(currentActivity);
    }
    
    // Sort by createdAt or dayNumber (latest first)
    return stories.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.dayNumber - a.dayNumber;
    });
  })();

  // Show content immediately when opening - no delays for instant feel
  useEffect(() => {
    if (isOpen) {
      // Show everything immediately for instant transition
      setShowStories(true);
      setShowTiles(true);
    } else {
      setShowTiles(false);
      setShowStories(false);
      setExpandingCardId(null);
    }
  }, [isOpen]);

  const handleStoryTap = useCallback((story: Activity, index: number) => {
    // Set expanding card for animation
    setExpandingCardId(story.id);
    
    // Slight delay to show expansion animation before closing
    setTimeout(() => {
      onStoryTap(index, story.userId, story.id);
    }, 250);
  }, [onStoryTap]);

  const getDayFromIndex = (index: number) => 12 - index;
  const isTileActive = (dayNumber: number) => myActivities.some(a => a.dayNumber === dayNumber);

  if (isInline) {
    // Inline mode: render content directly without fixed overlay
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <LayoutGroup>
          <div className="flex-1 flex flex-col">
            {/* Story strip */}
            {showStories && (
              <div
                className="flex-shrink-0 w-full overflow-x-auto scrollbar-hide overscroll-x-contain"
                style={{
                  paddingTop: "8px",
                  paddingInline: "4vw",
                  paddingBottom: "12px",
                  minHeight: "120px",
                }}
              >
                <div className="flex items-end gap-3">
                  {allStories.slice(0, 8).map((story, index) => {
                    const isExpanding = expandingCardId === story.id;
                    const storyMediaUrl = story.originalUrl || story.storageUrl;
                    const storyIsVideo = story.isVideo || isVideoUrl(storyMediaUrl);
                    
                    return (
                      <motion.button
                        key={story.id}
                        className="relative flex-shrink-0 overflow-hidden cursor-pointer"
                        style={{
                          width: "64px",
                          height: "90px",
                          borderRadius: "12px",
                          boxShadow: index === 0 
                            ? "0 8px 24px rgba(100, 70, 180, 0.4)"
                            : "0 4px 16px rgba(0,0,0,0.25)",
                          border: index === 0 
                            ? "2px solid rgba(160, 120, 220, 0.35)"
                            : "1px solid rgba(255,255,255,0.1)",
                          zIndex: 10 - index,
                        }}
                        onClick={() => handleStoryTap(story, index)}
                        initial={{ opacity: 0, x: 30, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 35, delay: index * 0.03 }}
                      >
                        {storyIsVideo ? (
                          <video src={storyMediaUrl} className="w-full h-full object-cover" muted playsInline loop autoPlay preload="metadata" />
                        ) : (
                          <img src={storyMediaUrl} alt={`Day ${story.dayNumber}`} className="w-full h-full object-cover" />
                        )}
                        {story.avatarUrl && (
                          <div className="absolute bottom-1 left-1">
                            <ProfileAvatar src={story.avatarUrl} name={story.displayName || ''} size={20} style={{ border: '2px solid rgba(255,255,255,0.6)' }} />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded-full text-white font-semibold text-[8px]" style={{ background: "rgba(0,0,0,0.5)" }}>
                          D{story.dayNumber}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress tiles */}
            <div className="flex-1 relative w-full overflow-hidden" style={{ maxWidth: "430px", marginInline: "auto" }}>
              {showTiles && (
                <motion.div
                  className="absolute"
                  style={{ left: "10%", top: "-1%", width: "32%", aspectRatio: "1" }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.1 }}
                >
                  <img src={engineBadgeImg} alt="Engine Badge" className="w-full h-full object-contain" style={{ opacity: 0.7 }} />
                </motion.div>
              )}

              {TILE_POSITIONS.map((pos, index) => {
                const day = getDayFromIndex(index);
                const isActive = isTileActive(day);
                return (
                  <motion.div
                    key={day}
                    className="absolute"
                    style={{ left: `${pos.left}%`, top: `${pos.top}%`, width: "11%", aspectRatio: "1", transform: 'translateX(-50%)' }}
                    initial={{ opacity: 0, y: -40, scale: 0.5 }}
                    animate={showTiles ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.02 }}
                  >
                    <img src={isActive ? tileActiveImg : tileInactiveImg} alt={`Day ${day}`} className="w-full h-full object-contain" />
                  </motion.div>
                );
              })}

              {LABELS.map((label, idx) => (
                <motion.div
                  key={idx}
                  className="absolute flex flex-col"
                  style={{ left: `${label.left}%`, top: `${label.top}%`, textAlign: label.side === "left" ? "right" : "left", alignItems: label.side === "left" ? "flex-end" : "flex-start" }}
                  initial={{ opacity: 0, x: label.side === "left" ? -20 : 20 }}
                  animate={showTiles ? { opacity: 1, x: 0 } : {}}
                  transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.2 + idx * 0.05 }}
                >
                  <span className="text-white/50 text-[10px] font-bold tracking-widest">{label.text[0]}</span>
                  <span className="text-white/80 text-xs font-bold">{label.text[1]}</span>
                </motion.div>
              ))}

              {showTiles && (
                <motion.div
                  className="absolute"
                  style={{ left: "-15%", bottom: "2%", width: "65%", maxWidth: "260px" }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.25 }}
                >
                  <img src={basePlatformImg} alt="Base" className="w-full object-contain" style={{ opacity: 0.85 }} />
                </motion.div>
              )}
            </div>
          </div>
        </LayoutGroup>
      </div>
    );
  }

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
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.15 }}
        >
          <LayoutGroup>
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

              {/* Story strip - all stories sorted by latest */}
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
                      {allStories.slice(0, 8).map((story, index) => {
                        const isExpanding = expandingCardId === story.id;
                        const storyMediaUrl = story.originalUrl || story.storageUrl;
                        const storyIsVideo = story.isVideo || isVideoUrl(storyMediaUrl);
                        
                        return (
                          <motion.button
                            key={story.id}
                            layoutId={`story-card-${story.id}`}
                            className="relative flex-shrink-0 overflow-hidden cursor-pointer"
                            style={{
                              width: isExpanding ? "100vw" : "72px",
                              height: isExpanding ? "70vh" : "100px",
                              borderRadius: isExpanding ? "24px" : "14px",
                              boxShadow: isExpanding 
                                ? "0 24px 60px rgba(100, 70, 180, 0.6)"
                                : index === 0 
                                  ? "0 12px 40px rgba(100, 70, 180, 0.5)"
                                  : "0 4px 16px rgba(0,0,0,0.25)",
                              border: isExpanding 
                                ? "3px solid rgba(160, 120, 220, 0.5)"
                                : index === 0 
                                  ? "2px solid rgba(160, 120, 220, 0.35)"
                                  : "1px solid rgba(255,255,255,0.1)",
                              zIndex: isExpanding ? 100 : 10 - index,
                              position: isExpanding ? 'fixed' : 'relative',
                              left: isExpanding ? '50%' : 'auto',
                              top: isExpanding ? '50%' : 'auto',
                              x: isExpanding ? '-50%' : 0,
                              y: isExpanding ? '-50%' : 0,
                            }}
                            onClick={() => handleStoryTap(story, index)}
                            initial={{ opacity: 0, x: 40, scale: 0.8 }}
                            animate={{ 
                              opacity: 1, 
                              x: 0, 
                              scale: isExpanding ? 1.02 : 1,
                            }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileTap={{ scale: isExpanding ? 1 : 0.95 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 350, 
                              damping: 35,
                              delay: isExpanding ? 0 : index * 0.03,
                            }}
                          >
                            {storyIsVideo ? (
                              <video
                                src={storyMediaUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                loop
                                autoPlay
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={storyMediaUrl}
                                alt={`Day ${story.dayNumber}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                            
                            {/* Avatar - hide when expanding */}
                            {story.avatarUrl && !isExpanding && (
                              <motion.div 
                                className="absolute bottom-1.5 left-1.5"
                                animate={{ opacity: isExpanding ? 0 : 1 }}
                              >
                                <ProfileAvatar
                                  src={story.avatarUrl}
                                  name={story.displayName || ''}
                                  size={24}
                                  style={{ border: '2px solid rgba(255,255,255,0.6)' }}
                                />
                              </motion.div>
                            )}
                            
                            {/* Day badge - hide when expanding */}
                            {!isExpanding && (
                              <motion.div 
                                className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-white font-semibold text-[9px]"
                                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                                animate={{ opacity: isExpanding ? 0 : 1 }}
                              >
                                D{story.dayNumber}
                              </motion.div>
                            )}
                            
                            {/* Tap to view text when expanding */}
                            {isExpanding && (
                              <motion.div
                                className="absolute inset-0 flex items-center justify-center bg-black/20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <span className="text-white text-lg font-semibold tracking-wide">Opening...</span>
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress tiles area */}
              <motion.div 
                className="flex-1 relative w-full overflow-hidden" 
                style={{ maxWidth: "430px", marginInline: "auto" }}
                animate={{ opacity: expandingCardId ? 0.3 : 1 }}
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
          </LayoutGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
