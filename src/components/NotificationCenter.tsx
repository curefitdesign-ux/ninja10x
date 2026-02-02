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

// Improved Web Audio API notification sound - softer, more pleasant chime
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
            
            // Play notification sound
            playNotificationSound();
            
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

  // Don't render any UI - the ReactionNotificationPill handles all visual notifications
  // This component only handles the realtime listening and sound
  return null;
}
