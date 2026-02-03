import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import confetti from 'canvas-confetti';

// Reaction images
import fireReaction from '@/assets/reactions/fire-3d.png';

type PillState = 'creating' | 'completing' | 'complete' | 'celebrate';

interface Reaction {
  type: string;
  count: number;
  avatarUrl?: string;
}

interface ReelProgressPillProps {
  weekNumber: number;
  state: PillState;
  progress?: number; // 0-100
  reactions?: Reaction[];
  totalReactions?: number;
  thumbnailUrl?: string; // User's activity thumbnail for complete state
  onPlay?: () => void;
  className?: string;
  isAnimating?: boolean;
}

// Stacked cards icon for "creating" state - liquid glass style
const StackedCardsIcon = () => (
  <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
    {/* Back card */}
    <div 
      className="absolute rounded-sm"
      style={{ 
        width: 18,
        height: 24,
        left: 4, 
        top: 6,
        transform: 'rotate(-12deg)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }} 
    />
    {/* Middle card */}
    <div 
      className="absolute rounded-sm"
      style={{ 
        width: 18,
        height: 24,
        left: 10, 
        top: 4,
        transform: 'rotate(-4deg)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.18) 100%)',
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }} 
    />
    {/* Front card */}
    <div 
      className="absolute rounded-sm"
      style={{ 
        width: 18,
        height: 24,
        left: 16, 
        top: 2,
        transform: 'rotate(4deg)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 100%)',
        border: '1px solid rgba(255,255,255,0.45)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }} 
    />
  </div>
);

// Decorative abstract pattern for "completing/transition" state
const AbstractPattern = () => (
  <div className="absolute inset-0 overflow-hidden rounded-[20px] pointer-events-none">
    {/* Curved decorative lines */}
    <svg 
      className="absolute inset-0 w-full h-full opacity-30"
      viewBox="0 0 300 60" 
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(52, 211, 153, 0.1)" />
          <stop offset="50%" stopColor="rgba(52, 211, 153, 0.6)" />
          <stop offset="100%" stopColor="rgba(52, 211, 153, 0.1)" />
        </linearGradient>
      </defs>
      {/* Flowing curves */}
      <motion.path
        d="M0,30 Q75,10 150,30 T300,30"
        fill="none"
        stroke="url(#lineGradient1)"
        strokeWidth="1.5"
        initial={{ pathOffset: 0 }}
        animate={{ pathOffset: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M0,40 Q75,20 150,40 T300,40"
        fill="none"
        stroke="rgba(52, 211, 153, 0.25)"
        strokeWidth="1"
        initial={{ pathOffset: 0 }}
        animate={{ pathOffset: 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M0,20 Q75,40 150,20 T300,20"
        fill="none"
        stroke="rgba(52, 211, 153, 0.2)"
        strokeWidth="1"
        initial={{ pathOffset: 0 }}
        animate={{ pathOffset: 1 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      {/* Scattered dots */}
      {[...Array(12)].map((_, i) => (
        <motion.circle
          key={i}
          cx={30 + (i * 22)}
          cy={20 + Math.sin(i * 0.8) * 15}
          r={1 + Math.random() * 1.5}
          fill="rgba(52, 211, 153, 0.4)"
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </svg>
  </div>
);

// Thumbnail with reaction badge for "complete" state
const ThumbnailWithBadge = ({ 
  thumbnailUrl, 
  totalReactions 
}: { 
  thumbnailUrl?: string; 
  totalReactions: number;
}) => (
  <div className="relative w-10 h-10 flex-shrink-0">
    {/* Thumbnail */}
    <div 
      className="w-10 h-10 rounded-xl overflow-hidden"
      style={{
        border: '2px solid rgba(255,255,255,0.25)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt="Activity" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div 
          className="w-full h-full"
          style={{
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
          }}
        />
      )}
    </div>
    
    {/* Reaction badge - only show if there are reactions */}
    {totalReactions > 0 && (
      <motion.div
        className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(236, 72, 153, 0.85) 100%)',
          border: '1.5px solid rgba(255,255,255,0.4)',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <img src={fireReaction} alt="" className="w-3 h-3" />
        <span className="text-white text-[10px] font-bold">{totalReactions}</span>
      </motion.div>
    )}
  </div>
);

// Circular progress ring with play button
const ProgressRing = ({ 
  state, 
  progress,
  needsAttention,
}: { 
  state: PillState; 
  progress: number;
  needsAttention: boolean;
}) => {
  const isComplete = state === 'complete' || state === 'completing';
  const isCreating = state === 'creating';
  
  return (
    <div className="relative flex-shrink-0 w-12 h-12">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        {/* Background track */}
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
        />
        
        {/* Progress arc for complete state */}
        {isComplete && (
          <motion.circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="url(#completeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 20}
            initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.6))',
            }}
          />
        )}
        
        {/* Rotating segment for creating state */}
        {isCreating && (
          <motion.circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="url(#creatingGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20 * 0.3} ${2 * Math.PI * 20 * 0.7}`}
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.5, 
              ease: 'linear',
              repeat: Infinity,
            }}
            style={{
              transformOrigin: 'center',
              filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.5))',
            }}
          />
        )}
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="completeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="creatingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(52, 211, 153, 0.15)" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="rgba(52, 211, 153, 0.15)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Play button center */}
      <motion.div
        className="absolute inset-[5px] rounded-full flex items-center justify-center"
        style={{
          background: isComplete
            ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: isComplete
            ? '1.5px solid rgba(52, 211, 153, 0.5)'
            : '1px solid rgba(255,255,255,0.1)',
        }}
        whileTap={{ scale: 0.92 }}
        animate={needsAttention ? {
          scale: [1, 1.08, 1],
        } : {}}
        transition={{
          duration: 1.2,
          repeat: needsAttention ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <Play 
          className={`w-4 h-4 ml-0.5 ${isComplete ? 'text-emerald-400' : 'text-white/50'}`}
          fill="currentColor" 
        />
      </motion.div>
    </div>
  );
};

const ReelProgressPill = ({
  weekNumber,
  state,
  progress = 0,
  reactions = [],
  totalReactions = 0,
  thumbnailUrl,
  onPlay,
  className = '',
  isAnimating = false,
}: ReelProgressPillProps) => {
  const pillRef = useRef<HTMLDivElement>(null);
  const [hasPlayedConfetti, setHasPlayedConfetti] = useState(false);
  const prevStateRef = useRef<PillState>(state);
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  
  // Trigger celebration animation
  useEffect(() => {
    if (isAnimating) {
      setShowCelebration(true);
      const timeout = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [isAnimating]);

  // Trigger attention animation when reel completes
  useEffect(() => {
    if ((state === 'complete' || state === 'completing') && prevStateRef.current === 'creating') {
      setJustCompleted(true);
      const timeout = setTimeout(() => setJustCompleted(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [state]);
  
  // Fire confetti when transitioning to completing state
  useEffect(() => {
    const shouldFireConfetti = (state === 'completing' && prevStateRef.current === 'creating') || 
                               (state === 'celebrate');
    
    if (shouldFireConfetti && !hasPlayedConfetti && pillRef.current) {
      setHasPlayedConfetti(true);
      
      const rect = pillRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x, y },
        colors: ['#34d399', '#10b981', '#6ee7b7', '#ffffff'],
        startVelocity: 20,
        gravity: 0.8,
        scalar: 0.6,
        ticks: 80,
        shapes: ['circle', 'square'],
      });
    }
    
    prevStateRef.current = state;
  }, [state, hasPlayedConfetti]);

  // Reset confetti flag
  useEffect(() => {
    if (state === 'creating') {
      setHasPlayedConfetti(false);
    }
  }, [state]);

  const isCelebrating = state === 'celebrate' || showCelebration;
  const needsAttention = justCompleted || state === 'completing';
  const isComplete = state === 'complete' || state === 'completing';
  const isCreating = state === 'creating';
  
  const displayReactionCount = totalReactions > 0 
    ? totalReactions 
    : reactions.reduce((sum, r) => sum + r.count, 0);

  // Get background style based on state
  const getBackgroundStyle = () => {
    if (isComplete || isCelebrating) {
      return {
        background: 'linear-gradient(135deg, rgba(45, 55, 52, 0.85) 0%, rgba(35, 45, 42, 0.9) 100%)',
        border: needsAttention 
          ? '1.5px solid rgba(52, 211, 153, 0.5)'
          : '1px solid rgba(52, 211, 153, 0.25)',
        boxShadow: needsAttention
          ? '0 0 24px rgba(52, 211, 153, 0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
      };
    }
    // Creating state - neutral liquid glass
    return {
      background: 'linear-gradient(135deg, rgba(60, 60, 65, 0.85) 0%, rgba(45, 45, 50, 0.9) 100%)',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
    };
  };

  return (
    <motion.div
      ref={pillRef}
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="relative flex items-center gap-3 px-3 py-2.5 rounded-[20px] cursor-pointer overflow-hidden"
        style={{
          ...getBackgroundStyle(),
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          minHeight: 56,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPlay?.();
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        animate={needsAttention ? {
          scale: [1, 1.02, 1],
          y: [0, -1, 0],
        } : {}}
        transition={{
          duration: 1.2,
          repeat: needsAttention ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Abstract pattern for completing/transition state */}
        <AnimatePresence>
          {(state === 'completing' || isCelebrating) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AbstractPattern />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing glow ring when needs attention */}
        <AnimatePresence>
          {needsAttention && (
            <motion.div
              className="absolute -inset-0.5 rounded-[22px] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.5, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'transparent',
                border: '2px solid rgba(52, 211, 153, 0.5)',
                boxShadow: '0 0 16px rgba(52, 211, 153, 0.4)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Shimmer effect for creating state */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              className="absolute inset-0 rounded-[20px] pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left icon based on state */}
        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.div
              key="cards"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <StackedCardsIcon />
            </motion.div>
          ) : (
            <motion.div
              key="thumbnail"
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <ThumbnailWithBadge 
                thumbnailUrl={thumbnailUrl} 
                totalReactions={displayReactionCount}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text content */}
        <div className="flex-1 min-w-0 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5"
            >
              <span 
                className="font-semibold text-sm tracking-wide"
                style={{
                  color: isComplete ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
                }}
              >
                Week {weekNumber}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span 
                className="font-bold text-sm tracking-wide"
                style={{
                  color: isComplete ? '#34d399' : 'rgba(255,255,255,0.6)',
                }}
              >
                {isCreating ? 'Reel in progress' : 'PLAY NOW'}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress ring with play button */}
        <ProgressRing 
          state={state} 
          progress={progress}
          needsAttention={needsAttention}
        />
      </motion.div>
    </motion.div>
  );
};

export default ReelProgressPill;
