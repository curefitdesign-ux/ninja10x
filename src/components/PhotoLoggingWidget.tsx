import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  isVideo?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  dayNumber: number;
}

interface PhotoLoggingWidgetProps {
  photos?: LoggedPhoto[];
  onPhotoAdd?: (weekIndex: number, dayIndex: number) => void;
  onPhotoTap?: (photo: LoggedPhoto) => void;
  currentWeek?: number;
  currentDay?: number;
}

interface CardClusterProps {
  weekIndex: number;
  photos: (LoggedPhoto | null)[];
  isActiveWeek: boolean;
  isExpanded: boolean;
  onTap: () => void;
  onCardTap: (dayIndex: number, photo: LoggedPhoto | null) => void;
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

const CardCluster = ({ weekIndex, photos, isActiveWeek, isExpanded, onTap, onCardTap }: CardClusterProps) => {
  const baseCardWidth = 52;
  const baseCardHeight = 70;
  const borderRadius = 12;
  
  // Scale based on state - larger for expanded, smaller when other week is expanded
  const scale = isExpanded ? 1.55 : 0.8;
  const cardWidth = baseCardWidth * scale;
  const cardHeight = baseCardHeight * scale;
  
  // Check if any photo is logged in this week
  const hasAnyPhoto = photos.some(p => p !== null);
  
  // Card positions for stacked state - tighter stack with subtle rotation
  const getStackedPositions = (index: number) => {
    const rotations = [-6, 4, -2];
    const xOffsets = [-3, 6, 0];
    const yOffsets = [1, 4, 7];
    return {
      rotate: rotations[index],
      x: xOffsets[index],
      y: yOffsets[index],
    };
  };

  const handleCardClick = (e: React.MouseEvent, index: number, photo: LoggedPhoto | null) => {
    e.stopPropagation();
    if (!isExpanded) {
      // If not expanded, expand the cluster
      onTap();
    } else {
      // If expanded, handle individual card tap
      onCardTap(index, photo);
    }
  };

  const renderCard = (index: number, zIndex: number, opacity: number) => {
    const photo = photos[index];
    const hasPhoto = photo !== null;
    const isActiveDay = isActiveWeek && !hasPhoto && index === photos.findIndex(p => p === null);
    const dayNumber = weekIndex * 3 + index + 1;
    
    // Expanded position - fan out from center with more spacing
    const expandedX = (index - 1) * (cardWidth + 20);
    
    const stackedPos = getStackedPositions(index);
    
    // Minimal stagger for snappy fan-out/collapse
    const staggerDelay = isExpanded ? index * 0.02 : (2 - index) * 0.015;
    
    return (
      <motion.button
        key={index}
        className={`absolute rounded-xl overflow-hidden border shadow-lg ${
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
          background: hasPhoto ? 'transparent' : isActiveDay ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.06)',
          backdropFilter: hasPhoto ? 'none' : 'blur(16px)',
          zIndex,
          willChange: 'transform, opacity',
        }}
        initial={false}
        animate={
          isExpanded
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
                opacity: opacity,
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
        {/* Photo or empty state */}
        {hasPhoto ? (
          <>
            <img 
              src={photo.storageUrl} 
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide broken images
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Green glow overlay for logged photos */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/25 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isActiveDay && isExpanded && (
              <motion.div 
                className="p-3 rounded-full bg-emerald-500/20 backdrop-blur-sm"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ 
                  delay: 0.15, 
                  ...fastSpring,
                }}
              >
                <Upload className="w-6 h-6 text-emerald-400" strokeWidth={2.5} />
              </motion.div>
            )}
          </div>
        )}
        
        {/* Day number indicator */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="absolute bottom-2 left-1/2"
              initial={{ opacity: 0, y: 6, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 4, x: "-50%" }}
              transition={{ delay: 0.1 + index * 0.03, duration: 0.2 }}
            >
              <span className={`text-xs font-medium ${isActiveDay ? 'text-emerald-400' : 'text-white/50'}`}>
                D{dayNumber}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  // Calculate container width based on expanded state
  const containerWidth = isExpanded ? (cardWidth * 3 + 60) : (baseCardWidth * 0.8 + 16);
  const containerHeight = cardHeight + 24;

  return (
    <motion.div
      onClick={onTap}
      className="relative flex-shrink-0 cursor-pointer"
      style={{ 
        height: containerHeight,
        willChange: 'transform, width',
      }}
      initial={false}
      animate={{
        width: containerWidth,
        zIndex: isExpanded ? 10 : 1,
        scale: isExpanded ? 1 : 0.94,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
    >
      {/* Glow effect for active/expanded week */}
      <AnimatePresence>
        {isExpanded && (
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
      
      {/* Render 3 cards */}
      {[0, 1, 2].map((index) => 
        renderCard(index, index + 1, [0.5, 0.7, 0.9][index])
      )}
    </motion.div>
  );
};

const PhotoLoggingWidget = ({ 
  photos = [], 
  onPhotoAdd,
  onPhotoTap,
  currentWeek = 1,
  currentDay = 1,
}: PhotoLoggingWidgetProps) => {
  const navigate = useNavigate();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  
  // Auto-expand active week on mount and when it changes
  useEffect(() => {
    const activeWeekIndex = currentWeek - 1;
    setExpandedWeeks(new Set([activeWeekIndex]));
  }, [currentWeek]);

  // Get photos for each week (3 photos per week)
  const getWeekPhotos = useCallback((weekIndex: number): (LoggedPhoto | null)[] => {
    const startDay = weekIndex * 3 + 1;
    return [0, 1, 2].map(dayOffset => {
      const dayNumber = startDay + dayOffset;
      return photos.find(p => p.dayNumber === dayNumber) || null;
    });
  }, [photos]);

  // Determine which weeks are active (have photos or are current)
  const getWeekStatus = useCallback((weekIndex: number) => {
    const weekPhotos = getWeekPhotos(weekIndex);
    const hasPhotos = weekPhotos.some(p => p !== null);
    const isCurrentWeek = weekIndex === currentWeek - 1;
    return { hasPhotos, isCurrentWeek, isActive: hasPhotos || isCurrentWeek };
  }, [getWeekPhotos, currentWeek]);

  const handleClusterTap = (weekIndex: number) => {
    setExpandedWeeks(prev => {
      // If tapping the already expanded week that's also current, don't collapse
      if (prev.has(weekIndex) && weekIndex === currentWeek - 1) {
        return prev;
      }
      // Expand only the tapped week, collapse all others
      return new Set([weekIndex]);
    });
  };

  const handleCardTap = (weekIndex: number, dayIndex: number, photo: LoggedPhoto | null) => {
    const dayNumber = weekIndex * 3 + dayIndex + 1;
    const isActiveDay = dayNumber === currentDay;
    
    if (photo) {
      // Tap on existing photo (including active day with photo) - open preview/edit
      onPhotoTap?.(photo);
    } else if (isActiveDay && photos.find(p => p.dayNumber === dayNumber)) {
      // Active day already has a photo - open it for editing instead of creating new
      const existingPhoto = photos.find(p => p.dayNumber === dayNumber);
      if (existingPhoto) {
        onPhotoTap?.(existingPhoto);
      }
    } else {
      // Tap on empty card - use parent's camera flow if callback provided
      if (onPhotoAdd) {
        onPhotoAdd(weekIndex, dayIndex);
      } else {
        // Fallback to internal flow
        setPendingUpload({ weekIndex, dayIndex });
        setShowUploadOptions(true);
      }
    }
  };

  const handleUploadOptionSelect = (option: 'camera' | 'gallery') => {
    setShowUploadOptions(false);
    if (option === 'camera') {
      setShowActivitySheet(true);
    } else {
      setShowActivitySheet(true);
    }
  };

  const handleActivitySelect = (activity: string) => {
    setShowActivitySheet(false);
    if (pendingUpload) {
      const dayNumber = pendingUpload.weekIndex * 3 + pendingUpload.dayIndex + 1;
      navigate('/preview', {
        state: {
          openCameraWithActivity: activity,
          dayNumber,
          instantCamera: true,
        }
      });
    }
    setPendingUpload(null);
  };
  
  // 4 clusters representing 4 weeks (fixed order, no shuffling)
  const weeks = [0, 1, 2, 3];
  const activeWeekIndex = currentWeek - 1;
  
  // Calculate drag constraints based on content width
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  
  useEffect(() => {
    const updateConstraints = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const scrollWidth = containerRef.current.scrollWidth;
        const maxDrag = Math.max(0, scrollWidth - containerWidth + 32);
        setDragConstraints({ left: -maxDrag, right: 0 });
      }
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, [expandedWeeks]);

  return (
    <>
      <div className="relative w-full overflow-hidden" style={{ height: 160 }} ref={containerRef}>
        {/* Timeline Path - SVG curved dashed line */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
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
        
        {/* Cards Container - drag to scroll */}
        <motion.div 
          className="relative flex items-center gap-3 px-4 py-4 h-full cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          dragMomentum={true}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
        >
          {weeks.map((weekIndex) => {
            const { isCurrentWeek } = getWeekStatus(weekIndex);
            const isExpanded = expandedWeeks.has(weekIndex);
            const weekPhotos = getWeekPhotos(weekIndex);
            
            // Context-aware: other weeks scale down when one expands
            const anyOtherExpanded = Array.from(expandedWeeks).some(w => w !== weekIndex);
            const contextScale = isExpanded ? 1 : (anyOtherExpanded ? 0.92 : 1);
            
            return (
              <motion.div
                key={weekIndex}
                initial={false}
                animate={{ 
                  opacity: 1, 
                  scale: contextScale,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="flex-shrink-0"
              >
                  <CardCluster 
                    weekIndex={weekIndex}
                    photos={weekPhotos}
                    isActiveWeek={isCurrentWeek}
                    isExpanded={isExpanded}
                    onTap={() => handleClusterTap(weekIndex)}
                    onCardTap={(dayIndex, photo) => handleCardTap(weekIndex, dayIndex, photo)}
                  />
                </motion.div>
              );
            })}
        </motion.div>
      </div>

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