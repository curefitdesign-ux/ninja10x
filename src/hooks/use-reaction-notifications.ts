import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// 3D reaction assets for toast display
import fireImg from '@/assets/reactions/fire-3d.png';
import clapImg from '@/assets/reactions/clap-3d.png';
import fistbumpImg from '@/assets/reactions/fistbump.png';
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

const REACTION_LABELS: Record<string, string> = {
  heart: '❤️ loved',
  fire: '🔥 fired up',
  clap: '👏 applauded',
  fistbump: '🤜 fist bumped',
  wow: '😮 wowed at',
  flex: '💪 flexed on',
  trophy: '🏆 celebrated',
  runner: '🏃 cheered',
  energy: '⚡ energized',
  timer: '⏱️ timed',
};

interface ReactionPayload {
  activity_id: string;
  user_id: string;
  reaction_type: string;
}

/**
 * Hook to subscribe to realtime reaction notifications
 * Shows a toast when someone reacts to the current user's activity
 */
export function useReactionNotifications() {
  const { user } = useAuth();
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
      .channel('reaction-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_reactions',
        },
        async (payload) => {
          const newReaction = payload.new as ReactionPayload;
          
          // Only notify if this is a reaction to the current user's activity
          // and it's from someone else
          if (
            userActivitiesRef.current.has(newReaction.activity_id) &&
            newReaction.user_id !== user.id
          ) {
            // Fetch reactor's profile for display name
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', newReaction.user_id)
              .maybeSingle();

            const reactorName = profile?.display_name || 'Someone';
            const reactionLabel = REACTION_LABELS[newReaction.reaction_type] || 'reacted to';
            
            toast({
              title: `${reactorName} ${reactionLabel} your activity! 🎉`,
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
