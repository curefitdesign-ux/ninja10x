import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Sample logged photos for demo
const loggedPhotos = [
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
];

interface CardClusterProps {
  type: "logged" | "add" | "future";
  isCurrentWeek?: boolean;
  isExpanded?: boolean;
  weekIndex: number;
  onTap?: () => void;
}

const CardCluster = ({ type, isCurrentWeek = false, isExpanded = false, weekIndex, onTap }: CardClusterProps) => {
  const navigate = useNavigate();
  const baseCardWidth = 52;
  const baseCardHeight = 68;
  const borderRadius = 12;
  
  // Scale up for current week
  const scale = isCurrentWeek ? 1.3 : 1;
  const cardWidth = baseCardWidth * scale;
  const cardHeight = baseCardHeight * scale;
  
  // Shared translucent blurred card style
  const baseCardStyle = {
    width: cardWidth,
    height: cardHeight,
    borderRadius: borderRadius * scale,
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  };

  // Card positions for expanded state (3 cards spread out)
  const getExpandedPositions = (index: number) => {
    if (!isExpanded) return {};
    const offsets = [-65, 0, 65];
    return {
      left: `calc(50% + ${offsets[index]}px)`,
      transform: `translateX(-50%) rotate(0deg)`,
    };
  };

  // Card positions for stacked state
  const getStackedPositions = (index: number) => {
    const rotations = [-8, 6, -3];
    const xOffsets = [-4, 8, 0];
    const yOffsets = [0, 4, 8];
    const leftOffsets = [4, 12, 0];
    return {
      transform: `rotate(${rotations[index]}deg) translateX(${xOffsets[index]}px)`,
      top: yOffsets[index],
      left: leftOffsets[index],
    };
  };

  const renderCard = (index: number, zIndex: number, opacity: number) => {
    const stackedPos = getStackedPositions(index);
    const isActiveDay = isCurrentWeek && index === 2; // Front card of current week is active
    
    return (
      <motion.div
        key={index}
        className={`absolute rounded-xl overflow-hidden border shadow-lg ${
          isCurrentWeek ? 'border-white/40' : 'border-white/20'
        }`}
        style={{
          ...baseCardStyle,
          zIndex,
        }}
        initial={false}
        animate={
          isExpanded
            ? {
                left: `calc(50% + ${[-65, 0, 65][index]}px)`,
                top: 10,
                rotate: 0,
                x: "-50%",
                opacity: 1,
                scale: 1.1,
              }
            : {
                left: stackedPos.left,
                top: stackedPos.top,
                rotate: [-8, 6, -3][index],
                x: [-4, 8, 0][index],
                opacity: opacity,
                scale: 1,
              }
        }
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        {type === "logged" ? (
          <img 
            src={loggedPhotos[index]} 
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ opacity: opacity }}
          />
        ) : null}
        
        {/* Upload icon for active day card */}
        {isActiveDay && type === "add" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
              <Upload className="w-5 h-5 text-white/80" strokeWidth={2} />
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className="relative flex-shrink-0"
      style={{ 
        width: isExpanded ? 200 : cardWidth * 1.5,
        height: cardHeight * 1.3,
      }}
      animate={{
        scale: isCurrentWeek && !isExpanded ? 1 : 1,
        zIndex: isCurrentWeek ? 10 : 1,
      }}
    >
      {/* Glow effect for current week */}
      {isCurrentWeek && (
        <motion.div 
          className="absolute rounded-2xl blur-xl"
          style={{
            width: cardWidth * 1.8,
            height: cardHeight * 0.9,
            top: -16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 0,
            background: "rgba(255,255,255,0.12)",
          }}
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Render 3 cards */}
      {[0, 1, 2].map((index) => 
        renderCard(index, index + 1, [0.6, 0.7, 0.9][index])
      )}
    </motion.button>
  );
};

const PhotoLoggingWidget = () => {
  const [hasAnimatedInitial, setHasAnimatedInitial] = useState(false);
  const [currentWeekHighlighted, setCurrentWeekHighlighted] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  
  // Current week index (1 = second week, the "add" week)
  const currentWeekIndex = 1;
  
  // 4 clusters representing 4 weeks
  const clusters = [
    { type: "logged" as const, weekIndex: 0 },
    { type: "add" as const, weekIndex: 1 },
    { type: "future" as const, weekIndex: 2 },
    { type: "future" as const, weekIndex: 3 },
  ];
  
  // Animation sequence: show all cards, then highlight current week after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimatedInitial(true);
      setCurrentWeekHighlighted(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleClusterTap = (weekIndex: number) => {
    if (expandedWeek === weekIndex) {
      setExpandedWeek(null);
    } else {
      setExpandedWeek(weekIndex);
    }
  };
  
  return (
    <div className="relative w-full" style={{ height: 160 }}>
      {/* Timeline Path - SVG curved dashed line */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        <path
          d="M 20 60 Q 60 30, 120 50 Q 180 70, 240 45 Q 300 20, 360 50 Q 400 70, 420 55"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Cards Container - horizontal scroll */}
      <motion.div 
        className="relative flex items-center justify-center gap-3 px-4 py-4 overflow-x-auto scrollbar-hide h-full"
        animate={{
          gap: expandedWeek !== null ? 8 : 12,
        }}
      >
        <AnimatePresence>
          {clusters.map((cluster, idx) => {
            const isCurrentWeek = currentWeekHighlighted && idx === currentWeekIndex;
            const isExpanded = expandedWeek === idx;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: isCurrentWeek && !isExpanded ? 1.05 : 1,
                  x: isExpanded ? 0 : 0,
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: hasAnimatedInitial ? 0 : 0.1 * idx,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                layout
              >
                <CardCluster 
                  type={cluster.type} 
                  weekIndex={cluster.weekIndex}
                  isCurrentWeek={isCurrentWeek}
                  isExpanded={isExpanded}
                  onTap={() => handleClusterTap(idx)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PhotoLoggingWidget;
