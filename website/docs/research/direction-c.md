# Direction C — "Precise Modern"

Swiss-grid clarity for a plot developer: one typeface (Archivo, width axis), white surfaces, hairline borders, GIP navy as the only strong colour, and the real numbers doing the talking. The site reads like a well-set survey document: exact, calm, verifiable. The surprise is not decoration, it is that a Hyderabad plot developer's website shows live plot availability on a real master plan.

Status: buildable direction. Every section names the copy, the asset, the token and the component. Where copy is rewritten it is marked **[new copy]**. Where a fact needs the client it is listed in §10.

Sources: `docs/research/content-inventory.md`, `components-catalog.md`, `next16-cheatsheet.md`, `honer-analysis.md`; data in `src/lib/constants.ts`, `src/lib/data/global-city-vi.ts`, `src/lib/data/units.ts`, `src/lib/data/gc6-masterplan.json`; tokens in `../admin/src/app/globals.css`.

---

## 0. Decisions a developer needs on day one

| Topic | Decision |
|---|---|
| Typeface | Archivo only (Google, variable `wght` 100–900 + `wdth` 62–125), loaded once with `next/font/google` exactly as admin does. No serif, no mono. |
| Colour | Port admin tokens verbatim. Add six public-site tokens (§3). Accent = **signal blue** `oklch(0.56 0.16 251)` (= admin `--ring`). Status colours = admin's, untouched. |
| Radius | `--radius: 0.375rem` (6 px) everywhere: buttons, cards, images, inputs. No pills. |
| Depth | Hairline `1px var(--border)`; no card shadows; the admin `--shadow-overlay` only on dialog/sheet/popover/tooltip. No frosted glass. |
| Container | 1280 px content, 12 columns, 24 px gutter; page gutters 20 / 32 / 48 px. |
| Rhythm | Sections 64 px (mobile) / 112 px (≥1024). Secondary 48 / 80. |
| Motion | `motion` (installed). No Lenis, no GSAP, no preloader, no custom cursor, no marquee. CSS does hover; `motion` does reveals, count-ups and the plot panel. |
| Hardcoded project | Global City VI only, read through `getProjects()/getProject()/getUnits()/getPlan()` in `src/lib/projects.ts`. Nothing else in the Projects listing is a project. |
| Forms | No backend yet: the enquiry form composes a WhatsApp deep link (`wa.me/919700123900?text=…`) and shows a success state; `mailto:` is the secondary action. Works on the static-export build. |
| Dark surfaces | Light theme only. Exactly three navy surfaces: the footer (which contains the closing CTA), the project page "Approvals & documents" band, and the mobile action tray. |
| Phone | `+91 97001 23900` / `919700123900` from `COMPANY` in constants. The old `+91 98765 43210` never appears. |

---

## 1. Concept and the emotional promise

### Concept

A plot is bought on facts: who approved the layout, which survey numbers, what size, which road, is plot 142 still free, how far is the highway. Honer sells a feeling with giant serif type; GIP should sell certainty with exact type. Direction C treats the website as a precisely set document: a strict 12-column grid you can almost see, numerals set large and condensed like a surveyor's figures, hairlines instead of shadows, white paper instead of gradients, and GIP navy used the way a rubber stamp is used — rarely and with authority.

The one thing a visitor remembers: the Global City VI master plan on screen, 288 real plots, coloured by today's status, with "Status as of 6 Oct 2026" under it. No competitor in the Hyderabad plot market shows that.

### Emotional promise for the Hyderabad plot buyer

Most visits are on a phone, often from a WhatsApp link, often while comparing three developers. The buyer is anxious about documentation (HMDA/DTCP/RERA, survey numbers, link documents), wants to see the layout and whether a plot facing east on a 40 ft road is still available, and wants to talk to a human quickly — call or WhatsApp, not a form.

The promise, in the buyer's words: *"They show me everything before I ask, the numbers are exact, and I can reach them in one tap."*

How the design keeps that promise:

- Facts before adjectives. The home hero leads with four numerals and the live availability of the ongoing project, not a slogan over a render.
- Every approval has a reference number and a date on the page, set in the same condensed numerals as the plot numbers.
- Call and WhatsApp are always one tap away on mobile (fixed bottom tray) and visible in the desktop header.
- Artist's impressions are labelled "Artist's impression"; real site photos are labelled with the project and month. The buyer never has to guess which is which.
- Nothing moves unless it carries information (a number counting to its value, a plot lighting up under the finger).

---

## 2. Typography

### Family

**Archivo** (Google Fonts), the family admin already uses. One family, two axes, zero extra font cost. Loaded in `src/app/layout.tsx` exactly as admin:

```ts
import { Archivo } from 'next/font/google';
const archivo = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-sans', display: 'swap' });
```

`latin-ext` carries `₹` (U+20B9). Map it in `globals.css` `@theme inline` as `--font-sans` and `--font-heading` (same variable), and add two width utilities beside admin's `font-condensed`:

```css
@utility font-condensed { font-variation-settings: "wdth" 75; }   /* numerals, plot numbers, prices */
@utility font-wide      { font-variation-settings: "wdth" 112; }  /* eyebrows and labels */
@utility tabular        { font-variant-numeric: tabular-nums lining-nums; }
```

Three voices from one file:

| Voice | Width | Weight | Used for |
|---|---|---|---|
| Display | `wdth` 100 | 500 | H1–H3. Normal width, medium weight, negative tracking. Calm, not shouty. |
| Numeral | `wdth` 75 | 600 | Stats, plot numbers, prices, reference numbers, the 404 code. Condensed so big figures stay narrow and columnar. Always `tabular`. |
| Label | `wdth` 112 | 500 | Eyebrows, table headers, legend labels, nav links on mobile. Uppercase, tracked. |

Body is `wdth` 100 / 400. Bold in running text is 600, never 700.

### Scale

Root 16 px. `clamp()` values are what to ship; the px pairs are the design intent at 390 and 1440.

| Token | Mobile (390) | Desktop (1440) | CSS | Tracking | Weight | Notes |
|---|---|---|---|---|---|---|
| `display` | 40/44 | 72/74 | `clamp(2.5rem, 1.6rem + 3.9vw, 4.5rem)`, lh 1.03 | -0.03em | 500 | Home H1 only. `text-wrap: balance`. Max 2 lines; max 14 words. |
| `h1` | 34/38 | 56/60 | `clamp(2.125rem, 1.5rem + 2.6vw, 3.5rem)`, lh 1.07 | -0.025em | 500 | Inner-page H1 (Projects, Global City VI, About, Contact, Gallery). |
| `h2` | 28/32 | 40/44 | `clamp(1.75rem, 1.35rem + 1.6vw, 2.5rem)`, lh 1.1 | -0.02em | 500 | Section headings. |
| `h3` | 22/28 | 28/34 | `clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)`, lh 1.2 | -0.015em | 500 | Card and sub-section headings. |
| `h4` | 18/26 | 20/28 | `1.125rem → 1.25rem`, lh 1.4 | -0.01em | 600 | Facts-card labels, FAQ questions. |
| `h5` | 16/24 | 16/24 | `1rem` | 0 | 600 | Small headings inside panels. |
| `h6` / `label` | 12/16 | 12/16 | `0.75rem`, uppercase, `font-wide` | 0.08em | 500 | Eyebrows, table headers, legend. Colour `fg-2`. |
| `body-lg` | 18/28 | 18/28 | `1.125rem`, lh 1.55 | 0 | 400 | Ledes under H1/H2. Max 60ch. |
| `body` | 16/26 | 16/26 | `1rem`, lh 1.625 | 0 | 400 | Running text. Max 64ch. |
| `body-sm` | 14/20 | 14/20 | `0.875rem`, lh 1.45 | 0 | 400 | Info strips, captions on cards, form help. |
| `caption` | 12/16 | 12/16 | `0.75rem` | 0.01em | 400 | "Artist's impression", "Status as of", footer legal. |
| `num-xl` | 56/56 | 112/104 | `clamp(3.5rem, 1.4rem + 8vw, 7rem)`, lh 0.93 | -0.02em | 600 `font-condensed tabular` | Home stats band (11+, 20+, 600+, 6000+), 404 code. |
| `num-lg` | 36/40 | 48/52 | `clamp(2.25rem, 1.8rem + 1.6vw, 3rem)` | -0.015em | 600 `font-condensed tabular` | Hero fact strip, project facts card, availability count. |
| `num-md` | 20/24 | 22/26 | `1.25rem → 1.375rem` | -0.01em | 600 `font-condensed tabular` | Info strips, legend counts, plot panel values. |
| `ref` | 14/20 | 14/20 | `0.875rem` `font-condensed tabular` | 0.02em | 500 | Reference numbers (`P01100009270`, `2046/HMDA/SWFL/2026`), survey numbers. |

Rules:

- `text-wrap: balance` on h1–h3 (admin already has it); `text-wrap: pretty` on `p`.
- Headings never exceed 14 words. Ledes never exceed 2 sentences.
- The two-tone headline (borrowed from Honer, made Swiss): one phrase in a heading, never more than 3 words, set in `accent` colour at the same weight (no italic). Used only on H1s and the closing CTA. Example: "Approved plots in Hyderabad's **growth corridors**."
- Numbers in running text are plain body. Numbers that are the point (stats, counts, prices, plot numbers) are `num-*`, condensed, tabular, with the unit in `label` style beside or below them.
- The "+" on stats is set at 60% size, superscript, `fg-2`.
- `₹` is always followed by the figure with no space (`formatINR` already does this).
- Minimum 16 px for anything a user reads on mobile; 14 px only for captions and strips; 12 px only for uppercase labels.

---

## 3. Colour

Port `admin/src/app/globals.css` `:root` and `@theme inline` verbatim into `website/src/app/globals.css` first (the website still has the neutral shadcn defaults), delete the `.dark` block (light only), then add the six website tokens below. Hex values are the sRGB equivalents for the client deck; CSS uses the oklch.

### Background tiers

| Token | oklch | hex | Use |
|---|---|---|---|
| `--background` (bg-0) | `1 0 0` | #ffffff | Page canvas. Most sections. |
| `--surface-1` (bg-1) | `0.978 0.004 252` | #f6f8fa | Alternating section tint (stats band, facts cards, table header rows). Same value as admin `--sidebar`. |
| `--surface-2` (bg-2 "sand") | `0.972 0.012 80` | #faf5ed | One warm tier for one section per page at most (home Values band, About story band). Deccan soil, barely. Never behind a photo. |
| `--navy` (`--brand`) | `0.34 0.096 251` | #033967 | Footer, approvals band, mobile tray, primary button. |
| `--navy-deep` | `0.26 0.08 252` | #002449 | Footer bottom strip; primary button hover. |
| `--navy-tint` | `0.952 0.013 252` | #e9f0f8 | Selected state of filter chips; project sub-nav active chip. Same value as admin `--accent`. |

