import { motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { ReactionType, removeReaction } from '@/services/journey-service';
import ProfileAvatar from '@/components/ProfileAvatar';

// 3D reaction assets
import clapImg from '@/assets/reactions/clap-hands.png';
import fireImg from '@/assets/reactions/fire-new.png';
import fistbumpImg from '@/assets/reactions/fistbump-hands.png';
import wowImg from '@/assets/reactions/wow.png';
import flexImg from '@/assets/reactions/flex.png';
import trophyImg from '@/assets/reactions/dumbbells.png';
import runnerImg from '@/assets/reactions/runner.png';
import energyImg from '@/assets/reactions/energy.png';
import timerImg from '@/assets/reactions/stopwatch.png';
import heartImg from '@/assets/reactions/heart-workout.png';

interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
}

interface SendReactionSheetProps {
  activityId?: string;
  currentUserId?: string;
  onReact: (type: ReactionType) => void;
  onClose: () => void;
  onViewReactions?: () => void;
  onReactionRemoved?: () => void;
  totalReactions?: number;
  reactorProfiles?: ReactorProfile[];
}

const REACTION_IMAGES: Record<ReactionType, string> = {
  heart: heartImg,
  fire: fireImg,
  clap: clapImg,
  fistbump: fistbumpImg,
  wow: wowImg,
  flex: flexImg,
  trophy: trophyImg,
  runner: runnerImg,
  energy: energyImg,
  timer: timerImg,
};

// Full grid of all 10 reactions for sending
const SEND_REACTIONS: ReactionType[] = ['fire', 'clap', 'fistbump', 'flex', 'trophy', 'runner', 'energy', 'timer', 'heart', 'wow'];

export default function SendReactionSheet({ 
  activityId,
  currentUserId,
  onReact, 
  onClose, 
  onViewReactions,
  onReactionRemoved,
  totalReactions = 0,
  reactorProfiles = []
}: SendReactionSheetProps) {
  // Find current user's reaction
  const userReaction = reactorProfiles.find(r => r.userId === currentUserId);
  
  // Group reactions by type with counts
  const reactionCounts = reactorProfiles.reduce((acc, r) => {
    if (r.reactionType) acc[r.reactionType] = (acc[r.reactionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const handleRemoveReaction = async () => {
    if (!activityId || !userReaction?.reactionType) return;
    const success = await removeReaction(activityId, userReaction.reactionType);
    if (success) {
      onReactionRemoved?.();
    }
  };

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

        {/* VIEW REACTIONS SECTION - Enhanced */}
        {totalReactions > 0 && onViewReactions && (
          <motion.div
            className="px-5 py-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {/* Header with total count */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-2xl">{totalReactions}</span>
                <span className="text-white/60 text-sm">reactions</span>
              </div>
              <button
                onClick={onViewReactions}
                className="flex items-center gap-1 text-white/60 hover:text-white/80 transition-colors min-h-[44px] min-w-[44px] justify-end"
              >
                <span className="text-sm">See all</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Reaction types strip with counts - horizontal scroll */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {Object.entries(reactionCounts).map(([type, count]) => (
                <motion.div 
                  key={type} 
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img 
                    src={REACTION_IMAGES[type as ReactionType]} 
                    alt={type} 
                    className="w-7 h-7 object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                  />
                  <span className="text-white font-semibold text-sm">{count}</span>
                </motion.div>
              ))}
            </div>

            {/* User's own reaction - easy remove */}
            {userReaction?.reactionType && (
              <motion.div 
                className="mt-3 flex items-center justify-between p-3 rounded-2xl"
                style={{ background: 'rgba(255, 255, 255, 0.06)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    src={userReaction.avatarUrl}
                    name={userReaction.displayName}
                    size={40}
                    style={{ border: '2px solid rgba(255,255,255,0.1)' }}
                  />
                  <div>
                    <span className="text-white/50 text-xs block">Your reaction</span>
                    <div className="flex items-center gap-1.5">
                      <img 
                        src={REACTION_IMAGES[userReaction.reactionType]} 
                        alt={userReaction.reactionType} 
                        className="w-6 h-6 object-contain"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                      />
                      <span className="text-white font-medium capitalize">{userReaction.reactionType}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRemoveReaction}
                  className="p-3 rounded-full bg-white/10 hover:bg-red-500/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Remove your reaction"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Divider */}
        {totalReactions > 0 && (
          <div className="mx-5 h-px bg-white/10 my-2" />
        )}

        {/* SEND REACTION SECTION - Scattered random layout */}
        <div className="px-5 pt-3 pb-6">
          <motion.span 
            className="text-white/60 text-sm font-medium block mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {userReaction?.reactionType ? 'Change your reaction' : 'Send a reaction'}
          </motion.span>

          {/* Scattered emoji layout - random positions and sizes */}
          <div className="relative h-[160px] w-full">
            {SEND_REACTIONS.map((type, i) => {
              const isUserReaction = userReaction?.reactionType === type;
              // Better spaced scattered positions with varied sizes
              const positions = [
                { left: '0%', top: '0%', rotate: -12, size: 48 },
                { left: '18%', top: '55%', rotate: 8, size: 44 },
                { left: '35%', top: '5%', rotate: -5, size: 52 },
                { left: '55%', top: '60%', rotate: 10, size: 40 },
                { left: '75%', top: '8%', rotate: -8, size: 46 },
                { left: '5%', top: '70%', rotate: 15, size: 42 },
                { left: '28%', top: '35%', rotate: -10, size: 50 },
                { left: '48%', top: '30%', rotate: 5, size: 38 },
                { left: '68%', top: '50%', rotate: -6, size: 54 },
                { left: '85%', top: '40%', rotate: 12, size: 44 },
              ];
              const pos = positions[i] || positions[0];
              
              return (
                <motion.button
                  key={type}
                  onClick={() => isUserReaction ? handleRemoveReaction() : onReact(type)}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    minWidth: 44,
                    minHeight: 44,
                  }}
                  initial={{ opacity: 0, scale: 0, rotate: pos.rotate - 30 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    rotate: pos.rotate,
                  }}
                  transition={{ 
                    delay: 0.08 + i * 0.035, 
                    type: 'spring', 
                    stiffness: 400,
                    damping: 18,
                  }}
                  whileHover={{ scale: 1.2, rotate: 0 }}
                  whileTap={{ scale: 0.85 }}
                >
                  <div className="relative">
                    <img 
                      src={REACTION_IMAGES[type]} 
                      alt={type} 
                      style={{ 
                        width: pos.size,
                        height: pos.size,
                        objectFit: 'contain',
                        filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`,
                      }}
                    />
                    {/* Small X badge on user's reaction */}
                    {isUserReaction && (
                      <motion.div 
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                        style={{ 
                          border: '1.5px solid rgba(255,255,255,0.3)',
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <X className="w-3 h-3 text-white" strokeWidth={2.5} />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}
