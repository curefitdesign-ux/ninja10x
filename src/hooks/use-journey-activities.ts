import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadToStorage, deleteFromStorage } from '@/services/storage-service';
import { ReactionType, ActivityReaction } from '@/services/journey-service';

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
}

export interface LocalActivity {
  id: string;
  storageUrl: string;
  originalUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  dayNumber: number;
  userId?: string;
  createdAt?: string;
  reactionCount?: number;
  reactions?: Record<ReactionType, ActivityReaction>;
  displayName?: string;
  avatarUrl?: string;
  reactorProfiles?: { userId: string; displayName: string; avatarUrl?: string }[];
}

// Convert DB row to local shape
function toLocal(row: JourneyActivity & { 
  reaction_count?: number; 
  reactions?: Record<ReactionType, ActivityReaction>;
  display_name?: string;
  avatar_url?: string;
}): LocalActivity {
  return {
    id: row.id,
    storageUrl: row.storage_url,
    originalUrl: row.original_url || undefined,
    isVideo: row.is_video,
    activity: row.activity || undefined,
    frame: row.frame || undefined,
    duration: row.duration || undefined,
    pr: row.pr || undefined,
    dayNumber: row.day_number,
    userId: row.user_id,
    createdAt: row.created_at,
    reactionCount: row.reaction_count,
    reactions: row.reactions,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

/**
 * Hook to manage journey activities from Supabase as single source of truth.
 * Handles loading, upserting, and deleting activities for the current user.
 */
export function useJourneyActivities() {
  const [activities, setActivities] = useState<LocalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load activities for current user with reaction counts
  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActivities([]);
        setUserId(null);
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('journey_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('day_number', { ascending: true });

      if (error) {
        console.error('Error loading activities:', error);
        setActivities([]);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Fetch reactions for these activities
      const activityIds = data.map(a => a.id);
      const { data: reactions } = await supabase
        .from('activity_reactions')
        .select('activity_id, reaction_type')
        .in('activity_id', activityIds);

      // Build reaction counts per activity
      const reactionMap: Record<string, Record<ReactionType, ActivityReaction>> = {};
      const totalMap: Record<string, number> = {};

      for (const r of reactions || []) {
        const type = (r.reaction_type || 'heart') as ReactionType;
        if (!reactionMap[r.activity_id]) {
          reactionMap[r.activity_id] = { ...DEFAULT_REACTIONS };
          totalMap[r.activity_id] = 0;
        }
        reactionMap[r.activity_id][type] = {
          ...reactionMap[r.activity_id][type],
          count: reactionMap[r.activity_id][type].count + 1,
        };
        totalMap[r.activity_id]++;
      }

      setActivities(data.map(row => ({
        ...toLocal(row),
        reactionCount: totalMap[row.id] || 0,
        reactions: reactionMap[row.id] || { ...DEFAULT_REACTIONS },
      })));
    } catch (e) {
      console.error('Failed to load activities:', e);
      setActivities([]);
    }
    setLoading(false);
  }, []);

  // Initial load + listen for auth changes
  useEffect(() => {
    loadActivities();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadActivities();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadActivities]);

  /**
   * Upsert an activity (create or update by day_number).
   * Handles uploading base64/blob assets to storage automatically.
   */
  const upsertActivity = useCallback(async (input: {
    displayUrl: string; // The framed/template image
    originalUrl: string; // The raw image for re-editing
    isVideo?: boolean;
    activity?: string;
    frame?: string;
    duration?: string;
    pr?: string;
    dayNumber: number;
  }): Promise<LocalActivity | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Cannot upsert: not authenticated');
      return null;
    }

    const uploadAsset = async (src: string, label: string, isVideo: boolean): Promise<string | null> => {
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        return await uploadToStorage(src, label, isVideo);
      }
      if (src.startsWith('http')) return src;
      return null;
    };

    const storageUrl = await uploadAsset(input.displayUrl, `activity-display-${Date.now()}`, input.isVideo || false);
    if (!storageUrl) {
      console.error('Failed to upload display asset');
      return null;
    }

    const originalUrl = input.originalUrl === input.displayUrl
      ? storageUrl
      : await uploadAsset(input.originalUrl, `activity-original-${Date.now()}`, input.isVideo || false);

    if (!originalUrl) {
      console.error('Failed to upload original asset');
      return null;
    }

    const { data, error } = await supabase
      .from('journey_activities')
      .upsert(
        {
          user_id: user.id,
          storage_url: storageUrl,
          original_url: originalUrl,
          is_video: input.isVideo || false,
          activity: input.activity || null,
          frame: input.frame || null,
          duration: input.duration || null,
          pr: input.pr || null,
          day_number: input.dayNumber,
        },
        { onConflict: 'user_id,day_number' }
      )
      .select()
      .single();

    if (error) {
      console.error('Upsert error:', error);
      return null;
    }

    const local = toLocal(data);

    // Update local state
    setActivities(prev => {
      const without = prev.filter(a => a.dayNumber !== local.dayNumber);
      return [...without, local].sort((a, b) => a.dayNumber - b.dayNumber);
    });

    return local;
  }, []);

  /**
   * Delete an activity by dayNumber.
   * Also deletes the uploaded file from storage.
   */
  const deleteActivity = useCallback(async (dayNumber: number): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Find the activity to get storage URLs
    const activity = activities.find(a => a.dayNumber === dayNumber);
    if (!activity) return false;

    // Delete from database
    const { error } = await supabase
      .from('journey_activities')
      .delete()
      .eq('user_id', user.id)
      .eq('day_number', dayNumber);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    // Delete files from storage
    if (activity.storageUrl) {
      await deleteFromStorage(activity.storageUrl);
    }
    if (activity.originalUrl && activity.originalUrl !== activity.storageUrl) {
      await deleteFromStorage(activity.originalUrl);
    }

    // Update local state
    setActivities(prev => prev.filter(a => a.dayNumber !== dayNumber));

    return true;
  }, [activities]);

  /**
   * Delete ALL activities for the current user.
   * Also deletes all uploaded files from storage.
   */
  const clearAllActivities = useCallback(async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Delete all files from storage first
    for (const activity of activities) {
      if (activity.storageUrl) {
        await deleteFromStorage(activity.storageUrl);
      }
      if (activity.originalUrl && activity.originalUrl !== activity.storageUrl) {
        await deleteFromStorage(activity.originalUrl);
      }
    }

    // Delete all from database
    const { error } = await supabase
      .from('journey_activities')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Clear all error:', error);
      return false;
    }

    // Clear local state
    setActivities([]);
    
    // Clear celebrated weeks from localStorage
    localStorage.removeItem('celebrated_weeks');

    return true;
  }, [activities]);

  return {
    activities,
    loading,
    userId,
    refresh: loadActivities,
    upsertActivity,
    deleteActivity,
    clearAllActivities,
  };
}

