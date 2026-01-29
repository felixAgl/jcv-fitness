import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

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

  if (!client) {
    // Dynamic import to avoid validation at module load time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createBrowserClient } = require("@supabase/ssr");
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return client;
}
