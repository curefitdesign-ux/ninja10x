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
  const ringRadius = 115;
  const strokeWidth = 18;
  const totalDays = 12;
  const daysPerWeek = 3;
  const gapAngle = 4; // Gap between segments in degrees
  
  // Start at 12 o'clock (-90 degrees) and end at 6 o'clock (90 degrees) for the arc
  // Text will complete the bottom half
  const startAngle = -135; // Start angle in degrees (upper left)
  const endAngle = -45; // End angle in degrees (upper right)
  const totalArcAngle = 270; // Total arc span for 12 segments
  
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
    
    // Calculate segment angles
    const segmentAngle = (totalArcAngle - (totalDays - 1) * gapAngle) / totalDays;
    const segmentWithGap = segmentAngle + gapAngle;
    
    // Draw each segment
    for (let i = 0; i < totalDays; i++) {
      const weekIndex = Math.floor(i / daysPerWeek);
      const dayInWeek = i % daysPerWeek;
      const isActiveWeek = weekIndex === currentWeek - 1;
      const isCompletedDay = i < currentDay;
      
      // Calculate segment start and end angles
      // Start from bottom-left, go clockwise, end at bottom-right
      const segStart = (225 + i * segmentWithGap) * (Math.PI / 180);
      const segEnd = (225 + i * segmentWithGap + segmentAngle) * (Math.PI / 180);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, segStart, segEnd);
      ctx.lineCap = "round";
      ctx.lineWidth = strokeWidth;
      
      if (isActiveWeek) {
        if (isCompletedDay) {
          // Completed day in active week - bright neon green with glow
          ctx.strokeStyle = "#39FF85";
          ctx.shadowColor = "#39FF85";
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        } else {
          // Active week but not completed - glassmorphic light green
          const gradient = ctx.createLinearGradient(
            centerX + ringRadius * Math.cos(segStart),
            centerY + ringRadius * Math.sin(segStart),
            centerX + ringRadius * Math.cos(segEnd),
            centerY + ringRadius * Math.sin(segEnd)
          );
          gradient.addColorStop(0, "rgba(57, 255, 133, 0.25)");
          gradient.addColorStop(0.5, "rgba(57, 255, 133, 0.35)");
          gradient.addColorStop(1, "rgba(57, 255, 133, 0.25)");
          ctx.strokeStyle = gradient;
          ctx.shadowColor = "rgba(57, 255, 133, 0.3)";
          ctx.shadowBlur = 10;
        }
      } else {
        // Inactive weeks - neutral grey
        ctx.strokeStyle = "rgba(180, 180, 180, 0.45)";
        ctx.shadowBlur = 0;
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
  }, [currentDay, currentWeek]);
  
  // Generate curved text path
  const textRadius = ringRadius + 28;
  const text = "cult ninja  •  Week 1  •  Day 1";
  
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
          {/* Path for curved text at bottom */}
          <path
            id="curvedTextPath"
            d={`M ${centerX - textRadius * 0.85} ${centerY + 15}
                A ${textRadius * 0.9} ${textRadius * 0.9} 0 0 0 ${centerX + textRadius * 0.85} ${centerY + 15}`}
            fill="none"
          />
        </defs>
        
        <text
          fill="rgba(255, 255, 255, 0.65)"
          fontSize="13"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="400"
          letterSpacing="1.5px"
        >
          <textPath
            href="#curvedTextPath"
            startOffset="50%"
            textAnchor="middle"
          >
            cult ninja  •  Week {currentWeek}  •  Day {((currentDay - 1) % 3) + 1}
          </textPath>
        </text>
      </svg>
      
      {/* Confetti elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Teal confetti pieces */}
        <div 
          className="absolute w-3 h-2 rounded-sm bg-cyan-400/80 blur-[0.5px]"
          style={{ top: '25%', left: '35%', transform: 'rotate(45deg)' }}
        />
        <div 
          className="absolute w-2 h-3 rounded-sm bg-cyan-300/70 blur-[0.5px]"
          style={{ top: '30%', right: '32%', transform: 'rotate(-30deg)' }}
        />
        <div 
          className="absolute w-2.5 h-1.5 rounded-sm bg-teal-400/75 blur-[0.5px]"
          style={{ top: '22%', left: '45%', transform: 'rotate(15deg)' }}
        />
        <div 
          className="absolute w-1.5 h-2.5 rounded-sm bg-cyan-400/65 blur-[0.5px]"
          style={{ top: '35%', left: '30%', transform: 'rotate(-60deg)' }}
        />
        <div 
          className="absolute w-2 h-1.5 rounded-sm bg-teal-300/70 blur-[0.5px]"
          style={{ top: '40%', right: '28%', transform: 'rotate(75deg)' }}
        />
        <div 
          className="absolute w-1.5 h-2 rounded-sm bg-cyan-400/60 blur-[0.5px]"
          style={{ top: '55%', left: '28%', transform: 'rotate(20deg)' }}
        />
        <div 
          className="absolute w-2 h-1.5 rounded-sm bg-teal-400/65 blur-[0.5px]"
          style={{ top: '58%', right: '30%', transform: 'rotate(-45deg)' }}
        />
      </div>
      
      {/* Mascot in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src={curoMascot} 
          alt="Curo mascot" 
          className="w-44 h-44 object-contain drop-shadow-2xl"
          style={{ 
            marginTop: '-10px',
            filter: 'drop-shadow(0 10px 25px rgba(139, 92, 246, 0.3))'
          }}
        />
      </div>
    </div>
  );
};

export default CircularProgressRing;
