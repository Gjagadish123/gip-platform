import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Supabase mode: the admin reads and writes the database. Without the URL and key (the GitHub Pages preview build)
 * it stays the browser-only demo. Inlined at build time.
 */
export const BACKEND = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

export type Db = ReturnType<typeof createClient>;
