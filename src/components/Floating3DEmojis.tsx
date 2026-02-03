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
  isPaused?: boolean;
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
// Increased scale values for bigger emojis
const EDGE_POSITIONS = [
  { top: '4%', left: '4%', rotate: -12, scale: 1.0 },
  { top: '22%', left: '2%', rotate: 10, scale: 0.95 },
  { bottom: '28%', left: '3%', rotate: -15, scale: 0.9 },
  { top: '6%', right: '4%', rotate: 14, scale: 0.98 },
  { top: '28%', right: '2%', rotate: -8, scale: 1.0 },
  { bottom: '22%', right: '3%', rotate: 12, scale: 0.92 },
  { bottom: '6%', left: '10%', rotate: 5, scale: 0.85 },
  { bottom: '5%', right: '8%', rotate: -6, scale: 0.88 },
];

export default function Floating3DEmojis({ reactions, newReaction, isPaused = false }: Floating3DEmojisProps) {
  return (
    <>
      {reactions.slice(0, 8).map((type, i) => {
        const pos = EDGE_POSITIONS[i % EDGE_POSITIONS.length];
        const asset = EMOJI_ASSETS[type];
        
        // Create unique animation delay for each emoji - staggered entrance
        const entranceDelay = 0.2 + i * 0.08;
        const animDelay = i * 0.5;
        
        return (
          <motion.div
            key={`${type}-${i}`}
            className="absolute pointer-events-none"
            style={{
              ...pos,
              zIndex: 50,
              filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.6))',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: pos.scale, 
              opacity: 1,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 20,
              delay: entranceDelay,
            }}
          >
            {/* Subtle floating animation - freezes when paused */}
            <motion.div
              animate={isPaused ? {} : {
                y: [0, -4, 0],
                rotate: [pos.rotate - 2, pos.rotate + 2, pos.rotate - 2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: animDelay,
                ease: 'easeInOut',
              }}
            >
              <img 
                src={asset} 
                alt={type} 
                className="w-12 h-12 object-contain"
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
            initial={{ scale: 0, opacity: 1, rotate: -20 }}
            animate={{ scale: [0, 2.2, 0], opacity: [1, 1, 0], rotate: [0, 15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <img 
              src={EMOJI_ASSETS[newReaction]} 
              alt={newReaction} 
              className="w-24 h-24 object-contain"
              style={{ filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.6))' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
