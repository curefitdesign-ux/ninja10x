import { useState, useEffect } from 'react';
import { subscribeAuth, signOutAuth } from '@/lib/auth-singleton';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [state, setState] = useState<{ user: User | null; session: Session | null; loading: boolean }>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    return subscribeAuth((user, session, loading) => {
      setState(prev => {
        // Skip if identical to avoid re-renders
        if (prev.user === user && prev.session === session && prev.loading === loading) return prev;
        return { user, session, loading };
      });
    });
  }, []);

  return { ...state, signOut: signOutAuth };
};
