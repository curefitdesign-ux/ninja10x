import { motion } from 'framer-motion';
import { ReactionType } from '@/services/journey-service';

// 3D reaction assets
import fireImg from '@/assets/reactions/fire-3d.png';
import clapImg from '@/assets/reactions/clap-3d.png';
import fistbumpImg from '@/assets/reactions/fistbump.png';
import wowImg from '@/assets/reactions/wow.png';

interface SendReactionSheetProps {
  onReact: (type: ReactionType) => void;
  onClose: () => void;
  onViewReactions?: () => void;
  totalReactions?: number;
}

const REACTIONS: { type: ReactionType; image: string }[] = [
  { type: 'fire', image: fireImg },
  { type: 'fistbump', image: fistbumpImg },
  { type: 'clap', image: clapImg },
];

export default function SendReactionSheet({ onReact, onClose, onViewReactions, totalReactions = 0 }: SendReactionSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/40 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: 280,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          background: 'linear-gradient(180deg, rgba(80, 75, 85, 0.98) 0%, rgba(50, 45, 55, 0.98) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Title + View all link */}
        <div className="flex items-center justify-between py-4 px-6">
          <span className="text-white font-semibold text-xl">Send reaction</span>
          {totalReactions > 0 && onViewReactions && (
            <button 
              onClick={onViewReactions}
              className="text-white/60 text-sm hover:text-white transition-colors"
            >
              See all ({totalReactions})
            </button>
          )}
        </div>

        {/* Emoji grid */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center gap-4">
            {REACTIONS.map((reaction, i) => (
              <motion.button
                key={reaction.type}
                onClick={() => onReact(reaction.type)}
                className="flex items-center justify-center transition-transform active:scale-90"
                style={{
                  width: 100,
                  height: 100,
                }}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  delay: i * 0.06, 
                  type: 'spring', 
                  stiffness: 400,
                  damping: 15,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
              >
                <img 
                  src={reaction.image} 
                  alt={reaction.type} 
                  className="w-20 h-20 object-contain"
                />
              </motion.button>
            ))}
          </div>

          {/* WOW reaction */}
          <motion.button
            onClick={() => onReact('wow')}
            className="w-full flex justify-center mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src={wowImg} 
              alt="WOW!" 
              className="h-16 object-contain"
            />
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
