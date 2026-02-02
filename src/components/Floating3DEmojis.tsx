import { motion, AnimatePresence } from 'framer-motion';
import { ReactionType } from '@/services/journey-service';

// 3D reaction assets
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

interface Floating3DEmojisProps {
  reactions: ReactionType[];
  newReaction: ReactionType | null;
}

const EMOJI_ASSETS: Record<ReactionType, string> = {
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

// Positions INSIDE the story image border - on the edges but within bounds
const EDGE_POSITIONS = [
  { top: '5%', left: '5%', rotate: -12, scale: 0.7 },
  { top: '25%', left: '3%', rotate: 10, scale: 0.75 },
  { bottom: '30%', left: '4%', rotate: -15, scale: 0.65 },
  { top: '8%', right: '5%', rotate: 14, scale: 0.72 },
  { top: '30%', right: '3%', rotate: -8, scale: 0.78 },
  { bottom: '25%', right: '4%', rotate: 12, scale: 0.68 },
  { bottom: '8%', left: '12%', rotate: 5, scale: 0.6 },
  { bottom: '6%', right: '10%', rotate: -6, scale: 0.65 },
];

export default function Floating3DEmojis({ reactions, newReaction }: Floating3DEmojisProps) {
  return (
    <>
      {reactions.slice(0, 8).map((type, i) => {
        const pos = EDGE_POSITIONS[i % EDGE_POSITIONS.length];
        const isNew = newReaction === type;
        const asset = EMOJI_ASSETS[type];
        
        // Create unique animation delay for each emoji - staggered entrance
        const entranceDelay = 0.4 + i * 0.1;
        const animDelay = i * 0.6;
        
        return (
          <motion.div
            key={`${type}-${i}`}
            className="absolute pointer-events-none"
            style={{
              ...pos,
              zIndex: 50,
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
            }}
            initial={{ scale: 0, opacity: 0, rotate: pos.rotate - 30 }}
            animate={{ 
              scale: isNew ? [0, pos.scale * 1.4, pos.scale] : pos.scale, 
              opacity: 1,
              rotate: pos.rotate,
              y: isNew ? [20, -10, 0] : 0,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 350, 
              damping: 22,
              delay: isNew ? 0 : entranceDelay,
            }}
          >
            {/* Attention-grabbing floating animation wrapper */}
            <motion.div
              animate={{
                y: [0, -5, 0, -3, 0],
                rotate: [0, -6, 0, 4, 0],
                scale: [1, 1.12, 1, 1.06, 1],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                repeatDelay: animDelay + 1.5,
                ease: 'easeInOut',
              }}
            >
              <img 
                src={asset} 
                alt={type} 
                className="w-11 h-11 object-contain"
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Large burst animation for new reaction */}
      <AnimatePresence>
        {newReaction && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ zIndex: 60 }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.8, 0], opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <img 
              src={EMOJI_ASSETS[newReaction]} 
              alt={newReaction} 
              className="w-20 h-20 object-contain"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
