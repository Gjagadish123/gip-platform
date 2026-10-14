import { createClient } from "@supabase/supabase-js";

// ponytail: the website only reads public rows (RLS decides what is public), so no auth/cookie client here.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
