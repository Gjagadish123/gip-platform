# Next 16.4 cheat sheet for the GIP marketing site

Scope: `website/` (Next 16.4.0, React 19.3.0, Tailwind v4 via `@tailwindcss/turbopack`, `cacheComponents: true`, `partialPrefetching: true`). Every claim below was checked against `website/node_modules/next/dist/docs/01-app/**` or the Next source in `website/node_modules/next/dist/**`, and against how `admin/` already ships to GitHub Pages. Snippets are copy-pasteable TSX/TS for this repo (`@/` = `website/src/`).

Read §0 first. It is the list of things that will bite if you write Next the way Next 13–15 tutorials do.

---

## 0. Top gotchas (Next 16.4 vs what most code assumes)

| # | Gotcha | Why it matters here |
|---|--------|---------------------|
| 1 | **`params`, `searchParams` are Promises. Synchronous access is removed in 16** (`const { slug } = await params`). Same for `opengraph-image`/`icon` default-export `params` and the sitemap `id`. | Every `[slug]` page, `generateMetadata`, `opengraph-image.tsx`. Use the generated `PageProps<'/projects/[slug]'>` / `LayoutProps<'/'>` globals (no import; produced by `next dev`/`next build`/`next typegen`). |
| 2 | **`cacheComponents: true` changes the rendering contract.** Static by default; any *uncached async data* (`fetch`, Supabase query), any request API (`cookies/headers/searchParams`), and any `Date.now()/Math.random()/crypto.randomUUID()` in a Server Component outside `<Suspense>` is a **build error**, not a silent opt-in to dynamic. Fix = `"use cache"` (shared) or `<Suspense>` + `await io()` / `connection()` (per request). Module imports, JSON imports, pure computation, sync `fs` reads are fine and prerender. | A marketing site with hardcoded content needs **zero** directives. The moment you `await supabase.from(...)` in a page you must choose. See §6. |
| 3 | **`"use cache"` does not compile when `cacheComponents` is off** (source: `server/config.js` ~L1065 — `experimental.useCache` is set from `cacheComponents`; with it off "every `use cache` fails to compile"). The admin's GitHub Pages build sets `cacheComponents: !pages`. | If the website keeps the same GH Pages preview path, **it cannot contain `"use cache"` anywhere.** Use the build-time data snapshot pattern in §6.5 instead; it works in both modes. |
| 4 | **`output: 'export'` cannot run with `cacheComponents`** (source: `export/index.js` L657 "Invariant: PPR cannot be enabled in export mode"). Also unsupported in export: `loading.js` streaming, ISR, `cookies()`, route handlers that read the request, rewrites/redirects/headers, intercepting routes, Server Actions, default image loader. | Mirror admin: `cacheComponents: !pages`, `partialPrefetching: !pages`, `images.unoptimized: true` only when `GITHUB_PAGES=true`. |
| 5 | **With `cacheComponents`, `generateStaticParams` must return at least one param** — an empty array is a build error. Unlisted params get an App Shell + background ISR upgrade (16.3+). With `output: 'export'`, a dynamic route **without** `generateStaticParams` fails the build and unlisted params 404. | Projects page: hardcode exactly one slug (`global-city-vi`). |
| 6 | **`next/image`: `priority` is deprecated → `preload`** (or `loading="eager"` / `fetchPriority="high"`). `images.qualities` now defaults to `[75]` only (a `quality={90}` prop is coerced to 75 unless you allow it). `imageSizes` lost `16`. `images.domains` deprecated → `remotePatterns`. Local `src` with `?query` needs `images.localPatterns.search`. | The create-next-app stub `page.tsx` still uses `priority` — replace it. |
| 7 | **Metadata**: `viewport`, `themeColor`, `colorScheme` moved out of `metadata` into `export const viewport: Viewport`. `metadataBase` + relative paths is the only sane way to get absolute OG/canonical URLs. File-based `opengraph-image`, `icon`, `sitemap`, `robots` win over the object. Metadata is **streamed** on dynamic pages (after `<body>`) except for HTML-limited bots — prerendered pages don't stream, so a static marketing site is unaffected. | §3, §5. |
| 8 | **Turbopack is the default for dev and build.** `--turbopack` flags are gone; a `webpack` key in config fails the build. Tailwind v4 is wired through `turbopack.rules['*.css']` (this repo), not `postcss.config.mjs` — do not add a PostCSS config. `next lint` is removed (`eslint` CLI only; `next build` no longer lints). `.next/dev` is a separate output dir (tsconfig already includes `.next/dev/types`). | Keep the existing `turbopack.rules` block verbatim. |
| 9 | **`middleware.ts` → `proxy.ts`** (Node runtime only). Not needed for this site. `unstable_cacheLife/unstable_cacheTag` → `cacheLife/cacheTag` (stable). `revalidateTag(tag)` now requires a second arg `revalidateTag(tag, 'max')`; `updateTag` is new. `experimental.ppr`/`experimental_ppr`/`dynamicIO`/`useCache` flags are gone (hard error). | Don't copy Next 15 snippets. |
| 10 | **Scroll:** Next 16 no longer overrides `scroll-behavior: smooth` during navigation. If you set it globally and want instant scroll-to-top on route change, add `data-scroll-behavior="smooth"` on `<html>`. Sticky header → set `html { scroll-padding-top: <header height> }` so hash links and route scroll don't land under it. | Honer-style sticky nav. |
| 11 | **Windows + static export**: Next 16.3+ writes prefetch segment files as `__next.places/$d$slug/__PAGE__.txt` directories on Windows (backslash survives). Admin fixes this with `scripts/flatten-segments.mjs`. The CI runner is Linux so it is a no-op there, but run it after any local Windows `next build` you intend to serve. | Reuse the script as-is. |
| 12 | **`error.tsx` prop is `retry()` (stable 16.3), `reset()` is the fallback.** `error.tsx`/`global-error.tsx` must be `'use client'`; `global-error` can't export `metadata` (use React `<title>`). `not-found.tsx` is a Server Component; Next injects `<meta name="robots" content="noindex">` automatically. `global-not-found.tsx` is still experimental — don't use. | §6.6. |
| 13 | **React 19.3**: `import { ViewTransition, addTransitionType } from 'react'` are stable exports (verified in `react/cjs/react.production.js`). `<Link transitionTypes={['nav-forward']}>` exists (16.2+). `<Activity>` keeps hidden routes mounted with `cacheComponents` — effects are cleaned up/recreated; dropdowns/dialogs may need `key`s. | §11. |
| 14 | **Prefetch semantics changed** (`partialPrefetching`): a default `<Link>` prefetches one shared App Shell per route; `prefetch={true}` additionally resolves URL data (`params`) + cached content; `prefetch={false}` disables. Automatic prefetch only runs in **production** builds. | §10. |
| 15 | **`connection()` vs `io()`**: `io()` (16.3) is the preferred way to keep `Date`/`Math.random` out of the shell (prefetchable); `connection()` blocks prefetches. Both are no-ops without `cacheComponents` (i.e. in the export build). | §6.3. |

