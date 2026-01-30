"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

// Global cache for auth state to persist across navigations
const authCache: { initialized: boolean; state: AuthState | null } = {
  initialized: false,
  state: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use cached state if available, otherwise start with loading
  const [state, setState] = useState<AuthState>(() => {
    if (authCache.initialized && authCache.state) {
      return authCache.state;
    }
    return {
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
    };
  });

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    if (!supabase) {
      console.warn("Supabase client not available");
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const initAuth = async () => {
      // If already initialized, skip re-fetching
      if (authCache.initialized) {
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        let newState: AuthState;
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          newState = {
            user: session.user,
            session,
            profile,
            isLoading: false,
            isAuthenticated: true,
          };
        } else {
          newState = {
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          };
        }

        // Cache the state for future navigations
        authCache.initialized = true;
        authCache.state = newState;
        setState(newState);
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        let newState: AuthState;

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          newState = {
            user: session.user,
            session,
            profile,
            isLoading: false,
            isAuthenticated: true,
          };
        } else {
          newState = {
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          };
        }

        // Update cache
        authCache.initialized = true;
        authCache.state = newState;
        setState(newState);
      }
    );

    return () => {
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
