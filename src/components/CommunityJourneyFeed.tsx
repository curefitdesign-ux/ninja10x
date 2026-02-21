import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { fetchAllActivitiesGroupedByUser, type UserStoryGroup, type LocalActivity } from '@/hooks/use-journey-activities';
import ProfileAvatar from '@/components/ProfileAvatar';

interface CommunityJourneyFeedProps {
  /** Current user's own photos (from useJourneyActivities) */
  myPhotos: { id: string; storageUrl: string; originalUrl?: string; isVideo?: boolean; activity?: string; frame?: string; dayNumber: number }[];
  onPhotoTap?: (photo: any) => void;
}

/**
 * A single user's stacked card — shows up to 3 activities from their active week,
 * stacked with the latest on top. Avatar at bottom.
 */
const UserStackedCard = ({
  group,
  isOwn,
  index,
  onTap,
}: {
  group: UserStoryGroup;
  isOwn: boolean;
  index: number;
  onTap: () => void;
}) => {
  // Get active week: find the latest week that has activities
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
  
  // Always build 3 slots for the active week, fill with activity or null
  const latestDay = group.activities.length > 0
    ? Math.max(...group.activities.map(a => a.dayNumber))
    : 0;
  const activeWeek = latestDay > 0 ? Math.ceil(latestDay / 3) : 1;
  const weekStart = (activeWeek - 1) * 3 + 1;
  
  const slots: (LocalActivity | null)[] = [0, 1, 2].map(i => {
    const dayNum = weekStart + i;
    return weekActivities.find(a => a.dayNumber === dayNum) || null;
  });
  // Reverse so latest is on top (index 0 = top card)
  const cards = [...slots].reverse();

  const cardWidth = 90;
  const cardHeight = 128;

  return (
    <motion.button
      className="flex-shrink-0 flex flex-col items-center gap-2"
      style={{ width: cardWidth + 16 }}
      onClick={onTap}
      whileTap={{ scale: 0.96 }}
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Stacked cards - always 3 */}
      <div className="relative" style={{ width: cardWidth, height: cardHeight + 12 }}>
        {cards.map((activity, idx) => {
          const stackStyles: Record<number, React.CSSProperties> = {
            0: { zIndex: 3, transform: 'rotate(0deg) translateY(0px)' },
            1: { zIndex: 2, transform: 'rotate(-5deg) translateX(-6px) translateY(5px)' },
            2: { zIndex: 1, transform: 'rotate(5deg) translateX(6px) translateY(9px)' },
          };
          const style = stackStyles[idx] || stackStyles[2];

          if (!activity) {
            return (
              <div
                key={`empty-${idx}`}
                className="absolute inset-0 rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  ...style,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px dashed rgba(255,255,255,0.12)',
                }}
              >
                {idx === 0 && (
                  <span className="text-white/20 text-[9px] font-medium">Not logged</span>
                )}
              </div>
            );
          }

          return (
            <motion.div
              key={activity.id}
              layoutId={idx === 0 ? `story-card-${group.userId}` : undefined}
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{
                ...style,
                border: isOwn && idx === 0
                  ? '2px solid rgba(52,211,153,0.5)'
                  : idx === 0 ? '1.5px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isOwn && idx === 0
                  ? '0 8px 30px rgba(52,211,153,0.2), 0 0 16px rgba(52,211,153,0.15)'
                  : idx === 0
                    ? '0 8px 24px rgba(0,0,0,0.4)'
                    : '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src={activity.storageUrl}
                alt={activity.activity || 'Activity'}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5) 100%)' }}
                />
              )}
              {idx === 0 && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5" style={{ zIndex: 5 }}>
                  <p className="text-[8px] text-white/60 font-medium">Week {Math.ceil(activity.dayNumber / 3)}</p>
                  <p className="text-[9px] text-white font-semibold truncate">{activity.activity || 'Activity'}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Avatar + name below */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: 36,
            height: 36,
            border: isOwn
              ? '2px solid rgba(52,211,153,0.6)'
              : '2px solid rgba(255,255,255,0.15)',
            boxShadow: isOwn
              ? '0 0 12px rgba(52,211,153,0.3)'
              : '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <ProfileAvatar
            src={group.avatarUrl}
            name={group.displayName || 'User'}
            size={32}
          />
        </div>
        <span className="text-[10px] text-white/60 font-medium truncate max-w-[80px]">
          {isOwn ? 'You' : group.displayName?.split(' ')[0] || 'User'}
        </span>
      </div>
    </motion.button>
  );
};

const CommunityJourneyFeed = ({ myPhotos, onPhotoTap }: CommunityJourneyFeedProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<UserStoryGroup[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchAllActivitiesGroupedByUser().then(data => {
      setGroups(data);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  const handleUserTap = (group: UserStoryGroup) => {
    // Navigate to reel viewer with this user's activities
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
    <div className="px-2">
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {groups.map((group, idx) => (
          <UserStackedCard
            key={group.userId}
            group={group}
            isOwn={user?.id === group.userId}
            index={idx}
            onTap={() => handleUserTap(group)}
          />
        ))}

        {groups.length === 0 && (
          <div className="flex items-center justify-center w-full py-12">
            <p className="text-white/30 text-sm">No activities yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityJourneyFeed;