### Foreground tiers

| Token | oklch | hex | Use |
|---|---|---|---|
| `--foreground` (fg-0) | `0.215 0.022 256` | #131a24 | Headings, body. 15.8:1 on white. |
| `--foreground-2` (fg-1) | `0.36 0.022 256` | #363e49 | Body on tinted surfaces, table cells. |
| `--muted-foreground` (fg-2) | `0.505 0.022 256` | #5d6571 | Labels, captions, placeholders. 5.9:1 on white. |
| `--primary-foreground` | `0.985 0.003 250` | #f9fafc | Text on navy. |

### Brand navy usage

Navy is a fill on four things only: the primary button, the footer, the approvals band, the mobile action tray. As text it is the link colour on navy-tinted chips and the colour of the roof mark. It is never a gradient, never at 90% opacity over a photo (use the `--scrim` token below), never a heading colour on white (headings are `fg-0`; navy headings on white look like the old site).

### The one accent: signal blue

| Token | oklch | hex |
|---|---|---|
| `--accent-signal` | `0.56 0.16 251` | #0876ce |
| `--accent-signal-hover` | `0.48 0.15 251` | #005eae |
| `--accent-signal-soft` | `0.94 0.03 251` | #ddedff |

Same hue as navy, lifted. 4.6:1 on white, so it is legal as text. Rules:

- Text links in body copy and the "View project →" style links: `accent-signal`, underline `1px` offset 3px, hover `accent-signal-hover` with the underline thickening to 2px.
- The two-tone phrase in H1s and the closing CTA heading.
- The live indicator dot (availability "as of") and the reading-progress hairline under the header.
- Active nav link underline (2 px), active anchor chip text on the project sub-nav.
- Focus ring (`--ring`, same value) — 2 px, offset 2 px, everywhere.
- Hovered/keyboard-focused plot outline on the master plan (2 px stroke) and the selected plot's panel header rule.
- Never a button fill (buttons are navy or outline), never a background larger than a chip, never an icon colour in bulk (icons are `fg-1`).

Why not a warm accent: the four plot-status hues (teal 180, red 27, amber 70, indigo 264) already occupy the warm and cool extremes; any coral/ochre accent collides with Sold Out or Mortgaged on the page that matters most. The warm note comes from `surface-2` and the golden-hour photography instead.

### Borders, overlays, scrims

| Token | Value | Use |
|---|---|---|
| `--border` | `oklch(0.912 0.007 255)` #dfe2e7 | Every hairline: cards, table rules, section dividers, input rest state. |
| `--border-strong` (`--input`) | `oklch(0.865 0.01 255)` #ced3d9 | Input hover, card hover, the survey-grid lines in the hero. |
| `--scrim` | `oklch(0.2 0.05 252 / 0.55)` | Only overlay allowed on photos (caption bars, the mobile hero). Linear bottom-up, never full cover. |
| `--overlay` | `oklch(0 0 0 / 0.4)` | Dialog/sheet backdrop (admin value). No blur. |
| `--shadow-overlay` | admin value | Dialog, sheet, popover, tooltip, plot tooltip. Nothing else. |

### Status colours (plots) — copied from admin, not redefined

| Status | base | fg (text/dot on white) | soft (badge bg) | on (text on base) |
|---|---|---|---|---|
| Available | `oklch(0.8 0.12 180)` #52d7c1 | `oklch(0.48 0.09 180)` #006e5f | `oklch(0.955 0.035 180)` #d8f8f1 | `oklch(0.27 0.05 180)` #002e27 |
| Sold Out | `oklch(0.55 0.19 27)` #c9302d | `oklch(0.52 0.19 27)` #be2323 | `oklch(0.955 0.025 27)` #ffeae7 | white |
| Mortgaged | `oklch(0.8 0.15 70)` #faab3f | `oklch(0.52 0.12 60)` #9a5505 | `oklch(0.96 0.045 75)` #ffeed1 | `oklch(0.3 0.07 55)` #482304 |
| Registered | `oklch(0.45 0.15 264)` #284ea7 | same | `oklch(0.955 0.025 264)` #e8f0ff | white |

Order everywhere is the client's: Available, Sold Out, Mortgaged, Registered. Copy admin's `.tile[data-s]` rules and the `pattern-*` utilities too: the master plan uses the same fills **and** the same non-colour patterns (sold hatch, mortgaged dots, registered folded corner) so colour-blind buyers read it. On the public map Available is the soft fill with the `-fg` edge, exactly as admin's grid, so the sold statuses dominate visually and the map does not look like a teal poster.

Semantic: `--destructive` and `--warning` stay admin's (form errors, "pending" approvals).

---

## 4. Layout

### Grid

- Content container `max-width: 1280px`, centred; `--gutter: 20px` (<640), `32px` (640–1023), `48px` (≥1024).
- 12 columns, `gap: 16px` (<1024) / `24px` (≥1024). Use CSS grid directly (`grid-cols-12`), not nested containers.
- Wide media (hero image, aerial bands, master plan on desktop) may extend to `max-width: 1440px` with the same gutters; text never does.
- Reading measure: ledes 60ch, body 64ch. On desktop, body copy sits in columns 1–7 or 6–12, never full width.

### Vertical rhythm

| | Mobile | ≥1024 |
|---|---|---|
| Section padding (block) | 64 px | 112 px |
| Secondary section / inside a band | 48 px | 80 px |
| Heading group → content | 32 px | 48 px |
| Eyebrow → heading | 12 px | 16 px |
| Heading → lede | 16 px | 20 px |
| Card padding | 20 px | 24 px |
| Facts card cell padding | 16 px | 20 px |

Sections are separated by either a change of surface (`bg-0` → `surface-1`) or a full-width 1 px `--border` rule, never both, never neither.

### Radius, borders, shadows

- `--radius: 0.375rem` (6 px) on buttons, inputs, cards, image frames, chips. The legend swatches and plot tiles use 2 px (admin). Avatars (the two leaders) are 6 px, not circles.
- One border weight: 1 px. Card hover: border → `--border-strong`. Nothing lifts.
- Shadows only on floating layers (admin rule). Tooltips get `--shadow-overlay`.

### Image frames and aspect ratios

| Where | Ratio | Notes |
|---|---|---|
| Home hero image | 16:9 desktop; 4:5 mobile once the portrait render exists, 16:9 until then | `hero-aerial.webp` (2400×1340) / `hero-aerial-mobile.webp` (1080×603, landscape — it is a smaller 16:9, not a portrait crop) / `hero-aerial-portrait` (§6, 4:5). |
| Project cover (listing card, project hero) | 3:2 | `object-cover`, focal centre. |
| Gallery tiles | native, masonry | Real photos keep their ratio; lightbox shows full image. |
| Amenity/vision tiles | 4:3 | |
| Wide bands (avenue road, hills) | 21:9 desktop, 16:9 mobile | Scrim only if text sits on them. |
| Leader portraits | 4:5 | `syed-ismail-kashif.png` needs a portrait crop. |
| Master plan SVG | viewBox 375.75 × 559.95 (portrait, ≈ 2:3) | From `extent`; see §5.3. |
| OG image | 1200 × 630 | Generated with `opengraph-image.tsx`. |

Every image sits inside a frame with the 6 px radius and a 1 px `--border` (the hairline stops the pale sky of the aerials bleeding into the white page). Caption bar below the frame, not over the image: `caption` size, `fg-2`, e.g. "Global City VI, Rudraram — site photo, March 2026" or "Artist's impression".

### How "premium" is achieved here

1. Alignment you can feel: every text block, numeral and image edge sits on the 12-column grid. The hero's survey-grid motif (faint 1 px `--border-strong` vertical lines at the column boundaries, visible only in the hero and the stats band) makes the grid literal and ties the brand to surveying.
2. Scale contrast: 112 px condensed numerals next to 12 px tracked labels. Nothing in between competes.
3. Air: 112 px sections and 48 px between heading and content. Resist filling.
4. One colour story: white, navy, hairline grey, one blue. The photos carry all the warmth.
5. Exactness: tabular numerals, reference numbers set in `ref`, dates in `14 Oct 2026` format (`formatDate`), units set as labels.

---

## 5. Page-by-page plan

Routes: `/`, `/projects`, `/projects/[slug]` (only `global-city-vi` today), `/about`, `/gallery`, `/contact`, `not-found`. Old `/properties` and `/property/:slug` URLs: on the Node build add `redirects()` to `/projects` and `/projects/global-city-vi`; on the static export add tiny client-side redirect pages (`<meta http-equiv="refresh">`) at `/properties/` and `/property/GLOBAL CITY VI/` is not representable, so only `/properties` is covered there.

### 5.0 Global shell

#### Header (desktop ≥1024)

- Height 72 px, white, bottom 1 px `--border`, `position: sticky; top: 0`. No transparency over the hero (the hero is on white anyway).
- Left: `public/brand/gip-lockup-navy.svg` at 32 px tall, links to `/`, `alt="Greater Infra Projects"`.
- Centre-left (after a 48 px gap): nav links `Projects`, `About`, `Gallery`, `Contact` — `body` 16/500, `fg-1`, hover `fg-0` with a 2 px underline growing from the left (200 ms); active page keeps the underline in `accent-signal`.
- Right: `+91 97001 23900` as a `tel:` link in `num-md` (condensed tabular, `fg-0`) with a 16 px `Phone` icon, then the primary button `Enquire` (navy, 40 px tall, 6 px radius) → `/contact`.
- On scroll > 8 px: height compacts to 56 px (`transition: height 250ms var(--ease-standard)`), lockup scales to 26 px, and a 2 px reading-progress hairline in `accent-signal` runs along the bottom border on article-length pages (project, about). This is the Morphing Scroll Navbar behaviour with the capsule/float removed: it compacts, it does not detach.
- Mega-menu: none. One ongoing project does not need one; add Projects dropdown when the backend ships ≥3.

#### Header (mobile <1024)

