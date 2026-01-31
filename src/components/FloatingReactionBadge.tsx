import { motion } from 'framer-motion';

// Reaction emoji images
import fireImg from '@/assets/reactions/fire-cool.png';
import clapImg from '@/assets/reactions/clap.png';
import fistbumpImg from '@/assets/reactions/fistbump.png';
import wowImg from '@/assets/reactions/wow.png';

const REACTION_IMAGES: Record<string, string> = {
  fire: fireImg,
  clap: clapImg,
  fistbump: fistbumpImg,
  wow: wowImg,
  heart: fireImg, // fallback
};

interface FloatingReactionBadgeProps {
  reactionType?: string;
  count: number;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-center' | 'top-right';
  showAttentionAnimation?: boolean;
}

export default function FloatingReactionBadge({ 
  reactionType, 
  count, 
  size = 'md',
  position = 'bottom-right',
  showAttentionAnimation = true,
}: FloatingReactionBadgeProps) {
  if (count <= 0) return null;

  const sizeClasses = {
    sm: { badge: 'px-1.5 py-0.5', emoji: 'w-3 h-3', text: 'text-[10px]' },
    md: { badge: 'px-2 py-1', emoji: 'w-4 h-4', text: 'text-xs' },
    lg: { badge: 'px-2.5 py-1.5', emoji: 'w-5 h-5', text: 'text-sm' },
  };

  const positionClasses = {
    'bottom-right': '-bottom-2 -right-2',
    'bottom-center': '-bottom-3 left-1/2 -translate-x-1/2',
    'top-right': '-top-2 -right-2',
  };

  const emojiSrc = reactionType && REACTION_IMAGES[reactionType] 
    ? REACTION_IMAGES[reactionType] 
    : fireImg;

  return (
    <motion.div
      className={`absolute z-30 flex items-center gap-1 rounded-full ${positionClasses[position]} ${sizeClasses[size].badge}`}
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(251, 191, 36, 0.15)',
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
        delay: 0.1,
      }}
    >
      {/* Floating emoji with subtle bounce */}
      <motion.img 
        src={emojiSrc} 
        alt={reactionType || 'reaction'} 
        className={`${sizeClasses[size].emoji} object-contain`}
        animate={showAttentionAnimation ? {
          y: [0, -2, 0],
          rotate: [0, -5, 5, 0],
          scale: [1, 1.1, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
      />
      
      {/* Count with subtle pulse */}
      <motion.span 
        className={`text-white/90 font-semibold ${sizeClasses[size].text}`}
        animate={showAttentionAnimation ? {
          opacity: [0.9, 1, 0.9],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
      >
        +{count}
      </motion.span>

      {/* Attention glow ring - periodic pulse */}
      {showAttentionAnimation && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: '2px solid rgba(251, 191, 36, 0.5)',
          }}
          initial={{ opacity: 0, scale: 1 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [1, 1.4, 1.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 4,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
}
