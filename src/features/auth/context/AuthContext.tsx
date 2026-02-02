"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
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

  // Track if we've already initialized to prevent StrictMode double-init issues
  const initCompleted = useRef(false);

  useEffect(() => {
    // Skip if already initialized (handles StrictMode double-mount)
    if (initCompleted.current) {
      return;
    }

    let isMounted = true;
    const supabase = createClient();

    if (!supabase) {
      console.warn("[Auth] Supabase client not available");
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Helper to fetch profile
    const fetchProfile = async (userId: string): Promise<Tables<"profiles"> | null> => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.warn("[Auth] Profile fetch error:", error.message);
          return null;
        }
        return data;
      } catch (err) {
        console.warn("[Auth] Profile fetch exception:", err);
        return null;
      }
    };

    // Helper to update state with session
    const updateAuthState = async (session: Session | null, source: string) => {
      if (!isMounted) return;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);

        if (isMounted) {
          setState({
            user: session.user,
            session,
            profile,
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } else {
        if (isMounted) {
          setState({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    };

    // Use onAuthStateChange for EVERYTHING including initial session
    // This avoids AbortError issues with getSession() in StrictMode
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // Mark initialization as complete on first event
        if (!initCompleted.current) {
          initCompleted.current = true;
        }

        await updateAuthState(session, `Auth event: ${event}`);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const refreshSession = async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

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
