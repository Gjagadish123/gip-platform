# Direction A — "Folio" (editorial luxury)

Status: proposal, 2026-10-19. Written against `honer-analysis.md`, `content-inventory.md`, `components-catalog.md`, `next16-cheatsheet.md`, the data layer in `src/lib/`, the admin tokens in `admin/src/app/globals.css`, the six kie renders in `public/images/` and ten Honer screenshots. Every number, name, approval reference and line of copy below is either quoted from those sources or marked **NEW**. Nothing is invented.

---

## 1. Concept

**Folio** treats greaterinfraprojects.in as a developer's annual folio: a calm, typeset record of land, approvals and progress. Warm paper instead of white, GIP navy for the serious bands, one brass accent, a light editorial serif over Archivo. The luxury is not decoration; it is that every fact a plot buyer wants — HMDA permit number, RERA number, 288 plots, who owns which one today — is set in good type with air around it, the way a well-made brochure or an architecture journal would set it.

Why this fits GIP and not Honer: Honer sells renders of towers; GIP sells land and paperwork. A magazine spread of a drone photo with a hairline rule and a plot count under it says "we have nothing to hide" louder than any adjective. The site should feel unhurried because the company is not hurrying you.

**Emotional promise for the buyer** (a Hyderabad family or NRI, on a phone, comparing three plot layouts on a Sunday): *"I can see everything, verify everything, and reach a person in one tap."*

That promise maps to three mobile-first guarantees that govern every page:

| Buyer need | What Folio does |
|---|---|
| Compare approvals and facts fast | Every project surface leads with a **facts ledger** (extent, plots, sizes, road widths, HMDA LP, TS RERA) above any photograph. Approval references are set in Archivo at full size with a "verify" link, never in grey small print. |
| See the layout and what is actually free | The **live master plan** is an SVG built from `gc6-masterplan.json`, coloured with the admin's status tokens, stamped "Status as of 6 Oct 2026", zoomable, tappable, searchable by plot number. It is the hero of the project page, not a JPG at the bottom. |
| Call or WhatsApp without hunting | A fixed **bottom tray** on phones (Call · WhatsApp · Enquire) that appears once the hero scrolls away; desktop keeps "Call +91 97001 23900" and "Enquire" in the header on every page. The enquiry form hands off to WhatsApp with the project and plot pre-written. |

Signature moments a visitor remembers:
1. The hero photograph is **tipped into the page** like a plate in a book, then expands to full bleed as you scroll.
2. The master plan **draws itself** (boundary, roads, then plots fading in by status) and you can tap plot 142 and enquire about plot 142.
3. The company's numbers are set as **ledger typography** — 11+ / 20+ / 600+ / 6000+ at 128 px in a light serif, counting up once.
4. The **diptych**: every render ("Artist's impression") sits beside a real site photo ("Site progress · Mar 2026"). Honesty as a visual device.
5. The footer: the GIP logo animation draws in once on navy, under a giant serif line, *"Plan with purpose. Build with integrity."*

---

## 2. Typography

Two families, both Google, both self-hosted through `next/font/google` (verified in `next/dist/compiled/@next/font/.../font-data.json`):

