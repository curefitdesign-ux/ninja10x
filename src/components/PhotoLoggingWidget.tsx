import { motion, AnimatePresence } from "framer-motion";
import { Plus, Camera, Image as ImageIcon } from "lucide-react";
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
  onPhotoTap?: (photo: LoggedPhoto) => void;
  currentWeek?: number;
  currentDay?: number;
}

interface WeekCardProps {
  weekIndex: number;
  photos: (LoggedPhoto | null)[];
  isActiveWeek: boolean;
  isPastWeek: boolean;
  position: 'left' | 'center' | 'right' | 'far-right';
  onTap: () => void;
  onCardTap: (dayIndex: number, photo: LoggedPhoto | null) => void;
  isExpanded: boolean;
}

const WeekCard = ({ 
  weekIndex, 
  photos, 
  isActiveWeek, 
  isPastWeek,
  position, 
  onTap, 
  onCardTap,
  isExpanded 
}: WeekCardProps) => {
  // Size based on position - center is largest
  const getSize = () => {
    if (isExpanded) return { width: 200, height: 100 };
    switch (position) {
      case 'center': return { width: 100, height: 120 };
      case 'left': return { width: 72, height: 88 };
      case 'right': return { width: 68, height: 84 };
      case 'far-right': return { width: 56, height: 72 };
      default: return { width: 68, height: 84 };
    }
  };

  const { width, height } = getSize();
  const hasPhotos = photos.some(p => p !== null);
  const lastPhoto = [...photos].reverse().find(p => p !== null);
  const photosCount = photos.filter(p => p !== null).length;

  // Get position offset for centering active week
  const getPositionStyle = () => {
    if (isExpanded) {
      return { x: 0, scale: 1 };
    }
    switch (position) {
      case 'left': return { x: 0, scale: 1 };
      case 'center': return { x: 0, scale: 1 };
      case 'right': return { x: 0, scale: 1 };
      case 'far-right': return { x: 0, scale: 1 };
      default: return { x: 0, scale: 1 };
    }
  };

  const posStyle = getPositionStyle();

  // Expanded view - show 3 cards
  if (isExpanded) {
    const cardWidth = 56;
    const cardHeight = 72;
    const gap = 12;
    
    return (
      <motion.div
        className="relative flex items-center justify-center gap-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{ width: cardWidth * 3 + gap * 2 + 24, height: cardHeight + 32 }}
      >
        {/* Week label */}
        <motion.div
          className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-[10px] text-white/50 font-medium tracking-wide uppercase">
            Week {weekIndex + 1}
          </span>
        </motion.div>

        {[0, 1, 2].map((dayIdx) => {
          const photo = photos[dayIdx];
          const hasPhoto = photo !== null;
          const dayNumber = weekIndex * 3 + dayIdx + 1;
          const isNextToFill = !hasPhoto && photos.slice(0, dayIdx).every(p => p !== null) && 
            (dayIdx === 0 || photos[dayIdx - 1] !== null);

          return (
            <motion.button
              key={dayIdx}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: dayIdx * 0.08, type: "spring", stiffness: 300 }}
              onClick={(e) => {
                e.stopPropagation();
                onCardTap(dayIdx, photo);
              }}
              className={`relative rounded-xl overflow-hidden border shadow-lg ${
                hasPhoto 
                  ? 'border-emerald-400/30' 
                  : isNextToFill
                    ? 'border-emerald-400/40'
                    : 'border-white/15'
              }`}
              style={{
                width: cardWidth,
                height: cardHeight,
                background: hasPhoto ? 'transparent' : 'rgba(255,255,255,0.06)',
                backdropFilter: hasPhoto ? 'none' : 'blur(8px)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              {hasPhoto ? (
                <>
                  <img 
                    src={photo.storageUrl} 
                    alt={`Day ${dayNumber}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </>
              ) : isNextToFill ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white/30" strokeWidth={2} />
                </div>
              )}
              
              {/* Day indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                <span className="text-[8px] text-white/60 font-medium">D{dayNumber}</span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    );
  }

  // Collapsed week card view
  return (
    <motion.button
      onClick={onTap}
      className="relative flex-shrink-0"
      style={{ width, height }}
      animate={posStyle}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Glow effect for active week */}
      {isActiveWeek && (
        <motion.div 
          className="absolute -inset-3 rounded-3xl blur-xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(59, 130, 246, 0.15))",
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Main card */}
      <motion.div
        className={`relative w-full h-full rounded-2xl overflow-hidden border ${
          isActiveWeek 
            ? 'border-emerald-400/30 bg-gradient-to-br from-white/10 to-white/5' 
            : isPastWeek && hasPhotos
              ? 'border-white/20'
              : 'border-white/10 bg-white/5'
        }`}
        style={{
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Show last photo for past weeks with photos */}
        {isPastWeek && lastPhoto ? (
          <>
            <img 
              src={lastPhoto.storageUrl} 
              alt={`Week ${weekIndex + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {/* Photo count badge */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
              <span className="text-[9px] text-white/80 font-medium">{photosCount}/3</span>
            </div>
          </>
        ) : (
          /* Plus icon for active/future weeks */
          <div className="absolute inset-0 flex items-center justify-center">
            {isActiveWeek ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Plus className="w-10 h-10 text-emerald-400" strokeWidth={2} />
              </motion.div>
            ) : (
              <Plus className="w-6 h-6 text-white/40" strokeWidth={2} />
            )}
          </div>
        )}
        
        {/* Week label at bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <span className={`text-[9px] font-medium ${
            isActiveWeek ? 'text-emerald-300/80' : 'text-white/40'
          }`}>
            W{weekIndex + 1}
          </span>
        </div>
      </motion.div>
    </motion.button>
  );
};

const PhotoLoggingWidget = ({ 
  photos = [], 
  onPhotoTap,
  currentWeek = 1,
  currentDay = 1,
}: PhotoLoggingWidgetProps) => {
  const navigate = useNavigate();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get photos for each week (3 photos per week)
  const getWeekPhotos = useCallback((weekIndex: number): (LoggedPhoto | null)[] => {
    const startDay = weekIndex * 3 + 1;
    return [0, 1, 2].map(dayOffset => {
      const dayNumber = startDay + dayOffset;
      return photos.find(p => p.dayNumber === dayNumber) || null;
    });
  }, [photos]);

  // Determine card positions relative to active week
  const getCardPosition = (weekIndex: number): 'left' | 'center' | 'right' | 'far-right' => {
    const activeWeekIndex = currentWeek - 1;
    const diff = weekIndex - activeWeekIndex;
    
    if (diff < 0) return 'left';
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    return 'far-right';
  };

  const handleWeekTap = (weekIndex: number) => {
    if (expandedWeek === weekIndex) {
      setExpandedWeek(null);
    } else {
      setExpandedWeek(weekIndex);
    }
  };

  const handleCardTap = (weekIndex: number, dayIndex: number, photo: LoggedPhoto | null) => {
    if (photo) {
      onPhotoTap?.(photo);
    } else {
      setPendingUpload({ weekIndex, dayIndex });
      setShowUploadOptions(true);
    }
  };

  const handleUploadOptionSelect = (option: 'camera' | 'gallery') => {
    setShowUploadOptions(false);
    setShowActivitySheet(true);
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
    setExpandedWeek(null);
  };
  
  // 4 weeks
  const weeks = [0, 1, 2, 3];
  const activeWeekIndex = currentWeek - 1;

  // Reorder weeks so active week renders last (on top)
  const orderedWeeks = [...weeks].sort((a, b) => {
    if (a === activeWeekIndex) return 1;
    if (b === activeWeekIndex) return -1;
    return a - b;
  });
  
  return (
    <>
      <div className="relative w-full" style={{ height: 160 }}>
        {/* Timeline Path - SVG curved dashed line */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 400 120"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible" }}
        >
          <path
            d="M -10 70 Q 40 40, 100 60 Q 160 80, 200 55 Q 240 30, 300 55 Q 360 80, 420 55"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Cards Container - centered layout */}
        <div 
          ref={containerRef}
          className="relative flex items-center justify-center h-full px-4 z-10"
        >
          <AnimatePresence mode="sync">
            {expandedWeek !== null ? (
              /* Expanded view - single week */
              <WeekCard
                key={`expanded-${expandedWeek}`}
                weekIndex={expandedWeek}
                photos={getWeekPhotos(expandedWeek)}
                isActiveWeek={expandedWeek === activeWeekIndex}
                isPastWeek={expandedWeek < activeWeekIndex}
                position="center"
                isExpanded={true}
                onTap={() => setExpandedWeek(null)}
                onCardTap={(dayIdx, photo) => handleCardTap(expandedWeek, dayIdx, photo)}
              />
            ) : (
              /* Collapsed view - all weeks with active centered */
              <motion.div 
                className="flex items-center justify-center gap-3"
                initial={false}
                layout
              >
                {orderedWeeks.map((weekIndex) => {
                  const position = getCardPosition(weekIndex);
                  const weekPhotos = getWeekPhotos(weekIndex);
                  const isActive = weekIndex === activeWeekIndex;
                  const isPast = weekIndex < activeWeekIndex;
                  
                  return (
                    <motion.div
                      key={weekIndex}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        zIndex: isActive ? 10 : weekIndex,
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 280, 
                        damping: 26,
                        delay: weekIndex * 0.05,
                      }}
                      style={{
                        order: position === 'left' ? 0 : position === 'center' ? 1 : position === 'right' ? 2 : 3,
                      }}
                    >
                      <WeekCard
                        weekIndex={weekIndex}
                        photos={weekPhotos}
                        isActiveWeek={isActive}
                        isPastWeek={isPast}
                        position={position}
                        isExpanded={false}
                        onTap={() => handleWeekTap(weekIndex)}
                        onCardTap={(dayIdx, photo) => handleCardTap(weekIndex, dayIdx, photo)}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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