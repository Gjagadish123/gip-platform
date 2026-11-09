// A fingerprint of everything the website reads from Supabase at build time: the published projects (with their
// public content) and their plots. The Pages workflow writes it into the site (site/data-version.txt) and, on its
// schedule, rebuilds only when the live data no longer matches, so admin changes reach the static website on their own.
//
// Usage: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... node .github/scripts/site-data-version.mjs
import { createHash } from "node:crypto"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required")

async function read(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) throw new Error(`${path.split("?")[0]}: HTTP ${res.status} ${await res.text()}`)
  return res.json()
}

const projects = await read(
  "projects?select=id,slug,name,type_id,lifecycle,publish_state,homepage_slot,sort_order,public_content,inventory_updated_at,status_sample,sample,published_at,updated_at&publish_state=eq.published&order=id",
)
const units = {}
for (const p of projects) {
  // One project per request keeps each read under the API's 1000-row page.
  units[p.id] = await read(`units?select=number,block,area,width_ft,depth_ft,facing,facing2,road_width_ft,road_width2_ft,corner,status,status_date,sample&project_id=eq.${encodeURIComponent(p.id)}&order=number`)
}
process.stdout.write(createHash("sha256").update(JSON.stringify({ projects, units })).digest("hex"))
