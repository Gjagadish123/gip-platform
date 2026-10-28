import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Backend mode: projects and plots come from Supabase (what the admin publishes). Without the URL and key (the
 * GitHub Pages preview build) the site keeps its bundled data. Inlined at build time.
 */
export const BACKEND = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

let client: SupabaseClient | null = null;

// ponytail: the website only reads public rows (RLS and column grants decide what is public), so no auth/cookie client
// (and no token refresh timer). Every request gives up after 10 s, so a hung backend shows as an error, not a hang.
export const supabase = () =>
  (client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(10_000) }) },
  }));
