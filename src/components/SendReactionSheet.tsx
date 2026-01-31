import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ReactionType } from '@/services/journey-service';
import ProfileAvatar from '@/components/ProfileAvatar';

// 3D reaction assets
import fireImg from '@/assets/reactions/fire-3d.png';
import clapImg from '@/assets/reactions/clap-3d.png';
import fistbumpImg from '@/assets/reactions/fistbump.png';
import wowImg from '@/assets/reactions/wow.png';

interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
}

interface SendReactionSheetProps {
  onReact: (type: ReactionType) => void;
  onClose: () => void;
  onViewReactions?: () => void;
  totalReactions?: number;
  reactorProfiles?: ReactorProfile[];
}

const REACTION_IMAGES: Record<ReactionType, string> = {
  heart: fireImg,
  fire: fireImg,
  clap: clapImg,
  fistbump: fistbumpImg,
  wow: wowImg,
};

// Full grid of reactions for sending
const SEND_REACTIONS: ReactionType[] = ['fire', 'clap', 'fistbump', 'wow', 'heart'];

export default function SendReactionSheet({ 
  onReact, 
  onClose, 
  onViewReactions, 
  totalReactions = 0,
  reactorProfiles = []
}: SendReactionSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          background: 'linear-gradient(180deg, rgba(45, 42, 50, 0.98) 0%, rgba(30, 28, 35, 0.98) 100%)',
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
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* VIEW REACTIONS SECTION */}
        {totalReactions > 0 && onViewReactions && (
          <motion.button
            onClick={onViewReactions}
            className="w-full px-5 py-3 flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Reactor avatars strip with emojis */}
            <div className="flex items-center -space-x-2">
              {reactorProfiles.slice(0, 4).map((reactor, i) => (
                <div key={reactor.userId} className="relative" style={{ zIndex: 10 - i }}>
                  <ProfileAvatar
                    src={reactor.avatarUrl}
                    name={reactor.displayName}
                    size={36}
                    style={{
                      border: '2px solid rgba(45, 42, 50, 0.9)',
                    }}
                  />
                  {/* Small emoji badge on avatar */}
                  {reactor.reactionType && (
                    <img 
                      src={REACTION_IMAGES[reactor.reactionType]} 
                      alt="" 
                      className="absolute -bottom-1 -right-1 w-4 h-4 object-contain"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                    />
                  )}
                </div>
              ))}
              {totalReactions > 4 && (
                <div 
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs font-medium"
                  style={{ border: '2px solid rgba(45, 42, 50, 0.9)' }}
                >
                  +{totalReactions - 4}
                </div>
              )}
            </div>
            
            {/* Emoji strip showing reaction types */}
            <div className="flex items-center gap-1 flex-1">
              {Object.entries(
                reactorProfiles.reduce((acc, r) => {
                  if (r.reactionType) acc[r.reactionType] = (acc[r.reactionType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).slice(0, 3).map(([type]) => (
                <img 
                  key={type}
                  src={REACTION_IMAGES[type as ReactionType]} 
                  alt={type} 
                  className="w-6 h-6 object-contain"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                />
              ))}
              <span className="text-white font-semibold text-base ml-1">{totalReactions}</span>
            </div>
            
            {/* View all arrow */}
            <div className="flex items-center gap-1 text-white/50">
              <span className="text-sm">View all</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.button>
        )}

        {/* Divider */}
        {totalReactions > 0 && (
          <div className="mx-5 h-px bg-white/10 my-2" />
        )}

        {/* SEND REACTION SECTION */}
        <div className="px-5 pt-3 pb-4">
          <motion.span 
            className="text-white/60 text-sm font-medium block mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Send a reaction
          </motion.span>

          {/* Emoji grid - randomized arrangement */}
          <div className="grid grid-cols-5 gap-3">
            {SEND_REACTIONS.map((type, i) => (
              <motion.button
                key={type}
                onClick={() => onReact(type)}
                className="aspect-square flex items-center justify-center rounded-2xl transition-transform active:scale-90"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                }}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  delay: 0.15 + i * 0.04, 
                  type: 'spring', 
                  stiffness: 400,
                  damping: 18,
                }}
                whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.12)' }}
                whileTap={{ scale: 0.85 }}
              >
                <img 
                  src={REACTION_IMAGES[type]} 
                  alt={type} 
                  className="w-12 h-12 object-contain"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
                />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
