import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Image as ImageIcon, Lock, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import { isVideoUrl } from "@/lib/media";
import ReelProgressPill from "./ReelProgressPill";
import { useFitnessReel } from "@/hooks/use-fitness-reel";
import FloatingCardReactions from "./FloatingCardReactions";
import weekRecapVideo from "@/assets/demo-videos/week-recap.mp4";

// Activity icons
import footballIcon from '@/assets/activities/football.png';
import cricketIcon from '@/assets/activities/cricket.png';
import racquetIcon from '@/assets/activities/racquet.png';
import basketballIcon from '@/assets/activities/basketball.png';
import cyclingIcon from '@/assets/activities/cycling.png';
import runningIcon from '@/assets/activities/running.png';
import trekkingIcon from '@/assets/activities/trekking.png';
import boxingIcon from '@/assets/activities/boxing.png';
import yogaIcon from '@/assets/activities/yoga.png';

const activities = [
  { name: 'Running', icon: runningIcon },
  { name: 'Cycling', icon: cyclingIcon },
  { name: 'Trekking', icon: trekkingIcon },
  { name: 'Basketball', icon: basketballIcon },
  { name: 'Yoga', icon: yogaIcon },
  { name: 'Football', icon: footballIcon },
  { name: 'Cricket', icon: cricketIcon },
  { name: 'Badminton', icon: racquetIcon },
  { name: 'Boxing', icon: boxingIcon },
];

export interface LoggedPhoto {
  id: string;
  storageUrl: string;
  /** Raw asset used for re-editing in the template editor (optional). */
  originalUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  dayNumber: number;
  reactionCount?: number;
  topReaction?: string;
  /** All reaction types with their counts */
  allReactions?: { type: string; count: number }[];
}

interface PhotoLoggingWidgetProps {
  photos?: LoggedPhoto[];
  onPhotoAdd?: (weekIndex: number, dayIndex: number) => void;
  onPhotoTap?: (photo: LoggedPhoto) => void;
  onPlayReel?: (weekPhotos: LoggedPhoto[]) => void;
  currentWeek?: number;
  currentDay?: number;
}

interface CardClusterProps {
  weekIndex: number;
  photos: (LoggedPhoto | null)[];
  isActiveWeek: boolean;
  isExpanded: boolean;
  isPastWeekWithPhotos: boolean;
  onTap: () => void;
  onCardTap: (dayIndex: number, photo: LoggedPhoto | null) => void;
  onPlayReel?: (weekPhotos: LoggedPhoto[]) => void;
}

// Ultra-smooth spring configs - iOS-like physics
const smoothSpring = {
  type: "spring" as const,
  stiffness: 200,
  damping: 28,
  mass: 0.8,
  restDelta: 0.0001,
};

const fastSpring = {
  type: "spring" as const,
  stiffness: 350,
  damping: 35,
  mass: 0.6,
  restDelta: 0.0001,
};

// Cubic bezier for silky opacity/scale
const smoothEase = [0.32, 0.72, 0, 1] as const;

