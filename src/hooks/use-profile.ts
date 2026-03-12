import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  stories_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const fetchedForUserId = useRef<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before making profile decisions
    if (authLoading) {
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      setNeedsSetup(false);
      fetchedForUserId.current = null;
      return;
    }

    // Prevent duplicate fetches for the same user
    if (fetchedForUserId.current === user.id && profile !== null) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      fetchedForUserId.current = user.id;
      
      if (data) {
        setProfile(data as Profile);
        setNeedsSetup(false);
      } else {
        setNeedsSetup(true);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, authLoading]);

  const createProfile = async (displayName: string, avatarUrl: string) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (error) throw error;

    setProfile(data as Profile);
    setNeedsSetup(false);
    return data;
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'stories_public'>>) => {
    if (!user || !profile) throw new Error('No user or profile');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update local state immediately to keep UI in sync
    const updatedProfile = data as Profile;
    setProfile(updatedProfile);
    setNeedsSetup(false);
    
    return updatedProfile;
  };
  
  // Force refresh profile from database
  const refreshProfile = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data as Profile);
      setNeedsSetup(false);
    }
    return data;
  };

  return { profile, loading, needsSetup, createProfile, updateProfile, refreshProfile };
};
