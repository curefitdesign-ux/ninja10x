import { motion } from 'framer-motion';
import { ReactionType, ActivityReaction } from '@/services/journey-service';
import ProfileAvatar from '@/components/ProfileAvatar';

interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

interface ReactsSoFarSheetProps {
  total: number;
  reactions: Record<ReactionType, ActivityReaction>;
  reactorProfiles: ReactorProfile[];
  onClose: () => void;
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  heart: '❤️',
  fire: '🔥',
  clap: '👏',
  fistbump: '🤜🤛',
  wow: '🤩',
};

// Map reactors to their reactions
function getReactorReactions(reactors: ReactorProfile[], reactions: Record<ReactionType, ActivityReaction>) {
  const activeTypes = Object.entries(reactions)
    .filter(([, r]) => r.count > 0)
    .map(([type]) => type as ReactionType);
  
  if (activeTypes.length === 0) return [];
  
  return reactors.map((reactor, i) => ({
    ...reactor,
    reactionType: activeTypes[i % activeTypes.length],
  }));
}

export default function ReactsSoFarSheet({ total, reactions, reactorProfiles, onClose }: ReactsSoFarSheetProps) {
  const reactorList = getReactorReactions(reactorProfiles.slice(0, total), reactions);

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
            {String(total).padStart(2, '0')}
          </span>
        </div>

        {/* Reactor list */}
        <div className="px-5 pb-4 space-y-4 max-h-[40vh] overflow-y-auto">
          {reactorList.length > 0 ? (
            reactorList.map((reactor, i) => (
              <motion.div
                key={reactor.userId}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
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

                {/* Name */}
                <span className="text-white font-medium text-lg flex-1">
                  {reactor.displayName}
                </span>

                {/* Reaction emoji */}
                <span className="text-3xl">
                  {REACTION_EMOJIS[reactor.reactionType]}
                </span>
              </motion.div>
            ))
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
