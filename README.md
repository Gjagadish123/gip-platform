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

Local Supabase (needs Docker Desktop): `npx supabase start` from this folder.

## Website (public site)

Design + build contract: `website/docs/spec.md` (research and the three design directions behind it are in
`website/docs/research/`). The site hardcodes ONE project (Global City VI) through `website/src/lib/projects.ts`;
swap those function bodies for Supabase queries when the backend lands and nothing in the pages changes.

- Imagery: artist's impressions come from kie.ai (`website/scripts/kie-generate.py`, key in the repo-root `.env`);
  re-encode anything for the site with `website/scripts/optimize-images.py` → `src/assets/images/*.webp`.
- Previews: `.github/workflows/deploy-admin-pages.yml` publishes the admin at `/gip-platform/` and the website at
  `/gip-platform/site/` on GitHub Pages (both `noindex`). Local export test from `website/`:
  `GITHUB_PAGES=true PAGES_BASE_PATH=/gip-platform/site npx next build && node scripts/flatten-segments.mjs out`
  (in Git Bash prefix `MSYS_NO_PATHCONV=1` so the path is not rewritten).
- The real launch goes to a Node host (Vercel or similar): the image optimizer and Cache Components come back.

## Adding UI components

Run inside `website/` or `admin/`:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add "https://21st.dev/r/<author>/<component>"
```

Components land in `src/components/ui/`.
