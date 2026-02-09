import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { fetchPublicFeed, type LocalActivity } from '@/hooks/use-journey-activities';
import { useAuth } from '@/hooks/use-auth';
import ProfileAvatar from '@/components/ProfileAvatar';

const CommunityStoriesWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [communityActivities, setCommunityActivities] = useState<LocalActivity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchPublicFeed().then(activities => {
      // Filter out current user's activities
      const others = activities.filter(a => a.userId !== user?.id);
      setCommunityActivities(others.slice(0, 8));
      setLoaded(true);
    });
  }, [user?.id]);

  if (!loaded || communityActivities.length === 0) return null;

  const handleAvatarTap = (activity: LocalActivity) => {
    navigate('/reel', {
      state: {
        activityId: activity.id,
        dayNumber: activity.dayNumber,
      },
    });
  };

  return (
    <motion.div
      className="px-5 mb-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[11px] font-semibold text-white/50 tracking-wider uppercase">Community</span>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/reel')}
            className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors"
          >
            View all
          </button>
        </div>

        {/* Avatar row */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          {communityActivities.map((activity, idx) => (
            <motion.button
              key={activity.id}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
              onClick={() => handleAvatarTap(activity)}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
            >
              {/* Avatar with gradient ring */}
              <div className="relative">
                <svg
                  className="absolute inset-0"
                  style={{ width: 44, height: 44, transform: 'rotate(-90deg)' }}
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none" strokeWidth="5"
                    stroke="url(#communityRing)"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="communityRing" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FEDA75" />
                      <stop offset="50%" stopColor="#D62976" />
                      <stop offset="100%" stopColor="#4F5BD5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ width: 44, height: 44, padding: 4 }}>
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <ProfileAvatar
                      src={activity.avatarUrl}
                      name={activity.displayName || 'User'}
                      size={36}
                    />
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-white/40 font-medium max-w-[48px] truncate">
                {activity.displayName?.split(' ')[0] || 'User'}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CommunityStoriesWidget;
