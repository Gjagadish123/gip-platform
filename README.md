# GIP Platform

Greater Infra Projects: public website, admin portal, and Supabase backend.

| Folder | What | Dev URL |
| --- | --- | --- |
| `website/` | Public site (Next.js, reads published projects) | http://localhost:3000 |
| `admin/` | Admin portal (Next.js, Supabase Auth) | http://localhost:3001 |
| `supabase/` | Database migrations, storage, auth config | http://127.0.0.1:54323 (Studio) |

Stack: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui (Radix) + 21st.dev components, Supabase.

## Run

```bash
cd website && npm install && npm run dev
cd admin && npm install && npm run dev
```

Each app needs `.env.local`; copy it from `.env.example`.

## Backend (Supabase)

Everything lives in `supabase/`: one migration (`migrations/*_admin_backend.sql`: tables, Hold status, RLS, RPCs,
media bucket), a generated data seed, and pgTAP tests. Needs Docker Desktop. From this folder:

```bash
npm install          # pins the Supabase CLI
npm run db:seed      # writes supabase/seed.sql (data) and, once, supabase/seed.local-admin.sql (your local login)
npm run db:start     # local stack; prints the API URL and publishable key
npm run db:reset     # re-applies migrations + both seed files
npm run db:test      # pgTAP: access rules, Hold, RPCs, undo, stale-write protection
npm run db:lint      # Supabase security/performance advisors
npm run db:types     # regenerate admin/src/lib/supabase/database.types.ts after a schema change
```

Put the URL and publishable key from `db:start` in `admin/.env.local`. The local admin login is in the header of
`supabase/seed.local-admin.sql` (gitignored, random password per machine: this repo is public). With those two
variables set the admin reads and writes Supabase; without them only the GitHub Pages preview build
(`GITHUB_PAGES=true`) may run, as the browser-only demo; any other production build fails.
`admin/scripts/gen-seed.ts` writes `seed.sql` with the four live layout projects and `seed.catalogue.sql` with the
others (not loaded by `db:reset`).

How it fits together:

- **Admins** are Supabase Auth users whose `app_metadata.role` is `admin` (only an operator can set it). The database
  checks the live user row, so removing the role takes effect at once. Sign-up is off; non-admin accounts can't sign in.
- **projects**: identity, publishing and ordering are columns; everything the editor edits is one `content` JSON
  document shaped like `admin/src/lib/types.ts` (mapping in `admin/src/lib/supabase/rows.ts`). A save only lands on the
  version the admin was editing, so two admins can't silently overwrite each other.
- **units** change only through RPCs (`set_unit_statuses`, `save_unit`, `replace_units`, `undo_batch`), each atomic with
  its history row, activity line and the project's "status as of" stamp. They refuse a change made on a stale screen
  (another admin changed that plot first), and generate/remove only touch the plots they add or remove. A trigger logs
  every status change.
- **Website (anon)** can read the listing columns of published projects and the public columns of their units: no
  `content` yet (it holds the price even when hidden, and unlisted documents), no notes, mortgagee, sale deed numbers
  or unit prices, no history or activity. Wiring the website adds a cleaned public read of `content`.
- **Media** uploads go to the public `project-media` bucket (JPEG/PNG/WebP/AVIF/GIF and PDF, 20 MB, no SVG).

### Live layouts (`/layouts` on the website)

Global City VI, Global City V, Global City RRR and Western County – Shankarpalli on one page: each approved layout
drawn plot by plot on Google Maps (satellite, street map, or the plan alone), coloured by today's status, with nearby
schools, hospitals, shopping and transport from Google Places and drive routes from the Routes API.

- **Geometry** is built by `tools/layouts/build_layouts.py` from traceable sources in `tools/layouts/source/<id>/`
  (digitised plots and roads, printed side lengths, satellite control points). It writes the same JSON to
  `admin/src/lib/layouts/` and the website's `src/lib/data/layouts/`. Check it with `tools/layouts/check_layouts.py`
  (numbering, printed area totals, satellite fit, plots drawn at one scale, both copies, and that `supabase/seed.sql`
  has the same plots).
- **Sync**: migration `*_live_layouts.sql` broadcasts every status change of a published project on the private
  Realtime channel `live-layouts` (number, status, status date and sample flag only: columns anon can read anyway).
  Its RLS policy lets visitors listen and nobody send, so the publishable key cannot fake a change. The page patches
  the plot at once and re-reads all four projects through RLS on reconnect, on tab focus, and every 30 s while offline
  or after a failed read; only the newest read of a project may replace its plots.
  Unpublishing a project removes it from the page. The same migration enforces the admin's guarded changes in the
  RPCs: undoing a registration or putting a sold plot back on sale needs a note. `npm run db:test` covers both.
- **Keys**: the website needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (a browser key: restrict it to your site's referrers
  and to Maps JavaScript API, Places API (New) and Routes API). Without it the page shows the plans without a map.
  The admin's `NEXT_PUBLIC_WEBSITE_URL` adds a "Live layout ↗" link to those projects' inventory.
- **Admin**: works on these four projects. `supabase/seed.sql` holds only them, and the admin's demo data starts with
  them (`SEED` in `admin/src/lib/mock`). The client's other 20 projects stay on file: `npm run db:seed` also writes
  `supabase/seed.catalogue.sql`, which `db:reset` does not load; add it to `[db.seed]` in `supabase/config.toml` (or run
  it after `seed.sql` in the SQL editor) to bring them back. **Live layouts** in the sidebar (`/live-layouts`) shows,
  per project, whether it is on the live page, its drawing and fit, today's availability and sample data, with links to
  change statuses on the layout. The inventory's Layout view is offered for these four alone; every other project keeps
  Grid and Table, and its master plan stays in Media.

### Going live (hosted project)

1. Create the project (Postgres 17, region Mumbai), then from this folder: `npx supabase login`,
   `npx supabase link --project-ref <ref>`, `npx supabase db push`. Never add `--include-seed` and never run
   `db reset --linked`: they would load the local admin file.
2. Dashboard > Authentication > Sign In / Providers: turn **Allow new users to sign up** off. Add each admin with
   Authentication > Users > Add user > **Create new user** (email + a strong password, Auto Confirm User on); invite
   emails don't work with this app (it has no set-password page). Then mark them admin in the SQL editor before they
   sign in, and give them the password out of band:
   `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = '<email>';`
   To reset a password: `update auth.users set encrypted_password = extensions.crypt('<new>', extensions.gen_salt('bf')) where email = '<email>';`
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on the admin's host before it builds (they
   are baked in at build time; the build fails without them). Never the secret key.
4. Load the projects: run `npm run db:seed`, then run `supabase/seed.sql` (the four live layout projects; data only, no
   users) in the SQL editor, and `supabase/seed.catalogue.sql` too if the other projects should be listed. Many
   statuses are sample data (marked as such): check them with the client first.
5. `npx supabase db advisors --linked` should report no issues.

## Adding UI components

Run inside `website/` or `admin/`:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add "https://21st.dev/r/<author>/<component>"
```

Components land in `src/components/ui/`.
