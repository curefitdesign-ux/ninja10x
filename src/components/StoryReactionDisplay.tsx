import { motion } from 'framer-motion';
import { ReactionType, ActivityReaction } from '@/services/journey-service';

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

interface StoryReactionDisplayProps {
  reactions: Record<ReactionType, ActivityReaction>;
  totalCount: number;
}

export default function StoryReactionDisplay({ reactions, totalCount }: StoryReactionDisplayProps) {
  // Get non-zero reactions sorted by count
  const activeReactions = Object.entries(reactions)
    .filter(([, r]) => r.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  if (totalCount === 0) {
    return (
      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="text-white/50 text-sm">No reactions yet</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2.5 rounded-full"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Stacked reaction images display */}
      <div className="flex items-center -space-x-2">
        {activeReactions.map(([type], index) => (
          <motion.div
            key={type}
            className="relative flex items-center justify-center w-8 h-8"
            style={{
              zIndex: 10 - index,
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <img 
              src={REACTION_IMAGES[type as ReactionType]} 
              alt={type}
              className="w-7 h-7 object-contain"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Total count */}
      <motion.span
        className="font-semibold text-white text-lg ml-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {totalCount}
      </motion.span>
      <span className="text-white/60 text-sm">
        {totalCount === 1 ? 'reaction' : 'reactions'}
      </span>
    </motion.div>
  );
}
