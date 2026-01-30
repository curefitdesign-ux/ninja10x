import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import confetti from 'canvas-confetti';

// Reaction images
import clapReaction from '@/assets/reactions/clap.png';
import fireReaction from '@/assets/reactions/fire-cool.png';
import fistbumpReaction from '@/assets/reactions/fistbump.png';
import wowReaction from '@/assets/reactions/wow.png';

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
  onPlay?: () => void;
  className?: string;
  isAnimating?: boolean; // Trigger celebration animation
}

// Compact stacked card icon with liquid glass feel
const StackedCardsIcon = () => (
  <div className="relative w-6 h-6 flex-shrink-0">
    {/* Back card */}
    <div 
      className="absolute w-4 h-5 rounded-sm"
      style={{ 
        left: 0, 
        top: 2,
        transform: 'rotate(-8deg)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(8px)',
      }} 
    />
    {/* Middle card */}
    <div 
      className="absolute w-4 h-5 rounded-sm"
      style={{ 
        left: 4, 
        top: 1,
        transform: 'rotate(-3deg)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
        border: '1px solid rgba(255,255,255,0.25)',
        backdropFilter: 'blur(8px)',
      }} 
    />
    {/* Front card */}
    <div 
      className="absolute w-4 h-5 rounded-sm"
      style={{ 
        left: 8, 
        top: 0,
        transform: 'rotate(2deg)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)',
        border: '1px solid rgba(255,255,255,0.3)',
        backdropFilter: 'blur(8px)',
      }} 
    />
  </div>
);

// Reaction avatar for "complete" state when reactions exist
const ReactionAvatar = ({ reaction }: { reaction: Reaction }) => {
  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'fire': return fireReaction;
      case 'clap': return clapReaction;
      case 'fistbump': return fistbumpReaction;
      case 'wow': return wowReaction;
      default: return fireReaction;
    }
  };

  return (
    <div className="relative w-8 h-8 flex-shrink-0">
      {reaction.avatarUrl ? (
        <img 
          src={reaction.avatarUrl} 
          alt="User" 
          className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-white/20">
          <img src={getReactionIcon(reaction.type)} alt="" className="w-4 h-4" />
        </div>
      )}
      {/* Reaction badge */}
      <div 
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
          border: '1.5px solid rgba(255,255,255,0.4)',
        }}
      >
        <img src={getReactionIcon(reaction.type)} alt="" className="w-2.5 h-2.5" />
      </div>
    </div>
  );
};

