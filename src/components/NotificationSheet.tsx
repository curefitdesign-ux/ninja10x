import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

// 3D reaction assets (clean transparency)
import fireImg from '@/assets/reactions/fire-new.png';
import clapImg from '@/assets/reactions/clap-hands.png';
import flexImg from '@/assets/reactions/flex.png';

// Only use icons we know are clean (no white background).
// For other reaction types we still show text, but avoid rendering a potentially white-backed asset.
const REACTION_IMAGES: Record<string, string> = {
  fire: fireImg,
  clap: clapImg,
  flex: flexImg,
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

export interface Notification {
  id: string;
  activityId: string;
  reactorName: string;
  reactionType: string;
  timestamp: Date;
}

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationCountChange?: (count: number) => void;
  onLatestNotificationChange?: (notification: Notification | null) => void;
}

export default function NotificationSheet({ isOpen, onClose, onNotificationCountChange, onLatestNotificationChange }: NotificationSheetProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const userActivitiesRef = useRef<Set<string>>(new Set());

  // Fetch user's activity IDs and past reactions on mount
  useEffect(() => {
    if (!user) return;

    const fetchMyActivitiesAndReactions = async () => {
      // First get user's activity IDs
      const { data: activities } = await supabase
        .from('journey_activities')
        .select('id')
        .eq('user_id', user.id);
      
      if (activities) {
        const activityIds = activities.map(a => a.id);
        userActivitiesRef.current = new Set(activityIds);
        
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
              .select('user_id, display_name')
              .in('user_id', reactorIds);
            
            const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
            
            const pastNotifications: Notification[] = reactions.map(r => ({
              id: r.id,
              activityId: r.activity_id,
              reactorName: profileMap.get(r.user_id) || 'Someone',
              reactionType: r.reaction_type,
              timestamp: new Date(r.created_at),
            }));
            
            setNotifications(pastNotifications);
          }
        }
      }
    };

    fetchMyActivitiesAndReactions();
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
              activityId: newReaction.activity_id,
              reactorName,
              reactionType: newReaction.reaction_type,
              timestamp: new Date(),
            };

            setNotifications(prev => {
              const updated = [newNotif, ...prev].slice(0, 20); // Keep max 20
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

  const ui = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col"
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
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
              <h2 className="text-white text-xl font-semibold">Reactions</h2>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="text-white/50 text-sm hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>

            {/* Scrollable notification list */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="flex -space-x-2 mb-4">
                    <img src={fireImg} alt="fire" className="w-12 h-12 object-contain opacity-40" />
                    <img src={clapImg} alt="clap" className="w-12 h-12 object-contain opacity-40" />
                    <img src={flexImg} alt="flex" className="w-12 h-12 object-contain opacity-40" />
                  </div>
                  <p className="text-white/50 text-base">No reactions yet</p>
                  <p className="text-white/30 text-sm mt-1">Share your activities to get reactions!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif, index) => {
                    const iconSrc = REACTION_IMAGES[notif.reactionType];
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative flex items-center gap-3 p-3.5 rounded-2xl"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {/* Reaction icon */}
                        <div 
                          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          {iconSrc ? (
                            <img
                              src={iconSrc}
                              alt={notif.reactionType}
                              className="w-7 h-7 object-contain"
                            />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/30" />
                          )}
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
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                          }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-3.5 h-3.5 text-white/50" />
                        </motion.button>
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
  return createPortal(ui, document.body);
}