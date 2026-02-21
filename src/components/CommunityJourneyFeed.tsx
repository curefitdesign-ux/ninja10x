import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { fetchAllActivitiesGroupedByUser, type UserStoryGroup, type LocalActivity } from '@/hooks/use-journey-activities';
import ProfileAvatar from '@/components/ProfileAvatar';


interface CommunityJourneyFeedProps {
  myPhotos: { id: string; storageUrl: string; originalUrl?: string; isVideo?: boolean; activity?: string; frame?: string; dayNumber: number }[];
  onPhotoTap?: (photo: any) => void;
  onLogActivity?: () => void;
  onLockedTap?: () => void;
}

// Liquid glass style for each card
const liquidGlassCard: React.CSSProperties = {
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.1)',
};

const UserStackedCard = ({
  group,
  isOwn,
  index,
  isLocked,
  onTap,
  needsUpload,
}: {
  group: UserStoryGroup;
  isOwn: boolean;
  index: number;
  isLocked: boolean;
  onTap: () => void;
  needsUpload: boolean;
}) => {
  const getDisplayActivities = (activities: LocalActivity[]): (LocalActivity | null)[] => {
    if (activities.length === 0) return [null, null, null];
    // For all users: show latest logged activities first (top card = most recent)
    const sorted = [...activities].sort((a, b) => b.dayNumber - a.dayNumber);
    const top3: (LocalActivity | null)[] = sorted.slice(0, 3);
    while (top3.length < 3) top3.push(null);
    return top3;
  };

  const cards = getDisplayActivities(group.activities);
  const cardWidth = 68;
  const cardHeight = 96;
  const hasNoActivities = group.activities.length === 0;

  // Never show upload overlay on stacked cards if activity is already logged
  const showUploadOverlay = false;

  return (
    <motion.button
      className="flex-shrink-0 flex flex-col items-center"
      style={{ width: cardWidth + 12, gap: 0 }}
      onClick={onTap}
      whileTap={{ scale: 0.96 }}
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Stacked cards */}
      <div className="relative" style={{ width: cardWidth, height: cardHeight + 12 }}>
        {cards.map((activity, idx) => {
          const stackStyles: Record<number, React.CSSProperties> = {
            0: { zIndex: 3, transform: 'translateY(0px) scale(1)' },
            1: { zIndex: 2, transform: 'translateY(-6px) scale(0.94)' },
            2: { zIndex: 1, transform: 'translateY(-11px) scale(0.88)' },
          };
          const style = stackStyles[idx] || stackStyles[2];

          if (!activity) {
            const isTopEmpty = idx === 0 && isOwn && hasNoActivities;
            return (
              <div
                key={`empty-${idx}`}
                className="absolute inset-x-0 bottom-0 rounded-md overflow-hidden flex flex-col items-center justify-center gap-1"
                style={{
                  ...style,
                  height: cardHeight,
                  ...liquidGlassCard,
                  background: isTopEmpty ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)',
                  border: isTopEmpty ? '2px dashed rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {isTopEmpty ? (
                  <motion.div
                    className="flex flex-col items-center gap-1"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Plus className="w-5 h-5 text-emerald-400/70" strokeWidth={2} />
                    <span className="text-emerald-400/60 text-[8px] font-semibold">Log Activity</span>
                  </motion.div>
                ) : idx === 0 ? (
                  <span className="text-white/20 text-[8px] font-medium">Not logged</span>
                ) : null}
              </div>
            );
          }

          return (
            <motion.div
              key={activity.id}
              layoutId={idx === 0 ? `story-card-${group.userId}` : undefined}
              className="absolute inset-x-0 bottom-0 rounded-md overflow-hidden"
              style={{
                ...style,
                height: cardHeight,
                border: isOwn && idx === 0
                  ? '2px solid rgba(52,211,153,0.5)'
                  : '1px solid rgba(255,255,255,0.12)',
                boxShadow: isOwn && idx === 0
                  ? '0 4px 16px rgba(52,211,153,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src={activity.storageUrl}
                alt={activity.activity || 'Activity'}
                className="w-full h-full object-cover"
                style={{
                  filter: isLocked
                    ? 'blur(10px) brightness(0.5)'
                    : idx > 0
                      ? 'brightness(0.85)'
                      : 'none',
                }}
              />
              {/* Lock overlay on locked stories */}
              {isLocked && idx === 0 && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                >
                  <Lock className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                </div>
              )}
              {/* Upload overlay for next day */}
              {showUploadOverlay && idx === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.45)', zIndex: 6 }}
                >
                  <motion.div
                    className="flex flex-col items-center gap-1"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(52,211,153,0.2)',
                        border: '1.5px solid rgba(52,211,153,0.5)',
                      }}
                    >
                      <Plus className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-emerald-400/80 text-[7px] font-semibold">Log Day</span>
                  </motion.div>
                </div>
              )}
              {idx === 0 && !isLocked && !showUploadOverlay && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5) 100%)' }}
                />
              )}
              {idx === 0 && !isLocked && !showUploadOverlay && (
                <div className="absolute bottom-1 left-1 right-1" style={{ zIndex: 5 }}>
                  <p className="text-[8px] text-white font-semibold truncate">{activity.activity || 'Activity'}</p>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Removed green + badge — no longer needed */}
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-0.5 relative" style={{ marginTop: -10 }}>
        <div
          className="rounded-full overflow-hidden relative"
          style={{
            width: 32,
            height: 32,
            border: isOwn
              ? '2px solid rgba(52,211,153,0.6)'
              : '2px solid rgba(255,255,255,0.15)',
            boxShadow: isOwn
              ? '0 0 10px rgba(52,211,153,0.3)'
              : '0 2px 6px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        >
          <ProfileAvatar
            src={group.avatarUrl}
            name={group.displayName || 'User'}
            size={28}
          />
        </div>
        <span className="text-[9px] text-white/60 font-medium truncate max-w-[70px]">
          {isOwn ? 'You' : group.displayName?.split(' ')[0] || 'User'}
        </span>
      </div>
    </motion.button>
  );
};

const CommunityJourneyFeed = ({ myPhotos, onPhotoTap, onLogActivity, onLockedTap }: CommunityJourneyFeedProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [groups, setGroups] = useState<UserStoryGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isUserPublic = !!profile?.stories_public;

  useEffect(() => {
    fetchAllActivitiesGroupedByUser().then(data => {
      setGroups(data);
      setLoaded(true);
    });
  }, []);

  const sortedGroups = (() => {
    if (!user) return groups;
    const myIdx = groups.findIndex(g => g.userId === user.id);
    if (myIdx >= 0) {
      const own = groups[myIdx];
      const others = groups.filter((_, i) => i !== myIdx);
      return [own, ...others];
    }
    const ownGroup: UserStoryGroup = {
      userId: user.id,
      displayName: profile?.display_name || 'You',
      avatarUrl: profile?.avatar_url || '',
      activities: [],
    };
    return [ownGroup, ...groups];
  })();

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  const handleUserTap = (group: UserStoryGroup, isLocked: boolean) => {
    const isOwn = user?.id === group.userId;
    if (group.activities.length === 0) {
      if (isOwn && onLogActivity) {
        onLogActivity();
      }
      return;
    }

    // Locked: trigger parent's make-public sheet
    if (isLocked) {
      onLockedTap?.();
      return;
    }

    const activities = group.activities.map(a => ({
      id: a.id,
      user_id: a.userId || '',
      storage_url: a.storageUrl,
      original_url: a.originalUrl || null,
      is_video: a.isVideo || false,
      activity: a.activity || null,
      frame: a.frame || null,
      duration: a.duration || null,
      pr: a.pr || null,
      day_number: a.dayNumber,
      is_public: a.isPublic || false,
      created_at: a.createdAt || '',
      updated_at: '',
      reaction_count: a.reactionCount || 0,
      user_reacted: false,
    }));

    // Navigate to reel with the specific user's first activity for deep-linking
    const latestActivity = group.activities[0];
    navigate('/reel', {
      state: {
        activities,
        initialIndex: 0,
        sourceUserId: group.userId,
        activityId: latestActivity?.id,
      },
    });
  };

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: 'x mandatory', paddingLeft: '5%', paddingRight: 16 }}
      >
        {sortedGroups.map((group, idx) => {
          const isOwn = user?.id === group.userId;
          const isLocked = !isOwn && !isUserPublic && group.activities.length > 0;
          // Own user needs upload if they have activities but haven't completed the current week slot
          const ownNeedsUpload = isOwn && group.activities.length > 0 && group.activities.length < 12;
          return (
            <div key={group.userId} style={{ scrollSnapAlign: 'start' }}>
              <UserStackedCard
                group={group}
                isOwn={isOwn}
                isLocked={isLocked}
                index={idx}
                needsUpload={ownNeedsUpload}
                onTap={() => handleUserTap(group, isLocked)}
              />
            </div>
          );
        })}

        {sortedGroups.length === 0 && (
          <div className="flex items-center justify-center w-full py-12">
            <p className="text-white/30 text-sm">No activities yet. Be the first!</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default CommunityJourneyFeed;