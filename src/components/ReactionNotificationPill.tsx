import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface ReactionNotification {
  id: string;
  activityId: string;
  reactorName: string;
  reactionType: string;
  timestamp: Date;
}

// Web Audio API notification sound
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant two-tone chime
    const playTone = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    playTone(880, now, 0.12); // A5
    playTone(1108.73, now + 0.08, 0.15); // C#6
    playTone(1318.51, now + 0.14, 0.18); // E6
    
    // Auto-close context after sounds complete
    setTimeout(() => audioCtx.close(), 500);
  } catch (e) {
    console.log('Audio not available');
  }
};

export default function ReactionNotificationPill() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState<ReactionNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const userActivitiesRef = useRef<Set<string>>(new Set());
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if on Activity page (home/default)
  const isOnActivityPage = location.pathname === '/' || location.pathname === '/activity';

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
            
            // Only show pill if NOT on Activity page
            if (!isOnActivityPage) {
              setIsVisible(true);
              
              // Clear previous timeout
              if (dismissTimeoutRef.current) {
                clearTimeout(dismissTimeoutRef.current);
              }
              
              // Auto-dismiss after 4 seconds
              dismissTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
              }, 4000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [user, isOnActivityPage]);

  const handleTap = useCallback(() => {
    if (notification) {
      setIsVisible(false);
      // Navigate to reel with the specific activity
      navigate('/reel', { 
        state: { 
          fromNotification: true,
          targetActivityId: notification.activityId,
        } 
      });
    }
  }, [notification, navigate]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  }, []);

  // Don't show on Activity page
  if (isOnActivityPage || !isVisible || !notification) return null;

  return createPortal(
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
          className="flex items-center gap-3 p-3 rounded-2xl mx-auto max-w-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: `
              0 12px 40px rgba(0, 0, 0, 0.4),
              inset 0 1px 1px rgba(255, 255, 255, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.05)
            `,
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Reaction icon with glow */}
          <motion.div
            className="relative flex-shrink-0"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
                transform: 'scale(1.8)',
              }}
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1.5, 2, 1.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <img
              src={REACTION_IMAGES[notification.reactionType] || fireImg}
              alt={notification.reactionType}
              className="w-10 h-10 object-contain relative z-10"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
            />
          </motion.div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              <span className="font-semibold">{notification.reactorName}</span>
              <span className="text-white/80"> reacted to your activity</span>
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              Tap to view
            </p>
          </div>

          {/* Close indicator */}
          <motion.div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            onClick={handleDismiss}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-white/60 text-xs">✕</span>
          </motion.div>
        </motion.div>

        {/* Progress bar for auto-dismiss */}
        <motion.div
          className="h-0.5 rounded-full mt-2 mx-auto max-w-[200px] overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.8), rgba(52, 211, 153, 0.8))',
            }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
