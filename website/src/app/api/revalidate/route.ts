import { revalidateTag } from "next/cache";

/**
 * The database calls this after every admin save to projects or plots (supabase/migrations/*_site_revalidate.sql),
 * with the shared secret REVALIDATE_SECRET, so the next visit reads the change instead of waiting out the cache.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) return new Response(null, { status: 401 });
  revalidateTag("site-data", { expire: 0 });
  return new Response(null, { status: 204 });
}
