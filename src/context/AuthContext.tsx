import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { validateSSOToken } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextShape {
  user: User | null;
  cultUserId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export const useSSOAuth = (): AuthContextShape => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSSOAuth must be used within <AuthProvider>");
  return ctx;
};

// Capture SSO token and initial path synchronously at module level
// before any React Router redirect can strip it
const _initialSearch = window.location.search;
const _initialParams = new URLSearchParams(_initialSearch);
const _capturedSSOToken = _initialParams.get("sso_token") || _initialParams.get("ssoToken");
const _ignoreAuth = _initialParams.get("ignoreAuth") === "true";
const _initialPathIsRoot = window.location.pathname === "/" || window.location.pathname === "";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cultUserId, setCultUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const ssoToken = _capturedSSOToken;

    const run = async () => {
      try {
        // Check for existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        // If we have an existing session and NO sso token to re-validate, use it
        if (existingSession?.user && !ssoToken && !_ignoreAuth) {
          setUser(existingSession.user);
          setIsLoading(false);
          return;
        }

        // If no sso token and not in ignoreAuth mode, stop loading
        if (!ssoToken && !_ignoreAuth) {
          setIsLoading(false);
          return;
        }

        // Sign out any existing session before establishing a new one
        // This prevents multiple auth sessions accumulating in localStorage
        if (existingSession) {
          console.log("[SSO Auth] Existing session found — signing out before re-auth...");
          await supabase.auth.signOut();
        }

        console.log(
          _ignoreAuth
            ? "[SSO Auth] ignoreAuth mode — using 'at' header..."
            : "[SSO Auth] Validating SSO token..."
        );
        const result = await validateSSOToken(ssoToken);

        // Set Supabase session from edge function tokens
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: result.supabaseTokens.access_token,
            refresh_token: result.supabaseTokens.refresh_token,
          });

        if (sessionError) throw new Error("Failed to establish session");

        setCultUserId(result.cultUserId);
        setUser(sessionData.user);
        setError(null);
      } catch (err: any) {
        console.error("[SSO Auth] Validation failed:", err);
        setError(err?.message || "Authentication failed");
        setUser(null);
        setCultUserId(null);
      } finally {
        // Strip sso token and ignoreAuth from URL
        const params = new URLSearchParams(window.location.search);
        params.delete("sso_token");
        params.delete("ssoToken");
        params.delete("ignoreAuth");
        const remaining = params.toString();
        const newUrl =
          window.location.pathname +
          (remaining ? `?${remaining}` : "") +
          window.location.hash;
        window.history.replaceState({}, "", newUrl);
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const value: AuthContextShape = {
    user,
    cultUserId,
    isAuthenticated: !!user,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
