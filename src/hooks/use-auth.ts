import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const { user, session, isAuthenticated, isLoading } = useAuthContext();

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return {
    user,
    session,
    loading: isLoading,
    signOut,
  };
};
