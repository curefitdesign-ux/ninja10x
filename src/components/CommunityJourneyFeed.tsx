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
}

const UserStackedCard = ({
  group,
  isOwn,
  index,
  isLocked,
  onTap,
}: {
  group: UserStoryGroup;
  isOwn: boolean;
  index: number;
  isLocked: boolean;
  onTap: () => void;
}) => {
  const getActiveWeekActivities = (activities: LocalActivity[]): LocalActivity[] => {
    if (activities.length === 0) return [];
    const sorted = [...activities].sort((a, b) => a.dayNumber - b.dayNumber);
    const latestDay = sorted[sorted.length - 1].dayNumber;
    const activeWeek = Math.ceil(latestDay / 3);
    const weekStart = (activeWeek - 1) * 3 + 1;
    const weekEnd = activeWeek * 3;
    return sorted.filter(a => a.dayNumber >= weekStart && a.dayNumber <= weekEnd);
  };

  const weekActivities = getActiveWeekActivities(group.activities);
  const latestDay = group.activities.length > 0
    ? Math.max(...group.activities.map(a => a.dayNumber))
    : 0;
  const activeWeek = latestDay > 0 ? Math.ceil(latestDay / 3) : 1;
  const weekStart = (activeWeek - 1) * 3 + 1;

  const slots: (LocalActivity | null)[] = [0, 1, 2].map(i => {
    const dayNum = weekStart + i;
    return weekActivities.find(a => a.dayNumber === dayNum) || null;
  });
  const cards = [...slots].reverse();

  const cardWidth = 76;
  const cardHeight = 108;
  const hasNoActivities = group.activities.length === 0;

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
      <div className="relative" style={{ width: cardWidth, height: cardHeight + 10 }}>
        {cards.map((activity, idx) => {
          const stackStyles: Record<number, React.CSSProperties> = {
            0: { zIndex: 3, transform: 'rotate(0deg) translateY(0px)' },
            1: { zIndex: 2, transform: 'rotate(-5deg) translateX(-5px) translateY(4px)' },
            2: { zIndex: 1, transform: 'rotate(5deg) translateX(5px) translateY(7px)' },
          };
          const style = stackStyles[idx] || stackStyles[2];
          const isBehindCard = idx > 0;

          if (!activity) {
            const isTopEmpty = idx === 0 && isOwn && hasNoActivities;
            return (
              <div
                key={`empty-${idx}`}
                className="absolute inset-0 rounded-lg overflow-hidden flex flex-col items-center justify-center gap-1"
                style={{
                  ...style,
                  background: isTopEmpty ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)',
                  border: isTopEmpty ? '2px dashed rgba(52,211,153,0.4)' : '1px dashed rgba(255,255,255,0.12)',
                  backdropFilter: isBehindCard ? 'blur(6px)' : undefined,
                  WebkitBackdropFilter: isBehindCard ? 'blur(6px)' : undefined,
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
              className="absolute inset-0 rounded-lg overflow-hidden"
              style={{
                ...style,
                border: isOwn && idx === 0
                  ? '2px solid rgba(52,211,153,0.5)'
                  : idx === 0 ? '1.5px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isOwn && idx === 0
                  ? '0 6px 24px rgba(52,211,153,0.2), 0 0 12px rgba(52,211,153,0.15)'
                  : idx === 0
                    ? '0 6px 20px rgba(0,0,0,0.4)'
                    : '0 3px 10px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src={activity.storageUrl}
                alt={activity.activity || 'Activity'}
                className="w-full h-full object-cover"
                style={{
                  filter: isBehindCard
                    ? 'blur(4px) brightness(0.6)'
                    : isLocked && !isOwn
                      ? 'blur(12px) brightness(0.5)'
                      : 'none',
                }}
              />
              {/* Lock overlay for non-public users viewing others */}
              {isLocked && !isOwn && idx === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                  <Lock className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                  <span className="text-white/40 text-[7px] font-medium">Share to unlock</span>
                </div>
              )}
              {idx === 0 && !isLocked && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5) 100%)' }}
                />
              )}
              {idx === 0 && !isLocked && (
                <div className="absolute bottom-1 left-1 right-1" style={{ zIndex: 5 }}>
                  <p className="text-[7px] text-white/60 font-medium">Week {Math.ceil(activity.dayNumber / 3)}</p>
                  <p className="text-[8px] text-white font-semibold truncate">{activity.activity || 'Activity'}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Avatar + name — shifted up 10px to overlap card */}
      <div className="flex flex-col items-center gap-0.5" style={{ marginTop: -10 }}>
        <div
          className="rounded-full overflow-hidden"
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

const CommunityJourneyFeed = ({ myPhotos, onPhotoTap, onLogActivity }: CommunityJourneyFeedProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [groups, setGroups] = useState<UserStoryGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Privacy: user must be public to see others' content
  const isUserPublic = !!profile?.stories_public;

  useEffect(() => {
    fetchAllActivitiesGroupedByUser().then(data => {
      setGroups(data);
      setLoaded(true);
    });
  }, []);

  // Ensure own user is always present and first
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

    // Don't navigate to reel if content is locked
    if (isLocked) return;

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

    navigate('/reel', {
      state: {
        activities,
        initialIndex: 0,
        sourceUserId: group.userId,
      },
    });
  };

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {sortedGroups.map((group, idx) => {
          const isOwn = user?.id === group.userId;
          const isLocked = !isOwn && !isUserPublic && group.activities.length > 0;
          return (
            <div key={group.userId} style={{ scrollSnapAlign: 'start' }}>
              <UserStackedCard
                group={group}
                isOwn={isOwn}
                isLocked={isLocked}
                index={idx}
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