---

## 1. `next.config.ts` for this site (dev/Node host vs GitHub Pages export)

Mirrors `admin/next.config.ts` exactly, plus the website-specific `images` and `basePath` (`/gip-platform/site` so it can co-exist with the admin preview; see §12).

```ts
// website/next.config.ts
import type { NextConfig } from "next";

// GITHUB_PAGES=true builds the static preview served at https://gjagadish123.github.io/gip-platform/site/
// (see .github/workflows/deploy-admin-pages.yml). Normal builds keep Cache Components + the image optimizer.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/gip-platform/site" : "";

const nextConfig: NextConfig = {
  cacheComponents: !pages, // PPR cannot run in export mode (next/dist/export/index.js L657)
  partialPrefetching: !pages, // requires cacheComponents; set explicitly or Next warns
  ...(pages && { output: "export", basePath, trailingSlash: true }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath }, // read by src/lib/base-path.ts (copy from admin)
  images: pages
    ? { unoptimized: true } // default loader is not allowed in export mode
    : {
        formats: ["image/avif", "image/webp"], // order matters: AVIF first, WebP fallback
        qualities: [60, 75, 90], // Next 16 default is [75] only; add what you actually pass as `quality`
        remotePatterns: [
          // Supabase Storage public objects (project ref comes from NEXT_PUBLIC_SUPABASE_URL)
          { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**", search: "" },
        ],
      },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
```

Notes
- `trailingSlash: true` + `output: 'export'` emits `out/about/index.html` (GitHub Pages serves directories). `next/link` adds the slash itself; plain strings (`<img src>`, CSS `url()`, JSON-LD URLs) do not get `basePath` — use `withBase()` (§12.2).
- `remotePatterns` wildcards: `*` = one subdomain/segment, `**` = many. Keep `search: ""` unless you intentionally pass query strings.
- `images.minimumCacheTTL` default is now 4 h; fine for Supabase assets with content-hashed names.
- Do **not** add `experimental.ppr`, `experimental.turbo`, `eslint`, `serverRuntimeConfig` — all hard errors or removed in 16.

---

## 2. Project structure (App Router, `src/app`)

```
website/src/app/
  layout.tsx            root layout: fonts, metadata, viewport, JSON-LD Organization, header/footer
  page.tsx              /
  about/page.tsx        /about
  projects/page.tsx     /projects (lists the one hardcoded project)
  projects/[slug]/page.tsx            /projects/global-city-vi  (generateStaticParams -> ONE slug)
  projects/[slug]/opengraph-image.tsx optional, generated OG per project
  gallery/page.tsx      /gallery
  contact/page.tsx      /contact
  not-found.tsx         404 (server component)
  error.tsx             'use client' boundary (retry)
  sitemap.ts robots.ts manifest.ts
  icon.svg apple-icon.png opengraph-image.jpg   (file conventions, root only for favicon.ico)
website/src/components/   ui/ (shadcn), site/ (header, footer, sections), motion/ ('use client' wrappers)
website/src/data/          company.ts, projects.ts (hardcoded Global City VI), gc6-masterplan.json
website/src/lib/           base-path.ts, seo.ts (jsonLd helper), supabase.ts (later)
website/public/            img/, video/, brand/ (copy the 4 SVGs from admin/public/brand)
```

- `_folder` = private (not routable); `(group)` = route group (no URL segment). Colocating components inside `app/` is safe; only `page`/`route` files create routes.
- Component hierarchy per segment: `layout` → `template` → `error` → `loading` → `not-found` → `page`. `error.tsx` does not catch errors in its own segment's `layout.tsx`; that needs `global-error.tsx`.

---

## 3. Root layout: fonts, metadata, viewport, Organization JSON-LD

### 3.1 Fonts (`next/font/google` with the Archivo `wdth` axis, plus optional local/display font)

Google variable fonts are downloaded at build and self-hosted; no runtime request to Google. Extra axes must be listed or only `wght` ships.

```ts
// website/src/app/fonts.ts  (one definition file; each call = one hosted instance)
import { Archivo } from "next/font/google";
import localFont from "next/font/local";

// Same family as admin: wght + wdth axes. latin-ext carries the rupee sign (U+20B9).
export const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],          // Archivo wdth range 62–125; default ships only wght
  weight: "variable",      // default for variable fonts; omit or keep explicit
  display: "swap",
  variable: "--font-sans",
});

// Optional display face for hero headlines (file lives next to this module or anywhere in the project).
export const display = localFont({
  src: [{ path: "./fonts/GIPDisplay-Variable.woff2", weight: "300 700", style: "normal" }],
  display: "swap",
  variable: "--font-display",
  preload: true,           // default; the root layout preloads on every route
  adjustFontFallback: "Arial", // local default; 'Times New Roman' for serif faces, false to disable
  // declarations: [{ prop: "font-family", value: "display" }], // only if you need to rename the family
});
```

```css
/* website/src/app/globals.css — Tailwind v4 maps the variables to utilities */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@theme inline {
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-display), var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  /* ...copy the oklch tokens from admin/src/app/globals.css; --primary = oklch(0.34 0.096 251) */
}
```

Usage: `className="font-sans"`, `font-heading`, and for the condensed numerals Tailwind v4 has `font-stretch-condensed` (75%) / `font-stretch-[85%]` which drive the `wdth` axis.

### 3.2 Root layout with full SEO metadata

