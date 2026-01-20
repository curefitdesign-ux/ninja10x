import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
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

const CardCluster = ({ weekIndex, photos, isActiveWeek, isExpanded, onTap, onCardTap }: CardClusterProps) => {
  const baseCardWidth = 48;
  const baseCardHeight = 64;
  const borderRadius = 10;
  
  // Scale up for active week
  const scale = isActiveWeek ? 1.25 : 0.9;
  const cardWidth = baseCardWidth * scale;
  const cardHeight = baseCardHeight * scale;
  
  // Check if any photo is logged in this week
  const hasAnyPhoto = photos.some(p => p !== null);
  
  // Card positions for stacked state
  const getStackedPositions = (index: number) => {
    const rotations = [-6, 4, -2];
    const xOffsets = [-3, 6, 0];
    const yOffsets = [0, 3, 6];
    return {
      rotate: rotations[index],
      x: xOffsets[index],
      y: yOffsets[index],
    };
  };

  const renderCard = (index: number, zIndex: number, opacity: number) => {
    const photo = photos[index];
    const hasPhoto = photo !== null;
    const isActiveDay = isActiveWeek && !hasPhoto && index === photos.findIndex(p => p === null);
    const dayNumber = weekIndex * 3 + index + 1;
    
    // Calculate expanded position
    const expandedX = (index - 1) * (cardWidth + 8);
    
    const stackedPos = getStackedPositions(index);
    
    return (
      <motion.button
        key={index}
        className={`absolute rounded-xl overflow-hidden border shadow-lg ${
          hasPhoto 
            ? 'border-emerald-400/40' 
            : isActiveDay 
              ? 'border-white/30' 
              : 'border-white/15'
        }`}
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: borderRadius * scale,
          background: hasPhoto ? 'transparent' : 'rgba(255,255,255,0.06)',
          backdropFilter: hasPhoto ? 'none' : 'blur(12px)',
          zIndex,
        }}
        initial={false}
        animate={
          isExpanded
            ? {
                left: `calc(50% + ${expandedX}px)`,
                top: 8,
                rotate: 0,
                x: "-50%",
                y: 0,
                opacity: 1,
                scale: 1,
              }
            : {
                left: 10 + stackedPos.x,
                top: stackedPos.y,
                rotate: stackedPos.rotate,
                x: 0,
                y: 0,
                opacity: opacity,
                scale: 1,
              }
        }
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 24,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isExpanded) {
            onCardTap(index, photo);
          }
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Photo or empty state */}
        {hasPhoto ? (
          <>
            <img 
              src={photo.storageUrl} 
              alt={`Day ${dayNumber}`}
              className="w-full h-full object-cover"
            />
            {/* Green glow overlay for logged photos */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isActiveDay && isExpanded && (
              <motion.div 
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Upload className="w-4 h-4 text-white/70" strokeWidth={2} />
              </motion.div>
            )}
          </div>
        )}
        
        {/* Day number indicator */}
        {isExpanded && (
          <motion.div 
            className="absolute bottom-1 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <span className="text-[8px] text-white/50 font-medium">
              D{dayNumber}
            </span>
          </motion.div>
        )}
      </motion.button>
    );
  };

  return (
    <motion.button
      onClick={onTap}
      className="relative flex-shrink-0"
      style={{ 
        width: isExpanded ? (cardWidth * 3 + 32) : (cardWidth + 20),
        height: cardHeight + 24,
      }}
      animate={{
        zIndex: isActiveWeek ? 10 : 1,
      }}
      whileTap={{ scale: isExpanded ? 1 : 0.97 }}
    >
      {/* Glow effect for active week */}
      {isActiveWeek && (
        <motion.div 
          className="absolute rounded-2xl blur-xl"
          style={{
            width: isExpanded ? cardWidth * 3 + 40 : cardWidth * 1.6,
            height: cardHeight * 0.8,
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 0,
            background: hasAnyPhoto 
              ? "rgba(52, 211, 153, 0.15)" 
              : "rgba(255,255,255,0.08)",
          }}
          animate={{
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Week label */}
      <motion.div
        className="absolute -top-5 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-[9px] text-white/40 font-medium tracking-wide uppercase">
          Week {weekIndex + 1}
        </span>
      </motion.div>
      
      {/* Render 3 cards */}
      {[0, 1, 2].map((index) => 
        renderCard(index, index + 1, [0.5, 0.65, 0.85][index])
      )}
    </motion.button>
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
      const next = new Set(prev);
      if (next.has(weekIndex)) {
        // Don't collapse current week
        if (weekIndex === currentWeek - 1) return prev;
        next.delete(weekIndex);
      } else {
        next.add(weekIndex);
      }
      return next;
    });
  };

  const handleCardTap = (weekIndex: number, dayIndex: number, photo: LoggedPhoto | null) => {
    if (photo) {
      // Tap on existing photo - open preview/edit
      onPhotoTap?.(photo);
    } else {
      // Tap on empty card - start upload flow
      setPendingUpload({ weekIndex, dayIndex });
      setShowUploadOptions(true);
    }
  };

  const handleUploadOptionSelect = (option: 'camera' | 'gallery') => {
    setShowUploadOptions(false);
    if (option === 'camera') {
      // Open camera directly
      setShowActivitySheet(true);
    } else {
      // Open gallery then activity sheet
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
  
  // 4 clusters representing 4 weeks
  const weeks = [0, 1, 2, 3];
  
  return (
    <>
      <div className="relative w-full" style={{ height: 140 }}>
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
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Cards Container - horizontal scroll */}
        <motion.div 
          className="relative flex items-center justify-center gap-2 px-3 py-3 overflow-x-auto scrollbar-hide h-full"
          layout
        >
          <AnimatePresence mode="sync">
            {weeks.map((weekIndex) => {
              const { isActive, isCurrentWeek } = getWeekStatus(weekIndex);
              const isExpanded = expandedWeeks.has(weekIndex);
              const weekPhotos = getWeekPhotos(weekIndex);
              
              return (
                <motion.div
                  key={weekIndex}
                  initial={{ opacity: 0, y: 15, scale: 0.92 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: 1,
                  }}
                  transition={{ 
                    duration: 0.45, 
                    delay: 0.08 * weekIndex,
                    type: "spring",
                    stiffness: 220,
                    damping: 22,
                  }}
                  layout
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
          </AnimatePresence>
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