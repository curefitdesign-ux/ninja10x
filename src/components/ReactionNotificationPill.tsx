import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import NotificationSheet from '@/components/NotificationSheet';

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

interface ReactionNotification {
  id: string;
  activityId: string;
  reactorName: string;
  reactionType: string;
  timestamp: Date;
}

// Improved Web Audio API notification sound - soft, pleasant chime
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a soft, pleasant notification chime using triangle waves
    const playTone = (freq: number, startTime: number, duration: number, volume: number = 0.08) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'triangle'; // Softer sound than sine
      
      // Gentle envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    // Pleasant ascending arpeggio - C major chord
    playTone(523.25, now, 0.15, 0.06);        // C5
    playTone(659.25, now + 0.06, 0.18, 0.08); // E5
    playTone(783.99, now + 0.12, 0.22, 0.07); // G5
    playTone(1046.5, now + 0.18, 0.28, 0.05); // C6 (soft finish)
    
    // Auto-close context after sounds complete
    setTimeout(() => audioCtx.close(), 600);
  } catch (e) {
    console.log('Audio not available');
  }
};

export default function ReactionNotificationPill() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<ReactionNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const userActivitiesRef = useRef<Set<string>>(new Set());
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      .channel('reaction-pill-notifications')
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
          
          console.log('[ReactionPill] New reaction received:', newReaction.id, 'for activity:', newReaction.activity_id);
          console.log('[ReactionPill] My activities:', [...userActivitiesRef.current]);
          console.log('[ReactionPill] Is my activity?', userActivitiesRef.current.has(newReaction.activity_id));
          console.log('[ReactionPill] From someone else?', newReaction.user_id !== user.id);
          
          // Only notify if this is a reaction to the current user's activity
          // and it's from someone else
          if (
            userActivitiesRef.current.has(newReaction.activity_id) &&
            newReaction.user_id !== user.id
          ) {
            // Play notification sound
            playNotificationSound();

            // Fetch reactor's profile for display name
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', newReaction.user_id)
              .maybeSingle();

            const reactorName = profile?.display_name || 'Someone';
            
            const newNotif: ReactionNotification = {
              id: newReaction.id,
              activityId: newReaction.activity_id,
              reactorName,
              reactionType: newReaction.reaction_type,
              timestamp: new Date(),
            };

            setNotification(newNotif);
            setIsVisible(true);
            
            // Clear previous timeout - pill stays visible until user taps
            if (dismissTimeoutRef.current) {
              clearTimeout(dismissTimeoutRef.current);
              dismissTimeoutRef.current = null;
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[ReactionPill] Channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [user]);

  const handleTap = useCallback(() => {
    if (notification) {
      setIsVisible(false);
      // Open notification sheet instead of navigating
      setShowNotificationSheet(true);
    }
  }, [notification]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  }, []);

  return (
    <>
      {/* Notification Sheet */}
      <NotificationSheet
        isOpen={showNotificationSheet}
        onClose={() => setShowNotificationSheet(false)}
      />
      
      {/* Pill notification */}
      {isVisible && notification && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-4 right-4 z-[200] cursor-pointer"
            style={{
              top: 'calc(env(safe-area-inset-top, 16px) + 12px)',
            }}
            onClick={handleTap}
          >
            <motion.div
              className="flex items-center gap-2 px-3 py-2 rounded-full mx-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: `
                  0 8px 24px rgba(0, 0, 0, 0.3),
                  inset 0 1px 1px rgba(255, 255, 255, 0.2)
                `,
                maxWidth: '220px',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Reaction icon - compact */}
              <motion.div
                className="relative flex-shrink-0"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
              >
                <img
                  src={REACTION_IMAGES[notification.reactionType] || fireImg}
                  alt={notification.reactionType}
                  className="w-7 h-7 object-contain"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                />
              </motion.div>

              {/* Text content - compact */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  <span className="font-semibold">{notification.reactorName}</span>
                  <span className="text-white/70"> reacted</span>
                </p>
              </div>

              {/* Tap indicator dot */}
              <motion.div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'rgba(52, 211, 153, 0.8)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
