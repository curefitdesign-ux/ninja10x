import { useEffect, useRef } from "react";
import curoMascot from "@/assets/activity-page/curo-mascot.png";

interface CircularProgressRingProps {
  currentDay: number; // 1-12
  currentWeek: number; // 1-4
  className?: string;
}

const CircularProgressRing = ({ currentDay = 1, currentWeek = 1, className = "" }: CircularProgressRingProps) => {
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
    
    // Draw 12 bars in 4 groups of 3 with liquid glass styling
    for (let week = 0; week < 4; week++) {
      // Calculate the start and end angles for this week's group background
      const weekStartAngle = currentAngle;
      const weekEndAngle = currentAngle + (barAngle * 3) + (barGap * 2);
      const isActiveWeek = week === activeWeekIndex;
      const midAngleWeek = toRad((weekStartAngle + weekEndAngle) / 2);
      
      // LIQUID GLASS PILL BACKGROUND - Layer 1: Outer blur/glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, toRad(weekStartAngle - 4), toRad(weekEndAngle + 4));
      ctx.lineCap = "round";
      ctx.lineWidth = strokeWidth + 20;
      const outerGlowColor = isActiveWeek 
        ? "rgba(57, 255, 133, 0.12)" 
        : "rgba(255, 255, 255, 0.06)";
      ctx.strokeStyle = outerGlowColor;
      ctx.filter = "blur(8px)";
      ctx.stroke();
      ctx.restore();
      
      // LIQUID GLASS PILL BACKGROUND - Layer 2: Glass body with gradient
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, toRad(weekStartAngle - 3), toRad(weekEndAngle + 3));
      ctx.lineCap = "round";
      ctx.lineWidth = strokeWidth + 16;
      
      // Create gradient for liquid glass effect
      const glassGradient = ctx.createLinearGradient(
        centerX + Math.cos(midAngleWeek - 0.5) * (ringRadius - 30),
        centerY + Math.sin(midAngleWeek - 0.5) * (ringRadius - 30),
        centerX + Math.cos(midAngleWeek + 0.5) * (ringRadius + 30),
        centerY + Math.sin(midAngleWeek + 0.5) * (ringRadius + 30)
      );
      
      if (isActiveWeek) {
        glassGradient.addColorStop(0, "rgba(57, 255, 133, 0.18)");
        glassGradient.addColorStop(0.3, "rgba(57, 255, 133, 0.08)");
        glassGradient.addColorStop(0.7, "rgba(57, 255, 133, 0.12)");
        glassGradient.addColorStop(1, "rgba(100, 255, 160, 0.15)");
      } else {
        glassGradient.addColorStop(0, "rgba(255, 255, 255, 0.14)");
        glassGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.06)");
        glassGradient.addColorStop(0.7, "rgba(255, 255, 255, 0.08)");
        glassGradient.addColorStop(1, "rgba(255, 255, 255, 0.12)");
      }
      
      ctx.strokeStyle = glassGradient;
      ctx.stroke();
      ctx.restore();
      
      // LIQUID GLASS PILL BACKGROUND - Layer 3: Inner highlight (top edge shine)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius - 6, toRad(weekStartAngle - 2), toRad(weekEndAngle + 2));
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      
      const innerShineGradient = ctx.createLinearGradient(
        centerX + Math.cos(toRad(weekStartAngle)) * ringRadius,
        centerY + Math.sin(toRad(weekStartAngle)) * ringRadius,
        centerX + Math.cos(toRad(weekEndAngle)) * ringRadius,
        centerY + Math.sin(toRad(weekEndAngle)) * ringRadius
      );
      innerShineGradient.addColorStop(0, "rgba(255, 255, 255, 0.25)");
      innerShineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
      innerShineGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");
      
      ctx.strokeStyle = innerShineGradient;
      ctx.stroke();
      ctx.restore();
      
      // LIQUID GLASS PILL BACKGROUND - Layer 4: Border/edge definition
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, toRad(weekStartAngle - 3), toRad(weekEndAngle + 3));
      ctx.lineCap = "round";
      ctx.lineWidth = strokeWidth + 16;
      ctx.strokeStyle = isActiveWeek 
        ? "rgba(57, 255, 133, 0.25)" 
        : "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      
      // Draw the 3 individual bars within this pill
      for (let bar = 0; bar < 3; bar++) {
        const barIndex = week * 3 + bar + 1; // 1-indexed
        const isActiveBar = barIndex <= activeBarCount;
        const barStart = currentAngle;
        const barEnd = currentAngle + barAngle;
        
        // Calculate mid angle for radial gradient
        const midAngle = toRad((barStart + barEnd) / 2);
        
        if (isActiveBar) {
          // Active bar outer glow
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
          ctx.lineCap = "round";
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = "rgba(57, 255, 133, 0.5)";
          ctx.shadowColor = "rgba(57, 255, 133, 0.8)";
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = Math.cos(midAngle) * 2;
          ctx.shadowOffsetY = Math.sin(midAngle) * 2;
          ctx.stroke();
          ctx.restore();
          
          // Active bar with liquid gradient
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
          ctx.lineCap = "round";
          ctx.lineWidth = strokeWidth;
          
          const perpAngle = midAngle;
          const innerRadius = ringRadius - strokeWidth / 2;
          const outerRadius = ringRadius + strokeWidth / 2;
          
          const barGradient = ctx.createLinearGradient(
            centerX + Math.cos(perpAngle) * innerRadius,
            centerY + Math.sin(perpAngle) * innerRadius,
            centerX + Math.cos(perpAngle) * outerRadius,
            centerY + Math.sin(perpAngle) * outerRadius
          );
          barGradient.addColorStop(0, "rgba(180, 255, 220, 1)");
          barGradient.addColorStop(0.4, "rgba(57, 255, 133, 1)");
          barGradient.addColorStop(1, "rgba(30, 200, 90, 0.95)");
          
          ctx.strokeStyle = barGradient;
          ctx.stroke();
          ctx.restore();
        } else {
          // Inactive bar - subtle grey with liquid glass feel
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
          ctx.lineCap = "round";
          ctx.lineWidth = strokeWidth;
          
          const inactiveGradient = ctx.createLinearGradient(
            centerX + Math.cos(midAngle) * (ringRadius - strokeWidth),
            centerY + Math.sin(midAngle) * (ringRadius - strokeWidth),
            centerX + Math.cos(midAngle) * (ringRadius + strokeWidth),
            centerY + Math.sin(midAngle) * (ringRadius + strokeWidth)
          );
          inactiveGradient.addColorStop(0, "rgba(200, 200, 210, 0.5)");
          inactiveGradient.addColorStop(0.5, "rgba(160, 160, 175, 0.4)");
          inactiveGradient.addColorStop(1, "rgba(180, 180, 195, 0.45)");
          
          ctx.strokeStyle = inactiveGradient;
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
  
  const dayInWeek = ((currentDay - 1) % 3) + 1;
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
        style={{ width: size, height: size }}
      />
      
      {/* Curved text */}
      <svg 
        className="absolute inset-0 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size }}
      >
        <defs>
          <path
            id="curvedTextPath"
            d={`M ${centerX - 68} ${centerY + 62}
                A ${ringRadius - 2} ${ringRadius - 2} 0 0 0 ${centerX + 68} ${centerY + 62}`}
            fill="none"
          />
        </defs>
        
        <text
          fill="rgba(255, 255, 255, 0.55)"
          fontSize="10"
          fontFamily="Inter, sans-serif"
          fontWeight="500"
          letterSpacing="1.2px"
        >
          <textPath
            href="#curvedTextPath"
            startOffset="50%"
            textAnchor="middle"
          >
            cult ninja  •  Week {currentWeek}  •  Day {dayInWeek}
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
      
      {/* Mascot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src={curoMascot} 
          alt="Curo mascot" 
          className="w-36 h-36 object-contain"
          style={{ 
            marginTop: '-6px',
            filter: 'drop-shadow(0 6px 16px rgba(139, 92, 246, 0.25))'
          }}
        />
      </div>
    </div>
  );
};

export default CircularProgressRing;
