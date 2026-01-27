import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadToStorage, deleteFromStorage } from '@/services/storage-service';

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
}

// Convert DB row to local shape
function toLocal(row: JourneyActivity): LocalActivity {
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

  // Load activities for current user
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
      } else {
        setActivities((data || []).map(toLocal));
      }
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

  return {
    activities,
    loading,
    userId,
    refresh: loadActivities,
    upsertActivity,
    deleteActivity,
  };
}

/**
 * Fetch all activities from all users (public feed).
 * For the Progress page top strip.
 */
export async function fetchPublicFeed(): Promise<LocalActivity[]> {
  const { data, error } = await supabase
    .from('journey_activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching public feed:', error);
    return [];
  }

  return (data || []).map(toLocal);
}