- Height 56 px; lockup 24 px tall; right: a 40×40 `Phone` icon button (`tel:`) and the hamburger (`MenuToggleIcon` from `header-3-mega-menu.tsx`, morphs to ×).
- Drawer: full-screen white panel sliding from the right (280 ms), body scroll locked, links at `h2` size (28/32, `font-wide` not used here — normal width, weight 500), stagger 40 ms; bottom: two full-width buttons `Call +91 97001 23900` (outline) and `WhatsApp` (navy, `MessageCircle` icon), then Facebook/Instagram as text links. Closing with Esc, the × button, or a route change.
- Mobile action tray (all pages except `/contact`): fixed bottom, 56 px + safe-area inset, navy, three equal cells: `Call` (`Phone`), `WhatsApp` (`MessageCircle`), `Enquire` (`Send` → `/contact`, or on a project page scrolls to `#enquire`). Text 14/500 `primary-foreground`; separators 1 px `oklch(1 0 0 / 0.12)`. Appears after the user scrolls 1 viewport (`translateY(100%) → 0`, 250 ms) so it does not cover the hero CTA; hidden while the drawer or a sheet is open. `html { scroll-padding-bottom: 72px }` on mobile so anchors are not hidden by it.

#### Footer (all pages; the closing CTA lives here)

Navy, `primary-foreground` text, 1 px `oklch(1 0 0 / 0.12)` rules.

1. CTA row (padding 80/112): eyebrow `GET IN TOUCH`; H2 (white, two-tone phrase in `oklch(0.76 0.1 243)` the admin dark-mode primary, the only place a lighter blue appears on navy): "Turning your property dreams into **trusted reality**." (kept from the old home hero, case normalised); lede: "We believe investment starts with a conversation, not pressure." (kept, old Contact hero); buttons: `Book a site visit` (white fill, navy text) → `/contact`, `WhatsApp` (outline white) → `wa.me/919700123900`.
2. Columns (4 on desktop, 2 on mobile):
   - **Company**: About, Projects, Gallery, Contact.
   - **Projects**: rendered from `getProjects()` — today "Global City VI — Rudraram" only; heading hidden if empty.
   - **Office** (`<address>`): "Flat No. 1314, 12th Floor, Vasavi MPM Grand, Metro Junction, Ameerpet, Hyderabad, Telangana 500016" · `+91 97001 23900` · `Gip@greaterinfraprojects.in` · "Mon–Sat, 10:00–19:00".
   - **Follow**: Facebook (`facebook.com/Greaterinfragip`), Instagram (`instagram.com/greaterinfraprojects`).
3. Wordmark row: "GREATER INFRA PROJECTS" set in Archivo `wdth 62` weight 600 at `clamp(3rem, 12vw, 11rem)`, `oklch(1 0 0 / 0.08)`, single line, clipped at the container edge. Decorative, `aria-hidden`.
4. Bottom strip (`navy-deep`): `gip-roof-white.svg` 24 px; "© 2026 Greater Infra Projects. All rights reserved." (year is a constant in `constants.ts`, not `new Date()`); "Projects are HMDA/DTCP approved and RERA registered; reference numbers are listed on each project page."; "Artist's impressions are indicative."

Component: adapt `footer-with-suite.tsx` as a Server Component (strip `select-none`, map its columns).

#### 404 (`app/not-found.tsx`)

White page, survey-grid lines across the full viewport (`background-image: repeating-linear-gradient(90deg, var(--border-strong) 0 1px, transparent 1px calc(100% / 12))`), `num-xl` "404" in condensed numerals, H1 "This plot isn't on our map." **[new copy]**, lede "The page may have moved when we rebuilt the site. Try one of these:" and three links: Projects, Global City VI, Contact. The roof mark SVG (`gip-roof-navy.svg`) at 48 px above the number, with its path stroke drawn in over 600 ms (`stroke-dasharray` CSS animation, reduced-motion → static). Returns a real 404 status on the Node build; on export it is `404.html`.

### 5.1 Home `/`

Heading outline: H1 hero → H2 per section. One H1.

**1. Hero — facts first** (white; survey-grid motif behind; padding 48/96 top)

- Grid: text in columns 1–6, fact strip full width below, image full width (1440) below that. Mobile: text, image (4:5), fact strip (2×2).
- Eyebrow: `HMDA · DTCP · RERA APPROVED LAYOUTS · HYDERABAD`
- H1 (`display`): "Approved plots in Hyderabad's **growth corridors**." **[new copy]** — the old "Turning Your Property Dreams into Trusted Reality" moves to the footer CTA.
- Lede (`body-lg`, 60ch): "Greater Infra Projects plans, develops and registers plotted layouts around Hyderabad — clear titles, approved layouts and complete documentation on every project since 2014." **[new copy; facts from the brand story and `COMPANY.founded`]**
- Buttons: `View Global City VI` (navy) → `/projects/global-city-vi`; `Book a site visit` (outline) → `/contact`.
- Fact strip (4 cells, hairline-separated, `surface-1`, 6 px radius): `11+` Years · `20+` Projects delivered · `600+` Acres developed · `6000+` Customers. `num-lg` condensed with count-up on view; labels `label` style. Source: old StatsSection; the body copy contradictions ("21", "100+") are dropped.
- Live card (sits at the right end of the strip on desktop as a 5th, wider cell; on mobile a full-width row): eyebrow with the pulsing `accent-signal` dot `NOW SELLING`; "Global City VI, Rudraram"; a 6 px stacked status bar (211 / 30 / 38 / 9 in the four status fills, legend below as `caption`); "**211** of 288 plots available" (`num-md`); `caption` "Status as of 6 Oct 2026" (= `formatDate(project.inventoryUpdatedAt)`); link "See the plan →". All values come from `summarize(await getUnits(id))`; nothing typed by hand. While `project.statusSample` is true, append "· preview data" in `caption`.
- Image: `hero-aerial.webp` (2400×1340) in a 16:9 frame at 1440 wide, caption "Artist's impression of a GIP plotted layout". Mobile: `hero-aerial-mobile.webp` (1080×603, 16:9) in a 16:9 frame under the text until the 4:5 `hero-aerial-portrait` render from §6 lands; then swap the mobile `<source>` to the portrait at 4:5. The 16:9 fallback is deliberately kept short so the fact strip stays within the first 1.5 viewports on a 390 px phone. Marked `preload` (LCP on mobile; on desktop the LCP is the H1).

**2. Featured project** (white, after a full-width rule)

- Eyebrow `ONGOING PROJECT`; H2 "Global City VI, Rudraram"; lede = `project.description` ("Global City VI is a premium HMDA & RERA approved 22-acre weekend villas and open plots project located at Rudraram / Shankarapally with excellent access to Mumbai Highway and educational hubs.").
- Feature row: cover photo (3:2, `media.cover`, caption "Site photo, March 2026") in columns 1–7; in 8–12 an info list with hairlines: Location `Rudraram / Shankarapally, Sangareddy` · Land `21 acres 10 guntas` (`formatLandArea`) · Plots `288` · Plot sizes `147–731 sq yd` (from `summarize().minArea/maxArea`, rounded) · Roads `40 / 30 ft CC, 100 ft facing` · Approvals `HMDA LP 2046/HMDA/SWFL/2026 · RERA P01100009270` in `ref` · Price → `showPrice` is false in the seed, so the row reads `On request`. Buttons: `View project` (navy), `Brochure & layout (PDF, 9.9 MB)` (text link with `Download` icon → `media.masterPlan.url`; the 23.7 MB brochure is linked only from the project page).
- This is rendered by the same `ProjectFeatureRow` component the listing uses.

**3. Built on principle** (`surface-2` sand band)

- Eyebrow `KEY PRINCIPLES`; H2 "Built on principle" (kept, case normalised); lede "A philosophy that guides every decision we make. Our values are not statements — they are standards." (old Values intro, trimmed) .
- 4 cards (2×2 mobile, 4 across desktop), white, hairline, 6 px; each: the looping illustration at 160 px (desktop) / 120 px (mobile), `h4` title, `body-sm` copy. The 1:1 mapping the old site never wired up:
  1. **Transparency** — `transparency.gif` → "We believe transparency is the foundation of trust. From approvals and documentation to pricing and timelines, we ensure absolute clarity at every stage of the customer journey." (kept)
  2. **Quality-driven planning** — `quality-driven-planning.gif` → "Every project is thoughtfully planned with a strong emphasis on layout design, infrastructure, and long-term usability. We focus on building developments that stand the test of time." (kept)
  3. **Trust & reliability** — `trust-reliability.gif` → "We value relationships over transactions. By delivering what we promise and standing by our commitments, we build long-term confidence with every customer." (kept)
  4. **Timely & responsible execution** — `timely-responsible-execution.gif` → "We understand the significance of a real estate investment. With disciplined execution and structured planning, we strive to deliver our projects responsibly and on schedule." (kept)
- The GIFs have opaque white backgrounds; these cards are white, so they sit flush. Re-encode per §6.

**4. In numbers** (`surface-1`, survey-grid motif, padding 80/112)

- Four rows alternating left/right on desktop (numeral in 5 columns, text in 6), stacked on mobile. `num-xl` with count-up; `h4` label; one trimmed paragraph each:
  - `11+` Years of industry experience — "Over a decade of hands-on real estate development, deep market knowledge and strong execution." **[trimmed]**
  - `20+` Projects delivered — "From gated communities to open villa plots, delivered across Hyderabad's growth corridors." **[rewritten; removes the "21" contradiction]**
  - `600+` Acres developed — "More than 600 acres of land turned into planned layouts with roads, drainage and power in place." **[trimmed]**
  - `6000+` Customers — "Families and investors who chose GIP for their plots — and the referrals they bring." **[rewritten; removes "100+"]**

**5. GIP vs typical plot sellers** (white)

- Eyebrow `THE DIFFERENCE`; H2 "The difference is in the details." (kept, promoted from the old lede).
- A real `<table>`, hairline rules, header row on `surface-1`, first column `h5`, GIP cells with a `Check` icon in `status-available-fg`, "typical" cells with `Minus` in `fg-2`. Rows kept verbatim: Community planning — Master-planned communities / Isolated plots · Documentation — Fully approved documentation / Documentation inconsistencies · Development control — End-to-end development control / Sale-only involvement · After sales — Structured after-sales support / No post-sale accountability · Vision — Long-term development vision / Short-term transactions.
- Mobile: the table becomes a two-column list (label row, then GIP / Typical pair) via `display: grid`; no horizontal scroll.

