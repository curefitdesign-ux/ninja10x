import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import curoMascot from "@/assets/activity-page/curo-mascot.png";

interface CircularProgressRingProps {
  currentDay: number; // 0-12 (0 = no photos uploaded yet)
  currentWeek: number; // 1-4
  className?: string;
  highlight?: boolean; // Trigger focus animation
  mascotSrc?: string;
  mascotAlt?: string;
  onMascotTap?: () => void;
}

const CircularProgressRing = ({
  currentDay = 0,
  currentWeek = 1,
  className = "",
  highlight = false,
  mascotSrc,
  mascotAlt,
  onMascotTap,
}: CircularProgressRingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 240;
  const centerX = size / 2;
  const centerY = size / 2;
  const ringRadius = 95;
  const strokeWidth = 12; // Reduced thickness
  
  // 12 bars total, 3 bars per week = 4 weeks
  // Arc spans from ~7 o'clock (210°) going clockwise around
  const barAngle = 5.5; // Reduced bar length
  const barGap = 10; // Gap between bars within a week
  const weekGap = 25; // Gap between week groups
  
  // Start position - rotated 5% clockwise (18°) from previous position
  const startAngleDeg = 157;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, size, size);
    
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    
    let currentAngle = startAngleDeg;
    
    // Calculate which bars are "active" based on currentDay (1-12)
    // Bars fill sequentially left to right (clockwise)
    const activeBarCount = currentDay;
    
    // Determine which week is active (1-indexed)
    const activeWeekIndex = currentWeek - 1;
    
    // Draw 12 bars in 4 groups of 3
    for (let week = 0; week < 4; week++) {
      // Calculate the start and end angles for this week's group background
      const weekStartAngle = currentAngle;
      const weekEndAngle = currentAngle + (barAngle * 3) + (barGap * 2);
      const isActiveWeek = week === activeWeekIndex;
      
      // Draw translucent liquid glass background behind each group of 3 bars
      // Simple glass layer without glow effects
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, toRad(weekStartAngle - 2), toRad(weekEndAngle + 2));
      ctx.lineCap = "round";
      ctx.lineWidth = strokeWidth + 10;
      
      // Create gradient for liquid glass effect
      const midAngleWeek = toRad((weekStartAngle + weekEndAngle) / 2);
      const glassGradient = ctx.createLinearGradient(
        centerX + Math.cos(midAngleWeek) * (ringRadius - 25),
        centerY + Math.sin(midAngleWeek) * (ringRadius - 25),
        centerX + Math.cos(midAngleWeek) * (ringRadius + 25),
        centerY + Math.sin(midAngleWeek) * (ringRadius + 25)
      );
      
      if (isActiveWeek) {
        glassGradient.addColorStop(0, "rgba(15, 228, 152, 0.15)");
        glassGradient.addColorStop(0.5, "rgba(0, 190, 255, 0.06)");
        glassGradient.addColorStop(1, "rgba(0, 190, 255, 0.10)");
      } else {
        // Inactive weeks: frosted glass effect
        glassGradient.addColorStop(0, "rgba(255, 255, 255, 0.12)");
        glassGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
        glassGradient.addColorStop(1, "rgba(255, 255, 255, 0.08)");
      }
      
      ctx.strokeStyle = glassGradient;
      ctx.stroke();
      ctx.restore();
      
      for (let bar = 0; bar < 3; bar++) {
        const barIndex = week * 3 + bar + 1; // 1-indexed
        const isActiveBar = barIndex <= activeBarCount;
        const barStart = currentAngle;
        const barEnd = currentAngle + barAngle;
        
        // Calculate mid angle for radial gradient
        const midAngle = toRad((barStart + barEnd) / 2);
        
        if (isActiveBar) {
          // Draw outer glow layer first
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
          ctx.lineCap = "round";
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = "rgba(15, 228, 152, 0.4)";
          ctx.shadowColor = "rgba(0, 190, 255, 0.6)";
          ctx.shadowBlur = 18;
          ctx.shadowOffsetX = Math.cos(midAngle) * 2;
          ctx.shadowOffsetY = Math.sin(midAngle) * 2;
          ctx.stroke();
          ctx.restore();
          
          // Draw main active bar with gradient #0FE498 → #00BEFF
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
          ctx.lineCap = "round";
          ctx.lineWidth = strokeWidth;
          
          // Calculate progress ratio for this bar (0-1 across all 12 bars)
          const progressRatio = (barIndex - 1) / 11;
          
          // Interpolate between #0FE498 and #00BEFF based on bar position
          const r = Math.round(15 + (0 - 15) * progressRatio);
          const g = Math.round(228 + (190 - 228) * progressRatio);
          const b = Math.round(152 + (255 - 152) * progressRatio);
          
          const innerRadius = ringRadius - strokeWidth / 2;
          const outerRadius = ringRadius + strokeWidth / 2;
          const perpAngle = midAngle;
          const gradient = ctx.createLinearGradient(
            centerX + Math.cos(perpAngle) * innerRadius,
            centerY + Math.sin(perpAngle) * innerRadius,
            centerX + Math.cos(perpAngle) * outerRadius,
            centerY + Math.sin(perpAngle) * outerRadius
          );
          gradient.addColorStop(0, `rgba(${Math.min(r + 80, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)}, 1)`);
          gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 1)`);
          gradient.addColorStop(1, `rgba(${Math.max(r - 10, 0)}, ${Math.max(g - 20, 0)}, ${b}, 0.9)`);
          
          ctx.strokeStyle = gradient;
          ctx.stroke();
          ctx.restore();
        } else {
          // Inactive bar - white
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
          ctx.lineCap = "round";
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.stroke();
          ctx.restore();
        }
        
        // Move to next bar position
        currentAngle = barEnd + barGap;
      }
      
      // Add week gap after each week (except last)
      if (week < 3) {
        currentAngle += (weekGap - barGap);
      }
    }
    
  }, [currentDay, currentWeek]);
  
  const dayInWeek = currentDay === 0 ? 0 : ((currentDay - 1) % 3) + 1;
  
  // Contextual journey text - always includes CULT NINJA
  const getJourneyText = () => {
    if (currentDay === 0) {
      return "CULT NINJA • START JOURNEY";
    }
    
    return `CULT NINJA • WEEK ${currentWeek} • DAY ${dayInWeek}`;
  };
  
  const journeyText = getJourneyText();
  
  return (
    <motion.div 
      className={`relative ${className}`} 
      style={{ width: size, height: size }}
      animate={highlight ? {
        scale: [1, 1.05, 1],
        filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
      } : {}}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Highlight glow effect */}
      <AnimatePresence>
        {highlight && (
          <motion.div
            className="absolute inset-[-20px] rounded-full pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'radial-gradient(circle, rgba(15, 228, 152, 0.3) 0%, rgba(0, 190, 255, 0.1) 40%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>
      
      <canvas
        ref={canvasRef} 
        className="absolute inset-0"
        style={{ width: size, height: size }}
      />
      
      {/* Curved text - contextual journey progress */}
      <svg 
        className="absolute inset-0 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size, overflow: 'visible' }}
      >
        <defs>
          {/* Curve path that follows the ring - positioned at the bottom arc */}
          <path
            id="curvedTextPath"
            d={`M ${centerX - 75} ${centerY + 60}
                A ${ringRadius - 10} ${ringRadius - 10} 0 0 0 ${centerX + 75} ${centerY + 60}`}
            fill="none"
          />
        </defs>
        
        {/* Contextual journey text */}
        <text
          fill="rgba(255, 255, 255, 0.6)"
          fontSize="8"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
          letterSpacing="1.5px"
        >
          <textPath
            href="#curvedTextPath"
            startOffset="50%"
            textAnchor="middle"
          >
            {journeyText}
          </textPath>
        </text>
      </svg>
      
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-2.5 h-1.5 rounded-sm bg-cyan-400/80" style={{ top: '28%', left: '40%', transform: 'rotate(45deg)' }} />
        <div className="absolute w-1.5 h-2.5 rounded-sm bg-cyan-300/70" style={{ top: '32%', right: '38%', transform: 'rotate(-30deg)' }} />
        <div className="absolute w-2 h-1 rounded-sm bg-teal-400/75" style={{ top: '26%', left: '50%', transform: 'rotate(15deg)' }} />
        <div className="absolute w-1 h-2 rounded-sm bg-cyan-400/65" style={{ top: '40%', left: '35%', transform: 'rotate(-60deg)' }} />
        <div className="absolute w-1.5 h-1 rounded-sm bg-teal-300/70" style={{ top: '44%', right: '34%', transform: 'rotate(75deg)' }} />
        <div className="absolute w-1 h-1.5 rounded-sm bg-cyan-400/60" style={{ top: '55%', left: '33%', transform: 'rotate(20deg)' }} />
        <div className="absolute w-1.5 h-1 rounded-sm bg-teal-400/65" style={{ top: '54%', right: '35%', transform: 'rotate(-45deg)' }} />
      </div>
      
      {/* Inner circle - fully tappable to open gallery */}
      <motion.button
        className="absolute flex items-center justify-center cursor-pointer rounded-full"
        style={{
          top: '50%',
          left: '50%',
          width: ringRadius * 2 - strokeWidth * 2 - 8,
          height: ringRadius * 2 - strokeWidth * 2 - 8,
          transform: 'translate(-50%, -50%)',
        }}
        onClick={onMascotTap}
        whileTap={{ scale: 0.95 }}
      >
        <img 
          src={mascotSrc || curoMascot} 
          alt={mascotAlt || "Curo mascot"} 
          className="w-36 h-36 object-contain pointer-events-none"
          style={{ 
            marginTop: '-6px',
            filter: 'drop-shadow(0 6px 16px rgba(139, 92, 246, 0.25))'
          }}
        />
      </motion.button>
    </motion.div>
  );
};

export default CircularProgressRing;