```tsx
// website/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { archivo, display } from "./fonts";
import { COMPANY, SITE_URL } from "@/data/company";
import { JsonLd, organizationJsonLd } from "@/lib/seo";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import "./globals.css";

const preview = process.env.GITHUB_PAGES === "true"; // GH Pages preview must never be indexed

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL), // https://www.greaterinfraprojects.in — makes every relative URL below absolute
  title: {
    default: "Greater Infra Projects — HMDA & DTCP approved plots in Hyderabad",
    template: "%s · Greater Infra Projects", // applies to CHILD segments only; a page without title gets `default`
  },
  description:
    "Greater Infra Projects develops HMDA, DTCP and RERA approved open plots and villa plots across Hyderabad — 11+ years, 20+ projects, 600+ acres.",
  applicationName: "Greater Infra Projects",
  keywords: ["HMDA approved plots Hyderabad", "DTCP plots", "villa plots Hyderabad", "Greater Infra Projects"],
  authors: [{ name: "Greater Infra Projects", url: SITE_URL }],
  creator: "Greater Infra Projects",
  publisher: "Greater Infra Projects",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" }, // child pages override with their own path (see §4)
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Greater Infra Projects",
    title: "Greater Infra Projects — HMDA & DTCP approved plots in Hyderabad",
    description: "Approved open plots and villa plots across Hyderabad.",
    // omit `images` here and let app/opengraph-image.jpg (file convention) win — it also sets width/height/type
  },
  twitter: {
    card: "summary_large_image",
    title: "Greater Infra Projects",
    description: "HMDA & DTCP approved plots in Hyderabad.",
    // images come from app/twitter-image.jpg or fall back to OG
  },
  robots: preview
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
      },
  // verification: { google: "..." }, // add when Search Console token exists
};

// Next 14+: viewport/themeColor/colorScheme live here, NOT in `metadata`.
export const viewport: Viewport = {
  themeColor: "#033967", // GIP navy
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${archivo.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <JsonLd data={organizationJsonLd()} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

Rules that trip people up
- `title.template` applies to children only, and `title.default` is required with a template. A page sets `title: "About"` → `About · Greater Infra Projects`; `title: { absolute: "..." }` ignores the template.
- Metadata merges **shallowly** per key: a page that sets `openGraph: { title }` replaces the whole `openGraph` object (you lose `siteName`, `locale`). Pull shared bits into `src/lib/seo.ts` and spread them.
- `metadataBase` + relative `alternates.canonical`/`openGraph.url` → absolute. A relative URL without `metadataBase` is a build error. Leading `/` and `./` and `../` are all treated as relative to the base.
- Keep `metadata` exports in Server Components only (`layout.tsx`/`page.tsx`). Move interactivity to a child `'use client'` file.
- `robots: { index: false }` on the GH Pages build is essential: otherwise Google may index `gjagadish123.github.io/gip-platform/site/` as a duplicate of the real domain.

### 3.3 JSON-LD helper (server components, XSS-safe)

```tsx
// website/src/lib/seo.ts
import { COMPANY, SITE_URL } from "@/data/company";

// Native <script>, not next/script: JSON-LD is data, not executable code (Next docs).
// JSON.stringify does not escape "<", so a malicious string could close the tag. Replace it.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Greater Infra Projects",
    alternateName: "GIP",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/gip-lockup-navy.svg`,
    telephone: "+91 97001 23900",
    email: "Gip@greaterinfraprojects.in",
    address: { "@type": "PostalAddress", addressLocality: "Ameerpet, Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
    contactPoint: [{ "@type": "ContactPoint", telephone: "+91 97001 23900", contactType: "sales", areaServed: "IN", availableLanguage: ["en", "te"] }],
    sameAs: COMPANY.socials, // array of profile URLs; leave [] rather than invent
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
```

Validate with https://validator.schema.org and Google's Rich Results Test. Typing: `npm i -D schema-dts` gives `WithContext<Organization>` if you want it; optional.

---

## 4. Per-route metadata + the ONE project page

### 4.1 Static page (`about`, `contact`, …)

```tsx
// website/src/app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Eleven years of approved plotted developments across Hyderabad.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", title: "About Greater Infra Projects", type: "website", siteName: "Greater Infra Projects", locale: "en_IN" },
};

export default function AboutPage() { /* static JSX */ }
```

### 4.2 Dynamic project page with `generateStaticParams` + `generateMetadata` + JSON-LD

Data comes from a module (`src/data/projects.ts`, exactly one project), so there is **no** async data, nothing to cache, and the route is fully prerendered under both `cacheComponents` and `output: 'export'`.

```ts
// website/src/data/projects.ts — ponytail: one hardcoded project until the backend feeds this
import type { Project } from "./types"; // copy the Project/Unit types from admin/src/lib/types.ts
import masterplan from "./gc6-masterplan.json"; // copied from admin/src/lib/mock/gc6-masterplan.json

export const PROJECTS: Project[] = [/* Global City VI from admin/src/lib/mock/projects.ts */];
export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);
export const GC6_MASTERPLAN = masterplan;
```

```tsx
// website/src/app/projects/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProject } from "@/data/projects";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/data/company";
import { Masterplan } from "@/components/site/masterplan"; // 'use client' SVG polygons

// Cache Components: must return >= 1 entry (empty array = build error). Export mode: required or the build fails.
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}
// Optional: 404 for any slug not listed, instead of an App Shell + on-demand render on a Node host.
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params; // Promise in Next 16 — no sync access
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.name,
    description: `${project.name}: ${project.approval} approved plots in ${project.location}. ${project.acres} acres, ${project.totalUnits} plots.`,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "website",
      url: `/projects/${project.slug}`,
      siteName: "Greater Infra Projects",
      locale: "en_IN",
      title: `${project.name} — ${project.location}`,
      description: `${project.approval} approved. ${project.acres} acres.`,
      // images: omit if app/projects/[slug]/opengraph-image.tsx exists (file wins); otherwise:
      images: [{ url: project.heroImage, width: 1200, height: 630, alt: project.name }],
    },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound(); // renders app/projects/[slug]/not-found.tsx or app/not-found.tsx, status 404

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${SITE_URL}/projects/${project.slug}#listing`,
    name: project.name,
    url: `${SITE_URL}/projects/${project.slug}`,
    description: project.summary,
    datePosted: project.launchedOn, // ISO date string from data, never new Date()
    image: `${SITE_URL}${project.heroImage}`,
    offers: { "@type": "Offer", availability: "https://schema.org/InStock", priceCurrency: "INR", priceSpecification: { "@type": "UnitPriceSpecification", price: project.pricePerSqYd, priceCurrency: "INR", unitText: "sq yd" } },
    mainEntity: {
      "@type": "Place",
      name: project.name,
      address: { "@type": "PostalAddress", addressLocality: project.location, addressRegion: "Telangana", addressCountry: "IN" },
      ...(project.geo && { geo: { "@type": "GeoCoordinates", latitude: project.geo.lat, longitude: project.geo.lng } }),
      additionalProperty: [
        { "@type": "PropertyValue", name: "Approval", value: project.approval },
        { "@type": "PropertyValue", name: "Extent", value: `${project.acres} acres` },
        { "@type": "PropertyValue", name: "Plots", value: project.totalUnits },
      ],
    },
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }, { name: project.name, path: `/projects/${project.slug}` }])} />
      <JsonLd data={listingJsonLd} />
      <article>
        {/* ...hero, stats, amenities (server-rendered) */}
        <Masterplan plots={project.plots} /> {/* 288 polygons; client component for hover/filter */}
      </article>
    </>
  );
}
```

Notes
- `generateMetadata` and the page share the same sync `getProject`; with real async data wrap the fetcher in `React.cache()` so metadata + page dedupe within one render, and (Node host only) in `"use cache"` so both prerender (§6.5).
- The JSON-LD `datePosted` must come from data, not `new Date()`: a `Date` in render is a "blocking-prerender-current-time" error under `cacheComponents`.
- Breadcrumb `path`s already include the production domain via `SITE_URL`; do not pass `withBase()` paths to JSON-LD — structured data must use canonical production URLs even on the preview.

### 4.3 Generated OG image per project (optional, build-time)

```tsx
// website/src/app/projects/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProject } from "@/data/projects";

