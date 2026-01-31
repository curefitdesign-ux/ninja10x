import { motion } from 'framer-motion';

// 3D reaction images
import fire3d from '@/assets/reactions/fire-3d.png';
import clap3d from '@/assets/reactions/clap-3d.png';
import fistbump3d from '@/assets/reactions/fistbump.png';
import wow3d from '@/assets/reactions/wow.png';

const REACTION_IMAGES: Record<string, string> = {
  fire: fire3d,
  clap: clap3d,
  fistbump: fistbump3d,
  wow: wow3d,
  heart: fire3d,
};

// Edge positions for floating reactions - relative to card
const EDGE_POSITIONS = [
  { top: '-8px', right: '-6px', baseRotate: 15 },
  { bottom: '20%', left: '-10px', baseRotate: -12 },
  { top: '25%', right: '-8px', baseRotate: 8 },
  { bottom: '-6px', right: '20%', baseRotate: -5 },
  { top: '45%', left: '-8px', baseRotate: 10 },
];

interface FloatingCardReactionsProps {
  reactions: string[]; // Array of reaction types
  size?: 'sm' | 'md' | 'lg';
}

export default function FloatingCardReactions({ 
  reactions, 
  size = 'md' 
}: FloatingCardReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  // Take up to 3 unique reactions
  const uniqueReactions = [...new Set(reactions)].slice(0, 3);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 25 }}>
      {uniqueReactions.map((reactionType, index) => {
        const pos = EDGE_POSITIONS[index % EDGE_POSITIONS.length];
        const imageSrc = REACTION_IMAGES[reactionType] || fire3d;
        
        // Each reaction gets unique animation timing
        const animationDelay = index * 0.4;
        const floatDuration = 3 + index * 0.5;
        
        return (
          <motion.div
            key={`${reactionType}-${index}`}
            className="absolute"
            style={{
              ...pos,
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 20,
              delay: animationDelay,
            }}
          >
            {/* Floating and rotating animation */}
            <motion.img
              src={imageSrc}
              alt={reactionType}
              className={`${sizeClasses[size]} object-contain`}
              animate={{
                y: [0, -4, 0, 2, 0],
                x: [0, 2, 0, -2, 0],
                rotate: [pos.baseRotate, pos.baseRotate + 8, pos.baseRotate, pos.baseRotate - 6, pos.baseRotate],
                scale: [1, 1.08, 1, 1.05, 1],
              }}
              transition={{
                duration: floatDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: animationDelay,
              }}
            />
            
            {/* Subtle glow pulse behind reaction */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
                transform: 'scale(1.5)',
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1.3, 1.6, 1.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: animationDelay + 0.5,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
