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

## Adding UI components

Run inside `website/` or `admin/`:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add "https://21st.dev/r/<author>/<component>"
```

Components land in `src/components/ui/`.
