import { supabase } from '@/integrations/supabase/client';

export type ReactionType = 'heart' | 'clap' | 'fistbump' | 'wow' | 'fire';

export interface ActivityReaction {
  type: ReactionType;
  count: number;
  userReacted: boolean;
}

export interface JourneyActivity {
  id: string;
  user_id: string;
  storage_url: string;
  original_url: string | null;
  is_video: boolean;
  activity: string | null;
  frame: string | null;
  duration: string | null;
  pr: string | null;
  day_number: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  reaction_count?: number;
  user_reacted?: boolean;
  reactions?: Record<ReactionType, ActivityReaction>;
  is_own?: boolean;
}

/**
 * Fetch all activities for the current logged-in user
 */
export async function fetchMyActivities(): Promise<JourneyActivity[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('journey_activities')
    .select('*')
    .eq('user_id', user.id)
    .order('day_number', { ascending: true });

  if (error) {
    console.error('Error fetching my activities:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all activities (public feed) with reaction counts by type
 */
export async function fetchAllActivities(): Promise<JourneyActivity[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('journey_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  if (!data) return [];

  // Get reaction counts for each activity
  const activityIds = data.map(a => a.id);
  const { data: reactions } = await supabase
    .from('activity_reactions')
    .select('activity_id, user_id, reaction_type')
    .in('activity_id', activityIds);

  // Build reaction map with types
  const reactionMap: Record<string, Record<ReactionType, ActivityReaction>> = {};
  const totalReactionMap: Record<string, { count: number; userReacted: boolean }> = {};
  
  for (const r of reactions || []) {
    const type = (r.reaction_type || 'heart') as ReactionType;
    
    if (!reactionMap[r.activity_id]) {
      reactionMap[r.activity_id] = {
        heart: { type: 'heart', count: 0, userReacted: false },
        clap: { type: 'clap', count: 0, userReacted: false },
        fistbump: { type: 'fistbump', count: 0, userReacted: false },
        wow: { type: 'wow', count: 0, userReacted: false },
        fire: { type: 'fire', count: 0, userReacted: false },
      };
    }
    if (!totalReactionMap[r.activity_id]) {
      totalReactionMap[r.activity_id] = { count: 0, userReacted: false };
    }
    
    reactionMap[r.activity_id][type].count++;
    totalReactionMap[r.activity_id].count++;
    
    if (user && r.user_id === user.id) {
      reactionMap[r.activity_id][type].userReacted = true;
      totalReactionMap[r.activity_id].userReacted = true;
    }
  }

  return data.map(a => ({
    ...a,
    reaction_count: totalReactionMap[a.id]?.count || 0,
    user_reacted: totalReactionMap[a.id]?.userReacted || false,
    reactions: reactionMap[a.id] || {
      heart: { type: 'heart', count: 0, userReacted: false },
      clap: { type: 'clap', count: 0, userReacted: false },
      fistbump: { type: 'fistbump', count: 0, userReacted: false },
      wow: { type: 'wow', count: 0, userReacted: false },
      fire: { type: 'fire', count: 0, userReacted: false },
    },
    is_own: user ? a.user_id === user.id : false,
  }));
}

/**
 * Upsert an activity (create or update by day_number)
 */
export async function upsertActivity(activity: {
  storage_url: string;
  original_url?: string;
  is_video?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  day_number: number;
}): Promise<JourneyActivity | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Cannot upsert activity: user not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('journey_activities')
    .upsert(
      {
        user_id: user.id,
        storage_url: activity.storage_url,
        original_url: activity.original_url || null,
        is_video: activity.is_video || false,
        activity: activity.activity || null,
        frame: activity.frame || null,
        duration: activity.duration || null,
        pr: activity.pr || null,
        day_number: activity.day_number,
      },
      { onConflict: 'user_id,day_number' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting activity:', error);
    return null;
  }

  return data;
}

/**
 * Toggle reaction (any type) on an activity
 */
export async function toggleReaction(activityId: string, reactionType: ReactionType = 'heart'): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if user already reacted with this type
  const { data: existing } = await supabase
    .from('activity_reactions')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .eq('reaction_type', reactionType)
    .maybeSingle();

  if (existing) {
    // Remove reaction
    await supabase
      .from('activity_reactions')
      .delete()
      .eq('id', existing.id);
    return false;
  } else {
    // Add reaction
    await supabase
      .from('activity_reactions')
      .insert({
        activity_id: activityId,
        user_id: user.id,
        reaction_type: reactionType,
      });
    return true;
  }
}

/**
 * Send a reaction (always adds, doesn't toggle)
 */
export async function sendReaction(activityId: string, reactionType: ReactionType): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('activity_reactions')
    .insert({
      activity_id: activityId,
      user_id: user.id,
      reaction_type: reactionType,
    });

  return !error;
}

/**
 * Remove a specific reaction by the current user
 */
export async function removeReaction(activityId: string, reactionType: ReactionType): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('activity_reactions')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .eq('reaction_type', reactionType);

  return !error;
}
