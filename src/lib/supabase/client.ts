import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use global to persist singleton across hot reloads in development
const globalForSupabase = globalThis as unknown as {
  supabaseClient: SupabaseClient | undefined;
};

export function createClient(): SupabaseClient | null {
  // During SSG/build time without env vars, return null
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === "undefined") {
      return null;
    }
    throw new Error(
      "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  if (!globalForSupabase.supabaseClient) {
    globalForSupabase.supabaseClient = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          // Disable auto-refresh to avoid AbortError race conditions
          // We'll manually handle session refresh
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return globalForSupabase.supabaseClient;
}
