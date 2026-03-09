import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactionType, ActivityReaction, removeReaction } from '@/services/journey-service';
import { supabase } from '@/integrations/supabase/client';
import ProfileAvatar from '@/components/ProfileAvatar';
import { formatDistanceToNow } from 'date-fns';
import { ALL_REACTION_IMAGES } from '@/lib/reaction-images';

interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
  createdAt?: string;
}

// Extended type with guaranteed reactionType for internal use
interface ReactorWithReaction extends ReactorProfile {
  reactionType: ReactionType;
  createdAt?: string;
}

interface ReactsSoFarSheetProps {
  activityId: string;
  total: number;
  reactions: Partial<Record<ReactionType, ActivityReaction>>;
  reactorProfiles: ReactorProfile[];
  onClose: () => void;
  onReactionRemoved?: () => void;
}

const REACTION_IMAGES = ALL_REACTION_IMAGES;

// Format time ago (e.g., "2h ago", "3d ago")
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return '';
  }
}

// Map reactors to their reactions - use actual reaction type from each reactor entry
function getReactorReactions(reactors: ReactorProfile[]): ReactorWithReaction[] {
  // Filter out any reactors without a reaction type (safety check)
  return reactors
    .filter((reactor): reactor is ReactorWithReaction => !!reactor.reactionType)
    .map(reactor => ({
      ...reactor,
      reactionType: reactor.reactionType,
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

  const reactorList = getReactorReactions(localReactors);

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
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: 70 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <motion.div
        className="fixed left-0 right-0 overflow-hidden"
        style={{
          zIndex: 71,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          background: 'linear-gradient(180deg, rgba(60, 55, 65, 0.98) 0%, rgba(40, 35, 45, 0.98) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          maxHeight: '60vh',
          paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
          bottom: 0,
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
            {String(reactorList.length).padStart(2, '0')}
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

                  {/* Name + time ago */}
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium text-lg block truncate">
                      {reactor.displayName}
                    </span>
                    <span className="text-white/50 text-xs">
                      {isOwnReaction ? 'You • ' : ''}{formatTimeAgo(reactor.createdAt)}
                    </span>
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
