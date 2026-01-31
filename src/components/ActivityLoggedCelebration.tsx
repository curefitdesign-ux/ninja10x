import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import confetti from "canvas-confetti";

interface ActivityLoggedCelebrationProps {
  isVisible: boolean;
  onClose: () => void;
  activity: string;
  dayNumber: number;
  currentWeek: number;
}

const ActivityLoggedCelebration = ({
  isVisible,
  onClose,
  activity,
  dayNumber,
  currentWeek,
}: ActivityLoggedCelebrationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showTick, setShowTick] = useState(false);
  const [lottieData, setLottieData] = useState<object | null>(null);
  
  const size = 280;
  const centerX = size / 2;
  const centerY = size / 2;
  const ringRadius = 110;
  const strokeWidth = 14;
  
  // 12 bars total, 3 bars per week
  const barAngle = 5.5;
  const barGap = 10;
  const weekGap = 25;
  const startAngleDeg = 157;
  
  // Calculate which bars should be active based on dayNumber
  const activeBarCount = dayNumber;
  const activeWeekIndex = currentWeek - 1;
  const dayInWeek = ((dayNumber - 1) % 3) + 1;
  
  // Check if this is the 3rd activity of a week (week completion)
  const isWeekComplete = dayInWeek === 3;

  // Load Lottie animation
  useEffect(() => {
    fetch('/lottie/confirmation-tick.json')
      .then(res => res.json())
      .then(data => setLottieData(data))
      .catch(err => console.error('Failed to load Lottie:', err));
  }, []);

  // Animation sequence with confetti for week completion
  useEffect(() => {
    if (!isVisible) {
      setAnimationProgress(0);
      setShowTick(false);
      return;
    }

    // Animate progress from 0 to 100
    const duration = 1200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Show tick after progress completes
        setTimeout(() => setShowTick(true), 200);
        
        // Trigger confetti for week completion
        if (isWeekComplete) {
          const end = Date.now() + 2500;
          const frame = () => {
            confetti({
              particleCount: 4,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.6 },
              colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24'],
            });
            confetti({
              particleCount: 4,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.6 },
              colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24'],
            });
            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();
        }
      }
    };
    
    requestAnimationFrame(animate);
  }, [isVisible, isWeekComplete]);

  // Auto-close after tick animation completes (longer for week completion)
  useEffect(() => {
    if (showTick) {
      const timeout = setTimeout(() => {
        onClose();
      }, isWeekComplete ? 2800 : 1800); // Longer celebration for week complete
      return () => clearTimeout(timeout);
    }
  }, [showTick, onClose, isWeekComplete]);

  // Draw the progress ring with animation
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
    
    // Calculate which bars to animate based on progress
    const barsToFill = Math.floor(animationProgress * activeBarCount);
    const partialBarProgress = (animationProgress * activeBarCount) % 1;
    
    // Draw 12 bars in 4 groups of 3
    for (let week = 0; week < 4; week++) {
      const weekStartAngle = currentAngle;
      const weekEndAngle = currentAngle + (barAngle * 3) + (barGap * 2);
      const isActiveWeek = week === activeWeekIndex;
      
      // Draw liquid glass background
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, toRad(weekStartAngle - 2), toRad(weekEndAngle + 2));
      ctx.lineCap = "round";
      ctx.lineWidth = strokeWidth + 12;
      
      const midAngleWeek = toRad((weekStartAngle + weekEndAngle) / 2);
      const glassGradient = ctx.createLinearGradient(
        centerX + Math.cos(midAngleWeek) * (ringRadius - 25),
        centerY + Math.sin(midAngleWeek) * (ringRadius - 25),
        centerX + Math.cos(midAngleWeek) * (ringRadius + 25),
        centerY + Math.sin(midAngleWeek) * (ringRadius + 25)
      );
      
      if (isActiveWeek) {
        glassGradient.addColorStop(0, "rgba(57, 255, 133, 0.2)");
        glassGradient.addColorStop(0.5, "rgba(57, 255, 133, 0.08)");
        glassGradient.addColorStop(1, "rgba(57, 255, 133, 0.12)");
      } else {
        glassGradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        glassGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.06)");
        glassGradient.addColorStop(1, "rgba(255, 255, 255, 0.10)");
      }
      
      ctx.strokeStyle = glassGradient;
      ctx.stroke();
      ctx.restore();
      
      for (let bar = 0; bar < 3; bar++) {
        const barIndex = week * 3 + bar + 1;
        const isFullyActive = barIndex <= barsToFill;
        const isPartiallyActive = barIndex === barsToFill + 1 && barIndex <= activeBarCount;
        const barStart = currentAngle;
        const barEnd = currentAngle + barAngle;
        const midAngle = toRad((barStart + barEnd) / 2);
        
        if (isFullyActive || isPartiallyActive) {
          const opacity = isFullyActive ? 1 : partialBarProgress;
          
          // Outer glow
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
          ctx.lineCap = "round";
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = `rgba(57, 255, 133, ${0.4 * opacity})`;
          ctx.shadowColor = `rgba(57, 255, 133, ${0.7 * opacity})`;
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = Math.cos(midAngle) * 2;
          ctx.shadowOffsetY = Math.sin(midAngle) * 2;
          ctx.stroke();
          ctx.restore();
          
          // Main bar
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, toRad(barStart), toRad(barEnd));
          ctx.lineCap = "round";
          ctx.lineWidth = strokeWidth;
          
          const innerRadius = ringRadius - strokeWidth / 2;
          const outerRadius = ringRadius + strokeWidth / 2;
          const perpAngle = midAngle;
          const gradient = ctx.createLinearGradient(
            centerX + Math.cos(perpAngle) * innerRadius,
            centerY + Math.sin(perpAngle) * innerRadius,
            centerX + Math.cos(perpAngle) * outerRadius,
            centerY + Math.sin(perpAngle) * outerRadius
          );
          gradient.addColorStop(0, `rgba(160, 255, 200, ${opacity})`);
          gradient.addColorStop(0.3, `rgba(57, 255, 133, ${opacity})`);
          gradient.addColorStop(1, `rgba(40, 220, 100, ${0.9 * opacity})`);
          
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
        
        currentAngle = barEnd + barGap;
      }
      
      if (week < 3) {
        currentAngle += (weekGap - barGap);
      }
    }
  }, [animationProgress, activeBarCount, activeWeekIndex]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background - Enhanced for week completion */}
          <motion.div 
            className="absolute inset-0"
            initial={{ backdropFilter: 'blur(0px)' }}
            animate={{ backdropFilter: 'blur(48px)' }}
            transition={{ duration: 0.5 }}
            style={{
              background: isWeekComplete 
                ? 'radial-gradient(circle at center, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.1) 25%, rgba(10, 8, 15, 0.85) 60%, rgba(10, 8, 15, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(10, 8, 15, 0.75) 0%, rgba(15, 12, 22, 0.85) 50%, rgba(10, 8, 15, 0.75) 100%)',
              backdropFilter: 'blur(48px) saturate(150%)',
              WebkitBackdropFilter: 'blur(48px) saturate(150%)',
            }}
          />
          
          {/* Week completion extra glow rings */}
          {isWeekComplete && (
            <>
              <motion.div
                className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: [0.5, 1.5, 2, 2.5], 
                  opacity: [0.8, 0.5, 0.2, 0] 
                }}
                transition={{ duration: 2, ease: "easeOut" }}
                style={{ background: 'radial-gradient(circle, rgba(52, 211, 153, 0.4) 0%, transparent 70%)' }}
              />
              <motion.div
                className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: [0.5, 1.3, 1.8], 
                  opacity: [0.6, 0.3, 0] 
                }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)' }}
              />
            </>
          )}
          
          {/* Main content with entrance animation */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 280, 
              damping: 22,
              delay: 0.1,
            }}
          >
            {/* Outer pulsing glow ring effect - more intense for week completion */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: size + 120,
                height: size + 120,
                background: isWeekComplete
                  ? 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(52, 211, 153, 0.15) 35%, rgba(52, 211, 153, 0.02) 60%, transparent 75%)'
                  : 'radial-gradient(circle, rgba(57, 255, 133, 0.25) 0%, rgba(57, 255, 133, 0.1) 35%, rgba(57, 255, 133, 0.02) 60%, transparent 75%)',
                filter: 'blur(8px)',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                scale: { duration: isWeekComplete ? 1.5 : 2.5, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: isWeekComplete ? 1.5 : 2.5, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
            
            {/* Inner glow ring - tighter, more intense */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: size + 60,
                height: size + 60,
                background: isWeekComplete
                  ? 'radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(52, 211, 153, 0.2) 40%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(57, 255, 133, 0.3) 0%, rgba(57, 255, 133, 0.15) 40%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.12, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: isWeekComplete ? 1.2 : 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
            />
            
            {/* Progress Ring Container with glow */}
            <motion.div 
              className="relative" 
              style={{ width: size, height: size }}
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Glow layer behind canvas - enhanced for week completion */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: isWeekComplete
                    ? `
                      0 0 50px rgba(251, 191, 36, ${0.4 * animationProgress}),
                      0 0 100px rgba(52, 211, 153, ${0.3 * animationProgress}),
                      inset 0 0 40px rgba(251, 191, 36, ${0.15 * animationProgress})
                    `
                    : `
                      0 0 40px rgba(57, 255, 133, ${0.3 * animationProgress}),
                      0 0 80px rgba(57, 255, 133, ${0.2 * animationProgress}),
                      inset 0 0 30px rgba(57, 255, 133, ${0.1 * animationProgress})
                    `,
                }}
              />
              
              <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ width: size, height: size }}
              />
              
              {/* Curved text */}
              <svg 
                className="absolute inset-0 pointer-events-none"
                viewBox={`0 0 ${size} ${size}`}
                style={{ width: size, height: size, overflow: 'visible' }}
              >
                <defs>
                  <path
                    id="celebrationCurvedTextPath"
                    d={`M ${centerX - 85} ${centerY + 70}
                        A ${ringRadius - 10} ${ringRadius - 10} 0 0 0 ${centerX + 85} ${centerY + 70}`}
                    fill="none"
                  />
                </defs>
                
                <text
                  fill={isWeekComplete ? "rgba(251, 191, 36, 0.9)" : "rgba(57, 255, 133, 0.9)"}
                  fontSize="10"
                  fontFamily="Inter, sans-serif"
                  fontWeight="500"
                  letterSpacing="1.5px"
                  fontStyle="italic"
                >
                  <textPath
                    href="#celebrationCurvedTextPath"
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    Cult ninja  •  Week {currentWeek}  •  Day {dayInWeek}
                  </textPath>
                </text>
              </svg>
              
              {/* Confetti particles - more for week completion */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                  className={`absolute w-3 h-1.5 rounded-sm ${isWeekComplete ? 'bg-yellow-400/80' : 'bg-cyan-400/80'}`}
                  style={{ top: '25%', left: '38%' }}
                  animate={{ 
                    rotate: [45, 90, 45],
                    y: [0, -5, 0],
                  }}
                  transition={{ duration: isWeekComplete ? 1 : 2, repeat: Infinity }}
                />
                <motion.div 
                  className={`absolute w-2 h-3 rounded-sm ${isWeekComplete ? 'bg-emerald-400/70' : 'bg-cyan-300/70'}`}
                  style={{ top: '30%', right: '36%' }}
                  animate={{ 
                    rotate: [-30, -60, -30],
                    y: [0, -8, 0],
                  }}
                  transition={{ duration: isWeekComplete ? 0.8 : 1.8, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className={`absolute w-2.5 h-1.5 rounded-sm ${isWeekComplete ? 'bg-yellow-300/75' : 'bg-teal-400/75'}`}
                  style={{ top: '22%', left: '48%' }}
                  animate={{ 
                    rotate: [15, 45, 15],
                    y: [0, -6, 0],
                  }}
                  transition={{ duration: isWeekComplete ? 1.2 : 2.2, repeat: Infinity, delay: 0.4 }}
                />
                <motion.div 
                  className="absolute w-1.5 h-2.5 rounded-sm bg-cyan-400/65" 
                  style={{ top: '38%', left: '32%' }}
                  animate={{ 
                    rotate: [-60, -30, -60],
                    x: [0, -4, 0],
                  }}
                  transition={{ duration: isWeekComplete ? 0.8 : 1.6, repeat: Infinity, delay: 0.1 }}
                />
                <motion.div 
                  className={`absolute w-2 h-1 rounded-sm ${isWeekComplete ? 'bg-emerald-300/70' : 'bg-teal-300/70'}`}
                  style={{ top: '42%', right: '32%' }}
                  animate={{ 
                    rotate: [75, 105, 75],
                    x: [0, 4, 0],
                  }}
                  transition={{ duration: isWeekComplete ? 1 : 2, repeat: Infinity, delay: 0.3 }}
                />
                {/* Extra confetti for week completion */}
                {isWeekComplete && (
                  <>
                    <motion.div 
                      className="absolute w-2 h-2 rounded-full bg-yellow-400/80" 
                      style={{ top: '18%', left: '55%' }}
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
                    />
                    <motion.div 
                      className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/80" 
                      style={{ top: '35%', left: '28%' }}
                      animate={{ 
                        scale: [1, 1.4, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div 
                      className="absolute w-2.5 h-1 rounded-sm bg-yellow-300/75" 
                      style={{ top: '15%', right: '40%' }}
                      animate={{ 
                        rotate: [0, 180, 360],
                        y: [0, -10, 0],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </>
                )}
              </div>
              
              {/* Center content - Lottie tick animation (increased size) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {showTick && lottieData && (
                    <motion.div
                      key="tick"
                      className="flex items-center justify-center"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 350, 
                        damping: 18,
                        delay: 0.05,
                      }}
                    >
                      {/* Glow behind tick */}
                      <motion.div
                        className="absolute rounded-full"
                        style={{
                          width: 200,
                          height: 200,
                          background: isWeekComplete
                            ? 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(52, 211, 153, 0.2) 50%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(57, 255, 133, 0.4) 0%, rgba(57, 255, 133, 0.1) 50%, transparent 70%)',
                        }}
                        animate={{
                          scale: [1, 1.25, 1],
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: isWeekComplete ? 1 : 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      <Lottie
                        animationData={lottieData}
                        loop={false}
                        style={{ width: 190, height: 190 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            
            {/* Activity Logged Text - or Week Complete for week completion */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            >
              {isWeekComplete ? (
                <>
                  <motion.div
                    className="text-5xl mb-3"
                    animate={{ 
                      scale: [1, 1.2, 1], 
                      rotate: [0, 10, -10, 0] 
                    }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    🏆
                  </motion.div>
                  <motion.h2
                    className="text-2xl font-bold text-white mb-2"
                    animate={{ 
                      textShadow: [
                        '0 0 20px rgba(251, 191, 36, 0.3)',
                        '0 0 40px rgba(251, 191, 36, 0.5)',
                        '0 0 20px rgba(251, 191, 36, 0.3)',
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Week {currentWeek} Complete!
                  </motion.h2>
                  <motion.p
                    className="text-emerald-400/90 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    Amazing progress! Keep it up! 💪
                  </motion.p>
                </>
              ) : (
                <motion.h2
                  className="text-2xl font-bold text-white"
                  animate={{ 
                    textShadow: [
                      '0 0 20px rgba(255,255,255,0.2)',
                      '0 0 40px rgba(255,255,255,0.4)',
                      '0 0 20px rgba(255,255,255,0.2)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {activity} Logged
                </motion.h2>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActivityLoggedCelebration;