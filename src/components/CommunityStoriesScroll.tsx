import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { fetchPublicFeed, LocalActivity } from '@/hooks/use-journey-activities';
import { useAuth } from '@/hooks/use-auth';
import ProfileAvatar from '@/components/ProfileAvatar';
import { isVideoUrl } from '@/lib/media';

const CommunityStoriesScroll = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stories, setStories] = useState<LocalActivity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchPublicFeed(false).then((feed) => {
      // Exclude own activities, show most recent first
      const others = feed
        .filter((a) => a.userId !== user?.id && a.dayNumber < 1001)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        .slice(0, 20);
      setStories(others);
      setLoaded(true);
    });
  }, [user?.id]);

  if (!loaded || stories.length === 0) return null;

  const handleStoryTap = (story: LocalActivity) => {
    navigate('/reel', {
      state: {
        activityId: story.id,
        dayNumber: story.dayNumber,
        sourceUserId: story.userId,
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
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {stories.map((story, i) => {
          const mediaUrl = story.originalUrl || story.storageUrl;
          const isVid = story.isVideo || isVideoUrl(mediaUrl);

          return (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStoryTap(story)}
              className="flex-shrink-0 snap-start relative overflow-hidden rounded-2xl"
              style={{
                width: 140,
                height: 200,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
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
                  alt={story.activity || 'Activity'}
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
                  src={story.avatarUrl}
                  name={story.displayName}
                  size={24}
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white text-[11px] font-semibold truncate leading-tight">
                    {story.displayName || 'User'}
                  </p>
                  <p className="text-white/50 text-[9px] font-medium truncate">
                    {story.activity || `Day ${story.dayNumber}`}
                  </p>
                </div>
              </div>

              {/* Reaction count badge */}
              {(story.reactionCount || 0) > 0 && (
                <div
                  className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span className="text-[9px]">🔥</span>
                  <span className="text-white/80 text-[9px] font-semibold">
                    {story.reactionCount}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityStoriesScroll;
