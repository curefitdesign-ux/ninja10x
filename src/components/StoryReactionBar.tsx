import { motion } from 'framer-motion';
import { useWebHaptics } from 'web-haptics/react';
import { ReactionType } from '@/services/journey-service';

// Import 3D reaction images
import fireImg from '@/assets/reactions/fire-3d.png';
import clapImg from '@/assets/reactions/clap-3d.png';
import fistbumpImg from '@/assets/reactions/fistbump.png';
import wowImg from '@/assets/reactions/wow.png';

interface StoryReactionBarProps {
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
}

const REACTIONS: { type: ReactionType; image: string; label: string }[] = [
  { type: 'fire', image: fireImg, label: 'Fire' },
  { type: 'wow', image: wowImg, label: 'Wow' },
  { type: 'clap', image: clapImg, label: 'Clap' },
  { type: 'fistbump', image: fistbumpImg, label: 'Fist bump' },
];

export default function StoryReactionBar({ onReact, disabled }: StoryReactionBarProps) {
  return (
    <motion.div
      className="flex items-center justify-center gap-2 px-4 py-3 rounded-full"
      style={{
        background: 'rgba(60, 55, 70, 0.85)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {REACTIONS.map((reaction, index) => (
        <motion.button
          key={reaction.type}
          onClick={() => !disabled && onReact(reaction.type)}
          className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.04, type: 'spring', stiffness: 400 }}
          whileHover={{ scale: 1.15, background: 'rgba(255, 255, 255, 0.12)' }}
          whileTap={{ scale: 0.85 }}
          disabled={disabled}
          aria-label={reaction.label}
        >
          <img src={reaction.image} alt={reaction.label} className="w-8 h-8 object-contain" />
        </motion.button>
      ))}
    </motion.div>
  );
}