**6. How buying a plot with GIP works** (white, after a rule) **[new section, new copy — process facts to confirm with client]**

Four numbered steps in a 4-column grid (2×2 mobile), numerals `num-md` in `accent-signal`:
1. **Site visit** — "Walk the layout with our team. We arrange pick-up from the Ameerpet office on request."
2. **Verify** — "Take the HMDA/DTCP permit, RERA certificate, layout copy and link documents to your lawyer. We share them before booking."
3. **Book** — "Choose your plot on the master plan and reserve it with a booking amount."
4. **Register** — "Registration at the sub-registrar office with our documentation team; possession on registration."
Image band under the steps: `avenue-road.webp` 21:9, caption "Artist's impression — 40 ft CC road with avenue plantation".

**7. What customers say** (`surface-1`) — only if the client confirms the two reviews (§10)

Two quotes side by side, no avatars, no stars, `h3`-sized quote in weight 400, name in `label`: Rakesh Kota — "Nice plotting at Rudraram, really liked the spacious roads and good infrastructure. Definitely the best open plots in the Rudraram area for long-term investment." · Ravi Kiran — "A very promising group with a dedicated attitude and uncompromising sincerity. They completed Green Hills Farms in Yadadri and LR Medchal County. Their project planning and execution are excellent." If unconfirmed, omit the section; the page does not need it.

**8. Footer CTA + footer** (§5.0).

Dropped from the old home: the 10-second popup form, the Urban Eden carousel (external project), "Our Promise" rows (duplicated in Corporate Strengths on About), Construction Standards (duplicates), the pill video (31.7 MB; re-encode later as an optional band), five unverified testimonials.

### 5.2 Projects `/projects`

