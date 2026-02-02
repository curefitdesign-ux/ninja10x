import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactionType, ActivityReaction, removeReaction } from '@/services/journey-service';
import { supabase } from '@/integrations/supabase/client';
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

// Extended type with guaranteed reactionType for internal use
interface ReactorWithReaction extends ReactorProfile {
  reactionType: ReactionType;
}

interface ReactsSoFarSheetProps {
  activityId: string;
  total: number;
  reactions: Record<ReactionType, ActivityReaction>;
  reactorProfiles: ReactorProfile[];
  onClose: () => void;
  onReactionRemoved?: () => void;
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

// Map reactors to their reactions - use actual reaction type if available
function getReactorReactions(reactors: ReactorProfile[], reactions: Record<ReactionType, ActivityReaction>): ReactorWithReaction[] {
  const activeTypes = Object.entries(reactions)
    .filter(([, r]) => r.count > 0)
    .map(([type]) => type as ReactionType);
  
  if (activeTypes.length === 0) return [];
  
  return reactors.map((reactor, i) => ({
    ...reactor,
    // Use actual reaction type from reactor if available, otherwise cycle through active types
    reactionType: reactor.reactionType || activeTypes[i % activeTypes.length],
  }));
}

export default function ReactsSoFarSheet({ 
  activityId,
  total, 
  reactions, 
  reactorProfiles, 
  onClose,
  onReactionRemoved 
}: ReactsSoFarSheetProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [localReactors, setLocalReactors] = useState(reactorProfiles);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    setLocalReactors(reactorProfiles);
  }, [reactorProfiles]);

  const reactorList = getReactorReactions(localReactors.slice(0, total), reactions);

  const handleRemoveReaction = async (reactor: ReactorWithReaction) => {
    console.log('[ReactsSoFarSheet] Removing reaction:', reactor);
    
    setRemovingId(reactor.userId);
    try {
      const success = await removeReaction(activityId, reactor.reactionType);
      console.log('[ReactsSoFarSheet] Remove result:', success);
      
      if (success) {
        // Remove from local list
        setLocalReactors(prev => prev.filter(r => r.userId !== reactor.userId));
        onReactionRemoved?.();
      }
    } catch (error) {
      console.error('[ReactsSoFarSheet] Remove error:', error);
    }
    setRemovingId(null);
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
        className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          background: 'linear-gradient(180deg, rgba(60, 55, 65, 0.98) 0%, rgba(40, 35, 45, 0.98) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          maxHeight: '60vh',
          paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-white font-semibold text-lg">Reacts so far</span>
          <span className="text-white font-bold text-xl">
            {String(localReactors.length).padStart(2, '0')}
          </span>
        </div>

        {/* Reactor list */}
        <div className="px-5 pb-4 space-y-4 max-h-[40vh] overflow-y-auto">
          {reactorList.length > 0 ? (
            reactorList.map((reactor, i) => {
              const isOwnReaction = reactor.userId === currentUserId;
              const isRemoving = removingId === reactor.userId;
              
              return (
                <motion.div
                  key={reactor.userId}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isRemoving ? 0.5 : 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* Avatar with ProfileAvatar for error handling */}
                  <ProfileAvatar
                    src={reactor.avatarUrl}
                    name={reactor.displayName}
                    size={56}
                    style={{
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      flexShrink: 0,
                    }}
                  />

                  {/* Name + "You" label */}
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium text-lg block truncate">
                      {reactor.displayName}
                    </span>
                    {isOwnReaction && (
                      <span className="text-white/50 text-xs">Your reaction</span>
                    )}
                  </div>

                  {/* Reaction image */}
                  <img 
                    src={REACTION_IMAGES[reactor.reactionType]} 
                    alt={reactor.reactionType} 
                    className="w-10 h-10 object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
                  />

                  {/* Remove button for own reactions */}
                  {isOwnReaction && (
                    <button
                      onClick={() => handleRemoveReaction(reactor)}
                      disabled={isRemoving}
                      className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 transition-colors"
                      aria-label="Remove reaction"
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="text-center text-white/50 py-8">
              No reactions yet
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
