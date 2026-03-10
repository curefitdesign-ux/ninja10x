import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import ProfileAvatar from '@/components/ProfileAvatar';

import { ALL_REACTION_IMAGES as REACTION_IMAGES, REACTION_VERBS } from '@/lib/reaction-images';

// Instagram-style relative timestamp
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  if (diffWeek < 4) return `${diffWeek}w`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export interface Notification {
  id: string;
  activityId: string;
  reactorName: string;
  reactorAvatarUrl?: string;
  reactionType: string; // 'nudge' for nudges, reaction type for reactions
  timestamp: Date;
  dayNumber?: number;
  activityImageUrl?: string;
  activityType?: string;
  isNudge?: boolean;
}

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationCountChange?: (count: number) => void;
  onLatestNotificationChange?: (notification: Notification | null) => void;
}

export default function NotificationSheet({ isOpen, onClose, onNotificationCountChange, onLatestNotificationChange }: NotificationSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const portalContainer = usePortalContainer();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const userActivitiesRef = useRef<Set<string>>(new Set());

  // Fetch user's activity IDs and past reactions on mount
  useEffect(() => {
    if (!user) return;

    const fetchMyActivitiesAndReactions = async () => {
      // First get user's activity IDs
      const { data: activities } = await supabase
        .from('journey_activities')
        .select('id, day_number, storage_url, activity')
        .eq('user_id', user.id);
      
      if (activities) {
        const activityIds = activities.map(a => a.id);
        userActivitiesRef.current = new Set(activityIds);
        const activityMap = new Map(activities.map(a => [a.id, a]));
        
        if (activityIds.length > 0) {
          // Fetch past reactions on user's activities (excluding self-reactions)
          const { data: reactions } = await supabase
            .from('activity_reactions')
            .select('id, activity_id, user_id, reaction_type, created_at')
            .in('activity_id', activityIds)
            .neq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);
          
          if (reactions && reactions.length > 0) {
            // Fetch all reactor profiles in one query
            const reactorIds = [...new Set(reactions.map(r => r.user_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, display_name, avatar_url')
              .in('user_id', reactorIds);
            
            const profileMap = new Map(profiles?.map(p => [p.user_id, { name: p.display_name, avatar: p.avatar_url }]) || []);
            
            const pastNotifications: Notification[] = reactions.map(r => {
              const reactorProfile = profileMap.get(r.user_id);
              const activityInfo = activityMap.get(r.activity_id);
              return {
                id: r.id,
                activityId: r.activity_id,
                reactorName: reactorProfile?.name || 'Someone',
                reactorAvatarUrl: reactorProfile?.avatar || undefined,
                reactionType: r.reaction_type,
                timestamp: new Date(r.created_at),
                dayNumber: activityInfo?.day_number,
                activityImageUrl: activityInfo?.storage_url,
                activityType: activityInfo?.activity || undefined,
              };
            });
            
            setNotifications(pastNotifications);
          }
        }
      }
    };

    fetchMyActivitiesAndReactions();
  }, [user]);

  // Fetch past nudges
  useEffect(() => {
    if (!user) return;

    const fetchNudges = async () => {
      const { data: nudges } = await supabase
        .from('nudges')
        .select('id, from_user_id, created_at')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (nudges && nudges.length > 0) {
        const senderIds = [...new Set(nudges.map(n => n.from_user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, { name: p.display_name, avatar: p.avatar_url }]) || []);

        const nudgeNotifs: Notification[] = nudges.map(n => ({
          id: `nudge-${n.id}`,
          activityId: '',
          reactorName: profileMap.get(n.from_user_id)?.name || 'Someone',
          reactorAvatarUrl: profileMap.get(n.from_user_id)?.avatar || undefined,
          reactionType: 'nudge',
          timestamp: new Date(n.created_at),
          isNudge: true,
        }));

        setNotifications(prev => {
          const combined = [...prev, ...nudgeNotifs];
          combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          return combined.slice(0, 30);
        });
      }
    };

    fetchNudges();
  }, [user]);

  // Subscribe to realtime reaction inserts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notification-sheet')
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
          
          if (
            userActivitiesRef.current.has(newReaction.activity_id) &&
            newReaction.user_id !== user.id
          ) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', newReaction.user_id)
              .maybeSingle();

            const { data: activityInfo } = await supabase
              .from('journey_activities')
              .select('day_number, storage_url, activity')
              .eq('id', newReaction.activity_id)
              .maybeSingle();

            const reactorName = profile?.display_name || 'Someone';
            
            const newNotif: Notification = {
              id: newReaction.id,
              activityId: newReaction.activity_id,
              reactorName,
              reactorAvatarUrl: profile?.avatar_url || undefined,
              reactionType: newReaction.reaction_type,
              timestamp: new Date(),
              dayNumber: activityInfo?.day_number,
              activityImageUrl: activityInfo?.storage_url,
              activityType: activityInfo?.activity || undefined,
            };

            setNotifications(prev => {
              const updated = [newNotif, ...prev].slice(0, 30);
              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nudges',
          filter: `to_user_id=eq.${user.id}`,
        },
        async (payload) => {
          const nudge = payload.new as {
            id: string;
            from_user_id: string;
          };

          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', nudge.from_user_id)
            .maybeSingle();

          const newNotif: Notification = {
            id: `nudge-${nudge.id}`,
            activityId: '',
            reactorName: profile?.display_name || 'Someone',
            reactorAvatarUrl: profile?.avatar_url || undefined,
            reactionType: 'nudge',
            timestamp: new Date(),
            isNudge: true,
          };

          setNotifications(prev => [newNotif, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Notify parent of count and latest notification changes
  useEffect(() => {
    onNotificationCountChange?.(notifications.length);
    onLatestNotificationChange?.(notifications.length > 0 ? notifications[0] : null);
  }, [notifications, onNotificationCountChange, onLatestNotificationChange]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
    onClose();
  }, [onClose]);

  // Navigate to the progress page gallery overlay for the specific activity
  const handleNotificationTap = useCallback((notif: Notification) => {
    onClose();
    navigate('/progress', {
      replace: true,
      state: {
        openGalleryAtDay: notif.dayNumber,
        _ts: Date.now(),
      },
    });
  }, [navigate, onClose]);

  const ui = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col"
          style={{ height: '100dvh' }}
        >
          {/* Full-screen blur background */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.85) 0%, rgba(10, 10, 20, 0.95) 100%)',
              backdropFilter: 'blur(60px) saturate(150%)',
              WebkitBackdropFilter: 'blur(60px) saturate(150%)',
            }}
            onClick={onClose}
          />

          {/* Content container */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, delay: 0.05 }}
            className="relative flex flex-col h-full"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Header - back arrow left, title center */}
            <div className="flex items-center justify-between px-4 pb-4 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                <ChevronLeft className="w-5 h-5 text-white/80" />
              </button>
              
              <h2 className="text-white text-lg font-semibold">Reactions</h2>
              
              {notifications.length > 0 ? (
                <button
                  onClick={dismissAll}
                  className="text-white/50 text-xs hover:text-white transition-colors px-2"
                >
                  Clear all
                </button>
              ) : (
                <div className="w-10" /> // Spacer for centering
              )}
            </div>

            {/* Scrollable notification list */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="flex -space-x-2 mb-4">
                    <img src={REACTION_IMAGES['fire']} alt="fire" className="w-12 h-12 object-contain opacity-40" />
                    <img src={REACTION_IMAGES['clap']} alt="clap" className="w-12 h-12 object-contain opacity-40" />
                    <img src={REACTION_IMAGES['flex']} alt="flex" className="w-12 h-12 object-contain opacity-40" />
                  </div>
                  <p className="text-white/50 text-base">No reactions yet</p>
                  <p className="text-white/30 text-sm mt-1">Share your activities to get reactions!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif, index) => {
                    const iconSrc = notif.isNudge ? undefined : REACTION_IMAGES[notif.reactionType];
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                        onClick={() => !notif.isNudge && handleNotificationTap(notif)}
                      >
                        {/* Reactor avatar with reaction/nudge badge */}
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 rounded-full overflow-hidden">
                            <ProfileAvatar
                              src={notif.reactorAvatarUrl}
                              name={notif.reactorName}
                              size={44}
                            />
                          </div>
                          {notif.isNudge ? (
                            <div 
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                              style={{
                                background: 'rgba(30, 18, 69, 0.9)',
                                border: '1.5px solid rgba(255,255,255,0.15)',
                              }}
                            >
                              <span className="text-xs">👋</span>
                            </div>
                          ) : iconSrc && (
                            <div 
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                              style={{
                                background: 'rgba(30, 18, 69, 0.9)',
                                border: '1.5px solid rgba(255,255,255,0.15)',
                              }}
                            >
                              <img src={iconSrc} alt={notif.reactionType} className="w-4 h-4 object-contain" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm leading-snug">
                            <span className="font-semibold">{notif.reactorName}</span>
                            <span className="text-white/60">
                              {notif.isNudge 
                                ? ' nudged you to keep going! 💪' 
                                : ` ${REACTION_VERBS[notif.reactionType] || 'reacted to'} your ${notif.activityType || 'activity'}`}
                            </span>
                          </p>
                          <p className="text-white/35 text-xs mt-0.5">
                            {notif.dayNumber ? `Day ${notif.dayNumber} · ` : ''}{formatRelativeTime(notif.timestamp)}
                          </p>
                        </div>

                        {/* Activity thumbnail on right */}
                        {notif.activityImageUrl ? (
                          <div 
                            className="w-11 h-14 rounded-lg overflow-hidden flex-shrink-0"
                            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                          >
                            <img 
                              src={notif.activityImageUrl} 
                              alt="Activity" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs flex-shrink-0">
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Portal to body to avoid being clipped by transformed/scroll containers on mobile.
  if (typeof document === 'undefined') return null;
  return createPortal(ui, portalContainer);
}