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
  const strokeWidth = 16;
  
  // 12 bars total, 3 bars per week = 4 weeks
  // Arc spans ~280 degrees, leaving space for text at bottom
  const totalArcDegrees = 280;
  const totalBars = 12;
  const barsPerWeek = 3;
  const barAngle = 8; // Shorter bar length
  const barGap = 4; // Small gap between bars within a week
  const weekGap = 18; // Large gap between week groups
  
  // Start from left side
  const startAngleDeg = 140;
  
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
    
    // Draw 12 bars in 4 groups of 3
    for (let week = 0; week < 4; week++) {
      const isActiveWeek = week === currentWeek - 1;
      
      for (let bar = 0; bar < 3; bar++) {
        const barIndex = week * 3 + bar;
        const barStart = currentAngle;
        const barEnd = currentAngle + barAngle;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
        ctx.lineCap = "round";
        ctx.lineWidth = strokeWidth;
        
        if (isActiveWeek) {
          // Active week - glassmorphic green with glow
          const gradient = ctx.createLinearGradient(
            centerX + ringRadius * Math.cos(toRad(barStart)),
            centerY + ringRadius * Math.sin(toRad(barStart)),
            centerX + ringRadius * Math.cos(toRad(barEnd)),
            centerY + ringRadius * Math.sin(toRad(barEnd))
          );
          gradient.addColorStop(0, "rgba(57, 255, 133, 0.3)");
          gradient.addColorStop(0.5, "rgba(100, 255, 160, 0.5)");
          gradient.addColorStop(1, "rgba(57, 255, 133, 0.3)");
          
          ctx.strokeStyle = gradient;
          ctx.shadowColor = "rgba(57, 255, 133, 0.5)";
          ctx.shadowBlur = 12;
        } else {
          // Inactive weeks - grey
          ctx.strokeStyle = "rgba(180, 180, 190, 0.45)";
          ctx.shadowBlur = 0;
        }
        
        ctx.stroke();
        ctx.restore();
        
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
            d={`M ${centerX - 80} ${centerY + 38}
                A 85 85 0 0 0 ${centerX + 80} ${centerY + 38}`}
            fill="none"
          />
        </defs>
        
        <text
          fill="rgba(255, 255, 255, 0.55)"
          fontSize="11"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="400"
          letterSpacing="1.5px"
          fontStyle="italic"
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
