/**
 * Backward-compatible useAuth hook.
 * Wraps the new SSO AuthContext so all existing components keep working.
 */
import { useSSOAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error } = useSSOAuth();

  const signOut = async () => {
    window.location.href = '/logout';
  };

  return {
    user,
    session: isAuthenticated ? {} as any : null, // backwards compat for truthy checks
    loading: isLoading,
    signOut,
  };
};