- H1 "Projects"; lede "Plotted layouts planned, developed and registered by Greater Infra Projects. Ongoing projects show live plot availability; completed layouts are listed on request." **[new copy]**
- Filter bar (client component, URL `?status=&area=`; state only, no fetch): segmented control `Ongoing (1)` / `Completed (0)` / `Upcoming (0)` with counts from `getProjects()`; a `Location` select built from the projects' `location.areaId` ("Indrakaran – Rudraram" is the only option today). Counts in the control are what stop one result looking like a bug. With zero results: "No ongoing projects in {area} right now. Ask us about upcoming launches →" with a `WhatsApp` link — designed, not an afterthought.
- Results: `ProjectFeatureRow` stacked (Honer's stacked-feature-row pattern, which reads well at 1, 2 or 10 rows). Each row = cover 3:2 (`tilt-spotlight.tsx`, rotation factor 4, spotlight at 6% navy) + info list + buttons. For `lifecycle === 'completed'` or `publishing.externalUrl` rows the primary button becomes `Completed` (no link) or `Visit site ↗`, per `hasDetailPage()`.
- "Track record" band (`surface-1`): eyebrow `SINCE 2014`; H2 "20+ layouts delivered across Hyderabad's districts" **[new copy]**; a four-cell fact strip (11+ / 20+ / 600+ / 6000+) and a sentence "Sangareddy, Medchal–Malkajgiri, Rangareddy and Yadadri–Bhuvanagiri districts — Rudraram, Kompally, Shadnagar, Kadthal, Yadadri and more." **[new copy from the old inventory's project locations; districts are company facts, not project records]**; button `Ask about completed layouts` → WhatsApp with prefilled text "Hi, I'd like to know about your completed layouts." This signals depth without hardcoding a second project.
- Footer.

### 5.3 Project detail `/projects/global-city-vi`

Rendered from `getProject(slug)`, `getUnits(project.id)`, `getPlan(project.id)`. `generateStaticParams` returns `[{ slug: 'global-city-vi' }]`. Heading outline: H1 project name; H2 per section; H3 inside.

**Sub-nav** (sticky under the header, 48 px, white, bottom hairline): left `ref`-style "RERA P01100009270 · HMDA 2046/HMDA/SWFL/2026" (desktop only); right anchor chips `Overview` `Plan` `Gallery` `Amenities` `Location` `Approvals` `Enquire`, `body-sm`, active chip = `navy-tint` bg + `accent-signal` text, driven by `IntersectionObserver`. Mobile: chips scroll horizontally (`no-scrollbar` utility), the reference numbers move into the facts card.

**1. Overview hero** (white)
- Eyebrow `OPEN PLOTS · ONGOING · SANGAREDDY DISTRICT` (from `projectTypeLabel`, `LIFECYCLE_LABEL`, `location.district`).
- H1 "Global City VI"; sub-line `h3` weight 400 `fg-1` "Rudraram / Shankarapally, near Mumbai Highway" (location.full + locationAdvantages.badge).
- Lede = `project.description`.
- Facts card (columns 8–12 desktop; full width mobile), `surface-1`, 2-column cells with hairlines, `num-lg` values + `label`: Land `21 acres 10 guntas` · Plots `288` · Plot sizes `147–731 sq yd` · Internal roads `40 / 30 ft CC` · Main road `100 ft` · Launched `2021` · Price `On request` (showPrice false) · Availability `211 available` with the stacked status bar and "as of 6 Oct 2026".
- Buttons: `Enquire about a plot` (navy → `#enquire`), `Call +91 97001 23900` (outline, `tel:`), `Brochure & layout (PDF, 9.9 MB)` (text link).
- Cover: `media.cover` 3:2 at 1440 wide below, caption "Site photo, Global City VI, March 2026".
- Highlights strip under the cover: `project.highlights` as 7 chips (`body-sm`, hairline, 6 px): 100 Feet Road Facing Project · HMDA & RERA Approved · CC Internal Roads (40 / 30 Feet) · Grand Entrance Arch · Swimming Pool · Avenue Plantation · Rainwater Harvesting.

**2. Master plan & live availability** (`#plan`, `surface-1`, padding 80/112) — the signature section

Layout: desktop = map in columns 1–8, a sticky side panel in 9–12 (legend + filters + selected plot). Mobile = legend row, map full width (portrait, ≈ 1.5× viewport width tall, fine), plot details in a bottom sheet (shadcn `sheet`, side bottom).

Build (`src/components/plan/`):
- `PlanSvg` (Server Component): converts `gc6-masterplan.json` to SVG once at build. `viewBox="0 0 375.75 559.95"`; transform every point `x' = x − extent.minX`, `y' = extent.maxY − y` (data is metres east/north; SVG y is down). Layers in order: `boundary` (fill `surface-1`, stroke `fg-1` 0.8), `wall` (stroke `fg-1` 0.4 dashed 2 1), `road100` (fill `oklch(0.9 0.006 255)`), `roads` (fill white, stroke `border-strong` 0.3), `greens` (fill `status-available-soft`… no: fill `oklch(0.94 0.03 140)` a quiet green reserved for parks, stroke none), zones (`utility`, `social`, `clubhouse`: fill `navy-tint`, 0.4 stroke, name as 4-unit label), `features` (lucide icons `DoorOpen`, `Building`, `WavesLadder`, `CircleParking`, `Volleyball`→ use `Target`, `Droplets`, `Blocks`, `Trees` at `at`, 8-unit boxes, `fg-1`), then the 288 `plots` as `<path d=… data-n={n} data-s={status}>` inside a `<g class="plots">`, each with `<title>` for native tooltips as a fallback. Plot number `<text>` at `c`, `font-condensed`, `font-size 3.6`, `text-anchor middle`, `pointer-events none`, hidden under 640 px CSS width unless zoomed (`.plan[data-zoom="1"] text { display:none }` on mobile).
- Fills via the admin `.tile[data-s]` rules re-expressed for SVG: `fill: var(--st)`, `stroke: var(--edge)` 0.35, plus `pattern-sold` / `pattern-mortgaged` / `pattern-registered` as `<pattern>` defs (hatch 135°, dots, folded corner) so the non-colour cues survive.
- `PlanInteractive` ("use client", wraps the SVG): event delegation on `.plots` (one listener, not 288). Hover/focus: stroke `accent-signal` 1.2, raise the path (`parentNode.appendChild`), tooltip (120 ms fade, `--shadow-overlay`) with "Plot 142 · 200 sq yd · East · 40 ft road · Corner" and the status badge. Click/tap or Enter/Space: select (admin's double ring: `stroke-width 1.6` white + 2.4 outer `fg-0` via a second path), open panel/sheet. Keyboard: roving `tabindex` on paths (`role="button"`, `aria-label="Plot 142, 200 square yards, East facing, Available"`), arrows move to the nearest plot by centroid distance.
- Side panel / bottom sheet content: `num-lg` "Plot 142"; status badge (soft bg, fg text, with the pattern swatch); rows Area `200 sq yd` · Dimensions `30 × 60 ft` (when `w,d` exist) · Facing `East` (+ `facing2` for corners: "East & North, corner") · Road `40 ft` (+ `roadWidth2Ft`) · Status date `21 Sep 2026`; for `mortgaged`: `statusNote` ("Mortgaged to HMDA under LP 2046/HMDA/SWFL/2026") and the buyer-facing `UNIT_STATUS_META.description`; for `sample: true`: a `caption` "Preview status — confirm with our team". Button `Enquire about plot 142` → scrolls to `#enquire` and prefills the form's project + plot fields; `WhatsApp` → `wa.me/919700123900?text=Hi, I'm interested in plot 142 (200 sq yd, East) at Global City VI.`
- Legend + filters (panel top; a row above the map on mobile): four rows in client order with swatch (2 px radius, patterned), label, `num-md` count and percent from `summarize()` (211 · 73%, 30 · 11%, 38 · 13%, 9 · 3%); each row is a toggle that dims the other statuses (`data-dim`, admin's outline-only style). Below: size chips `150` `200` `250–300` `300+` sq yd (bucketed from `area`), facing chips `E` `W` `N` `S`, `Corner only`. Filters combine; the count line reads "**48** of 288 plots match". Clear link.
- Zoom: `+` `−` `Reset` buttons (40 px) that scale the `viewBox` about the centre (1× → 2.5×, 3 steps) and enable drag-pan (`pointer` events, `touch-action: none` only while zoomed). Pinch-zoom is left to the browser at 1×.
- Headline block above the map: eyebrow `LAYOUT`; H2 "288 plots on 21 acres 10 guntas"; `caption` with the live dot "Status as of 6 Oct 2026 · updated from the GIP sales desk" (date = `inventoryUpdatedAt`); lede = `masterPlan.description` ("22-acre master-planned community with 40 / 30 feet CC internal roads, premium amenities and well-defined villa & plot layouts."). Under the map: land-use bar from `landUse` — Plotted 62,108 · Roads 27,113 · Parks 6,950 · Social infrastructure 2,554 · Utility 1,040 sq yd — as a 10 px stacked bar in greys/green with a `caption` key. Real numbers, no adjectives.
- `image-comparison.tsx` is **not** used here; the scanned layout vs the digitised plan comparison is a nice-to-have, not a buyer need.
- Under the plan: "Download the approved layout (PDF, 9.9 MB)" text link, and a "How to read this plan" disclosure (shadcn accordion) explaining the four statuses in `UNIT_STATUS_META.description` words.

**3. Why Rudraram** (`#overview` continues; white) — `vision`
- Eyebrow `VISION`; H2 "Why Rudraram" **[new heading; seed title is empty]**; lede = `vision.description`.
- 4 tiles (hairline, icon from `ICONS[feature.icon]` 24 px `fg-1`, `h4`, `body-sm`): Prime Corridor — "Located at Rudraram / Shankarapally near Mumbai Highway." · High Growth Zone — "Rapid infrastructure growth in Sangareddy district." · HMDA Approved — "Approval No. 007133/LO/HMDA/1700/SKP/2024." · Green Infrastructure — "Avenue plantations and rainwater harvesting system." (all from the seed).
- Right/below: `entrance-arch.webp` 16:9, caption "Artist's impression — entrance arch".

**4. Gallery** (`#gallery`, white) — `media.gallery` (14 real site photos)
- Eyebrow `SITE PHOTOS`; H2 "On site, March 2026" **[new; the files are dated 2026-03-06]**.
- Masonry (3 columns desktop, 2 mobile) from `masonry-lightbox.tsx` with prev/next, focus trap and Esc from `gallery-grid-lightbox.tsx`; `next/image` with `sizes`; tiles have the 6 px frame and hairline; hover: image `scale(1.03)` 600 ms inside the clipped frame; lightbox: shared-element `layoutId` zoom, caption "Global City VI, site photo".

**5. Amenities & infrastructure** (`#amenities`, `surface-1`) — `amenities`
- The seed has `amenities.visible: false` (old site had the section unmounted). Flip it to `true` in `global-city-vi.ts`: the nine items are brochure facts and the buyer needs them. Rendered only when `visible`.
- Eyebrow `AMENITIES`; H2 "Premium community amenities" (seed title); lede = seed description.
- 3×3 tile grid (2 columns mobile): icon from `ICONS`, `h5` name, `body-sm` description — Clubhouse "25,000 Sq. Yards clubhouse facility." · CC Roads "40 / 30 feet wide internal roads." · Drainage "Underground drainage system." · Electricity "Underground electrical infrastructure." · Water Tank "Overhead water tank provision." · Avenue Plantation "Green landscaped internal roads." · Play Area "Children's recreational space." · Rainwater Harvesting "Eco-friendly water conservation system." · Swimming Pool "Recreational swimming facility." Non-featured items (Plot Fencing) as a `body-sm` line below: "Also: plot fencing."
- Image: `clubhouse-pool.webp` 4:3 beside the grid on desktop, caption "Artist's impression — clubhouse and pool".

**6. Location** (`#location`, white) — `locationAdvantages` + `location.pin`
- Eyebrow `LOCATION`; H2 = `locationAdvantages.title` ("Excellent Connectivity & Access"); lede = description ("Well connected to Mumbai Highway and major educational institutions, offering a peaceful yet accessible lifestyle.").
- Left: `expanded-map.tsx` adapted — a 4:3 frame showing Carto light tiles centred on `17.535588, 78.145298` at zoom 13, pin = `gip-roof-navy.svg` 28 px, attribution line "© OpenStreetMap contributors © CARTO" in `caption`, link `Open in Google Maps ↗` (`https://www.google.com/maps?q=17.535588,78.145298`). The expand interaction stays (click → 16:9), keyboard-operable.
- Right: distance grid grouped by `categories` — Connectivity: Mumbai Highway `Nearby` · Education: GITAM University `Nearby`. Distances render through `formatDistance`, so when the client gives "8 km" it just works. Design the row for a value column (`num-md`) even when the value is a word.
- `locationImage` (the old stock aerial at greaterinfraprojects.in) is **not** used.

**7. Approvals & documents** (`#approvals`, navy band, `primary-foreground`) — `legal`
- Eyebrow `APPROVALS`; H2 = `legal.title` ("Approvals & Legal Compliance"); lede = `legal.description`.
- Approvals list (hairlines `oklch(1 0 0 / 0.16)`), each row: authority badge (`ICONS.hmda/rera` icon), `h4` title, `ref` reference, date (`formatDate`), status chip (approved/registered → `status-available` soft on navy = white chip with `status-available-fg` text): HMDA Final Layout Permit `2046/HMDA/SWFL/2026` · 23 Apr 2026 · Approved · "Survey nos 426/P, 427/P, 428, 432, 433/P and 434/P" · RERA Registration `P01100009270` · Registered.
- Documents list: HMDA Layout Approval · RERA Registration Certificate · Layout Copy · Link Documents — each `available: true` but no file hosted, so the row's action is `Request copy` → WhatsApp prefilled "Please share the {doc name} for Global City VI." When `file` exists, it becomes `Download (PDF, size)`.
- Brochure row: `Brochure (PDF, 23.7 MB)` and `Brochure cum layout (PDF, 9.9 MB)` with sizes always shown (mobile data).
- Still-life image (`approvals-still`, §6) in columns 9–12 on desktop; hidden on mobile.

**8. FAQ** (white) **[new copy — draft answers for client sign-off]**
shadcn accordion, 5 items, `h4` questions: "Is Global City VI HMDA approved?" (yes; LP 2046/HMDA/SWFL/2026, RERA P01100009270) · "Can I get a bank loan on a plot here?" (answer to be confirmed) · "What are the plot sizes and the price?" (147–731 sq yd; price on request) · "Can I visit the site?" (Mon–Sat; pick-up from Ameerpet on request) · "What documents do I get at registration?" (to be confirmed). Answers wrapped in `FAQPage` JSON-LD only once the client confirms them.

**9. Enquire** (`#enquire`, `surface-1`) — the form in §5.6 with `project` preselected and the hidden `plot` field filled from the plan. Heading: eyebrow = `cta.subheading` ("INVEST IN SHANKARAPALLY GROWTH CORRIDOR"), H2 = `cta.title` ("Weekend Villas & Premium Plots Available"), lede = `cta.description`. Side column: `Call +91 97001 23900`, `WhatsApp`, office hours, and `cta.thankYou` as the success-state copy ("Our sales team will contact you with complete project details."). `cta.urgency` ("Limited Premium Plots Available") is not shown — the live count says it better.

**Mobile tray** on this page: `Call` · `WhatsApp` · `Enquire` (→ `#enquire`).

### 5.4 About `/about`

- **Hero** (white, text only, columns 1–8): eyebrow `ABOUT GREATER INFRA PROJECTS`; H1 "A legacy of trust. A standard of **excellence**." (kept, case normalised, two-tone on the last word); lede "Building with integrity, planning with precision, and delivering enduring value for generations." (kept). Below, full-width 21:9 frame: `about-us.png` (the real Global City VI launch collage, re-encoded ≤250 KB), caption "Global City VI launch, Rudraram".
- **Story** (`surface-2`): eyebrow `OUR STORY`; H2 "Purpose-driven development" (kept, used once); two paragraphs kept verbatim from Brand Story: "Greater Infra Projects is a real estate development firm driven by a clear philosophy—build with integrity, plan with purpose, and deliver enduring value. We are committed to creating thoughtfully planned developments that stand the test of time, guided by transparency, ethics, and disciplined execution." / "At the core of our approach lies an unwavering belief in doing business the right way. Every project is founded on clear titles, approved layouts, and complete documentation, ensuring absolute clarity and confidence for our customers. We place ethics and transparency at the forefront of every decision, treating trust as the most valuable asset we build." Pull-quote in `h3` 400: "Each project is backed by clear land titles, approved layouts, and complete documentation." (kept).
- **In numbers**: the same `StatsBand` as home (11+/20+/600+/6000+), shorter labels: Years · Projects · Acres · Customers.
- **Mission & vision** (white, two columns with a vertical hairline; stacked on mobile): `MISSION` → H3 "Trust, transparency, responsibility" **[new heading replacing the duplicated "Purpose-Driven Development"]**; p1 "Our mission is to uphold a development philosophy rooted in trust, transparency, and responsibility." p2 kept ("We are committed to delivering a real estate experience defined by fairness… the assurance of a secure investment."); blockquote kept ("Through disciplined execution and ethical practices, we continuously strive to elevate industry standards and deliver on every commitment we make."). `VISION` → H3 "Building for generations" (kept); p1 "Our vision is to establish Greater Infra Projects as one of the most trusted and respected real estate brands."; p2 kept; blockquote kept ("Each development reflects our core values of quality, reliability, and customer satisfaction, aligned seamlessly with evolving lifestyles and expectations.").
- **Values** (`surface-1`): H2 "Our values"; three white cards with the About GIF set: **Integrity** — `integrity-transparency.gif` — "We conduct ourselves with honesty, transparency, and ethical standards in all aspects of our business." · **Quality** — `quality-craftsmanship.gif` — "We are committed to delivering the highest quality in every project we undertake, ensuring durability, functionality, and aesthetic appeal." · **Customer focus** — `customer-first-focus.gif` — "We are dedicated to understanding and exceeding the expectations of our clients, providing exceptional service and value in every interaction." (all kept).
- **Corporate strengths** (white): eyebrow `WHAT WE DO`; H2 "Premium open plots & real estate development in Hyderabad" (kept sub-line); lede "Delivering high-value residential plotting ventures with clear titles, prime locations, and strong growth potential across Hyderabad." (kept). 4×2 hairline grid (2 columns mobile) with lucide icons (`Building2`, `MapPin`, `Route`, `Users`, `FileCheck2`, `TrendingUp`, `Landmark`, `Target`), `h5` + `body-sm`, all eight kept verbatim (Value-driven investments · Strategic location selection · Fast & structured development · End-to-end in-house support · Clear title & legal transparency · High-growth micro-markets · Financially disciplined operations · Projects selected with vision).
- **Leadership** (`surface-1`): eyebrow `LEADERSHIP`; H2 "Visionary leadership. Disciplined execution." (kept); lede kept ("Leadership at Greater Infra Projects defines direction, values, and standards…"). Two cards: 4:5 portrait (`teams/syed-imam.png`; `teams/syed-ismail-kashif.png` cropped to portrait), `h4` name, `label` role, bio kept verbatim. **Syed Imam** — Chairman & Managing Director. **Syed Ismail Kashif** — Director, Strategy & Urban Development. The six real but unnamed staff photos are **not** published until the client supplies names and roles (§10); the grid component takes an array so adding them is data, not design.
- **Milestones** (white): eyebrow `MILESTONES`; H2 "Nine years, celebrated" **[new]**; `gallery-events.png` (9th-anniversary collage) 21:9, caption "9th anniversary celebration, Hyderabad". A year-by-year timeline is deferred until projects come from the backend (project years would otherwise be hardcoded).
- **Closing band**: `hills-dusk.webp` 21:9 full-bleed with a bottom scrim; over it (white text) H2 "Let's start a conversation." and the two buttons. This is the one scrim-on-photo moment on the site.
- Footer.

### 5.5 Gallery `/gallery` — keep as a light index, merge the rest

Keep the route: it exists, is linked from the old nav, and will hold every project's photos once the backend ships. Do not build a hero for it.
- H1 "Gallery"; lede "Site photos from our layouts and moments from the company." **[new]**
- Section per project from `getProjects()` with ≥1 gallery asset: H2 "Global City VI, Rudraram" + the same masonry/lightbox, first 9 tiles, link "All 14 photos on the project page →".
- Section "Company": the two real collages (`gallery-land.png` is byte-identical to the launch collage already used on About, so show `gallery-events.png` and `about-us.png` once each) with captions. If the client supplies the individual event photos, they replace the collages here.
- No categories UI until there are ≥3 sources.

### 5.6 Contact `/contact`

- H1 "Let's start a **conversation**." (kept; two-tone); lede "We believe investment starts with a conversation, not pressure. Reach out and let us understand your vision." (kept).
- Two columns (form 1–7, details 8–12; stacked on mobile with details first — a phone user wants the number before a form).
- **Details card** (`surface-1`, hairline rows, lucide icons 20 px `fg-1`): Call `+91 97001 23900` (`tel:`), WhatsApp `Chat on WhatsApp` (`wa.me/919700123900`), Email `Gip@greaterinfraprojects.in` (`mailto:`), Office `Flat No. 1314, 12th Floor, Vasavi MPM Grand, Metro Junction, Ameerpet, Hyderabad, Telangana 500016` (`<address>`), Hours `Mon–Sat, 10:00–19:00`, and the response promise in `body-sm` with the live dot: "We reply within one working day." **[new; confirm with client]**
- **Form** (`floating-label-input.tsx`, retokened, plus a textarea variant), all `name`d, native validation + inline messages:
  - Name (text, required, `autocomplete=name`)
  - Phone (tel, required, `inputmode=tel`, pattern `^(\+91[\s-]?)?[6-9]\d{9}$`, help "10-digit Indian mobile")
  - Email (email, optional)
  - Interested in (select: "Global City VI — Rudraram" from `getProjects()`, "Other open plots", "General enquiry"; preselected via `?project=` or from the plan panel)
  - Plot (hidden unless prefilled from the plan; shown as a removable chip "Plot 142")
  - Preferred contact (radio: Call / WhatsApp; default WhatsApp)
  - Message (textarea, optional, 500 chars)
  - Consent line (`caption`): "By sending, you agree that GIP may contact you about this enquiry." (checkbox not required under current Indian law for a direct enquiry; keep as a statement).
  - Submit `Send on WhatsApp` (navy, `MessageCircle`); secondary `Email instead` (text link).
- **Behaviour (no backend)**: on submit, validate; build `text` = "Enquiry from {name}\nPhone: {phone}\nEmail: {email}\nInterested in: {project}{, plot N}\nPrefer: {Call|WhatsApp}\n\n{message}"; open `https://wa.me/919700123900?text=${encodeURIComponent(text)}` in a new tab; swap the form for a success state: `Check` icon in `status-available-fg`, H3 "Thanks, {first name}." , "Your enquiry is open in WhatsApp — send it and we'll reply within one working day." , buttons `Open WhatsApp again`, `Call us instead`. `Email instead` builds a `mailto:Gip@greaterinfraprojects.in?subject=Enquiry%20–%20{project}&body=…` with the same text. Reason: works on the static export, no PII stored, matches how buyers already contact GIP; the backend phase replaces `submit()` with a Supabase insert + the same success state. Keep a honeypot-free, JS-required form; if JS is disabled the submit button is a plain `<a>` to `wa.me` without prefill.
- **Map** (white, below): `expanded-map.tsx` centred on the Ameerpet office `17.4373, 78.4487` zoom 15, pin = roof mark, button `Get directions ↗` → `https://www.google.com/maps/dir//Vasavi+MPM+Grand,+Metro+Junction,+Ameerpet,+Hyderabad,+Telangana+500016` (the old site's real directions URL). The old `<iframe>` embed with its hand-typed place id is not reused.
- Footer. No mobile tray on this page.

---

## 6. Imagery plan

### Principles

- Real photos first, artist's impressions second, and the caption always says which. Every kie render carries `alt="Artist's impression: …"` and a visible `caption` "Artist's impression".
- Consistent grading: the six existing renders are all golden-hour/dusk; new prompts keep "warm golden-hour light, clean sky". No render shows a signboard, text or logo.
- Budget: ≤300 KB per hero image at 1600 wide, ≤120 KB per card image at 800 wide. `scripts/optimize-images.py` (sharp) emits AVIF + WebP at 640 / 1024 / 1600 / 2400.

### Reuse — existing assets, exact placement

| Asset | Where | Treatment |
|---|---|---|
| `public/images/hero-aerial.webp` (2400×1340) | Home hero image; OG image base | 16:9 frame, `preload` on mobile only if it is above the fold; also the `opengraph-image.tsx` background with the lockup |
| `public/images/hero-aerial-mobile.webp` (1080×603) | Home hero on <640 until the 4:5 `hero-aerial-portrait` render exists | 16:9 frame as-is; it is a landscape downscale, not a portrait crop — do not force it to 4:5 (the clubhouse/park would be cut) |
| `public/images/entrance-arch.webp` | Project page "Why Rudraram" | 16:9 |
| `public/images/avenue-road.webp` | Home "How buying works" band | 21:9 crop |
| `public/images/clubhouse-pool.webp` | Project page Amenities | 4:3 |
| `public/images/park-walk.webp` | Projects listing "Track record" band (behind nothing; beside the text) | 4:3 |
| `public/images/hills-dusk.webp` | About closing band | 21:9 full-bleed with bottom scrim |
| Supabase `media.cover` (GC VI, 117 KB) | Home featured row, listing card, project hero | `next/image` remote; 3:2 |
| Supabase `media.gallery` ×14 | Project gallery, Gallery page | masonry + lightbox |
| Old site `about-us.png` (real launch collage) | About hero image | re-encode ≤250 KB AVIF/WebP |
| Old site `gallery-events.png` (9th anniversary) | About Milestones, Gallery "Company" | re-encode ≤250 KB |
| Old site `teams/syed-imam.png`, `teams/syed-ismail-kashif.png` | About Leadership | 4:5 crops, ≤80 KB WebP |
| `public/brand/gip-lockup-navy.svg` / `-white.svg` | Header / footer bottom | 32 px / 24 px |
| `public/brand/gip-roof-navy.svg` / `-white.svg` | Map pins, 404, footer strip | |
| Old site `homepage/cover-image1.jpg` (Urban Eden creative) | Not used — external project | |
| Old site `GC-V club house` render | Not used — different project | |
| Old site videos (31.7 MB, 11 MB) | Not used in phase 1; candidate for a muted loop band on the project page once re-encoded ≤4 MB | |

### GIF illustrations (`public/illustrations/`)

Convert with ffmpeg to WebM (VP9, alpha where needed) + MP4 (H.264) at 512 px, 24 fps, plus a WebP poster (first frame); play via a `LoopVideo` client component (`autoplay muted loop playsinline`, `IntersectionObserver` pause off-screen, reduced-motion → poster only). Target ≤120 KB each.

| File | Section | Card title |
|---|---|---|
| `transparency.gif` | Home · Built on principle | Transparency |
| `quality-driven-planning.gif` | Home · Built on principle | Quality-driven planning |
| `trust-reliability.gif` | Home · Built on principle | Trust & reliability |
| `timely-responsible-execution.gif` | Home · Built on principle | Timely & responsible execution |
| `integrity-transparency.gif` | About · Values | Integrity |
| `quality-craftsmanship.gif` | About · Values | Quality |
| `customer-first-focus.gif` | About · Values | Customer focus |
| `timely-completion.gif` | Home · How buying works, step 4 "Register" (small, 80 px) | — |
| `strategic-land-investment-opportunities.gif` (transparent, black lines) | Projects listing · Track record band, on `surface-1` | — |
| `customization-options.gif` | Not used (sliders/phone — off-topic) | |
| `gip-logo-animation.gif` (white on transparent) | Not used in page flow (no preloader). Optional: the mobile drawer's lockup plays it once on open, on white it is invisible, so only if the drawer were navy — it is not. Drop. | |

The ten white-background loops sit on white cards, so the old "white square on a tinted card" problem does not arise in this direction.

### New kie.ai renders (model `nano-banana-2`, 2K, via `scripts/kie-generate.py`)

Shared suffix (already in the script): "Set on the dry Deccan plateau near Hyderabad, India, inside a gated plotted township. Photorealistic, natural materials, believable scale, warm golden-hour light, clean sky. No people, no faces, no text, no lettering, no signboards, no logos, no watermark."

Budget: 70 credits remain (≈5 images). `weekend-villa` (3:2, the script's existing prompt) is already generating and is **not** counted below; place it on the project page as the second "Why Rudraram" tile and on the About story band. At most three more, in this order; stop after #2 if the client wants credits kept for a real drone shoot.

| # | Job name | Aspect | Prompt (before the shared suffix) | Placement |
|---|---|---|---|---|
| 1 | `hero-aerial-portrait` | 4:5 | "High aerial drone photograph at golden hour of a newly developed gated residential plotted layout seen from above at a slight angle: a neat grid of empty plots with survey stones and low kerbs, wide pale cement-concrete roads, young avenue trees with guards, a landscaped park, a white clubhouse beside a blue pool near the bottom of the frame, a 100-foot road along the lower edge, open scrubland and low rocky hills at the top, long warm shadows." | Home hero on mobile (the mobile LCP; replaces the centre crop of the 16:9 `hero-aerial`) |
| 2 | `approvals-still` | 4:3 | "Overhead still life on a pale oak desk: an unrolled architectural layout plan of a plotted township with a fine grid of plots, a brass scale ruler, a fountain pen, a stamped approval document with an embossed seal (illegible), a stack of neatly clipped papers, soft window light." | Project Approvals band (desktop columns 9–12); Contact page details card (muted, 12% opacity) |
| 3 | `survey-stone` | 3:2 | "Close-up at ground level of a freshly painted white concrete survey stone at the corner of an empty plot, a low granite kerb, a strip of fresh pale concrete road, a young avenue tree with a green guard slightly out of focus, dry red Deccan soil, long warm shadow." | Home "How buying works" step 2 "Verify"; 404 page |

Each one fills a slot that otherwise has no image on mobile (1) or carries a trust message (2, 3). Nothing else is generated: the Projects listing, amenities tiles and footer use the six existing renders and the real site photos. A 100-ft-road render, an entrance-at-dusk render and amenity interiors were considered and dropped — `avenue-road`, `entrance-arch`, `hills-dusk`, `clubhouse-pool` and `park-walk` already cover those subjects.

---

## 7. Motion system

Principle: motion confirms state or reveals a number; it never decorates. Everything below is `transition`-based CSS unless it needs `motion` for in-view or layout animation. Global easing `--ease-standard: cubic-bezier(0.2, 0, 0, 1)` (admin); durations 150 / 250 / 400 / 600 ms, nothing longer except count-ups (1.2 s).

| Moment | Spec | Library |
|---|---|---|
| Page load | No preloader. Fonts `display: swap`. The header lockup and H1 are in the HTML; the H1 does a one-line **vertical cut reveal** (lines clip-translate up, 500 ms, stagger 60 ms per line) with the full text in `sr-only` so there is no layout shift and the LCP is the text. Everything else below the fold uses the standard reveal. | `vertical-cut-reveal.tsx` (H1s only) |
| Route change | Next 16 `ViewTransition`: 200 ms cross-fade of `main`; the header does not transition. Project cover ↔ project hero share a `view-transition-name` so the photo morphs. | React 19.3 `ViewTransition` |
| Nav on scroll | Header 72 → 56 px, lockup 32 → 26 px, 250 ms. Reading progress hairline (project/about) scales `transform: scaleX` from `scroll()` CSS animation timeline where supported, `motion` `useScroll` fallback. | CSS / motion |
| Scroll reveals | Blocks `opacity 0 → 1` + `translateY(12px → 0)`, 400 ms, `once`, trigger at 15% visible, stagger 60 ms inside grids, max 6 staggered children per group. Headings, cards, table rows. Nothing above the fold is hidden at first paint. | `motion` `whileInView` via one `Reveal` client wrapper taking server-rendered children |
| Count-up | Stats and the availability number roll from 0 to value over 1.2 s with `easeOut`, tabular numerals so width is stable; the `+` fades in at the end. Trigger once at 50% visible. | `motion` `animate()` in a 25-line `CountUp` (skip `count-up.tsx`'s odometer and `react-use-measure`; the slide effect is heavier than needed) |
| Links | Underline grows from left (`background-size` 0% → 100%, 200 ms); colour to `accent-signal-hover`. | CSS |
| Buttons | Navy: background → `navy-deep`, 150 ms; the trailing `ArrowRight` nudges 4 px. Outline: border → `fg-0`. Press: `scale(0.98)`, 100 ms. The magnetic effect from `magnetic-button.tsx` on **two** buttons only: the hero `View Global City VI` and the project `Enquire about a plot`, strength 0.25, pointer:fine only. | CSS + `magnetic-button.tsx` |
| Cards / images | Border → `border-strong`; the image inside its clipped frame `scale(1.03)` over 600 ms. No lift, no shadow. `tilt-spotlight.tsx` only on the project feature row cover (rotation factor 4, spotlight 6% navy, pointer:fine). | CSS + `tilt-spotlight.tsx` |
| Chips / filters | Background → `navy-tint`, 150 ms; count text updates with a 150 ms cross-fade. | CSS |
| Master plan | Hover/focus plot: stroke to `accent-signal` 1.2 units, 120 ms; tooltip fades 120 ms. Select: double ring appears instantly (no transition — selection must feel exact). Status filter: non-matching plots transition fill → transparent over 250 ms. Panel/sheet slides 250 ms. Zoom: `viewBox` interpolated over 300 ms via `motion` `animate`. | CSS + `motion` |
| Form | Floating labels (translate/scale 150 ms); invalid field border → `destructive` and the message slides down 150 ms; success state cross-fades 250 ms. | `floating-label-input.tsx` + CSS |
| Mobile drawer / tray | Drawer `translateX(100% → 0)` 280 ms; links stagger 40 ms. Tray `translateY(100% → 0)` 250 ms after 1 vh. | CSS / `motion` |
| Accordion | Height auto animation 200 ms (shadcn default). | radix |
| Lightbox | Shared-element zoom from tile (`layoutId`), backdrop 200 ms. | `motion` |
| Smooth scroll | **No Lenis.** Native scrolling; `html { scroll-behavior: smooth; scroll-padding-top: 72px }` (56 px mobile + tray) for anchors. Reasons: nothing on this site needs scroll-synced animation, scroll-jacking undermines "exact", and it is one less client bundle on a low-RAM target. | — |
| Cursor | **No** custom cursor. | — |
| Marquee | **No** marquee. There is no logo wall and the testimonials are two quotes. | — |
| Parallax | **No** parallax. | — |

Reduced motion (`prefers-reduced-motion: reduce`): admin's global rule already collapses transitions and animations to 0.01 ms; additionally the `Reveal` wrapper renders children visible immediately, `CountUp` renders the final value, the cut reveal renders plain text, `LoopVideo` shows the poster, magnetic/tilt return `children` unchanged, and the plan's zoom jumps.

What not to do: no text that types itself, no split-by-character headings, no shimmer buttons, no gradient blobs, no floating particles, no auto-playing carousels, no hover states that hide content, no "scroll to discover" bouncing chevrons, no 3D flips, no parallax backgrounds, no video with no poster, no blur-in of images (use the real AVIF with a 10 px `blurDataURL` only), no opacity-0 first paint above the fold.

---

## 8. Component mapping

Saved 21st references live in `C:\Users\purne\AppData\Local\Temp\claude\J--Jaggu-Projects-gip-platform\a4e3adf4-041d-4c96-8844-7f1972088045\scratchpad\21st\`. Paths below are relative to it. "Hand-build" means ≤80 lines with Tailwind + the shadcn primitives.

| Section | Source | Notes |
|---|---|---|
| Header (desktop compact-on-scroll) | `navbar-morphing-scroll.tsx` — behaviour only | Keep the scroll-direction logic and progress bar; drop the capsule/float/blur; CSS re-expressed in `globals.css` with tokens; `usePathname` for the active link. "use client". |
| Header (mobile drawer, hamburger) | `header-3-mega-menu.tsx` — `MenuToggleIcon` + portal drawer | Drop the radix NavigationMenu (no mega menu yet). |
| Mobile action tray | Hand-build | 30 lines; `IntersectionObserver` sentinel at 100vh. |
| Footer | `footer-with-suite.tsx` | Server Component; columns from data; add the wordmark row. |
| Home hero | Hand-build | Text + fact strip + image in grid; `vertical-cut-reveal.tsx` for the H1 line reveal. The catalog's `hero-gallery-scroll-animation.tsx` is **rejected for C**: scroll-driven bento of five renders is spectacle, not facts, and it hides the LCP under motion. |
| Fact strip / stats band / count-up | Hand-build `CountUp` with `motion` `animate()` | Skip `count-up.tsx` and `react-use-measure`. |
| Live availability card + status bar | Hand-build `StatusBar` (4 flex spans with status fills + patterns) | Reused in hero, project facts, legend. |
| Project feature row / listing card | `tilt-spotlight.tsx` (cover only) + hand-built info list | Fix `isRevese` typo and the Spotlight listener leak as the catalog notes. |
| Principles / values cards | Hand-build + `LoopVideo` | `bento-grid-kokonutd.tsx` not needed; equal cards on a grid are the Swiss answer. |
| Difference table | Hand-build `<table>` | Responsive grid fallback under 640 px. |
| How buying works | Hand-build | `stacking-cards.tsx` rejected: pinned scroll sections fight the "no scroll-jacking" rule. |
| Testimonials | Hand-build (two quotes) | `reviews-carousel.tsx` only if the client supplies ≥5 confirmed reviews. |
| Projects filter bar | shadcn `toggle-group` + `select` | URL state via `useSearchParams` inside Suspense. |
| Master plan | Hand-build (`PlanSvg` server + `PlanInteractive` client) + shadcn `sheet` (mobile) + `tooltip` | The one L-effort piece; ~400 lines total. Reuse admin's `.tile` CSS and patterns. |
| Gallery + lightbox | `masonry-lightbox.tsx` + prev/next/focus-trap from `gallery-grid-lightbox.tsx` | Change `framer-motion` → `motion/react`; `next/image`; no blur class. |
| Location map | `expanded-map.tsx` | Carto light tiles, attribution, keyboard toggle, "Open in Google Maps". |
| Approvals band | Hand-build | List + chips; `ICONS` registry. |
| FAQ | shadcn `accordion` | |
| Enquiry / contact form | `floating-label-input.tsx` + hand-built textarea variant + `submit()` → WhatsApp | |
| CTA (footer top) | Hand-build; borrow the arrow-travel button from `gradient-cta-banner.tsx` as a shared `ArrowButton` | No gradient blob. |
| Timeline | Not built in phase 1 | `timeline-interactive.tsx` stays on file for when project years come from the backend. |
| Before/after | Not built | `image-comparison.tsx` stays on file. |
| 404 | Hand-build | |

### Install

```
npm i -D sharp          # already present per cheatsheet; for scripts/optimize-images
npx shadcn@latest add badge card accordion dialog sheet tooltip toggle-group select
```

`motion` is already installed (`motion@^14`); import from `motion/react`. **Do not install** `lenis`, `framer-motion`, `gsap`, `embla-carousel`, `react-use-measure`, `react-pdf` (PDFs are download links). Verify `src/lib/utils.ts`: it re-exports `cn` from the `cn` package; replace with `clsx` + `tailwind-merge` (`npm i clsx tailwind-merge`) so `className` overrides on the 21st components win — this is a 3-line change and removes a real risk.

`globals.css` additions: admin tokens (verbatim), the six website tokens (§3), `font-wide` / `tabular` utilities, `no-scrollbar` utility, the survey-grid utility (`bg-survey-grid`), the `.plot` SVG rules mirroring `.tile`, and the header's compact rules.

---

## 9. SEO and performance plan

### Rendering

`cacheComponents: true` on the Node build; everything is static from module data (no `use cache`, no `Date.now()`, no `Math.random()` in Server Components — the year, dates and `inventoryUpdatedAt` come from constants/data). The static export (`GITHUB_PAGES=true`) is `noindex` via `metadata.robots` and `robots.ts`.

### Metadata per page (`generateMetadata` / `metadata` export; root `metadataBase = SITE_URL`, title template `%s · Greater Infra Projects`)

| Route | `<title>` | Description | Canonical | OG image |
|---|---|---|---|---|
| `/` | Greater Infra Projects — HMDA, DTCP & RERA approved plots in Hyderabad | "Plotted layouts around Hyderabad with clear titles and approved layouts. 11+ years, 20+ projects, 600+ acres. Now selling: Global City VI, Rudraram — live plot availability." | `/` | generated: lockup + "Approved plots in Hyderabad's growth corridors" on `hero-aerial` |
| `/projects` | Projects — plotted layouts in Hyderabad | "Ongoing and completed plotted layouts by Greater Infra Projects across Sangareddy, Medchal, Rangareddy and Yadadri districts." | `/projects` | same as home |
| `/projects/global-city-vi` | Global City VI, Rudraram — HMDA approved plots near Mumbai Highway | "288 HMDA & RERA approved plots (147–731 sq yd) on 21 acres at Rudraram / Shankarapally. 40/30 ft CC roads, 100 ft road facing, clubhouse. See live availability." (built from data) | `/projects/global-city-vi` | generated from `media.cover` + name + "211 of 288 plots available" |
| `/about` | About — a legacy of trust since 2014 | "Greater Infra Projects: Hyderabad plot developer founded 2014, led by Syed Imam and Syed Ismail Kashif. Our story, values and leadership." | `/about` | lockup on `about-us.png` |
| `/gallery` | Gallery — site photos | "Site photos from Global City VI and moments from Greater Infra Projects." | `/gallery` | first gallery image |
| `/contact` | Contact — call, WhatsApp or visit us in Ameerpet | "Call +91 97001 23900, WhatsApp, or visit Vasavi MPM Grand, Ameerpet, Hyderabad. Mon–Sat 10:00–19:00." | `/contact` | default |
| 404 | Page not found | — | none, `noindex` | — |

`alternates.canonical` on every page; `openGraph.locale = 'en_IN'`; `twitter.card = 'summary_large_image'`; `viewport.themeColor = '#033967'`; `html lang="en-IN"`. `sitemap.ts` lists the six routes with `lastmod` from data (`publishing.updatedAt` for the project), `robots.ts` allows all on production, `manifest.ts` with the roof mark icons, `icon.svg` = `gip-roof-navy.svg` on white (never white-on-transparent).

### JSON-LD (one `<script type="application/ld+json">` per page, `<`-escaped)

- Root layout: `Organization` (+ `RealEstateAgent` type) — name, url, logo, telephone `+919700123900`, email, `address` (PostalAddress, Ameerpet), `sameAs` (Facebook, Instagram), `foundingDate: 2014`; `WebSite` with one `@id`, no SearchAction.
- `/projects/global-city-vi`: `RealEstateListing` (name, description, url, image[], `datePosted` = `publishedAt`, `offers` omitted while `showPrice` is false) + `Place` (geo 17.535588/78.145298, address Rudraram, Sangareddy) + `BreadcrumbList` (Home › Projects › Global City VI). `FAQPage` only after the client confirms the answers.
- `/about`: `AboutPage` + two `Person` (jobTitle, image, worksFor).
- `/contact`: `ContactPage` + `LocalBusiness` with `openingHoursSpecification` Mo–Sa 10:00–19:00, `geo` 17.4373/78.4487, `hasMap` = the directions URL.
- `/projects`: `CollectionPage` + `ItemList` of projects.

### Headings outline

One `<h1>` per page (the old site had multiple). Home: H1 hero → H2 Featured project / Built on principle / In numbers / The difference / How buying works / What customers say. Project: H1 name → H2 Master plan / Why Rudraram / Site photos / Amenities / Location / Approvals / FAQ / Enquire → H3 plot panel title, FAQ questions. Footer headings are `<p class="label">`, not `h*`. Eyebrows are `<p>` not headings.

### Images

- Static assets: `scripts/optimize-images.py` → `public/images/{name}-{640,1024,1600,2400}.{avif,webp}`; a `<Picture>` server component with `withBase()` for the export build; `next/image` with `sizes` on the Node build. `priority` → `preload`. Add `images.qualities: [60, 75]`.
- Remote Supabase JPEGs (≈110 KB each) through `next/image` with `remotePatterns` (already configured); on the export build they are served as-is (acceptable at ~110 KB).
- Old collages and portraits re-encoded into `public/images/about/` at the same widths.
- `alt` text is descriptive and names the project; decorative frames are `aria-hidden`.

### LCP element per page

| Page | Mobile | Desktop |
|---|---|---|
| Home | The hero image (`hero-aerial-mobile` 16:9 now, `hero-aerial-portrait` 4:5 later; `preload`, `fetchpriority=high`, AVIF ≤180 KB) | H1 text |
| Projects | H1 text | Feature-row cover (`preload`) |
| Global City VI | H1 text (cover is below the facts card) | Cover (`preload`) |
| About | H1 text | H1 text; the collage below is lazy |
| Contact | H1 text | H1 text |

Targets: LCP < 2.0 s on a mid-range Android over 4G, CLS 0 (all images have width/height; the cut reveal reserves line height), INP < 200 ms (plan interactions use event delegation and CSS transitions, no React re-render per hover).

### Fonts

Archivo via `next/font/google`: subsets latin + latin-ext, `axes: ['wdth']`, `display: 'swap'`, self-hosted by Next, preloaded automatically. One family means one or two WOFF2 files (~45 KB each). No other font requests. `size-adjust` not needed (swap from system sans is brief).

### Budgets

Home ≤ 350 KB transferred before images; JS ≤ 120 KB gzipped (motion is tree-shaken; the plan interaction code loads only on the project page). No third-party scripts in phase 1 (analytics is the client's call; if added, use a single tag, deferred).

---

## 10. Risks and open questions

**Facts to confirm with the client**

1. HMDA references: the seed carries both `007133/LO/HMDA/1700/SKP/2024` (vision feature) and `2046/HMDA/SWFL/2026` dated 23 Apr 2026 (final layout permit, survey nos 426/P, 427/P, 428, 432, 433/P, 434/P). Both are shown as the data says; confirm the relationship (application vs permit) and the wording.
2. Land area: `21 acres 10 guntas` (seed/plan) vs "22 acres" in the description and master-plan copy. The design shows the seed figure in numerals and leaves the prose; ask the client to align the prose.
3. Price: `showPrice: false`, so the page says "On request". Confirm whether ₹28,000 / sq yd may be published.
4. Plot statuses: the sold list is real (brochure scan 21 Sep 2026); Registered (3–13) and Mortgaged (229–266) are **sample**. The page prints "preview data" while `statusSample` is true. Replace before launch or the live card is misleading.
5. Testimonials: only Rakesh Kota and Ravi Kiran are plausibly real. Section ships only on written confirmation.
6. Six real staff/director photos exist under Figma placeholder names. Names and roles, or the grid stays at two leaders.
7. Distances: `locationAdvantages` says "Nearby" for Mumbai Highway and GITAM. Real km/min values make the grid useful.
8. "We reply within one working day", the four buying steps, and the FAQ answers (bank loans, registration documents) are process claims drafted here; confirm or edit.
9. Stats 11+/20+/600+/6000+ are used as given; the body copy contradictions were removed rather than resolved.
10. Office hours Mon–Sat 10:00–19:00 and the Ameerpet address come from the old Contact page; confirm nothing changed.

**Design / build risks**

11. The master plan is portrait (376 × 560 m). On mobile it is ~1.5× viewport-width tall, which is fine for scrolling but plot numbers are unreadable at 1×; the zoom buttons mitigate. If the client wants numbers visible at 1×, the plan must be rotated 90° for mobile (one `transform` on the root `<g>`, labels counter-rotated).
12. Interaction performance with 288 `<path>` nodes is fine; adding per-plot React state is not. Keep plot DOM static and drive hover/select with delegated events and `data-*` attributes.
13. `cn` package vs `clsx`+`tailwind-merge`: if class merging does not resolve conflicts, every retokened 21st component will show double styles. Swap first.
14. Static export: `next/image` string `src`, `<video>` `src`/`poster` and CSS `url()` need `withBase()`; `next/link` must not be prefixed. Redirects for the old `/properties` URLs only work on the Node build.
15. OG image generation (`opengraph-image.tsx`) must build URLs from `SITE_URL`, not `basePath`, and renders at build time — fine for one project.
16. Carto tiles in the Expanded Map are a free basemap with attribution; OSM's own tile server should not be used in production. If the client prefers Google Maps, replace with a static Google Maps image (API key) — the component boundary stays.
17. GIF → WebM/MP4 conversion needs ffmpeg on the build machine (or committed outputs). Commit the encoded files; do not convert at build.
18. The 23.7 MB brochure PDF stays a download link with the size shown; never embed PDFs (the old react-pdf + unpkg worker is gone).
19. Archivo's width axis is only used via `font-variation-settings`; Tailwind v4 has no utility for it, hence the two `@utility` rules. Safari ≤16 ignores `wdth` on Google-served variable fonts in rare cases — the fallback is normal width, which is acceptable.
20. Reduced-motion users on Windows (where "Show animations" is often off) will see no count-ups; the numbers still render. Test both modes.
21. The two-tone accent phrase must stay ≥4.5:1 (`accent-signal` on white is 4.6:1 — do not lighten it); on navy use the admin dark-mode primary `oklch(0.76 0.1 243)`.
