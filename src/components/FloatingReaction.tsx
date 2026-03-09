import { motion } from 'framer-motion';
import { ReactionType } from '@/services/journey-service';
import { ALL_REACTION_IMAGES } from '@/lib/reaction-images';

interface FloatingReactionProps {
  type: ReactionType;
  onComplete: () => void;
}

const REACTION_IMAGES = ALL_REACTION_IMAGES;

export default function FloatingReaction({ type, onComplete }: FloatingReactionProps) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ 
          scale: [0, 1.5, 1.2], 
          rotate: [-15, 10, 0],
          y: [0, -50, -80],
        }}
        transition={{ 
          duration: 0.6, 
          times: [0, 0.4, 1],
          ease: 'easeOut' 
        }}
        style={{
          filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.4))',
        }}
      >
        <img src={REACTION_IMAGES[type]} alt={type} className="w-24 h-24 object-contain" />
      </motion.div>
    </motion.div>
  );
}
