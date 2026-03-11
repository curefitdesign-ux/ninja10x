import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { fetchPublicFeed, LocalActivity } from '@/hooks/use-journey-activities';
import { useAuth } from '@/hooks/use-auth';
import ProfileAvatar from '@/components/ProfileAvatar';
import { isVideoUrl } from '@/lib/media';

interface UserStoryGroup {
  userId: string;
  displayName: string;
  avatarUrl: string;
  latest: LocalActivity;
  previous: LocalActivity[]; // up to 2 older activities for stacking
}

const CommunityStoriesScroll = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stories, setStories] = useState<LocalActivity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchPublicFeed(false).then((feed) => {
      const others = feed
        .filter((a) => a.userId !== user?.id && a.dayNumber < 1001)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setStories(others);
      setLoaded(true);
    });
  }, [user?.id]);

  // Group stories by user, take latest + up to 2 previous
  const userGroups = useMemo<UserStoryGroup[]>(() => {
    const map = new Map<string, LocalActivity[]>();
    for (const s of stories) {
      if (!map.has(s.userId)) map.set(s.userId, []);
      map.get(s.userId)!.push(s);
    }
    const groups: UserStoryGroup[] = [];
    for (const [userId, acts] of map) {
      const sorted = acts.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      groups.push({
        userId,
        displayName: sorted[0].displayName || 'User',
        avatarUrl: sorted[0].avatarUrl || '',
        latest: sorted[0],
        previous: sorted.slice(1, 3),
      });
    }
    return groups.slice(0, 15);
  }, [stories]);

  if (!loaded || userGroups.length === 0) return null;

  const handleStoryTap = (group: UserStoryGroup) => {
    navigate('/reel', {
      state: {
        activityId: group.latest.id,
        dayNumber: group.latest.dayNumber,
        sourceUserId: group.userId,
        _ts: Date.now(),
      },
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Community
        </h3>
        <button
          onClick={() => navigate('/reel')}
          className="flex items-center gap-0.5 active:scale-95 transition-transform"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <span className="text-xs font-medium">See all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory px-5 pb-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {userGroups.map((group, i) => {
          const mediaUrl = group.latest.originalUrl || group.latest.storageUrl;
          const isVid = group.latest.isVideo || isVideoUrl(mediaUrl);
          const prev1 = group.previous[0];
          const prev2 = group.previous[1];
          const prev1Url = prev1?.originalUrl || prev1?.storageUrl;
          const prev2Url = prev2?.originalUrl || prev2?.storageUrl;

          return (
            <motion.button
              key={group.userId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStoryTap(group)}
              className="flex-shrink-0 snap-start relative"
              style={{
                width: 140,
                height: 210,
              }}
            >
              {/* Back stacked card (deepest) */}
              {prev2Url && (
                <div
                  className="absolute overflow-hidden rounded-xl"
                  style={{
                    width: 140,
                    height: 200,
                    top: 2,
                    left: 0,
                    transform: 'rotate(6deg)',
                    transformOrigin: 'bottom center',
                    zIndex: 1,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <img
                    src={prev2Url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
                </div>
              )}

              {/* Middle stacked card */}
              {prev1Url && (
                <div
                  className="absolute overflow-hidden rounded-xl"
                  style={{
                    width: 140,
                    height: 200,
                    top: 1,
                    left: 0,
                    transform: prev2Url ? 'rotate(-3deg)' : 'rotate(4deg)',
                    transformOrigin: 'bottom center',
                    zIndex: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <img
                    src={prev1Url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.2)' }} />
                </div>
              )}

              {/* Main (latest) card */}
              <div
                className="absolute overflow-hidden rounded-xl"
                style={{
                  width: 140,
                  height: 200,
                  top: 0,
                  left: 0,
                  zIndex: 3,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.06)',
                }}
              >
                {/* Media */}
                {isVid ? (
                  <video
                    src={mediaUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={group.latest.activity || 'Activity'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)',
                  }}
                />

                {/* Avatar + name */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center gap-2">
                  <ProfileAvatar
                    src={group.avatarUrl}
                    name={group.displayName}
                    size={24}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white text-[11px] font-semibold truncate leading-tight">
                      {group.displayName}
                    </p>
                    <p className="text-white/50 text-[9px] font-medium truncate">
                      {group.latest.activity || `Day ${group.latest.dayNumber}`}
                    </p>
                  </div>
                </div>

                {/* Reaction count badge */}
                {(group.latest.reactionCount || 0) > 0 && (
                  <div
                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span className="text-[9px]">🔥</span>
                    <span className="text-white/80 text-[9px] font-semibold">
                      {group.latest.reactionCount}
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityStoriesScroll;