export const alt = "Greater Infra Projects";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Module scope: read once, not per render (Next docs "predictable values"). Path is relative to the project root.
const archivoBold = await readFile(join(process.cwd(), "src/app/fonts/Archivo-SemiBold.ttf"));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // Promise since Next 16
  const project = getProject(slug);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 64, background: "#033967", color: "white", fontFamily: "Archivo" }}>
        <div style={{ fontSize: 28, opacity: 0.8 }}>Greater Infra Projects</div>
        <div style={{ fontSize: 72, fontWeight: 600 }}>{project?.name ?? "Projects"}</div>
        <div style={{ fontSize: 32 }}>{project ? `${project.approval} approved · ${project.acres} acres · ${project.location}` : ""}</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Archivo", data: archivoBold, weight: 600, style: "normal" }] },
  );
}
```

Satori supports flexbox + a CSS subset only (no `grid`). Generated images are statically optimized at build and **are** emitted by `output: 'export'` (they are static GET route handlers; verified in `export/index.js` ~L699: app route handler bodies are copied to `out/<route>`). The static alternative is simply `app/opengraph-image.jpg` + `opengraph-image.alt.txt` (≤ 8 MB; twitter ≤ 5 MB).

---

## 5. `sitemap.ts`, `robots.ts`, `manifest.ts`, icons — and export compatibility

All four are "special Route Handlers, cached by default". With `output: 'export'` they are emitted as `out/sitemap.xml`, `out/robots.txt`, `out/manifest.webmanifest` (route handler bodies are copied verbatim in export; no export-mode exclusion exists for metadata routes in `export/index.js`). They need absolute URLs, so build them from `SITE_URL`, never from `basePath`.

```ts
// website/src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { PROJECTS } from "@/data/projects";
import { SITE_URL } from "@/data/company";

const LAST_MOD = "2026-10-18"; // bump per content release; new Date() here is fine in a route handler but gives crawlers a fake signal

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: LAST_MOD, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: LAST_MOD, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/projects`, lastModified: LAST_MOD, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/gallery`, lastModified: LAST_MOD, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: LAST_MOD, changeFrequency: "yearly", priority: 0.6 },
  ];
  const projects: MetadataRoute.Sitemap = PROJECTS.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: p.updatedAt ?? LAST_MOD,
    changeFrequency: "weekly",
    priority: 0.8,
    images: [`${SITE_URL}${p.heroImage}`], // image sitemap extension
  }));
  return [...pages, ...projects];
}
```

```ts
// website/src/app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/company";

const preview = process.env.GITHUB_PAGES === "true";

