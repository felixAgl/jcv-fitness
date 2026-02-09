"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Tables<"profiles"> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Track current session ID to avoid re-processing same session
  const currentSessionId = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch profile helper - stable reference
  const fetchProfile = useCallback(async (userId: string): Promise<Tables<"profiles"> | null> => {
    const supabase = createClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // No Supabase client (missing env vars during SSG)
    if (!supabase) {
      console.log("[Auth] No supabase client, setting isLoading=false");
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    let isMounted = true;

    // Clear timeout helper
    const clearAuthTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Handler for auth state changes - SET USER IMMEDIATELY, profile loads async
    const handleAuthChange = async (session: Session | null, source: string) => {
      if (!isMounted) return;

      const newSessionId = session?.access_token || null;

      // Skip only if EXACT SAME session (same token)
      if (newSessionId && newSessionId === currentSessionId.current) {
        console.log("[Auth] Same session, skipping:", source);
        return;
      }

      console.log("[Auth] handleAuthChange from", source, ":", session ? "has session" : "no session");

      // Clear timeout since we got a response
      clearAuthTimeout();

      if (session?.user) {
        currentSessionId.current = newSessionId;

        // SET USER IMMEDIATELY - don't wait for profile
        setState({
          user: session.user,
          session,
          profile: null, // Will be loaded async
          isLoading: false,
          isAuthenticated: true,
        });
        console.log("[Auth] User authenticated immediately:", session.user.email);

        // Load profile in background (non-blocking)
        fetchProfile(session.user.id).then(profile => {
          if (isMounted && profile) {
            setState(prev => ({ ...prev, profile }));
            console.log("[Auth] Profile loaded");
          }
        });
      } else {
        currentSessionId.current = null;
        setState({
          user: null,
          session: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
        console.log("[Auth] No session, user logged out");
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("[Auth] onAuthStateChange event:", event);

        // Handle all auth events - let handleAuthChange dedupe by session token
        await handleAuthChange(session, `onAuthStateChange:${event}`);
      }
    );

    // Also get session explicitly (for cases where onAuthStateChange doesn't fire immediately)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log("[Auth] getSession result:", session ? "has session" : "no session");
        handleAuthChange(session, "getSession");
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          console.error("[Auth] getSession error:", error);
        }
      });

    // Timeout fallback - only if still loading
    timeoutRef.current = setTimeout(() => {
      if (isMounted) {
        setState(prev => {
          if (prev.isLoading) {
            console.log("[Auth] Timeout reached, forcing isLoading=false");
            return {
              user: null,
              session: null,
              profile: null,
              isLoading: false,
              isAuthenticated: false,
            };
          }
          return prev;
        });
      }
    }, 3000); // Reduced from 5s to 3s for faster fallback

    // Cleanup
    return () => {
      console.log("[Auth] Cleanup - unmounting");
      isMounted = false;
      clearAuthTimeout();
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) return { error: new Error("Supabase not initialized") };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const supabase = createClient();
    if (!supabase) return { error: new Error("Supabase not initialized"), user: null };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null, user: data.user };
  };

  const signOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const signInWithMagicLink = async (email: string) => {
    const supabase = createClient();
    if (!supabase) return { error: new Error("Supabase not initialized") };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const supabase = createClient();
    if (!supabase) return { error: new Error("Supabase not initialized") };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: error as Error | null };
  };

  const refreshSession = async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);

      setState({
        user: session.user,
        session,
        profile,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        signInWithMagicLink,
        resetPassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
