import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    // Track last session id to avoid duplicate re-renders
    let lastSessionId: string | null = null;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Skip duplicate SIGNED_IN events for same session
        const sessionId = newSession?.access_token ?? null;
        if (event === 'SIGNED_IN' && sessionId === lastSessionId) {
          return;
        }
        lastSessionId = sessionId;

        console.log('[Auth] State change:', event, !!newSession);
        
        // Handle token refresh and session updates
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else if (event === 'INITIAL_SESSION') {
          // Initial session from storage
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
        
        // Only set loading false after initial check is done
        if (initialCheckDone.current) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session - this is the authoritative initial state
    const initSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session check error:', error);
        }
        
        console.log('[Auth] Initial session check:', !!existingSession);
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
      } catch (err) {
        console.error('[Auth] Session init error:', err);
      } finally {
        initialCheckDone.current = true;
        setLoading(false);
      }
    };

    initSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return { user, session, loading, signOut };
};
