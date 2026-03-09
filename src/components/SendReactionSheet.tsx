import { useState } from 'react';

import { motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { ReactionType, removeReaction } from '@/services/journey-service';
import ProfileAvatar from '@/components/ProfileAvatar';
import { ALL_REACTION_IMAGES, CORE_REACTIONS, ACTIVITY_REACTIONS } from '@/lib/reaction-images';

interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
}

interface SendReactionSheetProps {
  activityId?: string;
  currentUserId?: string;
  activityType?: string;
  onReact: (type: ReactionType) => void;
  onClose: () => void;
  onViewReactions?: () => void;
  onReactionRemoved?: (reactionType: ReactionType) => void;
  totalReactions?: number;
  reactorProfiles?: ReactorProfile[];
}

const REACTION_IMAGES = ALL_REACTION_IMAGES;

export default function SendReactionSheet({ 
  activityId,
  currentUserId,
  activityType,
  onReact, 
  onClose, 
  onViewReactions,
  onReactionRemoved,
  totalReactions = 0,
  reactorProfiles = []
}: SendReactionSheetProps) {
  
  const [isRemoving, setIsRemoving] = useState(false);
  const [localReactorProfiles, setLocalReactorProfiles] = useState(reactorProfiles);
  
  // Use local state for reaction count
  const actualReactionCount = localReactorProfiles.length;
  
  // Find current user's reaction
  const userReaction = localReactorProfiles.find(r => r.userId === currentUserId);
  
  // Get activity-specific reactions
  const activityConfig = activityType ? ACTIVITY_REACTIONS[activityType] : null;
  const activityReactions = activityConfig?.reactions || [];
  
  const handleRemoveReaction = async () => {
    if (!activityId || !userReaction?.reactionType || isRemoving) return;
    
    const reactionType = userReaction.reactionType;
    setIsRemoving(true);
    
    try {
      const success = await removeReaction(activityId, reactionType);
      if (success) {
        setLocalReactorProfiles(prev => prev.filter(r => r.userId !== currentUserId));
        onReactionRemoved?.(reactionType);
        
        toast('Reaction removed', {
          duration: 1800,
          icon: '✕',
          style: {
            background: 'rgba(30, 30, 40, 0.9)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          },
        });
        
        onClose();
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const renderReactionButton = (type: ReactionType, i: number, offset: { dx: number; dy: number; rotate: number; size: number }, baseLeft: number, baseTop: number) => {
    const isUserReaction = userReaction?.reactionType === type;
    return (
      <motion.button
        key={type}
        onClick={() => { isUserReaction ? handleRemoveReaction() : onReact(type); }}
        className="absolute flex items-center justify-center"
        style={{
          left: `${baseLeft + offset.dx}%`,
          top: `${baseTop + offset.dy}%`,
          minWidth: 44,
          minHeight: 44,
        }}
        initial={{ opacity: 0, scale: 0, rotate: offset.rotate - 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          rotate: offset.rotate,
        }}
        transition={{ 
          delay: 0.08 + i * 0.03, 
          type: 'spring', 
          stiffness: 400,
          damping: 18,
        }}
        whileHover={{ scale: 1.15, rotate: 0 }}
        whileTap={{ scale: 0.85 }}
      >
        <div className="relative">
          <img 
            src={REACTION_IMAGES[type]} 
            alt={type} 
            style={{ 
              width: offset.size,
              height: offset.size,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
            }}
          />
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
  };

  const offsets = [
    { dx: 2, dy: 5, rotate: -8, size: 46 },
    { dx: -1, dy: -3, rotate: 6, size: 50 },
    { dx: 3, dy: 8, rotate: -4, size: 44 },
    { dx: -2, dy: 2, rotate: 10, size: 48 },
    { dx: 1, dy: -5, rotate: -6, size: 52 },
    { dx: -3, dy: 3, rotate: 8, size: 50 },
    { dx: 2, dy: -2, rotate: -10, size: 44 },
    { dx: 0, dy: 6, rotate: 5, size: 46 },
    { dx: -1, dy: -4, rotate: -5, size: 52 },
    { dx: 3, dy: 0, rotate: 12, size: 48 },
  ];

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

      {/* Bottom sheet - liquid glass design */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 overflow-y-auto"
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
          backdropFilter: 'blur(60px) saturate(180%)',
          WebkitBackdropFilter: 'blur(60px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
          maxHeight: '80vh',
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

        {/* REACTIONS SECTION - Show all users' reactions */}
        {actualReactionCount > 0 && onViewReactions && (
          <motion.div
            className="px-5 py-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-2xl">{actualReactionCount}</span>
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
            
            <div className="flex items-center gap-4 overflow-x-auto overflow-y-visible scrollbar-none pb-2 pt-2 -mt-1">
              {reactorProfiles.slice(0, 8).map((reactor, idx) => {
                const isCurrentUser = reactor.userId === currentUserId;
                return (
                  <motion.div 
                    key={reactor.userId}
                    className="flex flex-col items-center gap-1 flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 + idx * 0.03 }}
                  >
                    <div className="relative" style={{ overflow: 'visible' }}>
                      <ProfileAvatar
                        src={reactor.avatarUrl}
                        name={reactor.displayName}
                        size={44}
                        style={{ 
                          border: isCurrentUser 
                            ? '2px solid rgba(34, 197, 94, 0.6)' 
                            : '2px solid rgba(255,255,255,0.1)',
                        }}
                      />
                      {reactor.reactionType && (
                        <div className="absolute -bottom-1 -right-1">
                          <img 
                            src={REACTION_IMAGES[reactor.reactionType]} 
                            alt={reactor.reactionType} 
                            className="w-5 h-5 object-contain"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                          />
                        </div>
                      )}
                      {isCurrentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveReaction();
                          }}
                          disabled={isRemoving}
                          className="absolute flex items-center justify-center active:scale-90 transition-transform"
                          style={{ 
                            top: -14,
                            right: -14,
                            width: 44,
                            height: 44,
                            zIndex: 10,
                          }}
                        >
                          <div 
                            className="w-5 h-5 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center"
                            style={{ 
                              border: '1.5px solid rgba(255,255,255,0.4)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            }}
                          >
                            <X className="w-3 h-3 text-white" strokeWidth={2.5} />
                          </div>
                        </button>
                      )}
                    </div>
                    <span className="text-white/60 text-[10px] max-w-[50px] truncate">
                      {isCurrentUser ? 'You' : reactor.displayName.split(' ')[0]}
                    </span>
                  </motion.div>
                );
              })}
              {actualReactionCount > 8 && (
                <button
                  onClick={onViewReactions}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div 
                    className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-sm font-medium"
                    style={{ border: '2px solid rgba(255,255,255,0.1)' }}
                  >
                    +{actualReactionCount - 8}
                  </div>
                  <span className="text-white/40 text-[10px]">more</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Divider */}
        {actualReactionCount > 0 && (
          <div className="mx-5 h-px bg-white/10 my-2" />
        )}

        {/* Activity-specific reactions section */}
        {activityReactions.length > 0 && (
          <div className="px-5 pt-3 pb-2">
            <motion.span 
              className="text-white/60 text-sm font-medium block mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              {activityConfig?.label} reactions
            </motion.span>

            <div className="flex items-center justify-center gap-5 pb-2">
              {activityReactions.map((type, i) => {
                const isUserReaction = userReaction?.reactionType === type;
                return (
                  <motion.button
                    key={type}
                    onClick={() => { isUserReaction ? handleRemoveReaction() : onReact(type); }}
                    className="relative flex flex-col items-center gap-1.5"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: 0.1 + i * 0.05, 
                      type: 'spring', 
                      stiffness: 400,
                      damping: 18,
                    }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: isUserReaction 
                          ? 'rgba(249, 115, 22, 0.15)' 
                          : 'rgba(255, 255, 255, 0.06)',
                        border: isUserReaction 
                          ? '1.5px solid rgba(249, 115, 22, 0.4)' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <img 
                        src={REACTION_IMAGES[type]} 
                        alt={type} 
                        className="w-10 h-10 object-contain"
                        style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.4))' }}
                      />
                      {isUserReaction && (
                        <motion.div 
                          className="absolute -top-1 -right-1 w-5 h-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                          style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <X className="w-3 h-3 text-white" strokeWidth={2.5} />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-white/50 text-[10px] capitalize">{type.replace('-', ' ')}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider between sections */}
        {activityReactions.length > 0 && (
          <div className="mx-5 h-px bg-white/10 my-2" />
        )}

        {/* SEND REACTION SECTION - Scattered layout with subtle grid */}
        <div className="px-5 pt-3 pb-6">
          <motion.span 
            className="text-white/60 text-sm font-medium block mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {userReaction?.reactionType ? 'Change your reaction' : 'Send a reaction'}
          </motion.span>

          {/* Container with subtle grid background */}
          <div 
            className="relative h-[220px] w-full rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          >
            {/* Optically balanced 5x2 scattered layout */}
            {CORE_REACTIONS.map((type, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              const baseLeft = col * 20 + 2;
              const baseTop = row * 50 + 10;
              const offset = offsets[i] || offsets[0];
              
              return renderReactionButton(type, i, offset, baseLeft, baseTop);
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}