| Role | Family | Axes used | Why |
|---|---|---|---|
| Display, pull quotes, storytelling numerals | **Newsreader** (variable, `wght` 200–800, `opsz` 6–72, true italic) | `opsz` auto (`font-optical-sizing: auto`), `wght` 300 for display, 400 for H3/quotes, italic 300 for the accent phrase | An editorial serif drawn for Google by Production Type: high contrast at opsz 72 (the Didone flavour Honer's Rhymes has) but with sturdier hairlines than a true Didone, so weight 300 survives low-DPI Android screens where weight 200 Didones disappear. Honer uses 200; we use 300 on purpose. Rejected: Instrument Serif (one weight, now the default "AI site" serif — reads as slop), Fraunces (ball terminals are too friendly for approvals), Bodoni Moda (hairlines fail on cheap phones), Playfair/Cormorant (overused / too thin). |
| Body, UI, data numerals, eyebrows | **Archivo** (variable, `wght` 100–900, `wdth` 62–125) | `wght` 400/500, `wdth` 100 for text, `wdth` 80 for data numerals (plot numbers, table figures, counts in chips) | Already the admin face; `wdth` 80 tabular figures give the ledger look without a third font. |

`fonts.ts`:

```ts
import { Archivo, Newsreader } from "next/font/google";
export const archivo = Archivo({ subsets: ["latin", "latin-ext"], axes: ["wdth"], display: "swap", variable: "--font-sans" });
export const newsreader = Newsreader({ subsets: ["latin", "latin-ext"], axes: ["opsz"], style: ["normal", "italic"], display: "swap", variable: "--font-display" });
```
`latin-ext` carries ₹ (U+20B9). Add `font-synthesis: none` on `html` so no faux-bold/italic is ever generated.

### 2.1 Type scale

Fluid between 390 px and 1440 px. `clamp()` values are the spec; the px pair is mobile → desktop.

| Token | Family / weight | Size | Line-height | Tracking | Use |
|---|---|---|---|---|---|
| `display-xl` | Newsreader 300 | `clamp(2.75rem, 1.5rem + 5.2vw, 6rem)` = 44 → 96 px | 1.0 | −0.03em | Home H1 only |
| `display-l` | Newsreader 300 | `clamp(2.5rem, 1.4rem + 4vw, 4.5rem)` = 40 → 72 px | 1.02 | −0.025em | Inner-page H1, project name |
| `h2` | Newsreader 300 | `clamp(2rem, 1.3rem + 2.4vw, 3rem)` = 32 → 48 px | 1.08 | −0.02em | Section headings |
| `h3` | Newsreader 400 | `clamp(1.5rem, 1.2rem + 1vw, 1.875rem)` = 24 → 30 px | 1.2 | −0.01em | Sub-sections, pull quotes (italic) |
| `h4` | Archivo 500 | 1.25rem (20 px) | 1.3 | −0.01em | Card and ledger row titles |
| `lede` | Archivo 400 | `clamp(1.125rem, 1rem + 0.5vw, 1.25rem)` = 18 → 20 px | 1.5 | 0 | First paragraph under a heading, max 48ch |
| `body` | Archivo 400 | 1rem (16 px) | 1.6 | 0 | Copy, max 62ch (~600 px) |
| `body-s` | Archivo 400 | 0.875rem (14 px) | 1.5 | 0 | Table cells, form help, footer links |
| `caption` | Archivo 400 | 0.8125rem (13 px) | 1.4 | +0.01em | Image captions, "as of" stamps, ink-3 colour |
| `eyebrow` | Archivo 500 | 0.75rem (12 px) | 1 | +0.12em, uppercase | Section labels, folio numbers ("02 — Master plan"), chips |
| `numeral-xl` | Newsreader 300 | `clamp(4rem, 2.5rem + 7vw, 8rem)` = 64 → 128 px | 0.95 | −0.04em | Company stats, availability count on the project hero; `font-variant-numeric: lining-nums tabular-nums` |
| `numeral-data` | Archivo 500, `wdth` 80 | inherits | inherits | 0 | Plot numbers, legend counts, table figures; `tabular-nums` |
| `button` | Archivo 500 | 0.875rem (14 px) | 1 | +0.02em | All buttons, sentence case (uppercase lives only in eyebrows) |
| `nav` | Archivo 500 | 0.875rem | 1 | +0.02em | Header links |

Rules:
- `h1, h2, h3 { text-wrap: balance }` (already in admin); `p, li { text-wrap: pretty }`; `max-width` on every text block (`lede` 48ch, `body` 62ch) — never let copy run the full 1280 container.
- Negative tracking only at ≥ 32 px (h2 and up). Body and UI stay at 0; eyebrows are positive-tracked.
- Weight 300 is the only display weight. Never bold a serif. Emphasis inside body copy = Archivo 500, never italic (italic belongs to the serif accent).
- Numerals in running copy use Archivo's default lining figures; stats use Newsreader tabular lining so count-up does not jitter.
- Headings are real DOM text at first paint (SEO + LCP); reveals animate transforms, never `display`.

### 2.2 The accent phrase rule

Exactly one italic phrase per headline, 1–3 words, never the first word, set in Newsreader *italic* 300 at the same size. Colour: **brass** on paper/stone; **brass** on navy too (one accent, see §3). Not every heading gets one — the H1 of each page and at most two H2s per page. Section H2s on the project page do not use it (facts, not poetry). Examples used in this document: *"papers in order"*, *"conversation"*, *"principle"*, *"excellence"*, *"sixteen handed over"*.

---

## 3. Colour

Light theme only. Dark sections are navy bands, listed exactly in §3.3. Tokens are oklch (authoritative) with hex approximations for mock-ups. The admin's status tokens are copied verbatim so the public plot map equals the admin plot map.

### 3.1 Token set

| Token | oklch | ≈ hex | Use |
|---|---|---|---|
| `--paper` (`--background`) | `oklch(0.985 0.006 80)` | #FBF9F5 | Page canvas. Warm, not white. |
| `--stone-50` | `oklch(0.965 0.010 80)` | #F4F1EA | Alternate section canvas, table header rows |
| `--stone-100` | `oklch(0.935 0.014 78)` | #ECE7DC | Facts strip, chips, secondary button hover, input underline |
| `--stone-200` (`--border`) | `oklch(0.88 0.018 78)` | #DBD4C5 | Hairlines on paper |
| `--stone-300` | `oklch(0.80 0.020 78)` | #C4BCAB | Strong rules (table head), plan outline motif |
| `--ink` (`--foreground`) | `oklch(0.215 0.022 256)` | #1D2431 | Primary text (admin value) |
| `--ink-2` | `oklch(0.42 0.022 256)` | #545C6A | Secondary text, ledger labels |
| `--ink-3` (`--muted-foreground`) | `oklch(0.505 0.022 256)` | #6B7381 | Captions, placeholders (5.6:1 on paper) |
| `--navy` (`--primary`, `--brand`) | `oklch(0.34 0.096 251)` | #033967 | Primary buttons on paper, navy bands, logo |
| `--navy-deep` | `oklch(0.27 0.075 252)` | #0A2A4E | Footer, primary-button hover |
| `--navy-ink` | `oklch(0.21 0.05 252)` | #0D1F38 | Text on brass, image scrims |
| `--paper-on-navy` | = `--paper` | #FBF9F5 | Headings/body on navy (11.3:1) |
| `--sand` | `oklch(0.86 0.035 80)` | #DED2BB | Secondary text on navy (7.7:1), rules on navy at 100% |
| `--rule-on-navy` | `oklch(1 0 0 / 0.14)` | — | Hairlines inside navy bands |
| `--brass` (accent) | `oklch(0.62 0.115 62)` | #B9772F | The one accent: italic accent phrase (≥ 32 px), brass primary button on navy, active plot-map filter chip, link underline on hover |
| `--brass-text` | `oklch(0.52 0.105 60)` | #966020 | Brass as small text: eyebrows, inline links, "verify" links (5.3:1 on paper) |
| `--brass-soft` | `oklch(0.95 0.03 75)` | #F6EBD9 | Background of the "Artist's impression" chip and the "as of" stamp |
| `--scrim` | `oklch(0.21 0.05 252 / 0.55)` | — | Dialog/sheet overlay (navy-tinted, never black), image bottom gradient (0 → 0.6) only where type sits on a photo |
| `--ring` | `oklch(0.56 0.16 251)` | #2E78D2 | Focus ring (admin value) |
| `--shadow-overlay` | admin value | — | Only floating layers: sheet, dialog, tooltip, mobile tray, header when stuck |
| Status (admin, verbatim) | `--status-available oklch(0.8 0.12 180)` + `-fg oklch(0.48 0.09 180)` `-on oklch(0.27 0.05 180)` `-soft oklch(0.955 0.035 180)`; `--status-sold oklch(0.55 0.19 27)` + `-fg oklch(0.52 0.19 27)` `-on white` `-soft oklch(0.955 0.025 27)`; `--status-mortgaged oklch(0.8 0.15 70)` + `-fg oklch(0.52 0.12 60)` `-on oklch(0.3 0.07 55)` `-soft oklch(0.96 0.045 75)`; `--status-registered oklch(0.45 0.15 264)` + `-fg oklch(0.45 0.15 264)` `-on white` `-soft oklch(0.955 0.025 264)`; `--tile-edge oklch(0 0 0 / 0.28)` | — | Plot map fills, legend swatches, availability bars, status chips. Patterns (hatch / dots / folded corner) copied from admin `@utility pattern-*` and `.tile`. |

Contrast checks done: brass-text on paper 5.3:1; brass as 48 px italic on paper 3.5:1 (large text, passes); brass fill with navy-ink text 4.9:1; sand on navy 7.7:1; ink-3 on paper 5.6:1; navy on paper 11.3:1.

### 3.2 Usage rules

1. Paper is the canvas. Stone-50 alternates sections when two paper sections would otherwise touch with no image between them. Never pure white except the illustration plates (§6).
2. Navy is for bands, primary buttons on paper, the logo and the plot-map selection ring. Not for text on paper (ink is warmer against paper; navy text reads "link").
3. **One accent, two contexts.** On paper the primary button is navy; brass is typographic (italic phrase, eyebrow, link hover). On navy bands the primary button is brass-filled with navy-ink text, because navy-on-navy has no contrast and brass + navy is the folio's signature pair. Brass is never a filled surface larger than a button; never a background band; never a gradient.
4. **The mortgaged amber `oklch(0.8 0.15 70)` and brass `oklch(0.62 0.115 62)` share a hue family.** Inside the master-plan section (map, legend, plot sheet, filters) brass is therefore forbidden; the active filter chip there is navy, and the accent phrase is not used in that section's heading.
5. Status colours appear only where a plot status is being communicated: the map, its legend, the availability line on cards/hero ("211 of 288 available" uses `--status-available-fg`), the plot sheet. Never as decoration, never as "approved" ticks (those are ink).
6. WhatsApp's green is a brand icon colour exception: the WhatsApp glyph is `#25D366` on paper, white on navy. Nothing else is green.
7. No gradients on UI. Photos get at most a bottom scrim where type sits. No duotones (the renders are already graded warm).
8. Borders over shadows everywhere (§4.5).

### 3.3 Dark (navy) sections — the complete list

| Page | Navy band(s) | Everything else |
|---|---|---|
| Home | §5.1 item 6 "Why buyers choose Greater Infra" (navy); item 10 closing CTA (navy) | paper / stone |
| Projects | none (footer only) | paper / stone |
| Project detail | 06 Approvals & documents (navy); 07 Enquire (navy, directly above footer — allowed because it is the page's end) | paper / stone |
| About | Mission / Vision (navy) | paper / stone |
| Contact | none | paper |
| 404 | none | paper |
| Footer (all pages) | navy-deep | — |

Rule: at most two navy bands per page, never adjacent except CTA → footer, each at least 480 px tall on desktop, always entered from paper with a 128 px paper margin above.

---

## 4. Layout

### 4.1 Container and grid

| Token | Value |
|---|---|
| `--container` | 1280 px content width (Honer: 1360). The narrower measure plus 80 px side margins at 1440 reads as a book margin; body copy capped at 62ch inside it. |
| `--bleed` | 1440 px for "wide" images (spreads, the hills-dusk panorama); true full-bleed (100vw) only for the hero plate after expansion and the panorama band. |
| Side padding | 16 px (< 480), 24 px (≥ 480), 40 px (≥ 768), 64 px (≥ 1280) |
| Grid | 12 columns, 24 px gutter (16 px on mobile). Mobile is single column; ≥ 768 uses the spread grammar below. |
| Baseline | 8 px. Line-heights above are chosen so headings and body snap to it at the main sizes. |

**Spread grammar** (the editorial unit used on every page): a sticky left column and a flowing right column.

```
cols 1–4   (sticky, top: 96px)   eyebrow · H2 · lede · optional CTA link
cols 6–12                         body / ledger / figures
```
On the project page the sticky left column also carries the folio number ("02 — Master plan"). On mobile the left column simply stacks above (not sticky).

**Ledger** (the second unit): a list or table whose rows are separated by 1 px `--stone-200` hairlines, label in `eyebrow` or `body-s` ink-2 at left, value in `h4`/`numeral-data` ink at right, 20 px vertical padding. Used for stats, highlights, amenities, approvals, contact details, completed projects, plot details. It replaces cards almost everywhere.

### 4.2 Section rhythm

| Section type | Desktop (≥ 1024) | Tablet | Mobile |
|---|---|---|---|
| Primary (story, spreads, bands) | 128 px top/bottom | 96 | 72 |
| Secondary (galleries, ledgers) | 96 | 72 | 56 |
| Dense (facts strips, tables, FAQ) | 64 | 48 | 40 |
| Hero → first section | 96 | 72 | 56 |
| Inside a spread, heading → body | 40 | 32 | 24 |
| Ledger row | 20 px padding | 16 | 16 |

### 4.3 Radius, borders, shadows

- `--radius: 0.125rem` (2 px) on everything: buttons, chips, inputs, sheets, the hero plate. Images are square. This is the one visible departure from the admin's 6 px and it is deliberate: print plates have square corners; pills and rounded cards are what makes real-estate sites look like SaaS.
- Hairlines: 1 px `--stone-200` on paper, `--rule-on-navy` on navy. Rules separate; boxes are rare. A "card" in Folio is a hairline rectangle with 24 px padding, no fill, no shadow; the image inside bleeds to the hairline.
- Shadows: `--shadow-overlay` only on floating layers (header once stuck, mobile tray, sheet, dialog, tooltip, plot popover). Cards, buttons and images never cast a shadow, never lift on hover.

### 4.4 Image aspect ratios (from the actual files)

| Asset | Native | Used at |
|---|---|---|
| `hero-aerial.webp` 2400×1340 (1.79) | 16:9 | Home hero plate desktop 16:9; after expansion `object-fit: cover` to viewport. |
| `hero-aerial-mobile.webp` 1080×603 (1.79, landscape — not a portrait crop) | 16:9 | Mobile hero plate at **3:2**, `object-position: 50% 60%` (keeps the layout and the arch, loses sky). A 4:5 portrait regeneration is the one essential extra prompt (§6.3). |
| `entrance-arch.webp` 1920×1072 | 16:9 | Project hero plate 16:9; project card diptych 3:2 crop |
| `avenue-road.webp` 1600×1073 (1.49) | 3:2 | Spreads at 3:2 |
| `park-walk.webp`, `clubhouse-pool.webp` 1600×1195 (1.34) | 4:3 | Spreads at 4:3; 3:2 crops acceptable (centre) |
| `hills-dusk.webp` 2400×1018 (2.36) | 21:9 | Full-bleed panorama band only |
| Site photos (Supabase, 1280×720) | 16:9 | Gallery tiles 16:9, diptych inset 16:9 |
| Leadership portraits | 1114×1066 / 2048×1365 | 3:4 crops (Kashif needs a manual portrait crop) |
| Illustrations (GIF → WebM) 1024² | 1:1 | 240 px plates |
| Brand lockup `gip-lockup-*.svg` viewBox 349×156 | 2.24:1 | Header 134×60, footer 224×100 |
| Roof mark `gip-roof-*.svg` viewBox 238×96 | 2.48:1 | Favicon/icon.svg, 404, mobile header at < 360 px |

### 4.5 How "premium" is achieved

Not with effects. With: (1) a strict measure — nothing wider than 62ch for text; (2) left-aligned everything, no centred sections except the 404 and the footer tagline; (3) one hairline where another site would draw a box; (4) 128 px of paper between ideas; (5) captions under every image in `caption` ink-3 — a captioned photo reads as published, an uncaptioned one as uploaded; (6) the plan-outline motif (§6.2) used twice per site, faintly, instead of stripes; (7) consistent iconography: lucide at 1.5 px stroke, 20 px, ink-2, never in coloured circles.

### 4.6 Header

**Desktop (≥ 1024)** — 72 px tall, paper background from the first pixel (the hero is an inset plate, so the header never sits on a photo and never needs a colour flip), no border at top; a 1 px `--stone-200` hairline + `--shadow-overlay` appear once `scrollY > 8`.
- Left: `gip-lockup-navy.svg` 134×60 → `/`.
- Centre: Home · Projects · About · Contact (`nav` style, ink-2; active = ink with a 1 px brass underline; hover = ink, underline draws from left 200 ms).
- Right: `Call +91 97001 23900` (text link with `Phone` icon, `tel:+919700123900`) + **Enquire** (navy primary, 40 px tall) → opens the enquiry sheet (§5.7).
- Scroll behaviour: hides on scroll-down after 200 px (`translateY(-100%)`, 320 ms `--ease-standard`), returns on any scroll-up or when a hash link is followed. `html { scroll-padding-top: 72px }` (project page: 72 + 48 sub-nav = 120 px).
- Project pages add a second sticky row (48 px, stone-50, hairline): folio anchors `00 Overview · 02 Master plan · 03 Site progress · 04 Amenities · 05 Location · 06 Approvals · Enquire` with the active item underlined (IntersectionObserver), and at the left "HMDA LP 2046/HMDA/SWFL/2026 · TS RERA P01100009270" in `eyebrow` with a verify link. On mobile this row scrolls horizontally with a fade mask at the right edge.

**Mobile (< 1024)** — 60 px tall, same paper bar. Lockup 112×50 (roof mark only below 360 px). Right: "Menu" text + the zero-dep `MenuToggleIcon` (hamburger → X) from `header-3-mega-menu.tsx`. Tapping opens a full-screen **paper** sheet (not navy — Honer's navy overlay is the one thing every competitor copies): links in Newsreader 300 at 44 px with the accent rule unused, staggered 60 ms; under them a hairline, then Call and WhatsApp as two secondary buttons and the office address in `caption`. Body scroll locked; focus trapped; Escape closes.

### 4.7 Mobile bottom CTA tray

- Fixed bottom, height 64 px + `env(safe-area-inset-bottom)`, paper background, 1 px hairline top, `--shadow-overlay`, `z-index: 50`. Three equal cells, each a 52 px tall button:
  1. **Call** — `Phone` icon + "Call" — secondary style — `tel:+919700123900`.
  2. **WhatsApp** — WhatsApp glyph (inline SVG, #25D366) + "WhatsApp" — secondary — `https://wa.me/919700123900?text=` + page-aware prefill (home: "Hi GIP, I'd like to know about your current plots."; project: "Hi GIP, I'm interested in Global City VI at Rudraram. Please share availability and price."; plot sheet: adds "plot 142 (200 sq yd, East, 40 ft road)").
  3. **Enquire** — navy primary — opens the enquiry sheet with the project (and plot) prefilled.
- Appears after the hero leaves the viewport (`translateY(100%) → 0`, 320 ms); hidden while the enquiry sheet is open, while any input is focused (keyboard) and on the Contact page (the form is the page). `main { padding-bottom: 80px }` on mobile so the footer bottom is reachable.
- Desktop: no tray (it covers content and competes with the page). Conversion on desktop is the header pair plus, on the project page, the sticky right rail (§5.3).

---

## 5. Page-by-page

Copy in quotation marks is verbatim from `content-inventory.md`; **NEW** marks new copy; (drop) marks old copy intentionally not carried. Images are named by file.

### 5.1 Home `/`

H1 count: 1. Document order:

**1. Hero — the tipped-in plate.** Section 160 vh with a sticky 100 vh child (desktop); static on mobile and under reduced motion.
- Eyebrow: **NEW** "Greater Infra Projects · Hyderabad · Plotted developments since 2014" (`COMPANY.founded`).
- H1 (`display-xl`): **NEW** "Land with its *papers in order*." (drop "Turning Your Property Dreams into Trusted Reality" — generic; keep it only if the client vetoes the new line).
- Lede: **NEW** "HMDA, DTCP and RERA-approved open plots and villa plots across Hyderabad's growth corridors — 11+ years, 20+ projects, 600+ acres."
- CTAs: **See Global City VI** (navy primary → `/projects/global-city-vi`) · "Call +91 97001 23900" (text link).
- Plate: `hero-aerial.webp` inset 24 px from the container edges on desktop (12 px mobile), 16:9, square corners, "ARTIST'S IMPRESSION" chip bottom-right (§6.1). Type sits on paper **beside** the plate on desktop (left 5 columns, plate right 7 columns) and **below** it on mobile — never on the photo. Beat 1 → beat 2 (scroll 0 → 45 % of the runway): the plate's `clip-path: inset()` goes from the inset to 0 and the image scales 1 → 1.08; the type column fades (opacity 1 → 0, y 0 → −24 px) between 25 % and 50 %; between 55 % and 75 % a second line fades in over the now full-bleed photo with a bottom scrim: **NEW** "Global City VI — 288 plots at Rudraram, Sangareddy. 211 available today." (numbers from `summarize()`; the availability figure is a `numeral-xl`) + **View the layout** (brass primary on scrim). Then the page scrolls on. H1 and lede are visible at first paint (no `initial opacity 0`).
- LCP element: the hero image (desktop) — preloaded; see §9.

**2. Facts ledger.** Stone-50 band, dense rhythm. Four `numeral-xl` figures in one hairline row (2×2 on mobile) with `eyebrow` labels, counting up once in view: **11+** "Years of Industry Experience" · **20+** "Successfully Delivered Projects" · **600+** "Acres Developed" · **6000+** "Happy Customers". Descriptions from the old stats section are dropped (they contradict the figures: "21 diverse projects", "100+ satisfied customers"). Behind the row: the faint plan-outline motif (§6.2).

**3. Featured project spread — Global City VI.** Spread grammar.
- Left (sticky): eyebrow "Ongoing · Rudraram, Sangareddy District"; H2 "Global City *VI*"; spec line in `body-s` ink-2: "21 acres 10 guntas · 288 plots · 147–731 sq yd · 100 ft road facing · 40 / 30 ft CC roads" (from `landArea`, `summarize()`, `masterPlan.stats`); approval line: "HMDA LP 2046/HMDA/SWFL/2026 · TS RERA P01100009270" with "Verify on rera.telangana.gov.in"; availability: "211 of 288 plots available · Status as of 6 Oct 2026" (`--status-available-fg` for the count, `caption` for the date); CTAs **View project** (navy) · "Download brochure (PDF, 23.7 MB)" (secondary, `media.brochure.url`).
- Right: the **diptych** — `entrance-arch.webp` at 3:2 (chip "Artist's impression") with the real cover photo (`media.cover.url`, 16:9) inset bottom-left at 38 % width, captioned "Site progress · March 2026". The render carries `ViewTransition name="project-global-city-vi"` and morphs into the project hero (§7.9).
- Why no three-up grid: one project in a three-slot grid reads as empty. One spread reads as chosen.

**4. "What a GIP layout includes" — stacked plates.** `stacking-cards.tsx` (sticky stack, 4 cards, each 100 vh−160 px tall). Each card: render on the left 7 columns, right 5 columns an eyebrow + `h3` + one fact line from Global City VI data:
  1. `entrance-arch.webp` — "Grand Entrance Arch" — **NEW** "A gated entry with a manned security cabin." (keep to what the render shows; the highlight list says "Grand Entrance Arch").
  2. `avenue-road.webp` — "CC Internal Roads (40 / 30 Feet)" — "Avenue Plantation", "Underground Electricity", "Underground Drainage" (highlights/amenities, verbatim labels).
  3. `park-walk.webp` — "Children's Play Area", "Overhead Water Tank" (amenities).
  4. `clubhouse-pool.webp` — "Clubhouse (25,000 Sq. Yards)", "Swimming Pool" (amenities).
  Every card carries the "Artist's impression" chip. Reduced motion: the four cards stack normally with 64 px gaps.

**5. Principles.** H2 "Built on *principle*." (old: "Built on Principle"). 2×2 grid, each tile: illustration plate (240 px, §6) + `h4` + body:
  1. "Transparency" — "We believe transparency is the foundation of trust. From approvals and documentation to pricing and timelines, we ensure absolute clarity at every stage of the customer journey." — `transparency.gif`
  2. "Quality-Driven Planning" — "Every project is thoughtfully planned with a strong emphasis on layout design, infrastructure, and long-term usability. We focus on building developments that stand the test of time." — `quality-driven-planning.gif`
  3. "Trust & Reliability" — "We value relationships over transactions. By delivering what we promise and standing by our commitments, we build long-term confidence with every customer." — `trust-reliability.gif`
  4. "Timely & Responsible Execution" — "We understand the significance of a real estate investment. With disciplined execution and structured planning, we strive to deliver our projects responsibly and on schedule." — `timely-responsible-execution.gif`
  (These four map 1:1 to the GIF names; the old site never wired them.)

**6. Navy band — why buyers choose GIP.** H2 **NEW** "Why buyers *choose* Greater Infra" (old "Why Choose Greater Infra Projects"); lede "A value proposition built on trust, planning, and execution. We define how we select land, design communities, engage with customers, and deliver long-term value." Four ledger rows (paper text, sand labels, `--rule-on-navy`), verbatim: "Trusted by Buyers & Investors" / "Prime Locations with Strong Connectivity" / "End-to-End Customer Care" / "Proven Track Record of Delivery" with their descriptions. Right column: nothing — air. No glass rows.

**7. Brand story panorama.** `hills-dusk.webp` full-bleed 21:9 (chip), caption "A GIP layout at dusk — artist's impression". Below, spread: eyebrow "Our Brand Story"; H2 **NEW** "Build with integrity. Plan with purpose." (lifted from the story's own words); body p1 "Greater Infra Projects is a real estate development firm driven by a clear philosophy—build with integrity, plan with purpose, and deliver enduring value…" and p2 "At the core of our approach lies an unwavering belief in doing business the right way…" (both verbatim, two columns at ≥ 1024). Link "About Greater Infra →".

**8. Two voices.** Only if the client confirms them: the two testimonials that read as real — Rakesh Kota ("Nice plotting at Rudraram, really liked the spacious roads and good infrastructure…") and Ravi Kiran ("A very promising group with a dedicated attitude…"). Typeset as two Newsreader italic `h3` pull quotes side by side with a hairline between, name in `eyebrow`. No avatars, no carousel, no stars. If unconfirmed, the section is cut; #3–#7 are never used.

**9. Delivered layouts ticker.** One line, the diceui Marquee at 80 s linear, pause on hover, Archivo `body-s` ink-2 with Newsreader italic locations: the sixteen completed project names and locations (§5.2). Reduced motion: a wrapped static list. This is the home page's only marquee and its only moving text.

**10. Navy closing band.** H2 "Let's start a *conversation*." (old contact H1 "Let's Start a Conversation"); lede "We believe investment starts with a conversation, not pressure. Reach out and let us understand your vision." (verbatim). Buttons: **Enquire** (brass) · WhatsApp · Call (secondary on navy). Right 5 columns: `clubhouse-pool.webp` 4:3 with chip (swap for the weekend-villa render when it lands).

Footer (§5.8).

### 5.2 Projects `/projects`

H1 count: 1.

1. **Header spread.** Eyebrow "Projects"; H1 (`display-l`) **NEW** "Plotted layouts across *Hyderabad's* growth corridors."; lede "Delivering high-value residential plotting ventures with clear titles, prime locations, and strong growth potential across Hyderabad." (verbatim, from Corporate Strengths). (drop "Discover Your Dream Property", "Indulge in Luxury: Villas & Plots for Distinction", "luxury apartments".)
2. **Segmented control** (stone-100 track, navy active): **Ongoing (1) · Delivered (16)**. Honest counts are the "more coming" signal: nothing says "coming soon", the ledger below simply shows the company's record, and the admin adds rows to both tabs. The control filters in place (no route change); the URL hash `#delivered` deep-links.
3. **Ongoing — one feature spread** identical to Home §5.1 item 3 (same component, `ProjectSpread`), full container width. Rendered from `getProjects()`; when the backend adds projects, spreads stack with 96 px gaps and hairlines.
4. **Delivered — the ledger.** H2 "Twenty projects, *sixteen handed over*." A hairline table, three columns at ≥ 768 (Project · Location · District), one column on mobile, rows from the inventory (names and places verbatim; no years, none are known; rows are not links — completed projects have no detail page, `hasDetailPage()`):
   Green Hill Farms — Yadadri · Global City — Rudraram · Global City II — Nandigama · Global City III — Isnapur · Greater Infra Resorts — Shadnagar · LR Palm Meadows — Rampally · Highway City — Yadadri · True Pride — Bachara · LR Medchal County — Medchal · Keesara County — Bogaram · RR Kompally County — Kompally · Sri Yadadri Gardens — Yadadri · Rampally County — Rampally · Global Highway City — Sangareddy · Kompally County II — Medchal · Global Village — Kadthal.
   Until these come from the backend they live in a `COMPLETED_PROJECTS` const in `src/lib/data/completed.ts` (name, location, district) — **ponytail:** one array, no types beyond `{name; location; district}`.
   Left column (sticky): a district index built from that array — "Sangareddy (4) · Medchal–Malkajgiri (5) · Yadadri (3) · Rangareddy (2) …" — tapping a district scrolls to and highlights its rows. District attribution must be checked with the client before launch (§10).
5. Closing CTA band is **not** repeated here (the tray and header carry it); a single secondary line under the ledger: **NEW** "Looking for a delivered layout's documents? Call the office — +91 97001 23900."

### 5.3 Project detail `/projects/global-city-vi`

H1 count: 1. Sticky sub-nav per §4.6. Desktop ≥ 1280 has a **sticky right rail** (cols 10–12, `top: 136px`) through sections 01–05: a hairline box with the availability figure, approval line, and three buttons (Enquire · WhatsApp · Brochure 23.7 MB). Below 1280 the rail's content is the hero facts card and the mobile tray.

**00 Hero.**
- Eyebrow: "Open Plots & Weekend Villa Plots · Rudraram / Shankarapally, Sangareddy District" (`typeLabel`/type name, `location.full`).
- H1 (`display-l`): "Global City *VI*" (the one italic accent on this page).
- Lede: "Global City VI is a premium HMDA & RERA approved 22-acre weekend villas and open plots project located at Rudraram / Shankarapally with excellent access to Mumbai Highway and educational hubs." (`description`, verbatim; note 22 acres vs `landArea` 21 ac 10 g — see §10).
- Plate: `entrance-arch.webp` 16:9, chip, `ViewTransition name="project-global-city-vi"`.
- Facts card (hairline, stone-50, 2-column ledger; on mobile directly under the plate): Extent "21 acres 10 guntas" (`formatLandArea`) · Plots "288" · Plot sizes "147 – 731 sq yd" (`summarize()` min/max, rounded) · Roads "40 / 30 ft CC · 100 ft facing" · Facing "141 east · 136 west · 7 north · 4 south" (from the plan) · Corner plots "38" · HMDA "LP 2046/HMDA/SWFL/2026 · 23 Apr 2026" · TS RERA "P01100009270" · Availability "211 available · 30 sold · 38 mortgaged · 9 registered" with the four status dots · "Status as of 6 Oct 2026". Price: `showPrice` is false → no price shown; the enquiry asks for it (§10).
- Buttons: **Enquire** (navy) · WhatsApp (secondary) · "Brochure (PDF, 23.7 MB)" (text link, `download`).

**01 Overview.** Spread. Eyebrow "01 — Overview"; H2 "Excellent Connectivity & Access" (`locationAdvantages.title`) is saved for 05; here H2 **NEW** "A gated layout on the Mumbai Highway side of Sangareddy"; body: "Strategically located near Mumbai Highway and GITAM University, Global City VI offers a secure and premium plotted development ideal for weekend homes and long-term appreciation." (`vision.description`). Ledger of the four vision features (verbatim titles + descriptions, lucide from `ICONS`): Prime Corridor · High Growth Zone · HMDA Approved ("Approval No. 007133/LO/HMDA/1700/SKP/2024") · Green Infrastructure. Then the seven `highlights` as a two-column checklist in `body-s`.

**02 Master plan — interactive.** Dense rhythm, stone-50 band, no brass anywhere in this section.
- Eyebrow "02 — Master plan"; H2 "Integrated Villa & Plot Layout" (`masterPlan.title`); lede "22-acre master-planned community with 40 / 30 feet CC internal roads, premium amenities and well-defined villa & plot layouts." (`masterPlan.description`).
- Layout: plan left (cols 1–7, portrait), control column right (cols 8–12): legend, filters, plot sheet target, stats. Mobile: controls above, plan below in a scroll container.
- **SVG construction** (`<Masterplan plots units plan />`, `"use client"`, data passed as props from the server page):
  - `viewBox="-206.72 -319.32 375.75 559.95"` from `extent`; every point rendered as `(x, −y)` (metres north → SVG down). North arrow top-right.
  - Layers in order: `greens` (fill `oklch(0.90 0.04 140)`), `road100` (fill `--stone-300`), `roads` (fill `--stone-200`), `zones` (park_west "Park", park_east "Landscaped park", clubhouse "Clubhouse", social "Social infrastructure", utility "Utility area" — fill stone-100, label at centroid in `eyebrow`), `plots`, `boundary` (stroke ink 1 px, `vector-effect: non-scaling-stroke`), `wall` (stroke ink-3 dashed), `features` (gate, clubhouse, pool, parking, courts, tank, play, park → lucide `DoorOpen`, `Building`, `WavesLadder`, `Car`, `Trophy`, `Droplets`, `Blocks`, `Trees` at 14 px, ink-2, placed at `at`).
  - Plot fill by `Unit.status` using the admin tokens: available = `--status-available-soft` fill + `--status-available-fg` 0.75 px stroke; sold_out = `--status-sold` fill + an SVG `<pattern id="hatch">` overlay (135°, 2 px pitch); mortgaged = `--status-mortgaged` + `<pattern id="dots">`; registered = `--status-registered` + a small paper triangle at vertex 0 (the admin's folded corner). Plot number text at `c` in Archivo `wdth` 80, 500, `--st-on` colour, `font-size: 3.6` user units, hidden below zoom 2× (see next).
  - **Zoom**: the plan sits in an `overflow: auto` container; zoom buttons 1× / 2× / 3× set the SVG width to 100 / 200 / 300 % (CSS width, no library). Desktop default 1× (≈ 1.9 px/unit at 700 px — colour read), numbers appear at 2×. Mobile default 2× (plots ≈ 16×33 px), 3× available (24×50 px). Scroll container has `touch-action: pan-x pan-y` so pinch stays native.
  - **Find plot**: a numeric input "Plot no." (1–288) that scrolls the container to the plot, selects it and opens its sheet — the reliable path on phones where 288 polygons cannot all be 44 px targets.
  - **Hover** (pointer: fine): tooltip (shadcn `tooltip`) "Plot 142 · 200 sq yd · East · 40 ft road · Available". **Click/tap** (any pointer, also Enter/Space — each plot is a `<path role="button" tabindex="0" aria-label>`): selection ring (admin's double ring: 2 px paper + 2 px ink, no fill change) and the **plot sheet** opens: desktop = the right column swaps to the sheet; mobile = shadcn `sheet` from the bottom. Sheet content: "Plot 142" `h3`, status chip, ledger (Area 200 sq yd · Dimensions 30 × 60 ft when `widthFt` exists · Facing East · Road 40 ft · Corner yes/no · Block —), status note for mortgaged ("Held with the approving authority until released; not for sale yet." — `UNIT_STATUS_META.description`), and **Enquire about plot 142** (navy) which opens the enquiry sheet with project + plot prefilled; for sold/registered plots the button becomes "Ask about similar plots".
  - **Filters** (chips, navy active): status (4), facing (East / West / North / South), size band (≤ 175 · 176–250 · 251–350 · 351+ sq yd), road (30 ft / 40 ft), corner. Filtered-out plots render as the admin's `[data-dim]` outline (transparent fill, `--border` edge). A result line: "97 plots match · 71 available".
  - **Legend** (same `.tile` CSS as admin, copied verbatim): Available 211 (73 %) · Sold Out 30 (11 %) · Mortgaged 38 (13 %) · Registered 9 (3 %) — counts and `percents()` from `summarize()`; one-line descriptions from `UNIT_STATUS_META`. Under it, the stamp in `caption` on `--brass-soft`: "Status as of 6 Oct 2026" (`formatDate(inventoryUpdatedAt)`). When `statusSample` is true (it is today: the registered split and the mortgaged block 229–266 are sample), add "Some statuses are sample data pending confirmation" — remove automatically when the flag clears.
  - **Draw-in** (once, in view, skipped under reduced motion): boundary and roads `stroke-dashoffset` 800 ms, then plots fade in by status in document order with a 4 ms stagger (288 × 4 = 1.15 s), legend counts count up in parallel.
- Below the plan: the four `masterPlan.stats` as a ledger ("150 – 400 and 700" / "Available Plot Sizes (Sq. Yds.)" — show the computed "147 – 731 sq yd" instead and flag the data string in §10; "22 Acres"; "40 / 30 Ft"; "100 Ft") and a land-use line from `landUse`: **NEW** "62,108 sq yd plotted · 27,113 sq yd roads · 6,950 sq yd parks · 2,554 sq yd social infrastructure" — then "Download layout copy (PDF, 9.9 MB)" (`media.masterPlan.url`, the brochure-cum-layout) as a text link. `image-comparison.tsx` (scan vs digitised plan) is **not** used until a raster of the brochure's page 2 exists (§10).

**03 Site progress.** Secondary rhythm. Eyebrow "03 — Site progress · Photographed March 2026"; H2 **NEW** "The layout as it stands today"; lede **NEW** "Roads cast, plantation in, entrance arch under construction. These are photographs, not renders." The 14 gallery photos (`media.gallery`, the duplicate already removed in data) in `masonry-lightbox.tsx` (3 columns / 2 / 1), each tile 16:9, `alt` **NEW** "Global City VI site, March 2026 — CC road and plot demarcation" etc. (one honest alt per photo written at build time). Lightbox with prev/next and focus trap taken from `gallery-grid-lightbox.tsx`.

**04 Amenities.** Spread. Eyebrow "04 — Amenities"; H2 "Premium Community Amenities" (`amenities.title`); lede "Designed to offer comfort, recreation and sustainable living within a secure gated community." Ledger of the nine `featured` items with `ICONS[icon]` and descriptions (verbatim: "25,000 Sq. Yards clubhouse facility.", "40 / 30 feet wide internal roads.", …) plus "Plot Fencing" as a plain row. Right column: `avenue-road.webp` 3:2 + `park-walk.webp` 4:3 stacked, chips. Data note: `amenities.visible` is `false` in the seed (the old site had the section unmounted); the page renders the section when `visible || items.length > 0` and the seed should flip `visible: true` — one-line change, the admin owns the flag afterwards.

**05 Location.** Spread. Eyebrow "05 — Location"; H2 "Excellent Connectivity & Access"; lede "Well connected to Mumbai Highway and major educational institutions, offering a peaceful yet accessible lifestyle."; badge chip "Prime location — Near Mumbai Highway". Ledger of `locationAdvantages.categories`: Connectivity → Mumbai Highway — "Nearby"; Education → GITAM University — "Nearby". Right column: `expanded-map.tsx` with the pin 17.535588, 78.145298 (`location.pin`), OSM/CARTO tiles, attribution, "Get directions" → `https://www.google.com/maps/dir/?api=1&destination=17.535588,78.145298`. The two-entry ledger is thin; real distances (ORR exit, Patancheru, BHEL, airport) must come from the client — do not invent (§10).

**06 Approvals & documents — navy band.** Eyebrow "06 — Approvals"; H2 "Approvals & Legal Compliance" (`legal.title`); lede "Fully HMDA approved and RERA registered project ensuring transparent and secure investment." Two approval plates (hairline on navy): "HMDA Final Layout Permit" — "2046/HMDA/SWFL/2026" in `h3` Archivo 500 — "23 Apr 2026" — "Survey nos 426/P, 427/P, 428, 432, 433/P and 434/P" — status chip "Approved"; "RERA Registration" — "P01100009270" — chip "Registered" — link "Verify on rera.telangana.gov.in ↗" (portal home; the portal has no stable deep link). Then a ledger "Documents available at the office" — HMDA Layout Approval · RERA Registration Certificate · Layout Copy · Link Documents (all `available: true`, no files attached → the row reads "Available on request", becomes a download when `file` exists). Buttons: "Brochure (PDF, 23.7 MB)" (brass) · "Layout copy (PDF, 9.9 MB)" (secondary on navy).

**FAQ** (paper, dense). Four questions whose answers are only data, shadcn `accordion` — **NEW**: "Is Global City VI HMDA approved?" → the LP number and date; "What plot sizes are available?" → "147 to 731 sq yd; most plots are 200 sq yd (143 of 288)."; "What roads does the layout have?" → "40 ft and 30 ft CC internal roads, 100 ft main-road frontage."; "How do I visit the site?" → office hours and the phone number. No invented questions about loans or registration charges.

**07 Enquire — navy band, page end.** Eyebrow "Invest in Shankarapally Growth Corridor" (`cta.subheading`, sentence-cased); H2 "Weekend Villas & Premium Plots Available" (`cta.title`); lede "Secure your premium villa plot in a 100-feet road facing HMDA approved community near Mumbai Highway." (`cta.description`). The urgency line "Limited Premium Plots Available" is replaced by the live figure: "211 of 288 plots available — status as of 6 Oct 2026" (honest urgency). The enquiry form (§5.7) inline on the right, project preselected; `cta.thankYou` "Our sales team will contact you with complete project details." is the post-submit line.

JSON-LD and metadata in §9.

### 5.4 About `/about`

H1 count: 1. No hero photograph — the page opens on type.

1. **Masthead.** Eyebrow "About Greater Infra Projects"; H1 (`display-l`) "A legacy of trust. A standard of *excellence*." (old H1, re-cased, accent on the last word); lede "Building with integrity, planning with precision, and delivering enduring value for generations." (verbatim).
2. **Who we are — spread.** Eyebrow "Who we are"; H2 "Purpose-Driven Development"; p1 "Greater Infra Projects is a real estate development firm guided by a singular philosophy — to build with integrity, plan with precision, and deliver enduring value…" (verbatim); p2 as a Newsreader italic pull quote: "At the core of our approach lies a simple belief: each project is backed by clear land titles, approved layouts, and complete documentation." Right column: `about-us.png` (the real Global City VI launch collage) cropped 3:2 to its ground-breaking frame, caption "Launch of Global City VI, Rudraram". Ask the client for the source photographs so the collage can be replaced by one strong frame (§10). Stats strip under it: 11+ "Years of Trust" · 6000+ "Happy Customers" · 20+ "Projects Delivered" (verbatim labels, `numeral-xl` at the `h2` size here).
3. **Timeline.** `timeline-milestone.tsx` (the lighter one; the interactive version needs a photo per year the client does not have). Years in Newsreader 300 at `h2` size, ink; one line each, from data only: 2014 "Greater Infra Projects founded" (`COMPANY.founded`) · 2017 "Western County, Shankarpalli" · 2021 "Global City V, Indrakaran" and "Global City VI, Rudraram" · 2022 "Global City RRR, Peddapur" · 2024 "Godavari Green Farms, Shamirpet" and "Kompally County III, Kandlakoya". Marked "verify years" in §10; render only after confirmation.
4. **Mission / Vision — navy band.** Two columns with a `--rule-on-navy` between. "Our Mission" (eyebrow, sand) → H2 **NEW** "Trust, transparency, responsibility" (the old H2 duplicated "Purpose-Driven Development"); p1 "Our mission is to uphold a development philosophy rooted in trust, transparency, and responsibility."; p2 "We are committed to delivering a real estate experience defined by fairness, clear communication, and uncompromising quality…"; pull quote (Newsreader italic, sand) "Through disciplined execution and ethical practices, we continuously strive to elevate industry standards and deliver on every commitment we make." "Our Vision" → H2 "Building for Generations"; p1 "Our vision is to establish Greater Infra Projects as one of the most trusted and respected real estate brands."; p2 "We aim to grow alongside our customers' confidence…"; pull quote "Each development reflects our core values of quality, reliability, and customer satisfaction, aligned seamlessly with evolving lifestyles and expectations." (all verbatim).
5. **Values.** H2 "Our Values"; lede "A philosophy that guides every decision we make. At Greater Infra Projects, our values are not statements—they are standards." Three plates (illustration 240 px + `h4` + body), from the About values (verbatim): "Integrity" — `integrity-transparency.gif` — "We conduct ourselves with honesty, transparency, and ethical standards in all aspects of our business."; "Quality" — `quality-craftsmanship.gif` — "We are committed to delivering the highest quality in every project we undertake, ensuring durability, functionality, and aesthetic appeal."; "Customer Focus" — `customer-first-focus.gif` — "We are dedicated to understanding and exceeding the expectations of our clients, providing exceptional service and value in every interaction."
6. **Corporate strengths.** Eyebrow "Premium Open Plots & Real Estate Development in Hyderabad" (verbatim sub-line); H2 **NEW** "How we work"; lede "Delivering high-value residential plotting ventures with clear titles, prime locations, and strong growth potential across Hyderabad." Eight ledger rows (2 columns at ≥ 1024), verbatim titles + descriptions: We build Value driven investments · Strategic Location Selection · Fast & Structured Development · End-to-End In-House Support · Clear Title & Legal Transparency · High Growth Micro-Markets · Financially Disciplined Operations · Projects Selected with Vision. Left column image: `strategic-land-investment-opportunities.gif` (transparent, black line-art — the one GIF that works on paper without blending), caption "Site selection".
7. **The difference.** H2 "Greater Infra Projects vs Typical Plot Sellers" (verbatim); lede "The difference is in the details." The five-row comparison as a hairline table (ink check `Check` / ink-3 `X` from lucide — no coloured cells): Community Planning (Master-planned communities / Isolated plots) · Documentation (Fully approved documentation / Documentation inconsistencies) · Development Control (End-to-end development control / Sale-only involvement) · After Sales (Structured after-sales support / No post-sale accountability) · Vision (Long-term development vision / Short-term transactions). Kept: it is specific and true to the business.
8. **Leadership.** Eyebrow "Leadership"; H2 "Visionary Leadership. Disciplined Execution."; lede "Leadership at Greater Infra Projects defines direction, values, and standards…" (verbatim). Two portraits 3:4 (re-encoded ≤ 120 KB WebP; Kashif cropped to portrait): **Syed Imam** — Chairman & Managing Director — bio verbatim; **Syed Ismail Kashif** — Director – Strategy & Urban Development — bio verbatim. The six unnamed staff photos are not published until names and roles arrive.
9. **Moments** (absorbs the old Gallery, §5.5): H2 **NEW** "Moments"; `gallery-events.png` (9th-anniversary collage) and `gallery-land.png` (launch collage) at 16:9 with captions "9th anniversary celebration" / "Global City VI launch" — in the masonry lightbox; replaced by individual photographs when supplied.
10. Closing navy CTA band as Home item 10.

### 5.5 Gallery — merge

Recommendation: **merge, do not keep a Gallery page.** The real gallery material is two event collages; everything else on the old gallery was Unsplash. A four-item nav (Home · Projects · About · Contact) is also cleaner. The collages live in About → Moments (§5.4 item 9) and the 14 site photos live on the project page where they carry meaning. Keep `/gallery` out of the sitemap. If the client insists on the URL, `app/gallery/page.tsx` renders the Moments section plus a "Site progress" link list under an H1 "Gallery" — ten lines, no new design. (A redirect is not available in the static export; on the Node host add `redirects()` in `next.config.ts`.)

### 5.6 Contact `/contact`

H1 count: 1. Paper only. The mobile tray is hidden here.

1. **Masthead + two columns.** Eyebrow "Contact"; H1 (`display-l`) "Let's start a *conversation*." ; lede "We believe investment starts with a conversation, not pressure. Reach out and let us understand your vision." (verbatim).
   Left (cols 1–5), a ledger with lucide icons: **Call** +91 97001 23900 (`tel:`) · **WhatsApp** +91 97001 23900 (`wa.me` with "Hi GIP, I'd like to talk about a plot.") · **Email** Gip@greaterinfraprojects.in (`mailto:`) · **Office** Flat No. 1314, 12th Floor, Vasavi MPM Grand, Metro Junction, Ameerpet, Hyderabad, Telangana 500016 — "Get directions ↗" (`https://www.google.com/maps/dir//Vasavi+MPM+Grand,+Metro+Junction,+Ameerpet,+Hyderabad,+Telangana+500016`, the real URL from the old site) · **Hours** Mon – Sat, 10:00 – 19:00 · **Response** **NEW** "We reply within one working day. Site visits are arranged on request."
   Right (cols 7–12): the enquiry form (§5.7), heading "Begin Your Journey" (old H2) — lede "Share your details and we'll arrange a personal consultation at your convenience." (verbatim).
2. **Map.** Eyebrow "Visit us"; `expanded-map.tsx` centred on 17.4373, 78.4487 (Ameerpet; the old site's embed `pb` string is fabricated and is not reused), 16:9, hairline, attribution, "Get directions" link as above. Caption: the address line.
3. No CTA band (the page is the CTA). Footer.

### 5.7 The enquiry form and its behaviour (no backend yet)

Used in three places: the Contact page (inline), the Enquire sheet (header / tray / rail), and project section 07. Fields (native inputs, underline-only, `eyebrow` labels above, 48 px tall, `--stone-200` underline → ink on focus, error in `--destructive`):

| Field | Type | Rules |
|---|---|---|
| Name | text | required, 2–60 chars |
| Phone | tel | required; fixed "+91" prefix chip; 10 digits starting 6–9; `inputmode="numeric"`, `autocomplete="tel-national"` |
| Email | email | optional |
| Interested in | select | Global City VI (preselected on its page) · Another GIP layout · General enquiry |
| Plot | hidden/readonly chip | present only when opened from a plot ("Plot 142 · 200 sq yd · East") |
| Message | textarea | optional, 500 chars |
| Consent | checkbox | **NEW** "You may contact me about this enquiry." required |

**Chosen behaviour: WhatsApp deep link with prefilled text.** On a valid submit the button becomes "Opening WhatsApp…", the page opens `https://wa.me/919700123900?text=` + URL-encoded:

```
Hi Greater Infra Projects,
Name: {name}
Phone: +91 {phone}
Interested in: {project}{, Plot 142 (200 sq yd, East, 40 ft road)}
{message}
— sent from greaterinfraprojects.in
```
and shows an inline success line: "If WhatsApp didn't open, call +91 97001 23900 or email us" with both as links; the same body is also offered as a `mailto:Gip@greaterinfraprojects.in?subject=Enquiry — Global City VI&body=…` link under the button for users without WhatsApp.

Why this and not the alternatives: WhatsApp is the channel plot buyers in Telangana already use with developers (Honer's own analysis calls it the dominant conversion path); it works in the GitHub Pages export with zero server; the message reaches a human on the client's real number immediately; and nothing is pretended — a stubbed "Thanks, we'll call you" with no backend would be a lie to a buyer, and `mailto` alone fails on most phones without a configured mail client. When Supabase lands, the submit also inserts a row (client-side insert under an RLS policy, per the catalog's note) and the WhatsApp handoff stays as the user-visible confirmation.

### 5.8 Footer (every page, navy-deep)

1. Row 1 (three columns at ≥ 1024): (a) `gip-lockup-white.svg` 224×100 — replaced by the logo animation once in view (§7.1) — then "Premium Open Plots & Real Estate Development in Hyderabad" (verbatim) in `body-s` sand, then the address block as `<address>`, phone, email, hours; (b) **Pages**: Home · Projects · About · Contact — Newsreader 300 at `h3` size, paper; (c) **Projects**: Global City VI · Delivered layouts (→ `/projects#delivered`) in the same style; under it Facebook and Instagram (the two real handles) as text links with lucide icons.
2. Hairline. Then the thank-you line in `body-s` sand: "Thank you for considering Greater Infra Projects for your real estate needs. We look forward to hearing from you and assisting you on your real estate journey." (verbatim) with **Get in touch** (brass).
3. Giant tagline: Newsreader 300 `clamp(2.5rem, 7vw, 6.5rem)`, paper with brass italics: "Plan with *purpose*. Build with *integrity*." (from the brand story's own phrase; two accents allowed here only, it is a signature).
4. Bottom line in `caption` sand: "© 2026 Greater Infra Projects" (build constant) · "Disclaimer" (dialog: **NEW** "Images marked 'Artist's impression' are indicative and not a representation of the final development. Plot availability is updated by Greater Infra Projects and is correct as of the date shown. TS RERA P01100009270 (Global City VI).") · "Admin" link is **not** shown.

### 5.9 404

Paper, centred (the one centred page). Roof mark `gip-roof-navy.svg` 96 px; H1 (`display-l`) **NEW** "This page isn't on our *layout*."; body "The address may have changed. Try one of these:"; three text links Home · Projects · Contact; behind, the plan-outline motif at 8 % opacity. `not-found.tsx` is a Server Component (Next injects `noindex`).

---

## 6. Imagery plan

### 6.1 The "Artist's impression" rule

Every kie render, wherever it appears (hero, spreads, stacked cards, diptych, CTA bands, OG image), carries a chip inside the image, bottom-right, 12 px from the edges: `eyebrow` text "ARTIST'S IMPRESSION" in navy-ink on `--brass-soft` at 92 % opacity, 2 px radius, 6×10 px padding. Its `alt` begins "Artist's impression of …". Real photographs carry a `caption` under the image (never inside) — "Site progress · March 2026", "Launch of Global City VI, Rudraram" — and `alt` text that describes what is in frame. The two never swap styles, so a reader learns the code on the first scroll. Add the disclaimer line in the footer dialog (§5.8).

### 6.2 Asset map

| Asset | Where | Treatment |
|---|---|---|
| `images/hero-aerial.webp` | Home hero plate (desktop), `opengraph-image.jpg` crop | AVIF/WebP srcset 960/1440/1920/2400 via the cheatsheet's `optimize-images.mjs` (the 438 KB WebP is too heavy for LCP; target ≤ 220 KB at 1920 AVIF). Chip. |
| `images/hero-aerial-mobile.webp` | Home hero plate (mobile) | 3:2 crop, `object-position: 50% 60%` until the portrait render exists. Chip. |
| `images/entrance-arch.webp` | Project hero plate; home/projects diptych (large half); stacked card 1 | Chip. View-transition pair. |
| `images/avenue-road.webp` | Stacked card 2; project §04 right column; About strengths alt | Chip. |
| `images/park-walk.webp` | Stacked card 3; project §04 right column | Chip. |
| `images/clubhouse-pool.webp` | Stacked card 4; Home/About closing CTA band | Chip. Swap the CTA slot for the weekend-villa render when generated. |
| `images/hills-dusk.webp` | Home brand-story panorama (21:9 full-bleed) | Chip; caption. Only use. |
| Weekend villa (pending) | Home/About CTA band right column | Chip. |
| Supabase `media.cover` (WhatsApp JPEG) | Diptych inset on Home and Projects | Caption "Site progress · March 2026". `remotePatterns` for `*.supabase.co`. |
| Supabase `media.gallery` ×14 | Project §03 masonry + lightbox | Captions by frame; honest alts. |
| `media.brochure` (23.7 MB), `media.masterPlan` (9.9 MB) | Download links only, size in the label | Never inline, never `react-pdf`. |
| `brand/gip-lockup-navy.svg` | Header | 134×60 |
| `brand/gip-lockup-white.svg` | Footer (static fallback), mobile sheet footer | 224×100 |
| `brand/gip-roof-navy.svg` | `app/icon.svg`, 404, header < 360 px | — |
| `illustrations/gip-logo-animation.gif` (white on transparent, 760×428) | Footer logo slot, plays once in view, holds the last frame; navy backgrounds only | Convert to WebM VP9 with alpha + the static white lockup as poster/fallback where alpha video is unsupported. Not a preloader (§7.1). |
| `illustrations/transparency.gif`, `quality-driven-planning.gif`, `trust-reliability.gif`, `timely-responsible-execution.gif` | Home Principles 1–4 | GIF → WebM/MP4 (cheatsheet §9), 1:1, 240 px, `mix-blend-mode: multiply` so the white background disappears on paper and the navy/light-blue/coral line-art stays. Plays once when 50 % in view, replays on hover/focus; poster = last frame. |
| `illustrations/integrity-transparency.gif`, `quality-craftsmanship.gif`, `customer-first-focus.gif` | About Values 1–3 | Same treatment. |
| `illustrations/strategic-land-investment-opportunities.gif` (transparent, black lines) | About Corporate strengths image | Same conversion, no blend needed. |
| `illustrations/timely-completion.gif` | Unused in Folio (its meaning — delivery — is covered by Timely & Responsible Execution). Keep in the folder for the admin's icon picker. | — |
| `illustrations/customization-options.gif` | Unused — no honest copy to pair it with (the old site mis-paired it with "Customer Care"). | — |
| Old site `about-us.png`, `gallery-land.png`, `gallery-events.png` | About Who-we-are (cropped frame), About Moments | AVIF ≤ 250 KB; ask for source frames. |
| Old site `teams/syed-imam.png`, `teams/syed-ismail-kashif.png` | About Leadership | 3:4 WebP ≤ 120 KB. |
| The plan outline (derived) | Home facts ledger background, 404 background | `<PlanOutline />` server component rendering `boundary` + `roads` from `gc6-masterplan.json` as a single inline SVG, stroke `--stone-300` 0.5 px, no fill, 1440 px wide, 12 % opacity. Replaces Honer's diagonal stripes with something only GIP owns. |

Everything else in the old `public/` (AI villas, Unsplash, stock faces, Webflow icons) is not carried over.

### 6.3 Extra kie.ai prompts (nano-banana-2, 2K) — two, one essential

1. **Essential — portrait hero for phones** (`hero-aerial-portrait`, aspect 4:5): "Golden-hour drone photograph, portrait orientation, of a gated plotted residential layout in rocky Telangana scrubland near Hyderabad: a compound wall, a white entrance arch with a navy beam at the bottom of frame, a 100-foot road in the foreground, straight 40-foot concrete internal roads with young avenue trees and street lights, open earth plots with white kerb markers, a small central park with a clubhouse and pool, low granite hills on the horizon, warm haze, no people, no text, photorealistic, 24 mm, slight tilt-down." Use: Home hero plate on mobile, project OG image for mobile share cards.
2. **Optional — the road frontage at dusk** (`frontage-dusk`, aspect 21:9): "Photorealistic dusk photograph along a 100-foot asphalt highway in Telangana, India; on the right a long white compound wall of a plotted layout with a lit entrance arch and street lights just switched on, avenue trees in tree guards, a few vehicles with headlights, low granite hills and an orange-to-navy sky, no people, no text, 35 mm." Use: project §05 Location band if the two-entry ledger needs an image; otherwise skip.

No third prompt. The remaining credits are better kept for a corrected render if the client objects to a detail.

---

## 7. Motion system

Principle: the page moves the way a reader turns a page — one thing at a time, with a settle. Defaults: `--ease-standard: cubic-bezier(0.2, 0, 0, 1)` for UI (admin), `--ease-reveal: cubic-bezier(0.22, 1, 0.36, 1)` for reveals, durations 200 ms (UI), 600 ms (reveal), 900 ms (plate). `<MotionConfig reducedMotion="user">` once around `{children}`; the admin's global `prefers-reduced-motion` CSS rule is copied.

### 7.1 Page load — no preloader

No gating preloader: it costs LCP and the old site's 2.5 s GIF on every load is the first thing to delete. The logo animation (`gip-logo-animation`) is reused where it belongs — on navy, once per visit: in the **footer logo slot** when the footer enters the viewport (WebM alpha, ~1 s, holds the last frame; static white lockup as poster and for browsers without alpha video; `sessionStorage` flag so it plays once per session, wrapped in try/catch). First paint on every route is the finished page; the hero plate reveals with a CSS-only `clip-path: inset(0 0 100% 0) → inset(0)` 900 ms + `scale 1.06 → 1` on the image (`@keyframes`, no JS, no `initial opacity 0` on text).

### 7.2 Navigation

- Header hide/show on scroll per §4.6 (rAF-throttled, from `navbar-morphing-scroll.tsx`'s listener; the capsule morph and blur are dropped).
- Mobile sheet: paper panel slides from the right 320 ms; links stagger 60 ms (y 12 px → 0); close reverses in 200 ms.
- Route change: React `ViewTransition` crossfade 200 ms; the header has `view-transition-name: site-header` with `animation: none`.
- Card → project: the diptych render and the project hero plate share `name="project-global-city-vi"`, `share="morph"`, `default="none"`, 400 ms (cheatsheet §11). Works only when the destination is prefetched — the project card uses `prefetch={true}`.

### 7.3 Scroll reveals

- What: section eyebrows + headings (Vertical Cut Reveal, per line, 700 ms, stagger 80 ms, H1/H2 only — `vertical-cut-reveal.tsx` keeps the full text `sr-only`); ledger rows and plates (opacity 0 → 1, y 16 → 0, 600 ms, stagger 60 ms, maximum six staggered items per group, the rest appear together); images in spreads (the plate reveal, at most three per page besides the hero).
- Trigger: `whileInView` once, `viewport={{ margin: "-10% 0px" }}`.
- Never on: body paragraphs, buttons, the facts ledger text (only its numerals count), anything above the fold.
- Hero scrub (§5.1): `useScroll` + `useTransform` on the section, transforms and clip-path only, desktop ≥ 1024, disabled under reduced motion and on touch devices (static layout).
- Stacked plates (Home item 4): `stacking-cards.tsx` — sticky + scale 1 → 0.94 for the card underneath; no opacity change.
- Master plan draw-in: §5.3 item 02.
- Timeline progress line (About): CSS `position: sticky` + a scaleY from `useScroll` — the milestone component's own logic.

### 7.4 Hover and focus micro-interactions (pointer: fine only; focus-visible always)

| Element | Hover / focus |
|---|---|
| Inline link | 1 px brass underline → 2 px, 150 ms; colour stays ink |
| Nav link | underline draws left → right 200 ms |
| Primary button | navy → navy-deep (brass → brass at L 0.58 on navy), 200 ms; no transform, no shadow |
| Secondary button | fill stone-100, 200 ms |
| Arrow links ("View project →") | arrow translates 4 px, 200 ms |
| Project spread / diptych | render scales 1.02 over 500 ms; hairline darkens to ink; nothing lifts |
| Gallery tile | scale 1.02, caption fades in 200 ms |
| Ledger row (when a link) | row background stone-50 |
| Plot (map) | stroke → ink 1.5 px + tooltip after 120 ms; selected = admin double ring |
| Illustration plate | the loop replays |
| Form field | underline → ink, label → ink, 150 ms |

### 7.5 Counters, marquee, cursor, smooth scroll

- **Counters**: Home facts, About stats, project availability figures, legend counts — count up over 1.2 s with ease-out once in view, `tabular-nums`, start from 0 only if the element was not in the initial viewport (otherwise render final immediately — no counting on the hero). **Ponytail**: implement with `motion`'s `animate()` + `useInView` in ~25 lines rather than installing `react-use-measure` for `count-up.tsx`.
- **Marquee**: one, Home item 9, diceui Marquee at 80 s linear, pause on hover, `role="marquee"`, static under reduced motion.
- **Cursor**: no custom cursor. Not negotiable — it is the fastest way to look like a template.
- **Smooth scroll (Lenis): no.** Next 16 no longer fights `scroll-behavior`; Lenis adds main-thread work on the low-end Android phones this audience uses, breaks native pinch/scroll inside the plan container and the masonry lightbox, and fights `position: sticky` timing in the spread grammar. The editorial pace comes from reveal timing and section rhythm, not from scroll smoothing. `html { scroll-behavior: smooth }` for hash links only, with `data-scroll-behavior="smooth"` on `<html>` (cheatsheet §0 #10). This overrides the catalog's pick #17.

### 7.6 Reduced motion

`prefers-reduced-motion: reduce` → hero static (plate at rest, type visible), no scrub, no stacked-card scaling (normal stack), no cut reveals (text visible), no plate reveals, counters show final values, marquee static, illustration loops show the poster frame, map draw-in skipped, view transitions 0 ms (cheatsheet CSS), hover scales off. Everything else — hairlines, colour, focus rings — unchanged.

### 7.7 What NOT to do

No preloader. No parallax on text. No scroll-jacking beyond the hero's 160 vh. No shimmer or gradient sweeps. No magnetic buttons (catalog #10 rejected: SaaS gesture). No tilt/spotlight cards (catalog #11 rejected: the plates must stay flat). No frosted glass. No floating particles or "pulsing dots". No autoplaying carousels or arrows. No bouncing scroll chevrons. No 10-second popup (the old site's `PopupContactForm` is deleted). No typewriter headlines. No hover-only information (every plot and card is reachable by tap and keyboard). No video without a poster; no video above the fold.

---

## 8. Component mapping

Saved components live in `C:\Users\purne\AppData\Local\Temp\claude\J--Jaggu-Projects-gip-platform\a4e3adf4-041d-4c96-8844-7f1972088045\scratchpad\21st\`. "Adapt" means retoken + swap `framer-motion` → `motion/react` + the notes in each file's header. Tokens from §2–§3 are ported into `globals.css` before any of this.

| Section | Build | Source |
|---|---|---|
| Header (desktop + mobile) | Adapt | `navbar-morphing-scroll.tsx` — keep only the rAF scroll listener and hide/show logic; drop the capsule, blur and `.msn-*` CSS. `header-3-mega-menu.tsx` — take `MenuToggleIcon` and the portal drawer (restyled to the paper sheet); the mega menu and radix `navigation-menu` are not needed for four links. |
| Project sub-nav | Hand-build | 40 lines: anchor list + IntersectionObserver. |
| Mobile CTA tray | Hand-build | 60 lines, `"use client"`, hero-visibility via IntersectionObserver. |
| Home hero (tipped-in plate, 2 beats) | Adapt | `hero-smooth-scroll-hero.tsx` — reuse its `useScroll` clip-path idea, replace `backgroundSize` with `<Image>` + `scale`, runway 160 vh, static below 1024. `hero-gallery-scroll-animation.tsx` is **not** used: five renders flying into a bento reads as a template, and the plate expansion is the editorial move. |
| Facts ledger + counters | Hand-build | ledger markup + the 25-line counter (§7.5). `count-up.tsx` is reference only. |
| Project spread / diptych | Hand-build | server component + `ViewTransition`. `tilt-spotlight.tsx` rejected (§7.7). |
| Stacked plates ("What a GIP layout includes") | Adapt | `stacking-cards.tsx` — retoken, image left / text right, chip overlay. |
| Principles / Values plates | Hand-build | `<LoopVideo>` from cheatsheet §9 + `mix-blend-mode: multiply`. `bento-grid-kokonutd.tsx` / `feature-bento-uilayout.tsx` rejected: bento grids are the opposite of a ledger. |
| Navy "Why buyers choose" ledger | Hand-build | — |
| Panorama + brand story | Hand-build | — |
| Testimonials (two voices) | Hand-build | two blockquotes. `reviews-carousel.tsx` rejected: two quotes do not need a carousel. |
| Delivered ticker | Adapt | `marquee-diceui.tsx` — keyframes into `@theme inline`, `useComposedRefs` inline. |
| Closing CTA band | Adapt (light) | `gradient-cta-banner.tsx` — keep the layout and the text-slide `ArrowButton`; remove the gradient blob entirely (flat navy), recolour to brass/paper. |
| Projects segmented control + district index | Hand-build | shadcn `toggle-group` (radix, installed) + a 30-line index. |
| Delivered ledger | Hand-build | semantic `<table>`. |
| Master plan (SVG, zoom, filters, sheet, tooltip) | Hand-build | the one real engineering task (§5.3 item 02); shadcn `sheet` + `tooltip`; admin `.tile` CSS copied for the legend. `image-comparison.tsx` deferred (§10). |
| Site progress gallery | Adapt | `masonry-lightbox.tsx` + prev/next/focus-trap from `gallery-grid-lightbox.tsx`; `next/image` with `remotePatterns`. |
| Amenities / approvals / highlights ledgers | Hand-build | — |
| Location map (project + contact) | Adapt | `expanded-map.tsx` — add attribution, keyboard toggle, directions link; `unoptimized` tiles. |
| FAQ | shadcn | `npx shadcn@latest add accordion` |
| Enquiry form (page, sheet, section 07) | Hand-build | native inputs with `eyebrow` labels; shadcn `sheet` for the overlay. `floating-label-input.tsx` rejected: floating labels are a product-UI trope and read worse at the `eyebrow` scale; static labels are calmer and more accessible. |
| Timeline (About) | Adapt | `timeline-milestone.tsx` — de-duplicate the double-rendered cards; years in Newsreader. `timeline-interactive.tsx` not used (no per-year photos). |
| Leadership, difference table, strengths | Hand-build | — |
| Footer | Adapt | `footer-with-suite.tsx` — server component, remove `select-none`, oversized wordmark slot becomes the serif tagline, logo slot hosts the alpha-video animation. |
| 404 | Hand-build | — |
| Headline reveals | Adapt | `vertical-cut-reveal.tsx` (rename `DynamicAnimationOptions` → `Transition`). |
| Plan outline motif | Hand-build | `<PlanOutline />` server component, 20 lines. |
| View transitions | React | `ViewTransition` from `react` (19.3). |
| Smooth scroll | None | Lenis rejected (§7.5). |
| Preloader | None | §7.1. |
| Magnetic button | None | rejected (§7.7). |

**Install summary** (no new npm packages beyond what is in `package.json`; `motion` 14 is already installed):

```
npx shadcn@latest add accordion dialog sheet tooltip toggle-group badge
```
Not installed: `lenis`, `react-use-measure`, `framer-motion`, `gsap`, any map library, `react-pdf`. `schema-dts` is optional as a dev dependency for typed JSON-LD. Verify `cn` (the npm package in `src/lib/utils.ts`) merges conflicting Tailwind classes; if not, swap to `clsx` + `tailwind-merge` before adapting any 21st component (catalog ground rule 2).

`globals.css` additions: the token set (§3.1) replacing the shadcn defaults, `--font-display`, the marquee keyframes, the admin `.tile`/`pattern-*` block, `@utility font-condensed { font-variation-settings: "wdth" 80 }`, `@utility chip-impression`, the view-transition rules, the reduced-motion rule, `scroll-padding-top`, `font-synthesis: none`.

---

## 9. SEO and performance

### 9.1 Metadata per route (`title.template: "%s · Greater Infra Projects"`, `metadataBase` = `https://www.greaterinfraprojects.in`, `lang="en-IN"`, `openGraph.locale: "en_IN"`, preview build `noindex`)

| Route | `<title>` (final string) | Description | Canonical |
|---|---|---|---|
| `/` | "Greater Infra Projects — HMDA & RERA approved plots in Hyderabad" (`title.default`, absolute) | "Greater Infra Projects develops HMDA, DTCP and RERA approved open plots and villa plots across Hyderabad — 11+ years, 20+ projects, 600+ acres, 6000+ customers." | `/` |
| `/projects` | "Projects — plotted layouts across Hyderabad · Greater Infra Projects" | "One ongoing layout and sixteen delivered projects across Sangareddy, Medchal, Yadadri and Rangareddy districts." | `/projects` |
| `/projects/global-city-vi` | "Global City VI — HMDA approved plots at Rudraram, Sangareddy · Greater Infra Projects" | "288 open and villa plots on 21 acres 10 guntas at Rudraram / Shankarapally. HMDA LP 2046/HMDA/SWFL/2026, TS RERA P01100009270. Live plot availability, master plan and site photos." | `/projects/global-city-vi` |
| `/about` | "About — 11+ years of approved plotted development · Greater Infra Projects" | "Founded 2014 in Hyderabad. Transparency, quality-driven planning, trust and timely execution. Leadership: Syed Imam and Syed Ismail Kashif." | `/about` |
| `/contact` | "Contact — Ameerpet, Hyderabad · Greater Infra Projects" | "Call +91 97001 23900, WhatsApp, or visit Vasavi MPM Grand, Metro Junction, Ameerpet. Mon–Sat 10:00–19:00." | `/contact` |

OG images: `app/opengraph-image.jpg` (1200×630 crop of `hero-aerial`, chip included) + `opengraph-image.alt.txt`; `app/projects/[slug]/opengraph-image.tsx` generated at build (cheatsheet §4.3) with Archivo 600 and the facts line. `twitter.card: summary_large_image`. Icons: `app/icon.svg` = roof mark, `apple-icon.png` 180², `favicon.ico`. `sitemap.ts`, `robots.ts`, `manifest.ts` per the cheatsheet, no `/gallery` entry, `images:` on the project entry.

### 9.2 JSON-LD

| Route | Nodes |
|---|---|
| root layout | `Organization` with `@id`, `alternateName: "GIP"`, `foundingDate: "2014"`, `logo`, `telephone`, `email`, `address` (full Ameerpet postal address), `geo` 17.4373 / 78.4487, `openingHoursSpecification` Mo–Sa 10:00–19:00, `contactPoint` (sales, en/te), `sameAs` (Facebook, Instagram). Additionally typed `["Organization","RealEstateAgent"]` — the closest LocalBusiness subtype Google recognises; no `WebSite` SearchAction (there is no search). |
| `/projects/global-city-vi` | `BreadcrumbList`; `RealEstateListing` (`name`, `url`, `description`, `datePosted: publishing.publishedAt`, `image`, `offers` with `availability: InStock` and no price while `showPrice` is false); `Place` (`geo` from `location.pin`, `address`, `additionalProperty` for Extent, Plots, Approval, RERA). |
| `/about` | `AboutPage` + two `Person` nodes (`name`, `jobTitle`, `worksFor @id`). |
| `/contact` | `ContactPage`. |
| `/projects` | `CollectionPage` + `ItemList` of one `RealEstateListing` reference. |
No `FAQPage` (Google no longer shows FAQ rich results for commercial sites; the accordion is for readers). All via the `JsonLd` helper with `<` escaping; validated with the Rich Results Test before launch.

### 9.3 Headings outline (one H1 per page)

- Home: H1 "Land with its papers in order." → H2 Facts (visually hidden "Greater Infra Projects at a glance") · H2 "Global City VI" · H2 "What a GIP layout includes" · H2 "Built on principle." · H2 "Why buyers choose Greater Infra" · H2 "Build with integrity. Plan with purpose." · H2 "Two voices" · H2 (visually hidden) "Delivered layouts" · H2 "Let's start a conversation."; H3 for principle titles and the four promise rows.
- Projects: H1 → H2 "Ongoing" (visually hidden, the spread's H3 is the project name) · H2 "Twenty projects, sixteen handed over."
- Project: H1 "Global City VI" → H2 per folio section (Overview, Master plan, Site progress, Amenities, Location, Approvals, FAQ, Enquire); H3 for approval titles, plot sheet title, FAQ questions.
- About: H1 → H2 per section (Purpose-Driven Development, Timeline, Our Mission, Our Vision, Our Values, How we work, GIP vs Typical Plot Sellers, Leadership, Moments); H3 names.
- Contact: H1 → H2 "Begin Your Journey", H2 "Visit us".
- 404: H1 only.

### 9.4 Images and LCP

| Route | LCP element | Handling |
|---|---|---|
| `/` desktop | hero plate `hero-aerial` | `<Picture>` AVIF/WebP srcset (cheatsheet §8.3) so the GitHub Pages export is as good as the Node host; `fetchPriority="high"`, `loading="eager"`, `decoding="async"`; `sizes="(min-width:1024px) 58vw, 100vw"`; the CSS plate reveal starts from a visible frame (no opacity 0) so LCP is painted at first frame. Target ≤ 220 KB at 1920 AVIF. |
| `/` mobile | hero plate `hero-aerial-mobile` (105 KB, or the portrait render) | same |
| `/projects` | diptych render `entrance-arch` | eager, `sizes="(min-width:1024px) 58vw, 100vw"` |
| `/projects/global-city-vi` | hero plate `entrance-arch` | eager; the SVG plan is below the fold and client-rendered after hydration with a stone-50 placeholder of the final aspect ratio (no CLS). The 64 KB JSON ships as a prop only to the plan component. |
| `/about`, `/contact`, 404 | the H1 text | no hero image; fonts preloaded so the serif H1 paints in the first frame |

All other images: `loading="lazy"`, explicit `width`/`height` or `aspect-ratio`, `sizes` on every responsive image, AVIF first. Supabase photos through `next/image` with `remotePatterns` (unoptimised in the export: they are already 100–120 KB 1280×720, acceptable). GIFs never shipped as GIF (§6.2). Brochure/layout PDFs are links, never embedded.

### 9.5 Fonts

`next/font/google`, self-hosted, `display: "swap"`, both families preloaded by the root layout (two Newsreader files — upright and italic — and one Archivo; ≈ 300 KB total, latin + latin-ext subsets only). `adjustFontFallback` default for Archivo; `"Times New Roman"` metric fallback for Newsreader so the balance of the H1 does not jump. `font-synthesis: none`. No `<link>` to Google Fonts; no third font.

### 9.6 Budget and hygiene

Every route `○ (Static)` in `next build`; zero `"use cache"` (export compatibility, cheatsheet §0 #3). Client bundles only for: header, tray, hero scrub, stacked plates, counters, marquee, plan, lightbox, map, form, cut-reveal. One analytics tag at most, loaded `lazyOnload` in a client effect, none in the preview build. Lighthouse mobile targets: Performance ≥ 90, LCP ≤ 2.5 s on simulated 4G, CLS 0, no console errors — the cheap, visible places to beat Honer (177 requests, two jQueries, 4K video without poster).

---

## 10. Risks and open questions

1. **Two HMDA references in the data.** `vision.features[2]` says "Approval No. 007133/LO/HMDA/1700/SKP/2024"; `legal.approvals[0]` says Final Layout Permit "2046/HMDA/SWFL/2026" dated 23 Apr 2026. Probably the 2024 layout-open (LO) permission and the 2026 final permit. Render both as the data gives them (Overview ledger vs Approvals band) and ask the client which is the headline number; the facts strip currently shows the final permit.
2. **Extent mismatch.** `description` says "22-acre"; `landArea` is 21 acres 10 guntas; `landUse.net` is 99,765 sq yd ≈ 20.6 acres. The ledger uses `landArea`; the prose keeps its own words. Client to confirm.
3. **Plot-size strings.** `masterPlan.stats[0]` "150 – 400 and 700" and the old `totalPlots` "200 to 400 and 730" disagree with the plan (147–731 sq yd, 143 plots at 200). The page shows the computed range; the stat string should be corrected in the admin seed.
4. **Sample statuses on a public page.** Registered (9) and Mortgaged (38) are `sample: true`. The "sample data" note (§5.3) is the honest mitigation for the demo; before launch the client must set real statuses or the plan shows only Available / Sold Out.
5. **Price.** `showPrice: false`; ₹28,000 / sq yd exists in data but the old site hid it. Folio shows no price and asks in the enquiry. Confirm with the client whether "From ₹28,000 / sq yd" may appear (one flag flip).
6. **Testimonials.** Only Rakesh Kota and Ravi Kiran read as real; the section ships only after the client confirms names and consent. The site has no social-proof section otherwise — acceptable in this direction, since the approvals are the proof.
7. **Completed-project districts and years.** The sixteen names/locations are from the old data; district attribution for the index and the timeline years are inferred and must be confirmed. Until then the index can list locations only and the timeline is hidden.
8. **Location distances.** Two "Nearby" entries is thin for a plot buyer. Ask for real distances (ORR exit, Patancheru, BHEL, Isnapur, airport, GITAM, Mumbai Highway junction). Nothing is invented meanwhile.
9. **Team photos.** Six real people with placeholder names stay unpublished; Kashif's photo needs a portrait crop; both leadership images need re-encoding.
10. **Hero mobile asset is landscape.** `hero-aerial-mobile.webp` is 1080×603; the 3:2 crop works, the 4:5 portrait render (§6.3) is better. 70 credits ≈ 5 images; the plan uses at most two.
11. **Newsreader at 300 on low-DPI Android.** Chosen over 200 for this reason; verify on a real sub-₹15k phone at 44 px before sign-off. Fallback is weight 350 (variable, free).
12. **GIF → video with `mix-blend-mode: multiply`.** Works in current Chrome/Safari/Firefox on `<video>`; on a browser that ignores blend on video the white square shows — acceptable degradation (a white plate on paper). Alpha WebM for the logo animation falls back to the static lockup on Safari < 17.
13. **Master-plan touch targets.** 288 polygons cannot all be 44 px on a phone; zoom 2×/3× plus "Find plot" and the filtered list are the mitigation, and the WCAG target-size criterion is satisfied by the alternative path. Test with a real thumb.
14. **View Transitions** need Chromium 125+ / recent Safari and a prefetched destination; elsewhere it is a plain navigation. No fallback work required.
15. **Static export limits**: no redirect for `/gallery`, `out/404.html` only honoured at the Pages root (the preview lives at `/gip-platform/site/`), Supabase images unoptimised. All disappear on the Node host.
16. **Brochure (23.7 MB) and layout (9.9 MB) PDFs** are served from the old Supabase bucket whose anon key is unavailable; the public object URLs work today but the client should move the files into the new project's storage before launch.
17. **Honer comparison risk**: Folio is quieter than Honer. If the client expects the navy menu overlay, coral pills and a video hero, this direction will read as "less". The answer is the plan, the ledger and the diptych — things Honer cannot do — shown first in the demo.
18. **`cn` package vs `clsx` + `tailwind-merge`** (catalog ground rule 2) must be settled before any 21st component is adapted, or every `className` override will silently fail.
