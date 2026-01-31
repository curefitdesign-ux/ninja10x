import { motion, AnimatePresence } from 'framer-motion';
import { ReactionType } from '@/services/journey-service';

// Use consistent 3D emoji assets
import clapEmoji from '@/assets/reactions/clap-3d.png';
import fireEmoji from '@/assets/reactions/fire-3d.png';
import fistbumpEmoji from '@/assets/reactions/fistbump.png';
import wowEmoji from '@/assets/reactions/wow.png';

interface Floating3DEmojisProps {
  reactions: ReactionType[];
  newReaction: ReactionType | null;
}

const EMOJI_ASSETS: Record<ReactionType, string> = {
  heart: fireEmoji, // Use fire as fallback for heart
  fire: fireEmoji,
  clap: clapEmoji,
  fistbump: fistbumpEmoji,
  wow: wowEmoji,
};

// Positions around the viewport edges for floating emojis
const EDGE_POSITIONS = [
  { top: '12%', left: '-4%', rotate: -15, scale: 0.9 },
  { top: '35%', left: '-6%', rotate: 10, scale: 1.1 },
  { bottom: '35%', left: '-5%', rotate: -20, scale: 0.85 },
  { top: '10%', right: '-3%', rotate: 15, scale: 0.95 },
  { top: '40%', right: '-4%', rotate: -10, scale: 1.05 },
  { bottom: '25%', right: '-5%', rotate: 20, scale: 0.9 },
  { bottom: '15%', left: '10%', rotate: 5, scale: 0.8 },
  { bottom: '12%', right: '8%', rotate: -8, scale: 0.85 },
];

export default function Floating3DEmojis({ reactions, newReaction }: Floating3DEmojisProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {reactions.slice(0, 8).map((type, i) => {
        const pos = EDGE_POSITIONS[i % EDGE_POSITIONS.length];
        const isNew = newReaction === type;
        const asset = EMOJI_ASSETS[type];
        
        // Create unique animation delay for each emoji
        const animDelay = i * 0.5;
        
        return (
          <motion.div
            key={`${type}-${i}`}
            className="absolute"
            style={{
              ...pos,
              filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))',
            }}
            initial={isNew ? { scale: 0, opacity: 0, rotate: pos.rotate - 30 } : { scale: pos.scale, opacity: 1, rotate: pos.rotate }}
            animate={{ 
              scale: isNew ? [0, pos.scale * 1.3, pos.scale] : pos.scale, 
              opacity: 1,
              rotate: pos.rotate,
              y: isNew ? [30, -15, 0] : 0,
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 350, 
              damping: 18,
              delay: isNew ? 0 : i * 0.08,
            }}
          >
            {/* Attention-grabbing floating animation wrapper */}
            <motion.div
              animate={{
                y: [0, -6, 0, -3, 0],
                rotate: [0, -8, 0, 5, 0],
                scale: [1, 1.1, 1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: animDelay + 2,
                ease: 'easeInOut',
              }}
            >
              <img 
                src={asset} 
                alt={type} 
                className="w-14 h-14 object-contain"
              />
            </motion.div>
            
            {/* Subtle glow pulse behind emoji */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none -z-10"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
                transform: 'scale(1.5)',
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [1.2, 1.8, 1.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: animDelay + 3,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        );
      })}

      {/* Large burst animation for new reaction */}
      <AnimatePresence>
        {newReaction && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 2, 0], opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ filter: 'drop-shadow(0 12px 32px rgba(0, 0, 0, 0.5))' }}
          >
            <img 
              src={EMOJI_ASSETS[newReaction]} 
              alt={newReaction} 
              className="w-24 h-24 object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
