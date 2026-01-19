import { useEffect, useRef } from "react";
import curoMascot from "@/assets/activity-page/curo-mascot.png";

interface CircularProgressRingProps {
  currentDay: number; // 1-12
  currentWeek: number; // 1-4
  className?: string;
}

const CircularProgressRing = ({ currentDay = 1, currentWeek = 1, className = "" }: CircularProgressRingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 280;
  const centerX = size / 2;
  const centerY = size / 2;
  const ringRadius = 110;
  const strokeWidth = 22;
  
  // 12 days total, 3 days per week = 4 weeks
  // Ring starts at bottom-left, goes clockwise, ends at bottom-right
  // Bottom ~90 degrees reserved for text
  const totalArcDegrees = 270; // Arc spans 270 degrees (leaving 90 for text at bottom)
  const weekArcDegrees = totalArcDegrees / 4; // Each week segment = 67.5 degrees
  
  // Start angle: bottom-left (225 degrees from 3 o'clock position)
  const startAngleDeg = 135; // Start from left side going down
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size for retina
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Convert degrees to radians
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    
    // Draw background grey ring (continuous, full arc)
    ctx.beginPath();
    ctx.arc(
      centerX, 
      centerY, 
      ringRadius, 
      toRad(startAngleDeg), 
      toRad(startAngleDeg + totalArcDegrees)
    );
    ctx.lineCap = "round";
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = "rgba(180, 180, 190, 0.5)";
    ctx.stroke();
    
    // Calculate active week segment position
    // Week 1 starts at the beginning (left side)
    const weekStartAngle = startAngleDeg + (currentWeek - 1) * weekArcDegrees;
    const weekEndAngle = weekStartAngle + weekArcDegrees;
    
    // Draw glassmorphic active week segment
    // First, draw the glow/shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      centerX, 
      centerY, 
      ringRadius, 
      toRad(weekStartAngle + 2), 
      toRad(weekEndAngle - 2)
    );
    ctx.lineCap = "round";
    ctx.lineWidth = strokeWidth + 4;
    ctx.strokeStyle = "rgba(57, 255, 133, 0.15)";
    ctx.shadowColor = "rgba(57, 255, 133, 0.4)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.stroke();
    ctx.restore();
    
    // Draw inner glow layer
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      centerX, 
      centerY, 
      ringRadius, 
      toRad(weekStartAngle + 2), 
      toRad(weekEndAngle - 2)
    );
    ctx.lineCap = "round";
    ctx.lineWidth = strokeWidth;
    
    // Create gradient for glassmorphic effect
    const gradientStartX = centerX + ringRadius * Math.cos(toRad(weekStartAngle));
    const gradientStartY = centerY + ringRadius * Math.sin(toRad(weekStartAngle));
    const gradientEndX = centerX + ringRadius * Math.cos(toRad(weekEndAngle));
    const gradientEndY = centerY + ringRadius * Math.sin(toRad(weekEndAngle));
    
    const gradient = ctx.createLinearGradient(
      gradientStartX, gradientStartY,
      gradientEndX, gradientEndY
    );
    gradient.addColorStop(0, "rgba(57, 255, 133, 0.25)");
    gradient.addColorStop(0.3, "rgba(100, 255, 160, 0.45)");
    gradient.addColorStop(0.5, "rgba(57, 255, 133, 0.55)");
    gradient.addColorStop(0.7, "rgba(100, 255, 160, 0.45)");
    gradient.addColorStop(1, "rgba(57, 255, 133, 0.25)");
    
    ctx.strokeStyle = gradient;
    ctx.shadowColor = "rgba(57, 255, 133, 0.5)";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();
    
    // Draw highlight edge on inner side for glass effect
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      centerX, 
      centerY, 
      ringRadius - strokeWidth / 3, 
      toRad(weekStartAngle + 5), 
      toRad(weekEndAngle - 5)
    );
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.stroke();
    ctx.restore();
    
  }, [currentDay, currentWeek]);
  
  // Calculate day in current week for display
  const dayInWeek = ((currentDay - 1) % 3) + 1;
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Canvas for progress ring */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
        style={{ width: size, height: size }}
      />
      
      {/* SVG for curved text */}
      <svg 
        className="absolute inset-0 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size }}
      >
        <defs>
          {/* Path for curved text at bottom - follows the ring */}
          <path
            id="curvedTextPath"
            d={`M ${centerX - 95} ${centerY + 45}
                A 100 100 0 0 0 ${centerX + 95} ${centerY + 45}`}
            fill="none"
          />
        </defs>
        
        <text
          fill="rgba(255, 255, 255, 0.6)"
          fontSize="14"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="400"
          letterSpacing="2px"
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
      
      {/* Confetti elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Teal confetti pieces positioned around mascot */}
        <div 
          className="absolute w-3 h-2 rounded-sm bg-cyan-400/80"
          style={{ top: '28%', left: '38%', transform: 'rotate(45deg)' }}
        />
        <div 
          className="absolute w-2 h-3 rounded-sm bg-cyan-300/70"
          style={{ top: '32%', right: '35%', transform: 'rotate(-30deg)' }}
        />
        <div 
          className="absolute w-2.5 h-1.5 rounded-sm bg-teal-400/75"
          style={{ top: '25%', left: '48%', transform: 'rotate(15deg)' }}
        />
        <div 
          className="absolute w-1.5 h-2.5 rounded-sm bg-cyan-400/65"
          style={{ top: '38%', left: '32%', transform: 'rotate(-60deg)' }}
        />
        <div 
          className="absolute w-2 h-1.5 rounded-sm bg-teal-300/70"
          style={{ top: '42%', right: '30%', transform: 'rotate(75deg)' }}
        />
        <div 
          className="absolute w-1.5 h-2 rounded-sm bg-cyan-400/60"
          style={{ top: '55%', left: '30%', transform: 'rotate(20deg)' }}
        />
        <div 
          className="absolute w-2 h-1.5 rounded-sm bg-teal-400/65"
          style={{ top: '56%', right: '32%', transform: 'rotate(-45deg)' }}
        />
      </div>
      
      {/* Mascot in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src={curoMascot} 
          alt="Curo mascot" 
          className="w-44 h-44 object-contain"
          style={{ 
            marginTop: '-8px',
            filter: 'drop-shadow(0 8px 20px rgba(139, 92, 246, 0.25))'
          }}
        />
      </div>
    </div>
  );
};

export default CircularProgressRing;
