/**
 * Singleton auth state manager.
 * All useAuth() hooks share ONE subscription and ONE state, eliminating
 * the 5-8 duplicate onAuthStateChange listeners visible in console logs.
 */
import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

type AuthListener = (user: User | null, session: Session | null, loading: boolean) => void;

let initialized = false;
let currentUser: User | null = null;
let currentSession: Session | null = null;
let currentLoading = true;
const listeners = new Set<AuthListener>();

function notify() {
  for (const fn of listeners) {
    fn(currentUser, currentSession, currentLoading);
  }
}

function init() {
  if (initialized) return;
  initialized = true;

  let lastSessionId: string | null = null;
  let initialCheckDone = false;

  supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession: Session | null) => {
    const sessionId = newSession?.access_token ?? null;
    if (event === 'SIGNED_IN' && sessionId === lastSessionId) return;
    lastSessionId = sessionId;

    if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      currentSession = newSession;
      currentUser = newSession?.user ?? null;
    } else if (event === 'SIGNED_OUT') {
      currentSession = null;
      currentUser = null;
    }

    if (initialCheckDone) {
      currentLoading = false;
      notify();
    }
  });

  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) console.error('[Auth] Session check error:', error);
    currentSession = session;
    currentUser = session?.user ?? null;
    initialCheckDone = true;
    currentLoading = false;
    notify();
  }).catch((err) => {
    console.error('[Auth] Session init error:', err);
    initialCheckDone = true;
    currentLoading = false;
    notify();
  });
}

export function subscribeAuth(listener: AuthListener): () => void {
  init();
  listeners.add(listener);
  // Immediately fire with current state
  listener(currentUser, currentSession, currentLoading);
  return () => { listeners.delete(listener); };
}

export function getAuthState() {
  init();
  return { user: currentUser, session: currentSession, loading: currentLoading };
}

export async function signOutAuth() {
  await supabase.auth.signOut();
  currentSession = null;
  currentUser = null;
  notify();
}
