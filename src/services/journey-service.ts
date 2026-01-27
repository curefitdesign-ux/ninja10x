import { supabase } from '@/integrations/supabase/client';

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
 * Fetch all activities (public feed) with reaction counts
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
    .select('activity_id, user_id')
    .in('activity_id', activityIds);

  // Build reaction map
  const reactionMap: Record<string, { count: number; userReacted: boolean }> = {};
  for (const r of reactions || []) {
    if (!reactionMap[r.activity_id]) {
      reactionMap[r.activity_id] = { count: 0, userReacted: false };
    }
    reactionMap[r.activity_id].count++;
    if (user && r.user_id === user.id) {
      reactionMap[r.activity_id].userReacted = true;
    }
  }

  return data.map(a => ({
    ...a,
    reaction_count: reactionMap[a.id]?.count || 0,
    user_reacted: reactionMap[a.id]?.userReacted || false,
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
 * Toggle reaction (heart) on an activity
 */
export async function toggleReaction(activityId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if user already reacted
  const { data: existing } = await supabase
    .from('activity_reactions')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
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
        reaction_type: 'heart',
      });
    return true;
  }
}
