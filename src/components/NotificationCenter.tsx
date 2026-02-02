import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

// 3D reaction assets (clean transparency)
import fireImg from '@/assets/reactions/fire-new.png';
import clapImg from '@/assets/reactions/clap-hands.png';
import fistbumpImg from '@/assets/reactions/fistbump-hands.png';
import wowImg from '@/assets/reactions/wow.png';
import flexImg from '@/assets/reactions/flex.png';
import trophyImg from '@/assets/reactions/dumbbells.png';
import runnerImg from '@/assets/reactions/runner.png';
import energyImg from '@/assets/reactions/energy.png';
import timerImg from '@/assets/reactions/stopwatch.png';
import heartImg from '@/assets/reactions/heart-workout.png';

const REACTION_IMAGES: Record<string, string> = {
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

const REACTION_VERBS: Record<string, string> = {
  heart: 'loved',
  fire: 'fired up',
  clap: 'applauded',
  fistbump: 'fist bumped',
  wow: 'wowed at',
  flex: 'flexed on',
  trophy: 'celebrated',
  runner: 'cheered',
  energy: 'energized',
  timer: 'timed',
};

interface Notification {
  id: string;
  reactorName: string;
  reactionType: string;
  timestamp: Date;
}

interface NotificationCenterProps {
  onNotificationCountChange?: (count: number) => void;
}

export default function NotificationCenter({ onNotificationCountChange }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const userActivitiesRef = useRef<Set<string>>(new Set());

  // Fetch user's activity IDs on mount
  useEffect(() => {
    if (!user) return;

    const fetchMyActivities = async () => {
      const { data } = await supabase
        .from('journey_activities')
        .select('id')
        .eq('user_id', user.id);
      
      if (data) {
        userActivitiesRef.current = new Set(data.map(a => a.id));
      }
    };

    fetchMyActivities();
  }, [user]);

  // Subscribe to realtime reaction inserts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notification-center')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_reactions',
        },
        async (payload) => {
          const newReaction = payload.new as {
            id: string;
            activity_id: string;
            user_id: string;
            reaction_type: string;
          };
          
          // Only notify if this is a reaction to the current user's activity
          // and it's from someone else
          if (
            userActivitiesRef.current.has(newReaction.activity_id) &&
            newReaction.user_id !== user.id
          ) {
            // Fetch reactor's profile for display name
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', newReaction.user_id)
              .maybeSingle();

            const reactorName = profile?.display_name || 'Someone';
            
            const newNotif: Notification = {
              id: newReaction.id,
              reactorName,
              reactionType: newReaction.reaction_type,
              timestamp: new Date(),
            };

            setNotifications(prev => {
              const updated = [newNotif, ...prev].slice(0, 10); // Keep max 10
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Notify parent of count changes
  useEffect(() => {
    onNotificationCountChange?.(notifications.length);
  }, [notifications.length, onNotificationCountChange]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
    setIsExpanded(false);
  }, []);

  if (notifications.length === 0) return null;

  // Combine multiple notifications summary
  const combinedSummary = notifications.length > 1 
    ? `${notifications.length} new reactions on your activities`
    : `${notifications[0].reactorName} ${REACTION_VERBS[notifications[0].reactionType] || 'reacted to'} your activity`;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-[calc(env(safe-area-inset-top,16px)+12px)] pointer-events-none">
      <AnimatePresence mode="sync">
        {/* Collapsed view - single stacked card */}
        {!isExpanded && (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto"
          >
            {/* Stack effect - background cards */}
            {notifications.length > 1 && (
              <>
                <div 
                  className="absolute left-6 right-6 top-2 h-14 rounded-2xl opacity-40"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transform: 'scale(0.96)',
                  }}
                />
                {notifications.length > 2 && (
                  <div 
                    className="absolute left-8 right-8 top-3 h-14 rounded-2xl opacity-20"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transform: 'scale(0.92)',
                    }}
                  />
                )}
              </>
            )}
            
            {/* Main notification card */}
            <motion.button
              onClick={() => setIsExpanded(true)}
              className="relative w-full flex items-center gap-3 p-3 pr-4 rounded-2xl text-left"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  inset 0 1px 1px rgba(255, 255, 255, 0.15),
                  0 0 0 1px rgba(255, 255, 255, 0.05)
                `,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Notification icon with glow */}
              <div 
                className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                }}
              >
                <Bell className="w-5 h-5 text-white" />
                {notifications.length > 1 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-[10px] font-bold text-white flex items-center justify-center shadow-lg">
                    {notifications.length}
                  </span>
                )}
              </div>

              {/* Reaction preview images */}
              <div className="flex items-center -space-x-2">
                {notifications.slice(0, 3).map((n, i) => (
                  <motion.img
                    key={n.id}
                    src={REACTION_IMAGES[n.reactionType] || fireImg}
                    alt={n.reactionType}
                    className="w-7 h-7 object-contain"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      zIndex: 3 - i,
                    }}
                  />
                ))}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {combinedSummary}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  Tap to see all
                </p>
              </div>

              {/* Close button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAll();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-white/60" />
              </motion.button>
            </motion.button>
          </motion.div>
        )}

        {/* Expanded view - all notifications */}
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-auto space-y-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                Notifications ({notifications.length})
              </span>
              <button
                onClick={dismissAll}
                className="text-white/50 text-xs hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>

            {/* Notification list */}
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: index * 0.03 }}
                className="relative flex items-center gap-3 p-3 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Reaction icon */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <img
                    src={REACTION_IMAGES[notif.reactionType] || fireImg}
                    alt={notif.reactionType}
                    className="w-6 h-6 object-contain"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">
                    <span className="font-medium">{notif.reactorName}</span>
                    <span className="text-white/70"> {REACTION_VERBS[notif.reactionType] || 'reacted to'} your activity</span>
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">Just now</p>
                </div>

                {/* Dismiss */}
                <motion.button
                  onClick={() => dismissNotification(notif.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-3.5 h-3.5 text-white/50" />
                </motion.button>
              </motion.div>
            ))}

            {/* Collapse button */}
            <motion.button
              onClick={() => setIsExpanded(false)}
              className="w-full py-2 text-center text-white/50 text-xs hover:text-white transition-colors"
            >
              Collapse
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
