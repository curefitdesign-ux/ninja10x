import { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setNeedsSetup(false);
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

      if (data) {
        setProfile(data as Profile);
        setNeedsSetup(false);
      } else {
        setNeedsSetup(true);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

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

    setProfile(data as Profile);
    return data;
  };

  return { profile, loading, needsSetup, createProfile, updateProfile };
};