const CardCluster = ({ weekIndex, photos, isActiveWeek, isExpanded, isPastWeekWithPhotos, onTap, onCardTap, onPlayReel }: CardClusterProps) => {
  // Use 9:16 aspect ratio to match reel viewer
  const baseCardWidth = 54;
  const baseCardHeight = 96; // 54 * (16/9) = 96 for 9:16 aspect ratio
  const borderRadius = 14;
  
  // Check if week is complete (all 3 photos logged)
  const isWeekComplete = photos.every(p => p !== null);
  
  // Completed weeks should collapse UNLESS they are explicitly expanded (via tap)
  // Only incomplete weeks that are expanded OR active stay fanned out
  const shouldShowExpanded = isExpanded;
  
  // Scale based on state - expanded weeks are larger
  const scale = shouldShowExpanded ? 1.5 : 0.75;
  const cardWidth = baseCardWidth * scale;
  const cardHeight = baseCardHeight * scale;
  
  // Check if any photo is logged in this week
  const hasAnyPhoto = photos.some(p => p !== null);
  
  // Card positions for stacked state - proper separation to avoid overlap
  const getStackedPositions = (index: number) => {
    // When stacked, cards should be positioned with clear separation
    const rotations = [-8, 0, 8];
    const xOffsets = [-14, 0, 14]; // Clear horizontal separation
    const yOffsets = [4, 0, 4];
    return {
      rotate: rotations[index],
      x: xOffsets[index],
      y: yOffsets[index],
    };
  };

  const handleCardClick = (e: React.MouseEvent, index: number, photo: LoggedPhoto | null) => {
    e.stopPropagation();
    
    // If not expanded, always expand first
    if (!isExpanded) {
      onTap();
      return;
    }
    
    // If expanded, handle individual card tap
    onCardTap(index, photo);
  };
  const renderCard = (index: number, zIndex: number, opacity: number) => {
    const photo = photos[index];
    const hasPhoto = photo !== null && photo.storageUrl;
    // storageUrl is always the templated PNG screenshot - render as image, not video
    // The actual video/image source is in originalUrl
    const displayUrl = photo?.storageUrl;
    const isDisplayVideo = displayUrl ? isVideoUrl(displayUrl) : false;
    const dayNumber = weekIndex * 3 + index + 1;
    
    // SEQUENTIAL LOGIC: Day N is only active if Day N-1 is complete (or N is 1)
    // First find if the previous day in the journey has a photo
    const previousDayNumber = dayNumber - 1;
    const previousDayHasPhoto = previousDayNumber === 0 || photos.some(p => p !== null);
    
    // isActiveDay: this is the NEXT slot to fill (no photo yet, but previous day is done)
    const firstEmptyIndex = photos.findIndex(p => p === null || !p.storageUrl);
    const isActiveDay = isActiveWeek && !hasPhoto && index === firstEmptyIndex;
    
    // Expanded position - fan out from center with spacing
    const expandedX = (index - 1) * (cardWidth + 16);
    
    const stackedPos = getStackedPositions(index);
    
    // Minimal stagger for snappy fan-out/collapse
    const staggerDelay = isExpanded ? index * 0.02 : (2 - index) * 0.015;
    
    // 10% white translucent backgrounds with blur
    const glassBg = 'rgba(255, 255, 255, 0.10)';
    const activeGlassBg = 'rgba(52, 211, 153, 0.15)';
    const solidBg = hasPhoto ? 'transparent' : glassBg;
    const expandedBg = hasPhoto ? 'transparent' : isActiveDay ? activeGlassBg : glassBg;
    
    return (
      <motion.button
        key={index}
        className={`absolute rounded-xl border shadow-lg ${
          hasPhoto 
            ? 'border-emerald-400/40' 
            : isActiveDay 
              ? 'border-emerald-400/50 ring-2 ring-emerald-400/30' 
              : 'border-white/10'
        }`}
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: borderRadius * scale,
          background: shouldShowExpanded ? expandedBg : solidBg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex,
          willChange: 'transform, opacity',
          overflow: 'visible', // Allow reaction badge to float outside
        }}
        initial={false}
        animate={
          shouldShowExpanded
            ? {
                left: `calc(50% + ${expandedX}px)`,
                top: 0,
                rotate: 0,
                x: "-50%",
                y: 0,
                opacity: 1,
                scale: 1,
              }
            : {
                left: "50%",
                top: 0,
                rotate: stackedPos.rotate,
                x: `calc(-50% + ${stackedPos.x}px)`,
                y: stackedPos.y,
                opacity: 1,
                scale: 1,
              }
        }
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 32,
          mass: 0.7,
          delay: staggerDelay,
        }}
        onClick={(e) => handleCardClick(e, index, photo)}
        whileTap={{ scale: 0.96 }}
      >
        {/* Photo content wrapper with overflow hidden for media clipping */}
        <div 
          className="absolute inset-0 overflow-hidden" 
          style={{ 
            zIndex: 1,
            borderRadius: (borderRadius * scale) - 1, // Match outer border radius minus border
          }}
        >
          {/* storageUrl is always the templated PNG - render as image */}
          {hasPhoto && (
            <>
              {isDisplayVideo ? (
                <video
                  src={displayUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  autoPlay
                  preload="metadata"
                  onError={() => {
                    console.error("Failed to load video:", displayUrl);
                  }}
                />
              ) : (
                <img
                  src={displayUrl}
                  alt={`Day ${dayNumber}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    // Try reloading once on error
                    const img = e.currentTarget;
                    if (!img.dataset.retried) {
                      img.dataset.retried = "true";
                      img.src = displayUrl + "?t=" + Date.now();
                    } else {
                      console.error("Failed to load image:", displayUrl);
                    }
                  }}
                />
              )}
              {/* Green glow overlay for logged photos */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/25 to-transparent pointer-events-none" />
            </>
          )}
        </div>
        
        {/* Empty state - animated upload icon ONLY when expanded */}
        {!hasPhoto && shouldShowExpanded && isActiveDay && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            
            {/* Breathing outer glow */}
            <motion.div
              className="absolute w-16 h-16 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(52, 211, 153, 0.4) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Expanding ripple ring */}
            <motion.div
              className="absolute w-12 h-12 rounded-full border-2 border-emerald-400/50"
              animate={{
                scale: [1, 1.8],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            
            {/* Main upload button with pulse */}
            <motion.div 
              className="relative p-3 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(52, 211, 153, 0.5)',
                boxShadow: '0 0 20px rgba(52, 211, 153, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [1, 1.08, 1],
                opacity: 1,
              }}
              transition={{ 
                scale: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                opacity: { duration: 0.3 },
              }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Bouncing upload icon with shimmer */}
              <motion.div
                animate={{ 
                  y: [0, -4, 0],
                  filter: [
                    'drop-shadow(0 0 8px rgba(52,211,153,0.6))',
                    'drop-shadow(0 0 16px rgba(52,211,153,0.9))',
                    'drop-shadow(0 0 8px rgba(52,211,153,0.6))',
                  ],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Upload className="w-6 h-6 text-emerald-400" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          </div>
        )}
        
        {/* LOCKED state for upcoming/inactive days (no photo, not the active day) */}
        {!hasPhoto && shouldShowExpanded && !isActiveDay && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Frosted glass lock badge */}
            <motion.div 
              className="relative p-2.5 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.03, duration: 0.25 }}
            >
              <Lock className="w-5 h-5 text-white/40" />
            </motion.div>
          </div>
        )}
        
        {/* Day number at TOP - only show for empty cards */}
        <AnimatePresence>
          {shouldShowExpanded && !hasPhoto && (
            <motion.div 
              className="absolute top-2 left-1/2"
              style={{ zIndex: 10 }}
              initial={{ opacity: 0, y: -6, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -4, x: "-50%" }}
              transition={{ delay: 0.1 + index * 0.03, duration: 0.2 }}
            >
              <span className={`text-[10px] italic ${
                isActiveDay 
                  ? 'text-emerald-400' 
                  : 'text-white/35'
              }`}>
                day {dayNumber}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Story label at BOTTOM - only show for empty cards */}
        <AnimatePresence>
          {shouldShowExpanded && !hasPhoto && (
            <motion.div 
              className="absolute bottom-2 left-1/2"
              style={{ zIndex: 10 }}
              initial={{ opacity: 0, y: 6, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 4, x: "-50%" }}
              transition={{ delay: 0.1 + index * 0.03, duration: 0.2 }}
            >
              <span className={`text-[10px] italic ${
                isActiveDay 
                  ? 'text-emerald-400' 
                  : 'text-white/35'
              }`}>
                {(() => {
                  const storyLabels = [
                    'begin…', 'push…', 'rise',      // Week 1
                    'grow…', 'build…', 'strong',    // Week 2  
                    'flow…', 'glow…', 'shine',      // Week 3
                    'soar…', 'peak…', 'legend'      // Week 4
                  ];
                  return storyLabels[dayNumber - 1] || '';
                })()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Floating animated reactions around card edges */}
        {hasPhoto && (
          (() => {
            // Calculate total reactions from allReactions or use reactionCount
            const totalReactions = photo.allReactions 
              ? photo.allReactions.reduce((sum, r) => sum + (r.count || 0), 0)
              : (photo.reactionCount || 0);
            
            if (totalReactions <= 0) return null;
            
            return (
              <FloatingCardReactions
                reactions={photo.topReaction ? [photo.topReaction] : ['fire']}
                allReactions={photo.allReactions}
                size={shouldShowExpanded ? 'md' : 'sm'}
              />
            );
          })()
        )}
      </motion.button>
    );
  };

  // Calculate container dimensions based on state
  const containerWidth = shouldShowExpanded 
    ? (cardWidth * 3 + 50) 
    : (baseCardWidth * 0.8 + 16);
  const containerHeight = cardHeight + 24;

  // Count photos in this week for play button
  const weekPhotoCount = photos.filter(p => p !== null).length;
  const canPlayReel = weekPhotoCount >= 3;
  
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canPlayReel && onPlayReel) {
      const validPhotos = photos.filter((p): p is LoggedPhoto => p !== null);
      onPlayReel(validPhotos);
    }
  };

  // Determine week status for icon
  const startDay = weekIndex * 3 + 1;
  const photosLogged = photos.filter(p => p !== null).length;
  const isCompletedWeek = photosLogged >= 3;
  // Current week = active week (has at least one empty slot and is the active week)
  const isCurrentWeekForIcon = isActiveWeek && !isCompletedWeek;

  // No icons in collapsed state - clean stacked cards only
  const collapsedIconConfig = null;

  // Handle tap on collapsed week icon
  const handleCollapsedIconTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompletedWeek) {
      // Play reel - don't expand
      if (onPlayReel) {
        const validPhotos = photos.filter((p): p is LoggedPhoto => p !== null);
        onPlayReel(validPhotos);
      }
    } else {
      // Expand the cards (current or upcoming week)
      onTap();
    }
  };

  // Add padding to container to allow reactions to overflow visibly
  const reactionPadding = 16; // Extra space for floating reactions

  return (
    <motion.div
      key={weekIndex}
      className="relative flex-shrink-0 overflow-visible"
      style={{
        width: containerWidth + reactionPadding * 2,
        height: containerHeight + reactionPadding,
        padding: `${reactionPadding / 2}px ${reactionPadding}px`,
      }}
      animate={{
        scale: 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
    >
      {/* Contextual icon ABOVE stacked cards - only for current incomplete week */}
      <AnimatePresence>
        {!isExpanded && !isWeekComplete && collapsedIconConfig && (
          <motion.button
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-20"
            style={{ top: -20 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleCollapsedIconTap}
            whileTap={{ scale: 0.9 }}
          >
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <collapsedIconConfig.icon 
                className={`w-4 h-4 ${collapsedIconConfig.color}`} 
                fill="none"
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Collapsed stacked cards - tap to expand (no play icon overlay) */}

      {/* Glow effect for active/expanded week */}
      <AnimatePresence>
        {shouldShowExpanded && !isWeekComplete && (
          <motion.div 
            className="absolute rounded-3xl blur-2xl pointer-events-none"
            style={{
              width: containerWidth * 0.9,
              height: cardHeight * 0.7,
              top: "50%",
              left: "50%",
              zIndex: 0,
              background: hasAnyPhoto 
                ? "rgba(52, 211, 153, 0.12)" 
                : isActiveWeek 
                  ? "rgba(52, 211, 153, 0.08)"
                  : "rgba(255,255,255,0.04)",
            }}
            initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
            animate={{
              opacity: [0.5, 0.7, 0.5],
              scale: 1,
              x: "-50%",
              y: "-50%",
            }}
            exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
            transition={{
              opacity: {
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
              scale: { ...smoothSpring },
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Render 3 cards - reversed order so first card (index 0) is on top when stacked */}
      {[2, 1, 0].map((index) => 
        renderCard(index, shouldShowExpanded ? index + 1 : 3 - index, 1)
      )}
    </motion.div>
  );
};

const PhotoLoggingWidget = ({ 
  photos = [], 
  onPhotoAdd,
  onPhotoTap,
  onPlayReel,
  currentWeek = 1,
  currentDay = 1,
}: PhotoLoggingWidgetProps) => {
  const navigate = useNavigate();
  const [focusedWeekIndex, setFocusedWeekIndex] = useState<number>(0);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  
  // Reel generation state
  const { 
    currentReel,
    currentStep: reelStep,
    isGenerating: isGeneratingReel,
  } = useFitnessReel();
  
  // Calculate reel progress based on step
  const reelProgress = (() => {
    if (!isGeneratingReel) {
      return currentReel?.videoUrl ? 100 : 0;
    }
    switch (reelStep) {
      case 'narration': return 25;
      case 'voiceover': return 50;
      case 'video': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  })();
  
  // Calculate completed weeks and current active week for pill display
  const getCompletedWeekCount = () => {
    let count = 0;
    for (let i = 0; i < 4; i++) {
      const startDay = i * 3 + 1;
      const weekPhotos = [0, 1, 2].map(dayOffset => {
        const dayNumber = startDay + dayOffset;
        return photos.find(p => Number(p.dayNumber) === dayNumber);
      });
      if (weekPhotos.every(p => p != null)) count++;
    }
    return count;
  };
  
  const completedWeeks = getCompletedWeekCount();
  const showReelPill = completedWeeks > 0;
  
  // Get photos for each week (3 photos per week)
  const getWeekPhotos = useCallback((weekIndex: number): (LoggedPhoto | null)[] => {
    const startDay = weekIndex * 3 + 1;
    return [0, 1, 2].map(dayOffset => {
      const dayNumber = startDay + dayOffset;
      return photos.find(p => Number(p.dayNumber) === dayNumber) || null;
    });
  }, [photos]);

  // Determine which weeks are active (have photos or are current)
  const getWeekStatus = useCallback((weekIndex: number) => {
    const weekPhotos = getWeekPhotos(weekIndex);
    const hasPhotos = weekPhotos.some(p => p !== null);
    const isComplete = weekPhotos.every(p => p !== null);
    const isCurrentWeek = weekIndex === currentWeek - 1;
    return { hasPhotos, isComplete, isCurrentWeek, isActive: hasPhotos || isCurrentWeek };
  }, [getWeekPhotos, currentWeek]);

  // Find the current active week (last week with any photos that isn't complete, or first week with photos in next week)
  const getCurrentActiveWeekIndex = useCallback(() => {
    for (let i = 0; i <= 3; i++) {
      const weekPhotos = getWeekPhotos(i);
      const hasPhotos = weekPhotos.some(p => p !== null);
      const isComplete = weekPhotos.every(p => p !== null);
      
      // If week has photos but isn't complete, this is the active week
      if (hasPhotos && !isComplete) return i;
      
      // If week is complete, check if next week has started
      if (isComplete && i < 3) {
        const nextWeekPhotos = getWeekPhotos(i + 1);
        const nextHasPhotos = nextWeekPhotos.some(p => p !== null);
        if (!nextHasPhotos) return i; // Stay on completed week until next starts
      }
    }
    return 0; // Default to first week
  }, [getWeekPhotos]);

  // Auto-focus on current active week on mount and when photos change
  useEffect(() => {
    const activeWeek = getCurrentActiveWeekIndex();
    setFocusedWeekIndex(activeWeek);
  }, [photos, getCurrentActiveWeekIndex]);

  // Handle tapping on a week cluster
  const handleClusterTap = (weekIndex: number) => {
    // Only switch focus if tapping a different week
    if (weekIndex !== focusedWeekIndex) {
      setFocusedWeekIndex(weekIndex);
    }
  };

  const handleCardTap = (weekIndex: number, dayIndex: number, photo: LoggedPhoto | null) => {
    const dayNumber = weekIndex * 3 + dayIndex + 1;

    console.info('[journey-debug] Widget: card tap', {
      weekIndex,
      dayIndex,
      dayNumber,
      hasPhoto: !!photo,
    });

    if (photo) {
      // Tap on existing photo - navigate to /reel page with all photos
      const allPhotos = photos.filter(p => p.storageUrl);
      const photoIndex = allPhotos.findIndex(p => p.id === photo.id);
      
      // Convert to JourneyActivity format for reel page
      const activitiesForReel = allPhotos.map(p => ({
        id: p.id,
        user_id: '',
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
      }));
      
      navigate('/reel', {
        state: {
          activities: activitiesForReel,
          initialIndex: photoIndex >= 0 ? photoIndex : 0,
        },
      });
    } else {
      // SEQUENTIAL UPLOAD ENFORCEMENT:
      // Day N can only be uploaded if Day N-1 is complete (or if N is 1)
      const previousDayNumber = dayNumber - 1;
      const previousDayPhoto = previousDayNumber > 0 
        ? photos.find(p => Number(p.dayNumber) === previousDayNumber) 
        : null;
      
      const canUpload = dayNumber === 1 || previousDayPhoto !== null;
      
      if (!canUpload) {
        // Show toast that previous day needs to be completed first
        toast.info(`Complete Day ${previousDayNumber} first!`);
        return;
      }
      
      if (onPhotoAdd) {
        onPhotoAdd(weekIndex, dayIndex);
      } else {
        setPendingUpload({ weekIndex, dayIndex });
        setShowUploadOptions(true);
      }
    }
  };

  const handleUploadOptionSelect = (option: 'camera' | 'gallery') => {
    setShowUploadOptions(false);
    if (pendingUpload) {
      const dayNumber = pendingUpload.weekIndex * 3 + pendingUpload.dayIndex + 1;
      if (option === 'camera') {
        // Navigate to dedicated camera page
        navigate('/camera', {
          state: { dayNumber },
        });
      } else {
        // Navigate to dedicated gallery page
        navigate('/gallery', {
          state: { dayNumber },
        });
      }
    }
    setPendingUpload(null);
  };

  const handleActivitySelect = (activity: string) => {
    setShowActivitySheet(false);
    if (pendingUpload) {
      const dayNumber = pendingUpload.weekIndex * 3 + pendingUpload.dayIndex + 1;
      navigate('/camera', {
        state: { dayNumber },
      });
    }
    setPendingUpload(null);
  };

  // Handle playing week recap - navigate to /reel page
  const handlePlayWeekRecap = (_weekPhotos: LoggedPhoto[], weekIndex: number) => {
    navigate('/reel', {
      state: {
        weekRecapVideo,
        weekNumber: weekIndex + 1,
      },
    });
  };
  
  // 4 clusters representing 4 weeks (fixed order, no shuffling)
  const weeks = [0, 1, 2, 3];
  const activeWeekIndex = currentWeek - 1;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to center the focused week
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const focusedElement = container.querySelector(`[data-week="${focusedWeekIndex}"]`) as HTMLElement;
      if (focusedElement) {
        const containerWidth = container.offsetWidth;
        const elementLeft = focusedElement.offsetLeft;
        const elementWidth = focusedElement.offsetWidth;
        const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [focusedWeekIndex]);

  return (
    <>
      <div 
        className="relative w-full overflow-visible" 
        style={{ height: 180, paddingTop: 20 }} 
        data-shared-element="cult-ninja-widget"
      >
        {/* Timeline Path - SVG curved dashed line */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 400 100"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible" }}
        >
          <path
            d="M 10 55 Q 50 30, 110 48 Q 170 66, 230 42 Q 290 18, 350 48 Q 390 68, 410 52"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Scrollable Cards Container */}
        <div 
          ref={scrollContainerRef}
          className="absolute inset-0 flex items-center overflow-x-auto overflow-visible scrollbar-hide gap-4 px-4"
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {weeks.map((weekIndex) => {
            const { isCurrentWeek, hasPhotos, isComplete } = getWeekStatus(weekIndex);
            const weekPhotos = getWeekPhotos(weekIndex);
            const isFocused = weekIndex === focusedWeekIndex;
            
            return (
              <motion.div
                key={weekIndex}
                data-week={weekIndex}
                className="flex-shrink-0"
                style={{ scrollSnapAlign: 'center' }}
                initial={false}
                animate={{ 
                  opacity: 1, 
                  scale: isFocused ? 1 : 0.9,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <CardCluster 
                  weekIndex={weekIndex}
                  photos={weekPhotos}
                  isActiveWeek={isCurrentWeek}
                  isExpanded={isFocused}
                  isPastWeekWithPhotos={false}
                  onTap={() => handleClusterTap(weekIndex)}
                  onCardTap={(dayIndex, photo) => handleCardTap(weekIndex, dayIndex, photo)}
                  onPlayReel={(weekPhotos) => handlePlayWeekRecap(weekPhotos, weekIndex)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Fixed Reel Progress Pill - positioned below cards, reduced spacing */}
      <AnimatePresence>
        {showReelPill && (
          <div className="w-full flex justify-center -mt-1 px-6">
            <ReelProgressPill
              weekNumber={completedWeeks}
              state={
                currentReel?.videoUrl 
                  ? 'complete' 
                  : reelProgress >= 90 
                    ? 'completing' 
                    : 'creating'
              }
              progress={reelProgress}
              onPlay={() => {
                // Navigate to reel page with the completed week photos
                const weekIndex = completedWeeks - 1;
                const startDay = weekIndex * 3 + 1;
                const weekPhotos = photos.filter(p => 
                  Number(p.dayNumber) >= startDay && Number(p.dayNumber) <= startDay + 2
                );
                
                if (weekPhotos.length >= 3) {
                  handlePlayWeekRecap(weekPhotos, weekIndex);
                }
              }}
              className="py-1.5"
            />
          </div>
        )}
      </AnimatePresence>

      {/* Upload Options Sheet */}
      <Sheet open={showUploadOptions} onOpenChange={setShowUploadOptions}>
        <SheetContent side="bottom" className="bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl">
          <div className="py-6 px-4">
            <h3 className="text-lg font-semibold text-white text-center mb-6">
              Add Photo
            </h3>
            <div className="flex justify-center gap-8">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUploadOptionSelect('camera')}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-white/70">Camera</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUploadOptionSelect('gallery')}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <ImageIcon className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-white/70">Gallery</span>
              </motion.button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Activity Selection Sheet */}
      <Sheet open={showActivitySheet} onOpenChange={setShowActivitySheet}>
        <SheetContent side="bottom" className="bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl">
          <div className="py-6 px-4">
            <h3 className="text-lg font-semibold text-white text-center mb-6">
              Select Activity
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {activities.map((activity) => (
                <motion.button
                  key={activity.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActivitySelect(activity.name)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <img 
                    src={activity.icon} 
                    alt={activity.name}
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-xs text-white/70">{activity.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
};

export default PhotoLoggingWidget;