const ReelProgressPill = ({
  weekNumber,
  state,
  progress = 0,
  reactions = [],
  onPlay,
  className = '',
  isAnimating = false,
}: ReelProgressPillProps) => {
  const pillRef = useRef<HTMLDivElement>(null);
  const [hasPlayedConfetti, setHasPlayedConfetti] = useState(false);
  const prevStateRef = useRef<PillState>(state);
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  
  // Trigger celebration animation when isAnimating becomes true
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
      // Keep attention animation running for 5 seconds
      const timeout = setTimeout(() => setJustCompleted(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [state]);
  
  // Fire confetti when transitioning to "completing" state or celebrating
  useEffect(() => {
    const shouldFireConfetti = (state === 'completing' && prevStateRef.current === 'creating') || 
                               (state === 'celebrate');
    
    if (shouldFireConfetti && !hasPlayedConfetti && pillRef.current) {
      setHasPlayedConfetti(true);
      
      // Get pill position for confetti origin
      const rect = pillRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      // Fire confetti masked to the pill area
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

  // Reset confetti flag when going back to creating
  useEffect(() => {
    if (state === 'creating') {
      setHasPlayedConfetti(false);
    }
  }, [state]);

  // Text content based on state
  const getText = () => {
    switch (state) {
      case 'creating':
        return `Week ${weekNumber} • Reel in progress`;
      case 'celebrate':
        return `Week ${weekNumber} • Activity Logged! 🎉`;
      case 'completing':
      case 'complete':
        return `Week ${weekNumber} • PLAY NOW`;
    }
  };
  
  // Celebration or complete state styling
  const isCelebrating = state === 'celebrate' || showCelebration;
  const needsAttention = justCompleted || state === 'completing';

  // Show reaction avatar or stacked cards based on state
  const showReactionAvatar = state === 'complete' && reactions.length > 0;
  const topReaction = reactions[0];

  return (
    <motion.div
      ref={pillRef}
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="relative flex flex-col px-4 py-3 rounded-2xl cursor-pointer overflow-hidden"
        style={{
          background: isCelebrating || needsAttention
            ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: isCelebrating || needsAttention
            ? '1px solid rgba(52, 211, 153, 0.4)'
            : '1px solid rgba(255,255,255,0.15)',
          boxShadow: isCelebrating || needsAttention
            ? '0 0 24px rgba(52, 211, 153, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
            : 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.1)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPlay?.();
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        animate={needsAttention ? {
          scale: [1, 1.03, 1],
          y: [0, -2, 0],
        } : isCelebrating ? {
          scale: [1, 1.01, 1],
        } : {}}
        transition={{
          duration: 1.2,
          repeat: needsAttention || isCelebrating ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Pulsing glow ring when needs attention */}
        <AnimatePresence>
          {needsAttention && (
            <motion.div
              className="absolute -inset-1 rounded-3xl pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scale: [0.98, 1.02, 0.98],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'transparent',
                border: '2px solid rgba(52, 211, 153, 0.5)',
                boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)',
              }}
            />
          )}
        </AnimatePresence>
        {/* Glow effect during celebration */}
        <AnimatePresence>
          {isCelebrating && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle at center, rgba(52, 211, 153, 0.3) 0%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Shimmer effect */}
        <AnimatePresence>
          {(state === 'completing' || state === 'creating') && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top row: Icon + Text + Play button */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Left icon: Stacked cards OR Reaction avatar */}
          <AnimatePresence mode="wait">
            {showReactionAvatar && topReaction ? (
              <motion.div
                key="reaction"
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <ReactionAvatar reaction={topReaction} />
              </motion.div>
            ) : (
              <motion.div
                key="cards"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <StackedCardsIcon />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.span
                className="text-white font-semibold text-sm tracking-wide block"
                key={state}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <span className={isCelebrating ? 'text-emerald-300' : ''}>{getText()}</span>
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Liquid glass play button with circular progress */}
          <div className="relative flex-shrink-0 w-10 h-10">
            {/* SVG Circular Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
              {/* Background circle */}
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2.5"
              />
              {/* Progress circle */}
              <motion.circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke={state === 'complete' || state === 'completing' || isCelebrating || needsAttention
                  ? '#34d399'
                  : 'rgba(255,255,255,0.5)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 17}
                initial={{ strokeDashoffset: 2 * Math.PI * 17 }}
                animate={{ 
                  strokeDashoffset: state === 'complete' || state === 'completing' 
                    ? 0 
                    : 2 * Math.PI * 17 * (1 - Math.max(progress, 10) / 100)
                }}
                transition={{ 
                  duration: state === 'complete' ? 0.5 : 0.8, 
                  ease: 'easeOut' 
                }}
                style={{
                  filter: state === 'complete' || state === 'completing' || isCelebrating || needsAttention
                    ? 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.8))'
                    : 'none',
                }}
              />
              {/* Animated glow overlay for "creating" state - simulates filling motion */}
              {state === 'creating' && (
                <motion.circle
                  cx="20"
                  cy="20"
                  r="17"
                  fill="none"
                  stroke="rgba(52, 211, 153, 0.6)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 17 * 0.15}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: -2 * Math.PI * 17 }}
                  transition={{ 
                    duration: 1.5, 
                    ease: 'linear',
                    repeat: Infinity,
                  }}
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.8))',
                  }}
                />
              )}
            </svg>
            
            {/* Play button center */}
            <motion.div
              className="absolute inset-1 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: state === 'complete' || state === 'completing' || isCelebrating || needsAttention
                  ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.4) 0%, rgba(16, 185, 129, 0.25) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: state === 'complete' || state === 'completing' || isCelebrating || needsAttention
                  ? '1px solid rgba(52, 211, 153, 0.5)'
                  : '1px solid rgba(255,255,255,0.15)',
                boxShadow: state === 'complete' || state === 'completing' || isCelebrating || needsAttention
                  ? '0 0 12px rgba(52, 211, 153, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={needsAttention ? {
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 12px rgba(52, 211, 153, 0.3)',
                  '0 0 24px rgba(52, 211, 153, 0.6)',
                  '0 0 12px rgba(52, 211, 153, 0.3)',
                ],
              } : isCelebrating ? {
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 12px rgba(52, 211, 153, 0.3)',
                  '0 0 20px rgba(52, 211, 153, 0.5)',
                  '0 0 12px rgba(52, 211, 153, 0.3)',
                ],
              } : {}}
              transition={{
                duration: 1,
                repeat: needsAttention || isCelebrating ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <Play 
                className={`w-3.5 h-3.5 ml-0.5 ${
                  state === 'complete' || state === 'completing' || isCelebrating || needsAttention
                    ? 'text-emerald-400' 
                    : 'text-white/70'
                }`} 
                fill="currentColor" 
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default ReelProgressPill;
