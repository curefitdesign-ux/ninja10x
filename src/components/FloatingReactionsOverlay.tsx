import { motion } from 'framer-motion';
import { ReactionType } from '@/services/journey-service';

// 3D reaction images
import fire3d from '@/assets/reactions/fire-3d.png';
import clap3d from '@/assets/reactions/clap-3d.png';
import fistbump3d from '@/assets/reactions/fistbump.png';
import wow3d from '@/assets/reactions/wow.png';

const REACTION_IMAGES: Record<ReactionType, string> = {
  heart: fire3d,
  fire: fire3d,
  clap: clap3d,
  fistbump: fistbump3d,
  wow: wow3d,
};

interface FloatingReactionsOverlayProps {
  reactions: ReactionType[];
  newReaction: ReactionType | null;
}

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
            <img 
              src={REACTION_IMAGES[type]} 
              alt={type} 
              className="w-10 h-10 object-contain"
            />
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
          <img 
            src={REACTION_IMAGES[newReaction]} 
            alt={newReaction} 
            className="w-20 h-20 object-contain"
          />
        </motion.div>
      )}
    </div>
  );
}
