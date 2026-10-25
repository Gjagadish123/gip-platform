# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Hyderabad families and NRIs (often abroad, deciding over WhatsApp with relatives in the city) buying an
HMDA/RERA-approved open plot or weekend-villa plot. They arrive from a WhatsApp forward, a site-visit invitation or a
search for "HMDA approved plots near Hyderabad", usually on a phone, and judge in seconds whether the developer is
real, the land exists and the papers are in order. Their job: shortlist a plot, check its status and approvals, and
start a conversation (WhatsApp, call, or a site visit) without being pressured.

## Product Purpose

The public website of Greater Infra Projects (GIP), a Hyderabad plotted-layout developer. It presents the company and
its projects, shows live plot availability on the real master plan, and turns interest into an enquiry. Success: a
first-time visitor understands within seconds that this is real, approved land with plots still available, and
reaches out on WhatsApp, by phone or for a site visit.

## Positioning

GIP sells land, not apartments: gated plotted layouts on Hyderabad's growth corridors with clear titles and approved
layouts. What a neighbouring builder's site cannot copy is the land itself, shown truthfully: the actual 288-plot
master plan of Global City VI with each plot's live status, the real approval numbers, and dated site photographs
beside clearly labelled artist's impressions.

## Operating Context

- Buyers compare layouts by approval (HMDA/DTCP, TS RERA), location and connectivity, plot size and facing, corner
  plots, road widths, and what has actually been built on site (roads, arch, plantation).
- Decisions are family decisions; links are shared on WhatsApp; NRIs call across time zones (office hours
  Mon–Sat 10:00–19:00 IST).
- Site visits are arranged on request; the office is at Vasavi MPM Grand, Ameerpet, Hyderabad.
- Plot status (Available, Sold Out, Mortgaged, Registered) will later come from the admin portal; today it is
  hardcoded for one project.

## Capabilities and Constraints

- Next.js 16.4 App Router (cacheComponents), React 19, TypeScript, Tailwind CSS v4, motion; also builds as a static
  export for GitHub Pages under `/gip-platform/site` (basePath via `withBase()`).
- Exactly one project is hardcoded (Global City VI) through `src/lib/projects.ts`; more projects will come from
  Supabase later. Do not hardcode other projects; delivered layouts appear only as a count.
- Enquiry has no backend: WhatsApp deep link plus mailto. Phone +91 97001 23900, email Gip@greaterinfraprojects.in.
- SEO is a priority: static metadata, JSON-LD, sitemap, robots, OG image.
- Price is not shown (open client question). "Mortgaged" status meaning and some sample statuses are pending client
  confirmation and are flagged on the page.

## Brand Commitments

- Name: Greater Infra Projects (GIP). Keep the roof-mark logo (navy and white versions) and its GIP navy as the brand
  anchor on white. Everything else about the visual identity is open (confirmed 2026-10-19).
- Taglines in use: "Plan with purpose. Build with integrity."; "Doing business the right way."
- Voice: plain, factual, calm; no hype, no pressure selling.
- Design language (2026-10-20): GIP's OWN identity, completely different from honerhomes.com in UI, UX, layout,
  colours, buttons and motion (the client fears copyright; the Honer-close build was rejected). Honer's calibre is
  the bar, not its look. Crisp white canvas, GIP navy logo kept. Typography must have real hierarchy and soul (a
  disciplined scale, no inflated thin display sizes); motion must be purposeful and crafted.
- Project page shows the master plan as a static image with a download (no interactive plot map).
- Presentation (2026-10-21, from the client): keep the site's sections and content; change how they are shown. Every
  section uses GIP's own premium components (switchers, spec sheets, rows on hairlines, a plot finder), Inter on the
  greaterinfraprojects.in scale, GIP navy on white. DESIGN.md is the contract.

## Evidence on Hand

- Global City VI facts: Rudraram / Shankarapally, Sangareddy District; 21 acres 10 guntas; 288 plots, 147–731 sq yd;
  40/30 ft CC roads; 100 ft main-road facing; HMDA final layout permit 2046/HMDA/SWFL/2026 (23 Apr 2026); earlier
  layout approval HMDA LO 007133/LO/HMDA/1700/SKP/2024; TS RERA P01100009270; amenities list; land-use areas.
- Plan geometry for all 288 plots with status (`src/lib/data/units.ts`, `gc6-masterplan.json`).
- Real photographs: 14 Global City VI site photos (March 2026, Supabase storage), launch and 9th-anniversary event
  collages, two leadership portraits (Syed Imam, Syed Ismail Kashif).
- Artist's impressions (kie.ai, must be labelled as such): aerial layout, entrance arch, avenue road, clubhouse and
  pool, park walk, weekend villa, hills at dusk. Old-site line-art GIFs (animated WebP) for principles and values.
- Company figures: 11+ years, 20+ projects, 600+ acres, 6,000+ customers, 16 delivered layouts.
- From the live greaterinfraprojects.in home (client's own published content, used verbatim on Home): seven client
  testimonials with names, five recent projects (Global City VI, Global City RRR, Kompally County III, Global Nature
  View City, Godavari Green Farms) with site photos in the client's Supabase storage, the record paragraphs.
- Absent, never to be fabricated: any testimonial beyond those seven, awards, press, prices, real travel distances,
  named staff beyond the two leaders.

## Product Principles

1. Truth over gloss: every claim is checkable (approval numbers, dated photos, live counts); renders are always
   labelled as artist's impressions.
2. The land is the hero: show the real layout and what is still available before anything else.
3. One tap to a person: WhatsApp, call or site visit is always within reach, never a pushy form.
4. Built for the WhatsApp phone first, and for the NRI evening call second.
5. One project today, many tomorrow: structures must scale to a list fed by the admin portal.

## Accessibility & Inclusion

WCAG 2.2 AA: keyboard-operable master plan, visible focus, reduced-motion fallbacks for every scroll or motion
sequence, readable contrast on white and navy, and pages usable on low-end Android phones over mobile data.