const DEFAULT_REACTIONS: Record<ReactionType, ActivityReaction> = {
  heart: { type: 'heart', count: 0, userReacted: false },
  clap: { type: 'clap', count: 0, userReacted: false },
  fistbump: { type: 'fistbump', count: 0, userReacted: false },
  wow: { type: 'wow', count: 0, userReacted: false },
  fire: { type: 'fire', count: 0, userReacted: false },
};

/**
 * Fetch all activities from all users (public feed) with reactions and profiles.
 * For the Progress page top strip.
 */
export async function fetchPublicFeed(): Promise<LocalActivity[]> {
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch latest activity per user
  const { data, error } = await supabase
    .from('journey_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching public feed:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Keep only the latest activity per user
  const latestByUser = new Map<string, typeof data[0]>();
  for (const row of data) {
    if (!latestByUser.has(row.user_id)) {
      latestByUser.set(row.user_id, row);
    }
  }

  const activities = Array.from(latestByUser.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  // Fetch reactions for these activities
  const activityIds = activities.map(a => a.id);
  const { data: reactions } = await supabase
    .from('activity_reactions')
    .select('activity_id, user_id, reaction_type')
    .in('activity_id', activityIds);

  // Fetch profiles for these users
  const userIds = activities.map(a => a.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map<string, { display_name: string; avatar_url: string }>();
  for (const p of profiles || []) {
    profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
  }

  // Build reaction map
  const reactionMap: Record<string, Record<ReactionType, ActivityReaction>> = {};
  const totalMap: Record<string, number> = {};

  for (const r of reactions || []) {
    const type = (r.reaction_type || 'heart') as ReactionType;
    if (!reactionMap[r.activity_id]) {
      reactionMap[r.activity_id] = { ...DEFAULT_REACTIONS };
      totalMap[r.activity_id] = 0;
    }
    reactionMap[r.activity_id][type] = {
      ...reactionMap[r.activity_id][type],
      count: reactionMap[r.activity_id][type].count + 1,
      userReacted: user && r.user_id === user.id ? true : reactionMap[r.activity_id][type].userReacted,
    };
    totalMap[r.activity_id]++;
  }

  return activities.map(row => {
    const profile = profileMap.get(row.user_id);
    return {
      ...toLocal(row),
      reactionCount: totalMap[row.id] || 0,
      reactions: reactionMap[row.id] || { ...DEFAULT_REACTIONS },
      displayName: profile?.display_name,
      avatarUrl: profile?.avatar_url,
    };
  });
}

export interface UserStoryGroup {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  activities: LocalActivity[];
}

/**
 * Fetch ALL activities from all users grouped by user, with reactions and profiles.
 * For the Reel page to show user-based story pages.
 */
export async function fetchAllActivitiesGroupedByUser(): Promise<UserStoryGroup[]> {
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all activities
  const { data, error } = await supabase
    .from('journey_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Group by user
  const userActivitiesMap = new Map<string, (typeof data[0])[]>();
  for (const row of data) {
    if (!userActivitiesMap.has(row.user_id)) {
      userActivitiesMap.set(row.user_id, []);
    }
    userActivitiesMap.get(row.user_id)!.push(row);
  }

  // Fetch reactions for all activities
  const activityIds = data.map(a => a.id);
  const { data: reactions } = await supabase
    .from('activity_reactions')
    .select('activity_id, user_id, reaction_type')
    .in('activity_id', activityIds);

  // Collect all unique user IDs (activity owners + reactors)
  const allUserIds = new Set<string>(Array.from(userActivitiesMap.keys()));
  for (const r of reactions || []) {
    allUserIds.add(r.user_id);
  }

  // Fetch profiles for ALL users (activity owners + reactors)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', Array.from(allUserIds));

  const profileMap = new Map<string, { display_name: string; avatar_url: string }>();
  for (const p of profiles || []) {
    profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
  }

  // Build reaction map + reactor profiles per activity
  const reactionMap: Record<string, Record<ReactionType, ActivityReaction>> = {};
  const totalMap: Record<string, number> = {};
  const reactorProfilesMap: Record<string, { userId: string; displayName: string; avatarUrl?: string }[]> = {};

  for (const r of reactions || []) {
    const type = (r.reaction_type || 'heart') as ReactionType;
    if (!reactionMap[r.activity_id]) {
      reactionMap[r.activity_id] = { ...DEFAULT_REACTIONS };
      totalMap[r.activity_id] = 0;
      reactorProfilesMap[r.activity_id] = [];
    }
    reactionMap[r.activity_id][type] = {
      ...reactionMap[r.activity_id][type],
      count: reactionMap[r.activity_id][type].count + 1,
      userReacted: user && r.user_id === user.id ? true : reactionMap[r.activity_id][type].userReacted,
    };
    totalMap[r.activity_id]++;
    
    // Add reactor profile if not already added
    const profile = profileMap.get(r.user_id);
    if (profile && !reactorProfilesMap[r.activity_id].some(p => p.userId === r.user_id)) {
      reactorProfilesMap[r.activity_id].push({
        userId: r.user_id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      });
    }
  }

  // Build user story groups
  const groups: UserStoryGroup[] = [];
  
  // Put current user first if they have activities
  if (user && userActivitiesMap.has(user.id)) {
    const userActivities = userActivitiesMap.get(user.id)!;
    const profile = profileMap.get(user.id);
    groups.push({
      userId: user.id,
      displayName: profile?.display_name || 'You',
      avatarUrl: profile?.avatar_url,
      activities: userActivities.map(row => ({
        ...toLocal(row),
        reactionCount: totalMap[row.id] || 0,
        reactions: reactionMap[row.id] || { ...DEFAULT_REACTIONS },
        reactorProfiles: reactorProfilesMap[row.id] || [],
        displayName: profile?.display_name,
        avatarUrl: profile?.avatar_url,
      })),
    });
    userActivitiesMap.delete(user.id);
  }

  // Add other users
  for (const [userId, userActivities] of userActivitiesMap) {
    const profile = profileMap.get(userId);
    groups.push({
      userId,
      displayName: profile?.display_name || 'User',
      avatarUrl: profile?.avatar_url,
      activities: userActivities.map(row => ({
        ...toLocal(row),
        reactionCount: totalMap[row.id] || 0,
        reactions: reactionMap[row.id] || { ...DEFAULT_REACTIONS },
        reactorProfiles: reactorProfilesMap[row.id] || [],
        displayName: profile?.display_name,
        avatarUrl: profile?.avatar_url,
      })),
    });
  }

  return groups;
}
