import { motion, AnimatePresence } from 'framer-motion';
import { ReactionType } from '@/services/journey-service';

interface StoryReactionBarProps {
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'heart', emoji: '❤️', label: 'Love' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'fistbump', emoji: '🤜🤛', label: 'Fist bump' },
  { type: 'wow', emoji: '🤩', label: 'Wow' },
];

export default function StoryReactionBar({ onReact, disabled }: StoryReactionBarProps) {
  return (
    <motion.div
      className="flex items-center justify-center gap-3 px-5 py-3 rounded-full"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
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
          className="relative flex items-center justify-center w-12 h-12 rounded-full transition-transform active:scale-90"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            fontSize: reaction.type === 'fistbump' ? '20px' : '28px',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, type: 'spring', stiffness: 400 }}
          whileHover={{ scale: 1.15, background: 'rgba(255, 255, 255, 0.12)' }}
          whileTap={{ scale: 0.85 }}
          disabled={disabled}
          aria-label={reaction.label}
        >
          {reaction.emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}
