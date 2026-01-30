import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import confetti from 'canvas-confetti';

// Reaction images
import clapReaction from '@/assets/reactions/clap.png';
import fireReaction from '@/assets/reactions/fire-cool.png';
import fistbumpReaction from '@/assets/reactions/fistbump.png';
import wowReaction from '@/assets/reactions/wow.png';

type PillState = 'creating' | 'completing' | 'complete';

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
}

// Stacked card icon on the left during "creating" state
const StackedCardsIcon = () => (
  <div className="relative w-9 h-9 flex-shrink-0">
    {/* Back card */}
    <div 
      className="absolute w-6 h-8 rounded-sm bg-white/20"
      style={{ 
        left: 0, 
        top: 2,
        transform: 'rotate(-8deg)',
        border: '1px solid rgba(255,255,255,0.3)',
      }} 
    />
    {/* Middle card */}
    <div 
      className="absolute w-6 h-8 rounded-sm bg-white/30"
      style={{ 
        left: 6, 
        top: 1,
        transform: 'rotate(-3deg)',
        border: '1px solid rgba(255,255,255,0.35)',
      }} 
    />
    {/* Front card */}
    <div 
      className="absolute w-6 h-8 rounded-sm bg-white/40"
      style={{ 
        left: 12, 
        top: 0,
        transform: 'rotate(2deg)',
        border: '1px solid rgba(255,255,255,0.4)',
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
    <div className="relative w-10 h-10 flex-shrink-0">
      {reaction.avatarUrl ? (
        <img 
          src={reaction.avatarUrl} 
          alt="User" 
          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-white/20">
          <img src={getReactionIcon(reaction.type)} alt="" className="w-5 h-5" />
        </div>
      )}
      {/* Reaction badge */}
      <div 
        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
          border: '1.5px solid rgba(255,255,255,0.4)',
        }}
      >
        <img src={getReactionIcon(reaction.type)} alt="" className="w-3 h-3" />
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
}: ReelProgressPillProps) => {
  const pillRef = useRef<HTMLDivElement>(null);
  const [hasPlayedConfetti, setHasPlayedConfetti] = useState(false);
  const prevStateRef = useRef<PillState>(state);
  
  // Fire confetti when transitioning to "completing" state
  useEffect(() => {
    if (state === 'completing' && prevStateRef.current === 'creating' && !hasPlayedConfetti && pillRef.current) {
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
      case 'completing':
      case 'complete':
        return `Week ${weekNumber} • PLAY NOW`;
    }
  };

  // Show reaction avatar or stacked cards based on state
  const showReactionAvatar = state === 'complete' && reactions.length > 0;
  const topReaction = reactions[0];

  return (
    <motion.div
      ref={pillRef}
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div
        className="relative flex items-center gap-3 px-3 py-2.5 rounded-full cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(30,35,40,0.95) 0%, rgba(20,25,30,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
        onClick={onPlay}
      >
        {/* Subtle gradient overlay during completion */}
        <AnimatePresence>
          {state === 'completing' && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(52, 211, 153, 0.15) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          )}
        </AnimatePresence>

        {/* Left icon: Stacked cards OR Reaction avatar */}
        <AnimatePresence mode="wait">
          {showReactionAvatar && topReaction ? (
            <motion.div
              key="reaction"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ReactionAvatar reaction={topReaction} />
            </motion.div>
          ) : (
            <motion.div
              key="cards"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <StackedCardsIcon />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <motion.span
            className="text-white/90 font-medium text-sm tracking-wide"
            key={state}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {getText()}
          </motion.span>
        </div>

        {/* Play button */}
        <motion.div
          className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: state === 'complete' || state === 'completing'
              ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
            border: state === 'complete' || state === 'completing'
              ? '1.5px solid rgba(52, 211, 153, 0.5)'
              : '1px solid rgba(255,255,255,0.15)',
            boxShadow: state === 'complete' || state === 'completing'
              ? '0 0 20px rgba(52, 211, 153, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
              : 'inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <Play 
            className={`w-4 h-4 ml-0.5 ${
              state === 'complete' || state === 'completing' 
                ? 'text-emerald-400' 
                : 'text-white/70'
            }`} 
            fill="currentColor" 
          />
        </motion.div>
      </div>

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
