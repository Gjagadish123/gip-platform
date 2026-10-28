# Live layouts

A standalone page that shows Greater Infra Projects' plotted layouts on the real Google satellite map, with each
plot's status read live from the admin: Global City VI, Global City RRR, Global City V and Western County. It is the
client-approved Global City VI demo (same look, unfurl reveal, 2D/3D lift, hover, selection ring, cars, sample villas,
guided tour, orbit) made multi-project and live. It is separate from the website.

Deployed to GitHub Pages at `/gip-platform/layouts/` (admin at `/gip-platform/`, website at `/gip-platform/site/`).

Stack: Vite 5, React 18, Tailwind 3, framer-motion, three.js, @supabase/supabase-js.

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://127.0.0.1:4030
npm run build                # dist/ (set VITE_BASE for a sub-path deploy)
```

## Environment

| Variable | Used for |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps JavaScript API. Restrict it by HTTP referrer. Without it the page uses its own 3D model. |
| `VITE_GOOGLE_MAP_ID` | A vector Map ID (tilt, rotation, WebGL overlay). Defaults to Google's `DEMO_MAP_ID`. |
| `VITE_SUPABASE_URL` | Supabase project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key. RLS lets it read only the public columns of published projects. |
| `VITE_BASE` | Deploy base path, e.g. `/gip-platform/layouts/` (default `/`). Every public file goes through `import.meta.env.BASE_URL`. |
| `VITE_WEBSITE_URL` | The website link (default `https://gjagadish123.github.io/gip-platform/site/`). |

Without the Supabase variables (or when the first read fails) the layouts still work, without statuses, and the
availability card says so (with a retry when Supabase is configured). Statuses are never made up.

## URL

`?project=<id>&plot=<n>` is the shareable state (kept with `replaceState`). Without `project` the first published
project opens. `?nomap=1` skips Google and shows the self-contained 3D model.

## Where the data comes from

| What | Source |
| --- | --- |
| Which projects are listed, their order and copy | `projects` (published only, `sort_order`): name, lifecycle, `public_content` (description, highlights, land area, `legal.approvals`, amenities, location, location advantages, media), `inventory_updated_at`, `status_sample` |
| Plot statuses and facts | `units`: number, area, width/depth, facing(s), road width(s), corner, status, status date, sample. The open project is read in full; the others only for the switcher's counts |
| Live changes | private Realtime channel `live-layouts` (see `supabase/migrations/20261027120000_live_layouts.sql`): `units` patches statuses (pulse on the map, screen-reader announcement), `units_reset` re-reads a project, `project` re-reads the list |
| Plot geometry, roads, parks, trees, entrance, tour stops | `src/data/masterplans/<id>.json`, one lazy chunk per project |
| Nearby landmarks with drive times | `src/data/landmarks/<id>.json` (optional; the Location section shows them when present) |
| Project logo | `public/brand/` (Global City VI has its brochure logo; the others get a monogram) |
| Company phone, WhatsApp, email, office | `src/data/project.js` |

The live logic (`src/lib/live.js`) is a port of the website's `use-live.ts`: it catches up on (re)connect, when the
browser comes back online and when the tab returns after a minute; it polls every 30 s while the socket is down or a
read failed; and only the newest read of a project may apply. Payloads are validated before they touch state.

A unit's own value wins over the drawn layout; the layout fills what the unit row leaves empty. Plot numbers are
strings everywhere.

## Statuses

Available `#1e9e5a`, Sold Out `#d8443c`, Mortgaged `#f0a020`, Registered `#2f5fbf`, Hold `#8e5bd0`, in the admin's
order. Legend swatches carry the admin's non-colour cues: plain, hatch, dots, folded corner, stripes. A plot without a
live status is drawn light grey. Sample villas stand on Sold Out and Registered plots in 3D (toggle "sample villas").
Prices show only when the project's `public_content.showPrice` is on.

## Rendering

- **Google vector map** (normal case): one map for the whole visit; the three.js site is mounted through
  `WebGLOverlayView`. Switching projects disposes the old site, builds the new one, flies out and in, and replays the
  unfurl from `features.revealFrom` (else the gate, else the layout's centre).
- **Google raster map** (no hardware WebGL): flat polygons for 2D; 3D and the tour use the standalone model.
- **No Google at all**: the standalone three.js model does both views and the page says so.

`src/map/`: `siteScene.js` (plots, roads, labels, trees, wall, lights, reveal/lift/pulse, villas rebuilt when the set
of sold plots changes), `amenities.js` (only the features a layout places: arch, clubhouse, pool, parking, tank,
play area, courts, park), `cars.js` (traffic on the longest roads), `tour.js` (stops read from the layout: entrance,
main road, a named place, the whole layout), `villas.js`, `shadows.js`.

## Before this goes live

- The Maps key in `.env.local` is a development key: create a production key restricted to the Pages domain and a real
  vector Map ID.
- Statuses marked sample in the admin show "Some statuses are sample data" until they are confirmed there.