export default function robots(): MetadataRoute.Robots {
  if (preview) return { rules: { userAgent: "*", disallow: "/" } }; // never index the GH Pages preview
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/_next/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

```ts
// website/src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Greater Infra Projects",
    short_name: "GIP",
    description: "HMDA & DTCP approved plots in Hyderabad",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#033967",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
```

Icons: put `favicon.ico` (root `app/` only), `icon.svg` (use `admin/public/brand/gip-roof-navy.svg`), and `apple-icon.png` (180×180, PNG) in `src/app/`. Next emits the `<link rel=...>` tags and content hashes. Trailing-slash exceptions: files with extensions (`/sitemap.xml`, `/robots.txt`, `/icon.svg`) never get a slash appended.

`generateSitemaps` (multiple sitemaps): not needed; note its `id` is a Promise in 16 if you ever use it.

---

## 6. Cache Components for a mostly-static marketing site

### 6.1 Mental model

With `cacheComponents: true`, `next build` prerenders a **static shell** per route and validates every component:

| Component does… | Result |
|---|---|
| Module imports, JSON import, pure computation, sync `fs.readFileSync`, props | Prerendered. **Nothing to do.** |
| `await fetch()` / Supabase / DB **without** `"use cache"`, outside `<Suspense>` | Build error ("blocking-route"). |
| Same, **with** `"use cache"` (+ `cacheLife`) | Runs at build, result in the shell; revalidates per profile. |
| Same, inside `<Suspense fallback>` without cache | Fallback in shell; streams at request time (Node host only). |
| `cookies()`, `headers()`, `searchParams`, un-listed `params` | Runtime data → must be inside `<Suspense>`. |
| `Date.now()`, `new Date()`, `Math.random()`, `crypto.randomUUID()` | Build error unless inside `"use cache"` (one value for everyone) or after `await io()` / `await connection()` inside `<Suspense>` (per request). `performance.now()` is exempt. |
| `params` returned by `generateStaticParams` | Known at build → the page is fully static for those slugs; other slugs get the App Shell then ISR upgrade (16.3+). |

For this site: hardcoded data → **no directives at all**. Everything is `○ (Static)` in the build output. That also keeps the code export-compatible (§0 #3).

### 6.2 Root-layout rules

- Render providers (`MotionConfig`, Lenis, theme) as deep as possible and only around `{children}`, not around `<html>`.
- Don't `await params` in a layout at the top level (ties the shell to one URL). Pass the promise down and await inside `<Suspense>` — exactly what `admin/src/app/(app)/projects/[id]/layout.tsx` does.
- No analytics side effects in layouts/pages (they run during prefetch). Put them in a `'use client'` `useEffect` component.

### 6.3 Dates, random, "live" bits

```tsx
// Footer year — ponytail: a build-time constant. A Date in render is a prerender error; a client component works too but can mismatch across New Year.
export const COPYRIGHT_YEAR = 2026; // bump on deploy

// Per-request unique value (Node host only; io() is a no-op in the export build and resolves immediately elsewhere)
import { io } from "next/cache";
import { Suspense } from "react";
async function RequestId() { await io(); return <span>{crypto.randomUUID()}</span>; }
export function Example() { return <Suspense fallback={null}><RequestId /></Suspense>; }
```

Prefer `io()` over `connection()`: both exclude what follows from the shell, but `connection()` also blocks per-link prefetches.

### 6.4 When you DO need `"use cache"` (Node host with live Supabase)

```ts
// website/src/data/projects.server.ts — only once the site runs on a Node/Vercel host (NOT in the export build, §0 #3)
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

export async function listProjects() {
  "use cache";
  cacheLife("hours"); // stale 5m / revalidate 1h / expire 1d — always set one explicitly
  cacheTag("projects");
  const { data } = await supabase.from("projects").select("*").eq("published", true).order("sort");
  return data ?? [];
}

export async function getProject(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("projects", `project-${slug}`); // arguments are part of the cache key automatically
  const { data } = await supabase.from("projects").select("*, units(*)").eq("slug", slug).maybeSingle();
  return data;
}
```

- Use the same cached function in `generateStaticParams` (`(await listProjects()).map(p => ({ slug: p.slug }))`), `generateMetadata` and the page. `fetch` is memoized across those automatically; non-fetch calls are memoized by `"use cache"` within a render anyway.
- Rules: cached functions must be `async`; args/returns must be serializable (no class instances, no `URL` — return `metadataBase` as a string if you ever cache `generateMetadata`); never read `cookies()/headers()` inside; `cacheLife` cannot be at module scope; nested short-lived caches inside an outer cache without explicit `cacheLife` fail the build.
- Invalidate from the admin (Server Action/route handler): `revalidateTag("projects", "max")` (two args in 16) or `updateTag("projects")` for read-your-writes. In-memory cache does not survive a new deploy anyway.
- Presets: `seconds/minutes/hours/days/weeks/max`; `seconds` (expire 1 min) is excluded from prerenders — don't use it on a marketing page.

### 6.5 Recommended data strategy for the backend phase (works in both modes)

Snapshot at build time. Add a `prebuild` script that writes `src/data/projects.json` from Supabase, import it statically, and trigger a rebuild from a Supabase Database Webhook → GitHub `repository_dispatch` (or Vercel deploy hook) when the admin publishes. Result: fully static HTML, no `"use cache"`, no runtime DB dependency, identical behaviour in `output: 'export'` and on Vercel, and nothing in the page tree changes when the source of truth moves from hardcoded TS to JSON. Keep §6.4 for a later "live ISR" upgrade only if the client needs sub-minute updates.

### 6.6 `loading.tsx`, `error.tsx`, `not-found.tsx`

- `loading.tsx` wraps the segment's `page` in `<Suspense>`. A fully static site never shows it on a direct visit; it still gives instant navigation feedback for client transitions on a Node host. Not supported in static export (no streaming) — harmless but pointless there. Prefer focused `<Suspense>` around the one slow region (e.g. a live inventory widget) over a route-level skeleton.
- `error.tsx` must be `'use client'`; use the `retry()` prop (stable 16.3):

```tsx
// website/src/app/error.tsx
"use client";
import { useEffect } from "react";
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <section className="mx-auto max-w-xl py-24 text-center">
      <h1 className="font-heading text-3xl">Something went wrong</h1>
      <button className="mt-6 underline" onClick={() => retry()}>Try again</button>
    </section>
  );
}
```

- `not-found.tsx` (Server Component, may export `metadata`). The root one also handles every unmatched URL. In the export build Next writes it to `out/404.html` (and `404/index.html` with `trailingSlash`), which is exactly the file GitHub Pages serves for unknown paths — but only at the Pages **root** (see §12.5).

---

## 7. Client/server boundaries for motion (framer-motion / `motion`)

`framer-motion` 12.x (what the old site uses; `motion` is the same library under its new name — `import { motion } from "motion/react"`) is client-only. Rules:

1. Pages and layouts stay Server Components (they own `metadata`). Wrap only the animated leaf in `'use client'`.
2. Re-export the primitives you need from one client file so server files can use `<motion.div>` without the whole page becoming client:

```tsx
// website/src/components/motion/index.tsx
"use client";
export { motion, AnimatePresence, MotionConfig, useReducedMotion, useScroll, useTransform, useInView } from "framer-motion";
```

```tsx
// website/src/components/motion/reveal.tsx — one reusable scroll-reveal; children can be SERVER-rendered markup
"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

3. Pass Server Components as `children`/props into client wrappers (interleaving). Props must be serializable (no functions from server files).
4. `<MotionConfig reducedMotion="user">` once, inside `<body>`, around `{children}` only. Lenis (smooth scroll) is also a `'use client'` provider; because Next 16 no longer fights `scroll-behavior`, you don't need the old workarounds — but add `::view-transition { pointer-events: none }` if you also use view transitions (§11).
5. Browser-only libs (Lenis, anything touching `window`) go behind `useEffect`, or `next/dynamic(() => import(...), { ssr: false })` **inside a client component** (`ssr: false` is an error in Server Components).
6. Client Components still prerender to HTML at build. `whileInView` + `initial={{ opacity: 0 }}` means the prerendered HTML has invisible content until hydration: fine for below-the-fold sections, **not** for the hero/LCP — render the hero statically and animate only decorative layers, or use CSS animations (`tw-animate-css` is already installed).
7. `"use client"` is a module-graph boundary: everything imported by a client file ships to the browser. Keep data (`src/data/projects.ts` with 288 polygons) out of client imports unless the component needs it; pass it as a prop from the server page.

---

## 8. Images

### 8.1 Local images: static import = width/height/blur for free

```tsx
import Image from "next/image";
import hero from "@/../public/img/home/hero.jpg"; // or colocate under src/ — any import path works

<Image
  src={hero}                 // width/height/blurDataURL inferred at build (jpg/png/webp/avif, not animated)
  alt="Aerial view of Global City VI layout, Hyderabad"
  placeholder="blur"
  preload                    // Next 16: replaces `priority`; only for the LCP/hero image
  sizes="100vw"
  className="h-[80svh] w-full object-cover"
/>
```

- Always give `sizes` for `fill`/responsive images or the browser assumes `100vw` and downloads the largest candidate.
- `fill` needs a positioned parent (`relative`) and `object-cover`.
- Below the fold: default `loading="lazy"`; never combine `preload` with `loading`/`fetchPriority`.
- SVGs (`brand/*.svg`) are automatically `unoptimized`; width/height still required.
- Animated GIF: the optimizer passes it through untouched; use `unoptimized` explicitly or a `<video>` (§9).
- `quality` other than 75 requires adding it to `images.qualities` (§1).

### 8.2 Remote Supabase Storage (Node host / Vercel)

Public object URL shape: `https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>`. Allowed via `remotePatterns` in §1. Remote images need explicit `width`/`height` (or `fill`) and a manual `blurDataURL` if you want blur (store a 10px data URL in the DB when the admin uploads, or use `plaiceholder` at build).

```tsx
<Image src={project.heroUrl} alt={project.name} width={1600} height={900} sizes="(min-width:1024px) 50vw, 100vw" placeholder={project.blurDataURL ? "blur" : "empty"} blurDataURL={project.blurDataURL} />
```

Optional: Supabase Image Transformations (Pro plan) via a custom loader so Supabase does the resizing instead of Next: `https://<ref>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?width=…&quality=…` — the Next docs ship a `supabaseLoader` example. Use the `loader` prop per image, not a global `loaderFile`, so local images keep the default loader.

### 8.3 Static export (`GITHUB_PAGES=true`): `images.unoptimized: true`

`next/image` then emits a plain `<img src=… >` (no srcset, no format negotiation). Static imports still give width/height/blur, so CLS stays zero. To keep the preview close to production quality, **ship pre-optimised files and `<picture>`**:

```js
// website/scripts/optimize-images.mjs — run once per new asset: `node scripts/optimize-images.mjs`
// sharp 0.35 is already in node_modules as a Next dependency; add it to devDependencies to pin it.
import sharp from "sharp";
import { readdirSync, mkdirSync } from "node:fs";
import { join, parse } from "node:path";

const SRC = "assets/raw";           // originals (git-ignored or LFS)
const OUT = "public/img";            // committed, served as-is
const WIDTHS = [640, 1080, 1600, 2400];
mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SRC)) {
  const { name } = parse(file);
  for (const w of WIDTHS) {
    const img = sharp(join(SRC, file)).resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 50 }).toFile(join(OUT, `${name}-${w}.avif`));
    await img.clone().webp({ quality: 78 }).toFile(join(OUT, `${name}-${w}.webp`));
  }
  await sharp(join(SRC, file)).resize({ width: 1600 }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, `${name}.jpg`)); // <img> fallback
}
```

```tsx
// website/src/components/site/picture.tsx — server component, works in BOTH modes, zero JS
import { withBase } from "@/lib/base-path";
const W = [640, 1080, 1600, 2400];
export function Picture({ name, alt, sizes = "100vw", width, height, className, eager = false }: { name: string; alt: string; sizes?: string; width: number; height: number; className?: string; eager?: boolean }) {
  const set = (ext: string) => W.map((w) => `${withBase(`/img/${name}-${w}.${ext}`)} ${w}w`).join(", ");
  return (
    <picture>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img src={withBase(`/img/${name}.jpg`)} alt={alt} width={width} height={height} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" className={className} />
    </picture>
  );
}
```

Decision rule: `next/image` with static imports for everything on the Node host; `<Picture>` (or `next/image` + `withBase()` on unoptimized `src`) wherever the asset must look right on the GitHub Pages preview too. Hero + project cards are worth `<Picture>`; icons/logos just use `next/image` + SVG.

### 8.4 `basePath` and image `src`

`next/image` does **not** prepend `basePath` to a string `src`; `next/link` does. Admin's helper handles it:

```ts
// website/src/lib/base-path.ts — copy of admin/src/lib/base-path.ts
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const withBase = (path: string) => (path.startsWith("/") && !path.startsWith("//") ? BASE + path : path);
```

Use it for `<Image src={withBase("/brand/gip-lockup-navy.svg")}>`, `<video src>`, `<source>`, CSS `mask: url(...)`, `poster`. Static imports (`import hero from ...`) already carry the prefix; `next/link` hrefs must stay un-prefixed.

---

## 9. Video and the old site's GIFs

Inventory (`J:\Jaggu Projects\GIP Website\gipproperties\public\*.gif`, 12 files, ~11.9 MB total): `gip-logo-animation` 312 KB (preloader), `quality-craftsmanship` 392 KB, `timely-completion` 584 KB, `transparency` 636 KB, `customer-first-focus(-7)` 684 KB ×2, `quality-driven-planning` 880 KB, `integrity-transparency` 968 KB, `timely-responsible-execution` 1.4 MB, `trust-reliability` 1.7 MB, `strategic-land-investment-opportunities` 1.7 MB, `customization-options` 1.9 MB. Used in `Homepage/ValuesSection`, `Homepage/ConstructionStandardsSection`, `AboutUsPage/.../ValuesAndTeamSection`, `common/Preloader`.

Recommendation: convert each to MP4 (H.264) + WebM (VP9), which is typically 5–10× smaller, and play them as muted inline loops. Keep the GIF only as a `<noscript>`/reduced-motion fallback poster if at all.

```bash
# per file (ffmpeg): even dimensions required for yuv420p; faststart puts the moov atom first for instant playback
ffmpeg -i transparency.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 24 -an public/video/values/transparency.mp4
ffmpeg -i transparency.gif -c:v libvpx-vp9 -b:v 0 -crf 34 -an -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" public/video/values/transparency.webm
ffmpeg -i transparency.gif -frames:v 1 public/video/values/transparency-poster.webp
```

```tsx
// website/src/components/site/loop-video.tsx — client only for the reduced-motion check; everything else is native <video>
"use client";
import { useEffect, useRef } from "react";
import { withBase } from "@/lib/base-path";
export function LoopVideo({ name, width, height, className, label }: { name: string; width: number; height: number; className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) ref.current?.pause();
  }, []);
  return (
    <video
      ref={ref}
      className={className}
      width={width} height={height}            // reserve the box: no CLS
      poster={withBase(`/video/values/${name}-poster.webp`)}
      autoPlay muted loop playsInline           // all four needed for mobile autoplay
      preload="metadata"                        // "none" for below-the-fold loops
      aria-label={label}
    >
      <source src={withBase(`/video/values/${name}.webm`)} type="video/webm" />
      <source src={withBase(`/video/values/${name}.mp4`)} type="video/mp4" />
    </video>
  );
}
```

Next docs' rules: set `width`/`height` or CSS `aspect-ratio`; use `poster` with `preload="none"`; `autoPlay` must pair with `muted` + `playsInline`; include fallback content; iframes (YouTube) need `loading="lazy"`, `title`, and explicit dimensions. No Next-specific video component; `next-video` exists but is unnecessary here.

---

## 10. `next/link` and prefetching (16.4 with `partialPrefetching`)

- `<Link href="/projects/global-city-vi">` prefetches when it enters the viewport **in production only** (`next dev` never prefetches). Default (`auto`) = the route's shared App Shell, fetched once for all links to that route. Hover/touch bumps priority.
- `prefetch={true}` = also render the URL-specific cached content for that link ahead of time (costs one server render per link on a Node host; served from static cache when the page is fully static). Use it on the few project cards.
- `prefetch={false}` for footer/legal links and large lists.
- `<Link>` applies `basePath` and `trailingSlash` automatically; keep hrefs un-prefixed.
- `scroll={false}` to keep position; hash links `href="/contact#form"` work, add `html { scroll-padding-top: 72px }` for the sticky header.
- `onNavigate` (SPA navigations only) for analytics; `transitionTypes={['nav-forward']}` for view transitions (§11).
- Active state: `'use client'` + `usePathname()` in the nav component only.
- Marketing-site pattern: `export const ensureStatic = 'navigation'` on the root layout (16.4) makes the build **fail** if anyone later adds request-time work to a public page — a guard worth adding once the site is live on a Node host. It requires `cacheComponents`, so wrap it like everything else: it's an export, so it can't be conditional — only add it once the export preview is retired.

---

## 11. View Transitions (React 19.3, no config)

```tsx
import { ViewTransition } from "react"; // stable export in react@19.3.0 (verified)

// Project card (server component is fine; ViewTransition is a React primitive)
<Link href={`/projects/${p.slug}`} transitionTypes={["nav-forward"]}>
  <ViewTransition name={`project-${p.slug}`} share="morph" default="none">
    <Image src={p.cover} alt="" ... />
  </ViewTransition>
</Link>

// Project page hero: same `name` → the thumbnail morphs into the hero (only when the destination is already prefetched/cached)
<ViewTransition name={`project-${project.slug}`} share="morph" default="none">
  <div className="relative aspect-[3/2]"><Image src={project.cover} alt={project.name} fill sizes="100vw" /></div>
</ViewTransition>
```

```css
/* globals.css */
::view-transition-group(.morph) { animation-duration: 400ms; }
::view-transition { pointer-events: none; }          /* keep the page clickable mid-transition */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*) { animation-duration: 0s !important; animation-delay: 0s !important; }
}
```

- `default="none"` on named pairs plus explicit `share="morph"`, otherwise every named element crossfades on unrelated transitions (or silently stops morphing).
- Directional slides: wrap each `page.tsx` content (not the layout) in `<ViewTransition enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }} exit={...} default="none">`; give the sticky header `style={{ viewTransitionName: 'site-header' }}` + `::view-transition-group(site-header) { animation: none }`.
- Chromium 125+, recent Safari/Firefox; degrades to a normal navigation elsewhere. Works in the static export too (it's client-side React).

---

## 12. Static export + GitHub Pages, exactly like admin

### 12.1 How admin does it (current state)

- `admin/next.config.ts`: `GITHUB_PAGES=true` → `output: 'export'`, `basePath: '/gip-platform'`, `trailingSlash: true`, `images.unoptimized`, `cacheComponents/partialPrefetching: false`, `env.NEXT_PUBLIC_BASE_PATH`.
- `admin/src/lib/base-path.ts`: `withBase()` for non-Link URLs.
- `admin/src/app/(app)/projects/[id]/layout.tsx`: `generateStaticParams()` lists every seed project id so the export has an HTML file per project; params are awaited inside `<Suspense>`.
- `admin/scripts/flatten-segments.mjs`: renames `out/<route>/__next.places/...` directories to the dotted file names the client router requests (Windows-only artefact).
- `.github/workflows/deploy-admin-pages.yml`: on push to `main` touching `admin/**`, `npm ci` → `GITHUB_PAGES=true npx next build` → flatten + `touch out/.nojekyll` (needed: `_next/` starts with an underscore, which Jekyll would drop) → `actions/upload-pages-artifact` → `actions/deploy-pages`. `concurrency: group: pages` so only one deploy runs.

### 12.2 Website additions

1. `website/next.config.ts` as in §1 with `basePath '/gip-platform/site'`.
2. Copy `admin/src/lib/base-path.ts` → `website/src/lib/base-path.ts` (don't import across packages; separate lockfiles/Turbopack roots).
3. Copy `admin/scripts/flatten-segments.mjs` → `website/scripts/flatten-segments.mjs` unchanged.
4. `generateStaticParams` on `projects/[slug]` returning the one slug (§4.2).
5. Preview-only `robots: { index: false }` + `robots.ts` disallow (§3.2, §5).
6. Add `"build:pages": "cross-env GITHUB_PAGES=true next build && node scripts/flatten-segments.mjs out"` to `website/package.json` only if you want local Windows exports (needs `cross-env`); CI sets the env itself.

### 12.3 One Pages site, two apps: extend the existing workflow

GitHub Pages supports **one** deployment per repository, so both apps must land in one artifact. Keep admin at `/gip-platform/` and nest the website at `/gip-platform/site/`:

```yaml
# .github/workflows/deploy-admin-pages.yml  (rename to deploy-pages.yml if you like; keep `group: pages`)
name: Deploy previews to GitHub Pages

on:
  push:
    branches: [main]
    paths: ["admin/**", "website/**", ".github/workflows/deploy-admin-pages.yml"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: |
            admin/package-lock.json
            website/package-lock.json

      - name: Build admin (/gip-platform/)
        working-directory: admin
        run: |
          npm ci
          npx next build
          node scripts/flatten-segments.mjs out
        env:
          GITHUB_PAGES: "true"

      - name: Build website (/gip-platform/site/)
        working-directory: website
        run: |
          npm ci
          npx next build
          node scripts/flatten-segments.mjs out
        env:
          GITHUB_PAGES: "true"
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL }}            # only once the site reads Supabase at build
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}

      - name: Assemble one Pages tree
        run: |
          mkdir -p admin/out/site
          cp -R website/out/. admin/out/site/
          touch admin/out/.nojekyll

      - uses: actions/upload-pages-artifact@v3
        with:
          path: admin/out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Why this works: each app's `assetPrefix` defaults to its `basePath`, so admin's chunks live at `/gip-platform/_next/…` and the website's at `/gip-platform/site/_next/…` — no collision. Both `out/` trees contain a `404.html`; only the root one (admin's) is used by Pages.

Alternative later: give the website the root (`basePath: '/gip-platform'`) and move admin to `/gip-platform/admin` — more churn in admin; or a second repo/Pages site for the website with a custom domain (`basePath: ''`). For the real launch the website should go to Vercel/a Node host anyway (image optimizer, `cacheComponents`, ISR, streaming all come back); the Pages export is a client preview.

### 12.4 What breaks under export and how the code stays dual-mode

| Feature | Node host | `output: 'export'` | Keep dual-mode by… |
|---|---|---|---|
| `"use cache"` | yes | **compile error** | not using it; snapshot data (§6.5) |
| `cacheComponents`/PPR/ISR/streaming | yes | invariant error → off via `!pages` | config flag only |
| `next/image` default loader | yes | not allowed → `unoptimized` | static imports + `<Picture>` for key visuals |
| Dynamic route w/o `generateStaticParams` | App Shell + ISR | build error | always export `generateStaticParams` |
| `loading.tsx`, `cookies()`, Server Actions, `proxy.ts`, redirects/rewrites/headers, intercepting routes | yes | no | contact form posts to an external endpoint (Supabase edge function / Formspree-style), not a Server Action |
| `sitemap.ts`/`robots.ts`/`opengraph-image.tsx`/`manifest.ts` | yes | yes (static route handlers → files in `out/`) | absolute URLs from `SITE_URL` |
| `io()`/`connection()` | suspend prerender | resolve immediately | fine to leave in |
| `ensureStatic`, `prefetch` segment config | yes | needs `cacheComponents` → **build fails** | don't export them until the preview is retired |

### 12.5 Export-specific gotchas

- `out/404.html` is only honoured at the Pages root; under `/site/` unknown URLs show admin's 404. Acceptable for a preview.
- `trailingSlash: true` means canonical URLs on the preview end in `/`; production (Node host) does not. Canonicals come from `metadataBase` (production domain) so the preview never advertises itself.
- Browser APIs (`window`, `localStorage`) only inside `useEffect`; Client Components still prerender at build.
- Fonts from `next/font` are self-hosted under `_next/static/media` and work with `basePath`.
- Build locally on Windows → run `node scripts/flatten-segments.mjs out` before serving; CI (Linux) doesn't need it but running it is harmless ("flattened 0").

---

## 13. Production checklist that matters for SEO/perf (from the Next production guide, filtered)

- Every route shows `○ (Static)` in `next build` output (no `◐`/`ƒ`) until a deliberate live widget exists. Run `next build --debug-prerender` if validation errors have no code frames.
- `<title>` + `description` on every page; `title.template` in root; canonical per page; OG + twitter via file conventions; `opengraph-image.alt.txt`.
- `sitemap.xml`, `robots.txt`, `manifest`, `icon.svg`, `apple-icon.png`, `favicon.ico`; submit the sitemap in Search Console once the domain is live.
- JSON-LD: `Organization` (root), `BreadcrumbList` + `RealEstateListing`/`Place` (project), validated.
- Fonts via `next/font` only (no `<link>` to Google Fonts); `display: 'swap'`; one variable family + at most one display face.
- Images: static imports, `sizes` on every responsive image, one `preload` hero, AVIF/WebP (`formats`), explicit `qualities`, `alt` text that describes (empty `alt` for decorative).
- GIFs → MP4/WebM loops with posters; `preload="none"` below the fold; respect `prefers-reduced-motion`.
- `'use client'` only on leaves; keep `src/data/*` out of client bundles; `next/dynamic` for heavy client-only widgets (map, lightbox).
- Third-party scripts via `next/script` (`strategy="lazyOnload"` for chat widgets); analytics calls in `useEffect`, never in layouts (prefetch side effects).
- `error.tsx` + `not-found.tsx` present; 404 is a real 404 on a Node host (status is fixed before streaming on static pages).
- Lighthouse in incognito on the production build (`next build && next start`), plus `useReportWebVitals` if you want field data. `next build` no longer prints bundle sizes; use `@next/bundle-analyzer` if needed.
- Env: only `NEXT_PUBLIC_*` reaches the browser; `.env.local` is git-ignored; the GH Pages preview is `noindex`.
- Security headers/CSP are `next.config` `headers()` → not available in export; configure them on the real host.

---

## 14. Sources read (all local)

Next 16.4 docs (`website/node_modules/next/dist/docs/01-app/`): getting-started 02, 03, 05, 08, 11, 12, 13, 14; guides json-ld, static-exports, view-transitions, keeping-pages-static, optimizing-the-static-shell, production-checklist, lazy-loading, videos, public-static-pages, prefetching, incremental-static-regeneration-cache-components, upgrading/version-16; api-reference file-conventions metadata (index, sitemap, robots, opengraph-image, manifest, app-icons), loading, not-found, error, dynamic-routes, route-segment-config prefetch + ensureStatic; functions generate-metadata, generate-static-params, generate-viewport, connection, io, cacheLife, cacheTag; directives use-cache; components font, image, link; config images, cacheComponents, partialPrefetching, output, basePath, trailingSlash, turbopack. Next source: `server/config.js` (export/cacheComponents/useCache validation), `export/index.js` (PPR invariant, route-handler copy, image loader check), `build/index.js` (generateStaticParams export requirement). Repo: `admin/next.config.ts`, `admin/src/app/layout.tsx`, `admin/src/app/(app)/projects/[id]/layout.tsx`, `admin/src/lib/base-path.ts`, `admin/scripts/flatten-segments.mjs`, `.github/workflows/deploy-admin-pages.yml`, `website/next.config.ts`, `website/src/app/layout.tsx`, `website/src/app/globals.css`, `website/package.json`, old site `public/*.gif` + usages.
