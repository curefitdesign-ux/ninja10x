import { motion } from 'framer-motion';
import { ReactionType } from '@/services/journey-service';

// Import 3D reaction images
import clapImg from '@/assets/reactions/clap-hands.png';
import fireImg from '@/assets/reactions/fire-new.png';
import fistbumpImg from '@/assets/reactions/fistbump-hands.png';
import wowImg from '@/assets/reactions/wow.png';
import flexImg from '@/assets/reactions/flex.png';
import trophyImg from '@/assets/reactions/dumbbells.png';
import runnerImg from '@/assets/reactions/runner.png';
import energyImg from '@/assets/reactions/energy.png';
import timerImg from '@/assets/reactions/stopwatch.png';
import heartImg from '@/assets/reactions/heart-workout.png';

interface FloatingReactionsOverlayProps {
  reactions: ReactionType[];
  newReaction: ReactionType | null;
}

const REACTION_IMAGES: Record<ReactionType, string> = {
  heart: heartImg,
  fire: fireImg,
  clap: clapImg,
  fistbump: fistbumpImg,
  wow: wowImg,
  flex: flexImg,
  trophy: trophyImg,
  runner: runnerImg,
  energy: energyImg,
  timer: timerImg,
};

// Positions around the card for floating reactions
const POSITIONS = [
  { top: '5%', right: '-5%', rotate: 15 },
  { top: '10%', right: '5%', rotate: -10 },
  { bottom: '35%', left: '-8%', rotate: -20 },
  { bottom: '15%', left: '-5%', rotate: 10 },
  { bottom: '8%', right: '-3%', rotate: -5 },
  { top: '50%', right: '-6%', rotate: 25 },
];

export default function FloatingReactionsOverlay({ reactions, newReaction }: FloatingReactionsOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {reactions.slice(0, 5).map((type, i) => {
        const pos = POSITIONS[i % POSITIONS.length];
        const isNew = newReaction === type;
        
        return (
          <motion.div
            key={`${type}-${i}`}
            className="absolute"
            style={{
              ...pos,
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
            }}
            initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            animate={{ 
              scale: isNew ? [0, 1.3, 1] : 1, 
              opacity: 1,
              rotate: pos.rotate,
              y: isNew ? [20, -10, 0] : 0,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 15,
              delay: isNew ? 0 : i * 0.1,
            }}
          >
            <img src={REACTION_IMAGES[type]} alt={type} className="w-10 h-10 object-contain" />
          </motion.div>
        );
      })}

      {/* Animated new reaction burst */}
      {newReaction && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1.8, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4))' }}
        >
          <img src={REACTION_IMAGES[newReaction]} alt={newReaction} className="w-20 h-20 object-contain" />
        </motion.div>
      )}
    </div>
  );
}
