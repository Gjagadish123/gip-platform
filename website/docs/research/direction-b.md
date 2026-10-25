# Direction B — CINEMATIC LAND

Greater Infra Projects public site · design direction for the Next 16.4 / Tailwind v4 rebuild
Written 2026-10-19 against: `content-inventory.md`, `honer-analysis.md`, `components-catalog.md`, `next16-cheatsheet.md`, `admin/src/app/globals.css`, `src/lib/data/*`.

Everything below is buildable as written. Where a number comes from data it says which field; where copy is new it is marked **[new copy]**; where the old site's copy is kept it is quoted. Anything the client must confirm is in §10.

---

## 1. Concept

**One line:** *The land, filmed at golden hour — and the layout, lit up plot by plot.*

Honer sells apartments with glossy renders and a Didone serif. GIP sells approved land. Direction B treats that land the way a township launch film does: a full-bleed aerial opens the site, deep-navy and near-black "title cards" carry the facts in big condensed numerals, and the centrepiece of the project page is not a JPG master plan but the real 288-plot layout, drawn in on scroll and glowing with live availability. Everything else is quiet: warm off-white paper, hairline rules, one brass accent, generous air.

**The emotional promise for a Hyderabad plot buyer** (most arrive on a phone from a WhatsApp forward or a Google search for "HMDA plots near Shankarpally"; they compare RERA/HMDA numbers across three or four developers; they want to see the layout, know what is still available, and talk to a human):

1. *"This is a serious company."* — Approval numbers sit at the top of every project page, in the sub-nav and the hero, with a verify link. Numbers are typography, not badges.
2. *"I can see exactly what I'd be buying."* — The interactive plan answers "which plots are left, what size, which facing, which road" without a phone call, and the status date is printed.
3. *"I can reach them in one tap."* — Call and WhatsApp live in a fixed tray on mobile on every page; every plot and every CTA pre-fills the message.
4. *"It feels like land I'd want to stand on."* — Golden-hour aerials, CC roads with avenue trees, the Deccan hill line. Not towers, not interiors, not stock.

**What makes it "premium" rather than "dark theme":** scale contrast (160 px numerals next to 17 px body), discipline (four colours, one accent, one italic phrase per headline), one image per viewport, 160 px section rhythm on desktop, and motion that is engineered once (the hero, the plan) rather than sprinkled everywhere.

---

## 2. Typography

### Families (both on Google Fonts, self-hosted by `next/font`)

| Role | Family | Axes used | Why |
|---|---|---|---|
| Display, headings, UI, body | **Archivo** (variable, wght 100–900, wdth 62–125) | `wght`, `wdth` | Same family as the admin app, so brand and admin match; the width axis gives condensed numerals and compact display without a second grotesk. |
| Accent phrase, pull quotes, testimonials, footer tagline | **Newsreader** italic (variable, wght 200–800, opsz 6–72) | `wght`, `opsz`, italic | One editorial italic for the single accent phrase per headline. Used only in italic. Chosen over Instrument Serif (over-used in 2025 templates) and over Fraunces (too playful). |

```ts
// src/app/fonts.ts
import { Archivo, Newsreader } from "next/font/google";

export const archivo = Archivo({
  subsets: ["latin", "latin-ext"],   // latin-ext carries ₹ (U+20B9)
  axes: ["wdth"],
  display: "swap",
  variable: "--font-sans",
});

export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["italic"],
  axes: ["opsz"],
  weight: "variable",
  display: "swap",
  variable: "--font-accent",
});
```

```css
/* globals.css additions */
@theme inline {
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-accent: var(--font-accent), "Georgia", serif;
}
@utility font-display  { font-variation-settings: "wdth" 75; letter-spacing: -0.025em; }
@utility font-numeral  { font-variation-settings: "wdth" 62; font-variant-numeric: tabular-nums lining-nums; letter-spacing: -0.03em; }
@utility font-eyebrow  { font-variation-settings: "wdth" 90; text-transform: uppercase; letter-spacing: 0.18em; }
@utility font-condensed { font-variation-settings: "wdth" 75; }  /* same as admin */
```

### Type scale

Base 17 px desktop / 16 px mobile. Sizes are `clamp()` so there is no breakpoint jump; the two ends are listed.

| Token | Mobile (≤640) | Desktop (≥1280) | Family / width | Weight | Line-height | Tracking | Use |
|---|---|---|---|---|---|---|---|
| `display` | 44 px / 2.75rem | 112 px / 7rem | Archivo wdth 75 | 500 | 0.95 | −0.025em | Home hero H1 only |
| `h1` | 38 px / 2.375rem | 80 px / 5rem | Archivo wdth 75 | 500 | 1.0 | −0.02em | Inner page H1 |
| `h2` | 30 px / 1.875rem | 52 px / 3.25rem | Archivo wdth 80 | 500 | 1.05 | −0.015em | Section titles |
| `h3` | 24 px / 1.5rem | 30 px / 1.875rem | Archivo wdth 90 | 500 | 1.15 | −0.01em | Card / block titles |
| `h4` | 20 px / 1.25rem | 22 px / 1.375rem | Archivo wdth 100 | 600 | 1.25 | 0 | List headings, form sections |
| `h5` | 17 px | 18 px | Archivo wdth 100 | 600 | 1.35 | 0 | Info-strip values |
| `h6` | 13 px | 13 px | Archivo wdth 90 uppercase | 600 | 1.2 | 0.08em | Info-strip labels, table heads |
| `numeral` | 72 px / 4.5rem | 160 px / 10rem | Archivo wdth 62 | 700 | 0.9 | −0.03em | Stats, "288", "21.10" |
| `numeral-sm` | 40 px | 56 px | Archivo wdth 62 | 700 | 0.95 | −0.02em | Facts strip, plot panel |
| `lead` | 18 px | 21 px | Archivo wdth 100 | 400 | 1.5 | 0 | First paragraph after a heading |
| `body` | 16 px | 17 px | Archivo wdth 100 | 400 | 1.6 | 0 | Copy, max 62ch |
| `body-sm` | 14 px | 15 px | Archivo | 400 | 1.55 | 0 | Table cells, form help |
| `caption` | 12 px | 13 px | Archivo | 500 | 1.4 | 0.01em | Image credits, "as of" dates, disclaimer |
| `eyebrow` | 11 px | 12 px | Archivo wdth 90 uppercase | 600 | 1.2 | 0.18em | Section labels ("OUR PROMISE") |
| `accent` | inherits | inherits | Newsreader italic, opsz = font size | 400 (300 above 64 px) | inherits | −0.01em | One phrase inside a heading; pull quotes |
| `button` | 15 px | 15 px | Archivo wdth 100 | 600 | 1 | 0.01em | All buttons |

Rules
- Headings are sentence case. Uppercase only for `eyebrow`, `h6` and the footer wordmark.
- Exactly one accent phrase per heading, never more than four words, always the last or the emotionally loaded phrase ("Land you can *stand on*.", "Global City *VI*", "Let's start a *conversation*."). Colour: brass on dark, navy on light. Never underline it.
- Negative tracking only at `h2` and above; body and UI at 0.
- `text-wrap: balance` on h1–h3 and on the facts-strip labels; `text-wrap: pretty` on body; numerals get `text-wrap: nowrap`. Body column max `62ch`; lead `48ch`; headline columns max `18ch` at display size.
- Numerals always `tabular-nums` (`font-variant-numeric`), including inside tables and the plot panel, so count-ups do not jitter.
- The ₹ symbol is set in Archivo (latin-ext), never in the accent face.
- Minimum body size 16 px on mobile; minimum anything 12 px.

---

## 3. Colour

Light theme for all content; **dark sections are deliberate "title cards"**: Home hero, Home featured-project band, Home brand-story film band, Home closing CTA, Projects feature row, Project-page hero and master-plan centrepiece, Project-page closing CTA, About hero, About mission/vision, Contact office band, 404, footer. Everything else sits on warm paper.

### Tokens (add to `:root` in `globals.css`; admin tokens stay as they are, these extend them)

| Token | oklch | ≈ hex | Use |
|---|---|---|---|
| `--background` | `oklch(0.985 0.004 85)` | `#FBF9F4` | Page canvas (warm paper; replaces admin's pure white on the public site) |
| `--surface-2` | `oklch(0.962 0.006 85)` | `#F3F0E9` | Alternate section band, info strips, table zebra |
| `--surface-3` | `oklch(0.93 0.008 85)` | `#EAE6DD` | Pressed/hover of surface-2, skeletons |
| `--foreground` | `oklch(0.215 0.022 256)` | `#1F2633` | Body text (admin value) |
| `--foreground-2` | `oklch(0.505 0.022 256)` | `#6E7686` | Secondary text (admin `--muted-foreground`) |
| `--foreground-3` | `oklch(0.66 0.015 256)` | `#9AA1AE` | Captions, disabled |
| `--border` | `oklch(0.912 0.007 255)` | `#E3E5EA` | Hairlines on light (admin value) |
| `--primary` / `--brand` | `oklch(0.34 0.096 251)` | `#033967` | GIP navy: primary button on light, accent phrase on light, links, logo |
| `--navy-deep` | `oklch(0.26 0.07 253)` | `#0B2545` | Dark section background (hero frame, feature band, CTA) |
| `--ink` | `oklch(0.17 0.025 255)` | `#0C1424` | Near-black: master-plan centrepiece, footer, 404 |
| `--on-dark` | `oklch(0.965 0.005 80)` | `#F6F4EE` | Text on navy-deep / ink |
| `--on-dark-2` | `oklch(0.74 0.015 250)` | `#AEB4C0` | Secondary text on dark |
| `--border-dark` | `oklch(1 0 0 / 0.12)` | — | Hairlines on dark |
| `--brass` | `oklch(0.76 0.11 82)` | `#D2A95B` | **The one accent.** Accent phrase on dark, eyebrow rule on dark, primary button fill on dark, selected-plot ring, numeral labels on dark |
| `--brass-ink` | `oklch(0.52 0.1 78)` | `#86651F` | Brass for text on light (5.3:1 on canvas) — eyebrows on light only |
| `--brass-soft` | `oklch(0.76 0.11 82 / 0.14)` | — | Brass tint for the map boundary fill / hover wash on dark |
| `--scrim` | `oklch(0.12 0.03 255 / 0.55)` | — | Over imagery where type sits (bottom gradient), lightbox backdrop |
| `--whatsapp` | `oklch(0.78 0.19 152)` | `#25D366` | WhatsApp icon only. Never a button fill. |

Status colours: **reuse admin's exactly** (`--status-available/sold/mortgaged/registered` with `-on`, `-fg`, `-soft`). On the dark master-plan section use admin's `.dark` values (declare them under a `.theme-dark` class on dark sections; the public site has no user theme toggle, so `.dark` can be aliased to `.theme-dark`). Keep admin's non-colour cues: Sold hatch, Mortgaged dots, Registered folded corner.

### Usage rules

1. Four colours carry the brand: paper, navy, ink, brass. Greys are warm (hue 85) on light and cool (hue 250–256) on dark; never mix.
2. **Brass is an accent, not a theme.** Allowed: one italic phrase per heading on dark; the 48 px rule above an eyebrow on dark; the primary button on dark sections; the selected/hovered plot ring; stat labels on dark; the map boundary. Not allowed: body text, icons on light, backgrounds, gradients, borders on light, more than one button per viewport.
3. Primary button: navy fill + `--on-dark` text on light sections; brass fill + `--ink` text on dark sections. Secondary: 1 px border (`--border` / `--border-dark`), transparent fill. Tertiary: text + arrow. There is never a third filled colour.
4. Status colours appear only on the plan, its legend, plot chips and the availability line in info strips. Never as decoration.
5. Gradients: only the `--scrim` bottom gradient over photographs (`linear-gradient(to top, scrim 0%, transparent 55%)`), and the hero's navy-to-transparent on beat 2. No gradient text, no gradient borders, no glows except the plot hover.
6. No frosted glass anywhere (admin rule). Overlays are opaque tokens or `--scrim`.
7. Contrast floor: 4.5:1 for text, 3:1 for hairlines against their surface (`--border-dark` at 12 % on ink passes for 1 px rules at the sizes used; check the eyebrow rule in brass, which passes at 8.9:1).

---

## 4. Layout

| Item | Value |
|---|---|
| Container | `max-width: 82.5rem` (1320 px) content; media may go full-bleed (`w-screen` breakout) |
| Gutters | 20 px < 640; 32 px ≥ 640; 48 px ≥ 1024; 64 px ≥ 1536 |
| Grid | 12 columns, gap 24 px (≥ 1024: 32 px). Headlines span cols 1–7; body cols 1–6 or 7–12; info strips span 12; two-column text sits 1–5 / 7–11 (one empty column as a gutter of air) |
| Vertical rhythm | Primary sections: 72 px mobile / 160 px desktop. Secondary: 48 / 96. Dark bands: 96 / 160 (they need more air than light ones to feel deliberate). Inside a section, heading → body 24 px, block → block 48 px, 8-px base grid |
| Radius | `--radius: 0.375rem` (admin). Buttons/inputs 6 px, cards 8 px, media frames 12 px (8 px mobile), the hero frame on beat 2 12 px, chips 999 px (chips only). Nothing else is round |
| Borders vs shadows | Hairlines (1 px) define cards and rows. Shadows only on floating layers (admin `--shadow-overlay`): sheet, dialog, tooltip, dropdown, mobile tray. Cards never cast a shadow; hover is a border-colour change + image scale, not elevation |
| Dividers | Full-width 1 px rules between rows in lists (promise, strengths, nearby places). Section boundaries are colour changes, not rules |
| Image ratios | Hero 16:9 desktop, 4:5 mobile (own crop). Feature/film bands 21:9. Project card 21:9 desktop / 4:3 mobile. Amenity cards 4:3. Portraits 4:5. Gallery masonry mixes 3:2 and 4:5 only. Map panel 1:1 mobile / 4:3 desktop. Plot plan: its own viewBox (≈ 0.67:1 portrait) |
| Max text width | 62ch body, 48ch lead, 18ch display |
| Touch targets | 44 px minimum; tray buttons 56 px |

**How "premium" is produced**: one idea per viewport (one image, or one headline + one block of copy, or one data strip); left-aligned type on the 12-col grid with headline and body never in the same column stack; 160 px of air between ideas; the numeral-as-typography pattern; images shown large (full container or full bleed) with a 12 px radius and a hairline, never as a thumbnail grid of five; no decorative shapes. The survey-grid motif (below) is the only ornament and it appears on three surfaces.

**Survey-grid motif (ownable, replaces Honer's stripes)**: an SVG `<pattern>` of 1 px lines every 64 px at 6 % alpha with every fifth line at 12 % and a 6 px cross-tick at major intersections, plus three faint contour curves (4 %, 1 px) in the top-right quadrant. Applied as a background on: the Home stats frame (beat 2), the Projects "delivered since 2014" strip, the closing CTA band. On light it uses `--foreground` alpha; on dark `--on-dark` alpha. Never behind running text.

---

## 5. Page-by-page

Routes: `/`, `/projects`, `/projects/global-city-vi`, `/about`, `/contact`, `/not-found`. `/gallery` is merged (see 5.6).

### 5.0 Global: header, mobile tray, footer

**Header (desktop ≥ 1024)**
- 88 px tall over the hero (transparent, `--on-dark` text, white lockup `public/brand/gip-lockup-white.svg` 140 px wide). After the hero sentinel leaves the viewport: solid `--background` bar, 64 px tall, navy lockup, 1 px `--border` bottom. Transition 300 ms, `--ease-standard`.
- Left: lockup → `/`. Centre-left: Projects, About, Contact (Archivo 15/600 wdth 100; active = 2 px navy/brass underline offset 6 px). Right: phone as text link `+91 97001 23900` (`tel:+919700123900`) with a phone icon, then primary button "Book a site visit" → `/contact?intent=site-visit`.
- Scroll behaviour: hides on scroll-down after 200 px, returns on scroll-up (Morphing Scroll Navbar logic, see §8). No reading-progress bar.
- Project pages: when the project hero leaves the viewport a 48 px **anchor rail** docks under the header: left `HMDA LP 2046/HMDA/SWFL/2026 · TS RERA P01100009270` (from `legal.approvals[].reference`, `font-numeral-sm` 13 px), right: Overview · Master plan · Amenities · Location · Approvals · Gallery · FAQ (scroll-spy underline). Mobile: the rail is a horizontally scrolling chip row, 44 px, under the 64 px bar.

**Header (mobile < 1024)**
- 64 px bar: roof mark (`gip-roof-white.svg` over hero / `gip-roof-navy.svg` after) 32 px, right: "Menu" button (hamburger→X `MenuToggleIcon` from the Header 3 reference).
- Menu: full-screen `--navy-deep` sheet. Links at 40 px display (Projects, About, Contact), staggered 60 ms, then a hairline, then three rows with icons: Call, WhatsApp, Email; then social (Facebook, Instagram); then the address in `caption`. Body scroll locked. Close on route change.

**Mobile action tray (fixed, every page, < 1024 only)**
- 64 px + safe-area, `--background`, 1 px `--border` top, `--shadow-overlay`. Three equal buttons, 56 px: **Call** (icon + label, `tel:`), **WhatsApp** (icon in `--whatsapp`, `https://wa.me/919700123900?text=…` with the page's prefilled message), **Site visit** (navy fill → `/contact?intent=site-visit`). On the project page the third becomes **Enquire** and opens the enquiry sheet prefilled with the project (and plot, if one is selected).
- Content gets `padding-bottom: 80px` on mobile so nothing is hidden; `scroll-padding-bottom: 6rem` as in admin.
- Desktop has no tray; the header CTA and the in-page CTAs carry conversion.

**Footer (`--ink`, survey-grid motif, 96 px / 128 px padding)**
1. Top row: outline wordmark "GREATER INFRA PROJECTS" in `numeral` style (wdth 62, 700) as `-webkit-text-stroke: 1px var(--on-dark-2)`, transparent fill, full width, overflow-hidden; this is the only decorative typography on the site.
2. Four columns: (a) White lockup + "Thank you for considering Greater Infra Projects for your real estate needs. We look forward to hearing from you and assisting you on your real estate journey." (kept) + Call / WhatsApp / Email as text links. (b) **Company**: Projects, About, Contact. (c) **Projects**: Global City VI (from `getProjects()`, so it grows with the backend). (d) **Office** `<address>`: "Flat No. 1314, 12th Floor, Vasavi MPM Grand, Metro Junction, Ameerpet, Hyderabad, Telangana 500016" · "Mon–Sat 10:00–19:00" · "Get directions" → Google Maps dir URL from the inventory.
3. Hairline. Social (Facebook `facebook.com/Greaterinfragip`, Instagram `instagram.com/greaterinfraprojects`), then the tagline in accent italic 32 px: "A legacy of trust. A standard of *excellence*."
4. Bottom line (`caption`, `--on-dark-2`): "© 2026 Greater Infra Projects" (a constant — never `new Date()` under cacheComponents) · "Disclaimer" (opens a shadcn Dialog: artist's-impression and RERA disclaimer text, **[new copy]** below) · "Privacy".

Disclaimer text **[new copy]**: "Images marked 'artist's impression' are illustrative and not photographs of the project. Plot availability shown on this site is updated by Greater Infra Projects and may change without notice; please confirm before booking. Approval and registration details should be verified with the issuing authority (HMDA / TS RERA)."

**404 (`not-found.tsx`)**: `--ink`, `hills-dusk.webp` at 30 % under the scrim, numeral "404" at 160 px brass, H1 **[new copy]** "This plot isn't on our layout.", lead "The page you're looking for was moved or never existed.", buttons: Home (brass), Projects (secondary), Call (text). Nothing animates.

---

### 5.1 Home `/`

Section order and exact content.

**H-1 · Hero (pinned, 2 beats, 200vh runway on desktop; static on mobile and under reduced motion)**

- Media: `public/images/hero-aerial.webp` (2400×1340, kie, golden-hour aerial of a plotted layout) as `<img fetchpriority="high" decoding="async">` — this is the LCP element. Mobile uses `hero-aerial-mobile.webp` today; replace with the portrait render from §6 (prompt K1) once generated.
- Beat 1 (scroll 0 → 45 %): full-bleed image, scale 1.06 → 1.0, bottom `--scrim` gradient. Eyebrow (brass rule + "HMDA · DTCP · TS RERA approved layouts · Hyderabad · since 2014"), then the H1 in `display`: **[new copy]** "Twenty-plus layouts. Six hundred acres. One *standard*." (lines reveal with Vertical Cut Reveal, 90 ms stagger). Lead (cols 1–6, `--on-dark`): **[new copy]** "Greater Infra Projects develops approved plotted communities in Hyderabad's growth corridors — clear titles, CC roads and complete documentation, since 2014." Buttons: brass "See Global City VI" → `/projects/global-city-vi`; secondary "Book a site visit". The old line "Turning Your Property Dreams into Trusted Reality" is kept as the `<title>`-adjacent tagline in the About hero, not here.
- Beat 2 (45 % → 100 %): the image shrinks into a framed card (inset 24 px, radius 12 px) on a `--navy-deep` field that carries the survey-grid motif, while a four-numeral strip rises under it: **11+** Years · **20+** Layouts delivered · **600+** Acres developed · **6000+** Customers (`numeral` at 120 px, labels in brass `eyebrow`). Count-ups fire when the strip is 40 % visible. The header flips to its solid state at the end of beat 2. This is Honer's hero reversed (full-bleed first, frame second) and it ends on the trust numbers, where a plot buyer looks first.
- Mobile: single 100svh screen, portrait image, H1 at 44 px, one brass button; the numeral strip becomes a 2×2 grid directly below the hero (no pinning). Reduced motion: same as mobile at every width.

**H-2 · Featured project (dark band, `--navy-deep`, 160 px)**
- Eyebrow "NOW SELLING" + H2 "Global City *VI*" (accent) + `lead`: project `description` (kept): "Global City VI is a premium HMDA & RERA approved 22-acre weekend villas and open plots project located at Rudraram / Shankarapally with excellent access to Mumbai Highway and educational hubs."
- The card (Tilt + Spotlight, subtle): 21:9 `media.cover` (Supabase JPEG, 117 KB) on the left two-thirds; on the right third a **non-interactive mini plan** — the same `<PlotPlan>` component in `mode="thumb"` (no labels, no hover, statuses coloured, draws in on view). Below the image a grey-on-dark info strip (icon + `h6` label + `h5` value, 4 cells): **Location** "Rudraram / Shankarapally" (`location.short` truncated to the first segment) · **Plot sizes** `${Math.round(minArea)}–${Math.round(maxArea)} sq yd` → "147–731 sq yd" (from `summarize(units)`; 143 of the 288 plots are exactly 200 sq yd) · **Approvals** "HMDA · TS RERA" · **Availability** "211 of 288 plots available" (`counts.available` / `total`) with `caption` "as of 6 Oct 2026" (`formatDate(inventoryUpdatedAt)`) and a "Sample" chip when `statusSample`.
- Buttons: brass "View project" · secondary "Download brochure (PDF, 24 MB)". No carousel; when the backend adds projects this band keeps the first `homepageSlot: 'large'` project and a 3-up of `small` cards appears beneath it — design the 3-up now as an empty-safe grid (renders nothing when there are no `small` projects).

**H-3 · Built on principle (light, 160 px)**
- Eyebrow "KEY PRINCIPLES", H2 (kept) "Built on *Principle*".
- 2×2 grid; each cell: converted GIF loop at 160 px (see §6), `h3`, body. Content kept verbatim from the old Principles section and finally wired to the right illustrations:
  1. **Transparency** — `transparency` loop — "We believe transparency is the foundation of trust. From approvals and documentation to pricing and timelines, we ensure absolute clarity at every stage of the customer journey."
  2. **Quality-Driven Planning** — `quality-driven-planning` — "Every project is thoughtfully planned with a strong emphasis on layout design, infrastructure, and long-term usability. We focus on building developments that stand the test of time."
  3. **Trust & Reliability** — `trust-reliability` — "We value relationships over transactions. By delivering what we promise and standing by our commitments, we build long-term confidence with every customer."
  4. **Timely & Responsible Execution** — `timely-responsible-execution` — "We understand the significance of a real estate investment. With disciplined execution and structured planning, we strive to deliver our projects responsibly and on schedule."
- The loops sit on `--surface-2` tiles because the source GIFs have opaque white backgrounds (make the tile white instead if the conversion keeps white; see §6).

**H-4 · Brand story film band (dark, full-bleed 21:9, parallax)**
- `public/images/hills-dusk.webp` (2400×1018) with ±6 % parallax inside an overflow-hidden frame; `--scrim` left-to-right so copy sits on the dark left half.
- Eyebrow "OUR BRAND STORY", H2 **[new copy]** "Build with integrity. Plan with purpose. Deliver *enduring value*." (lifted from the old paragraph's own words), then the two brand-story paragraphs kept verbatim: "Greater Infra Projects is a real estate development firm driven by a clear philosophy—build with integrity, plan with purpose, and deliver enduring value. We are committed to creating thoughtfully planned developments that stand the test of time, guided by transparency, ethics, and disciplined execution." / "At the core of our approach lies an unwavering belief in doing business the right way. Every project is founded on clear titles, approved layouts, and complete documentation, ensuring absolute clarity and confidence for our customers. We place ethics and transparency at the forefront of every decision, treating trust as the most valuable asset we build."
- Tertiary link "About the company →".
- Later, when the client supplies drone footage, this band becomes the one `<video>` on the site (muted loop, poster = this image). Do not use the Kompally County mp4 here (it is a different project; see §6).

**H-5 · Our promise (light, 128 px)**
- Sticky left label (cols 1–3) "OUR PROMISE" + H2 (kept) "Why choose *Greater Infra Projects*"; right (cols 5–12) four rows separated by hairlines, each `h3` + body, kept verbatim: "Trusted by Buyers & Investors", "Prime Locations with Strong Connectivity", "End-to-End Customer Care", "Proven Track Record of Delivery" with their old descriptions. Row hover: the `h3` shifts 4 px right and a brass-ink arrow appears (desktop only). The old "A value proposition built on trust, planning, and execution…" intro is kept as the `lead` above the rows.

**H-6 · The difference (light, `--surface-2`, 128 px)**
- Eyebrow "THE DIFFERENCE", H2 (kept) "Greater Infra Projects vs *typical plot sellers*", lead (kept) "The difference is in the details."
- Semantic `<table>` (5 rows kept verbatim: Community Planning, Documentation, Development Control, After Sales, Vision) with a ✓ in `--status-available-fg` for GIP and an × in `--foreground-3` for typical; no coloured cells. Rows reveal with 60 ms stagger.

**H-7 · What customers say (light, 96 px)** — only if the client confirms the two plausible reviews (§10). Two quotes side by side in accent italic 24 px, name + location in `caption`; no photos, no slider. Rakesh Kota: "Nice plotting at Rudraram, really liked the spacious roads and good infrastructure. Definitely the best open plots in the Rudraram area for long-term investment." Ravi Kiran: "A very promising group with a dedicated attitude and uncompromising sincerity. They completed Green Hills Farms in Yadadri and LR Medchal County. Their project planning and execution are excellent." If unconfirmed, drop the section; do not substitute.

**H-8 · Closing CTA (dark `--ink`, survey grid, 160 px)**
- H2 "Let's start a *conversation*." (kept from Contact), body (kept) "We believe investment starts with a conversation, not pressure. Reach out and let us understand your vision." Buttons: brass "Book a site visit", secondary "WhatsApp us", text "+91 97001 23900". Right column: the Ameerpet office card (address + hours) in `caption` on a hairline card.

---

### 5.2 Projects `/projects`

The page is designed to look complete with one record and to grow without redesign.

**P-1 · Header block (light, 112 px top padding)**
- Eyebrow "PROJECTS", H1 **[new copy]** "Approved layouts across Hyderabad's *growth corridors*", lead **[new copy]** "Every Greater Infra layout is HMDA or DTCP approved and TS RERA registered before it is offered. Current layouts are listed below; completed layouts are shown for the record." Right column (cols 8–12, desktop only): `entrance-arch.webp` at 4:3, hairline, 12 px radius, `caption` "Artist's impression".
- **Filter bar** (renders well with one result): three shadcn `Select`s and a chip count — **Status** (Ongoing · Completed), **Type** (`PROJECT_TYPES` names), **Location** (`LocationArea` names derived from `getProjects()`), plus a live count chip "1 layout". State in the URL (`?status=ongoing`) through `nuqs`-free `useSearchParams` in a client leaf wrapped in `<Suspense>`; the list itself stays a Server Component that receives the filtered array. With one project the Select options still read correctly ("Ongoing (1)", "Open Plots (1)", "Indrakaran – Rudraram (1)"); the empty state (if someone filters to zero) is a hairline card: **[new copy]** "No ongoing layouts match. Call us — new layouts are announced on WhatsApp first." + Call button.

**P-2 · Feature row (dark `--navy-deep`, one per published project with `homepageSlot` or `sortOrder` ≤ 3)**
- Full-width card: 21:9 cover with the status chip ("Now selling" when `lifecycle === 'ongoing'`) and the HMDA/RERA references in `font-numeral-sm` top-left; name as H2 "Global City *VI*"; the same 4-cell info strip as H-2 (Location / Plot sizes / Approvals / Availability + as-of date); `description`; buttons View project (brass) · Brochure (secondary) · WhatsApp (text). Tilt + Spotlight on hover, 4° max.
- When more projects arrive they stack as further rows separated by 96 px; rows 2+ are light.

**P-3 · Delivered since 2014 (light, survey grid, 128 px)**
- Eyebrow "DELIVERED", H2 **[new copy]** "Twenty layouts, delivered and handed over." Lead **[new copy]** "Sixteen completed layouts across Sangareddy, Medchal–Malkajgiri, Yadadri–Bhuvanagiri and Rangareddy districts." (verify the district attribution with the client.)
- A two-column hairline list of completed layout names with their area — **company facts as strings**, not Project records — stored as `COMPLETED_LAYOUTS: readonly { name: string; area: string }[]` in `src/lib/constants.ts` beside the stats. Names from the old data: Green Hill Farms (Yadadri), Global City – Rudraram, Global City – II (Nandigama), Global City – III (Isnapur), Greater Infra Resorts (Shadnagar), LR Palm Meadows (Rampally), Highway City (Yadadri), True Pride (Bachara), LR Medchal County, Keesara County (Bogaram), RR Kompally County, Sri Yadadri Gardens, Rampally County, Global Highway City (Sangareddy), Kompally County – II (Medchal), Global Village (Kadthal). Mark the constant `// ponytail: delete when completed projects come from the backend`. This satisfies "only one project hardcoded": there is one Project object; the rest is a text list of past work, like the "600+ acres" figure.
- Mobile: the same list in one column; no marquee (a marquee of names is hard to read and reads as filler).

**P-4 · How buying a plot with GIP works (light, 96 px)** — Stacking Cards, 4 cards, **[new copy]**, each with a lucide icon: 1 "Pick a plot on the layout" (interactive plan, facing, road width, availability) · 2 "Visit the site" (we arrange a site visit, Mon–Sat) · 3 "Verify the documents" (HMDA/DTCP layout permit, TS RERA registration, link documents, EC) · 4 "Register in your name" (registration assistance and after-sales support). Cards on `--surface-2`, 8 px radius, pinned scale 1 → 0.94.

**P-5 · Closing CTA** — same as H-8 with the copy swapped to the GC VI CTA (kept): eyebrow "INVEST IN SHANKARAPALLY GROWTH CORRIDOR", H2 "Weekend villas & premium plots *available*", body "Secure your premium villa plot in a 100-feet road facing HMDA approved community near Mumbai Highway."

---

### 5.3 Project detail `/projects/global-city-vi`

`generateStaticParams` returns `[{ slug: 'global-city-vi' }]`; `dynamicParams = false`. All data via `getProject`, `getUnits`, `getPlan`, `summarize`. Never show the price: `showPrice` is `false` → omit the price cell entirely (do not print "Contact for price" in the strip; put it in the enquiry sheet instead).

**D-1 · Hero (dark, 100svh max 880 px)**
- Media: `media.hero ?? media.cover` (Supabase JPEG today). Because the real cover is a 117 KB phone photo, the hero shows it inside the frame at 21:9 with the `--scrim`, and the kie `entrance-arch.webp` is NOT used here (it would misrepresent the site). Label the image `caption` "Site photo" bottom-right.
- Eyebrow: `TS RERA ${approvals.find(a=>a.authority==='RERA').reference}` · `HMDA LP ${…HMDA.reference}` with a "Verify →" link to `https://rera.telangana.gov.in/` (opens new tab).
- H1 "Global City *VI*" (`displayName ?? name`); `lead` = `location.full` with a map-pin icon; body = `description` (kept).
- **Facts strip** (2×3 on mobile, 6 across on desktop; `numeral-sm` value + `h6` label): **21 acres 10 guntas** Extent (`formatLandArea(landArea)`; abbreviate to "21 ac 10 g" only if it wraps at 360 px) · **288** Plots (`summarize().total`) · **147–731 sq yd** Plot sizes (`Math.round(minArea)`–`Math.round(maxArea)` from the 288 polygons: 200 plots sit in the 200–300 sq yd band, 67 below, 21 above; if the client wants the brochure's "150–400 and 700" band instead, read `masterPlan.stats[0].value`) · **40 / 30 ft** CC roads (`masterPlan.stats[2].value`) · **100 ft** Road frontage (`stats[3]`) · **211** Available (`counts.available`, teal dot, `caption` "as of 6 Oct 2026").
- Buttons: brass "Enquire about this layout" (opens the enquiry sheet), secondary "Download brochure (PDF, 24 MB)" (`media.brochure.url`), text "WhatsApp".

**D-2 · Vision (light, 128 px)** — Sticky label "VISION", H2 **[new copy]** "Weekend homes on the *Mumbai Highway* corridor" (the seed `vision.title` is empty; fall back to this string in the component, keyed on the slug, until the admin fills it), body = `vision.description` (kept). Four hairline rows from `vision.features` (icon from `ICONS[icon]`): Prime Corridor · High Growth Zone · HMDA Approved ("Approval No. 007133/LO/HMDA/1700/SKP/2024.") · Green Infrastructure. Right column: `avenue-road.webp` 4:3 with `caption` "Artist's impression — avenue plantation along a 40 ft CC road".

**D-3 · Master plan — the centrepiece (dark `--ink`, 160 px, full width)**

Layout: left (cols 1–8) the interactive SVG plan; right (cols 9–12) a sticky panel with the legend and the selected plot. Mobile: plan on top (scrollable/zoomable), legend chips under it, plot details open in a bottom Sheet.

Heading row: eyebrow "MASTER PLAN", H2 `masterPlan.title` (kept: "Integrated Villa & Plot Layout"), body `masterPlan.description` (kept), then `caption` **"Plot status as of 6 Oct 2026"** (`formatDate(project.inventoryUpdatedAt)`) and, when `project.statusSample`, a chip "Some statuses are sample data" with the `UNIT_STATUS_META` descriptions in a tooltip.

`<PlotPlan plan={getPlan(id)} units={units} mode="interactive" />` — a client component built from `gc6-masterplan.json`:
- `viewBox = "${extent.minX} ${-extent.maxY} ${extent.maxX - extent.minX} ${extent.maxY - extent.minY}"`; every point is emitted as `(x, -y)` (the JSON is metres east/north; SVG y points down). `vector-effect="non-scaling-stroke"` on every stroke.
- Layers, bottom to top: `boundary` (fill `--brass-soft`, stroke `--brass` 1 px), `wall` (stroke `--on-dark-2` 1 px dashed 2 2), `greens` (fill `--status-available-soft` dark variant at 60 %), `road100` and `roads` (fill `oklch(0.22 0.02 255)`, stroke `--border-dark`), `zones.clubhouse` (fill `--surface-3` at 25 %), then **plots**, then `features` markers (brass 3 px dot + `caption` label: Gate, Clubhouse, Pool, Parking, Courts, Water tank, Play area, Park), then plot numbers.
- Plot `<path d>` from `xy`, `data-s={unit.status}`, `tabIndex=0 role="button" aria-label="Plot 42, 200 sq yd, East facing, 40 ft road, Available"`. Fills from the admin status tokens (dark values): available = `--status-available-soft` fill + `--status-available-fg` 0.75 px stroke; sold = `--status-sold` fill + SVG hatch `<pattern>`; mortgaged = `--status-mortgaged` + dot pattern; registered = `--status-registered` + a 2-unit folded-corner triangle. The cues are identical to admin's tiles so a buyer who later sees the admin screen-share recognises them.
- Plot number: `<text>` at `c`, `font-numeral` 4.5 units, `--on-dark` at 85 %; hidden when the rendered plot is narrower than 28 px (check with a ResizeObserver once, toggle a class).
- **Glow**: a duplicated plot layer beneath, available plots only, `filter: url(#glow)` (`feGaussianBlur stdDeviation 1.2` + `feComposite`) in `--status-available-fg` at 35 % — this is what makes the plan read as "lit" on ink. Hover/focus: the plot's stroke becomes `--brass` 1.5 px and the glow opacity goes to 70 % (150 ms). Selected: brass stroke 2 px + the panel updates. Keyboard: Tab through plots in number order, Enter/Space selects, Esc clears.
- **Draw-in on first view** (once, `IntersectionObserver` at 30 %): roads stroke-dash draw 900 ms (`pathLength=1`, `stroke-dashoffset 1→0`), boundary 600 ms, then plots fade/scale in with `animation-delay: calc(var(--i) * 3ms)` (288 × 3 ms ≈ 0.9 s), then features and numbers. Total ≈ 2.2 s. Reduced motion: everything visible immediately.
- Tooltip (pointer: fine): a small `--background` card with `--shadow-overlay`, 8 px from the cursor: "Plot 42 · 200 sq yd · East · 40 ft road · Available". Touch: no tooltip; tap opens the sheet.
- Zoom (all widths): +/− buttons and a "Reset" in the top-right of the plan frame, scaling a wrapping `<g transform>` 1×–3× around the centre; drag to pan when zoomed (pointer events, 60 lines). Pinch-zoom is left to the browser inside a `touch-action: pan-x pan-y` frame on mobile.
- **List view**: a `<details>` under the plan, "View all 288 plots as a table", rendering a server-side `<table>` (Plot, Area, Facing, Road, Corner, Status, Status date). It is in the HTML for SEO and screen readers and costs nothing.

Right panel (sticky `top: 128px`):
- **Legend** with counts and percents from `summarize()` in the client's order: Available 211 (73 %) · Sold Out 30 (11 %) · Mortgaged 38 (13 %) · Registered 9 (3 %). Each row: swatch (with cue), label, count, a `caption` with `UNIT_STATUS_META[s].description`. Clicking a row filters the plan (others go to the `[data-dim]` outline state).
- **Land use** (from `landUse`, formatted with `formatNumber`): Plotted 62,108 sq yd · Roads 27,113 sq yd (27 %) · Park 6,950 · Social 2,554 · Utility 1,040 — presented as a single stacked bar + list. "27 % of the layout is road" is the fact to pull out as a `numeral-sm`.
- **Selected plot** card (or "Tap a plot to see its details" placeholder): `numeral-sm` "Plot 42", rows: Area `200 sq yd` · Dimensions `30 × 60 ft` (only when `widthFt`) · Facing `East` (+ `/ North` when `facing2`, "Corner" chip when `corner`) · Road `40 ft` (+ `& 30 ft`) · Status chip + description · `caption` "Status as of 21 Sep 2026" (`formatDate(unit.statusDate)`) · "Sample status" note when `unit.sample`. Buttons: brass "Enquire about Plot 42" (opens the enquiry sheet with `plot=42` prefilled), text "WhatsApp" with the message "Hi, I'm interested in Plot 42 (200 sq yd, East facing) at Global City VI. Is it available?". For non-available plots the button reads "Ask about similar plots".

Below the plan, full width: **Image Comparison** slider — left: the brochure layout rendered as an image (export page 2 of the "Brochure cum Layout" PDF to `public/images/gc6-layout-scan.webp` once, 1600 px), right: the digitised SVG as a static render. `caption` "Approved layout (HMDA) vs. the digitised plan used on this page". This is the honesty move that proves the plan is real.

**D-4 · What's on the ground (light, 128 px)** — Eyebrow "AMENITIES", H2 `amenities.title` (kept), lead `amenities.description` (kept). Three 4:3 image cards (`avenue-road`, `clubhouse-pool`, `park-walk`, each captioned "Artist's impression") above a two-column hairline list of all `amenities.items` where `featured` (icon from `ICONS`, name, description — kept verbatim: Clubhouse "25,000 Sq. Yards clubhouse facility.", CC Roads, Drainage, Electricity, Water Tank, Avenue Plantation, Play Area, Rainwater Harvesting, Swimming Pool) plus "Plot Fencing" as a plain chip. Note: the seed has `amenities.visible: false` because the old site never rendered the section; this design renders it — set `visible: true` in the seed (one-line change) and keep the flag honoured.

**D-5 · Location (light `--surface-2`, 128 px)** — Sticky label "LOCATION", H2 `locationAdvantages.title` (kept: "Excellent Connectivity & Access"), body `locationAdvantages.description`, chip "Prime location · Near Mumbai Highway" (`badge`). Left: Expanded Map centred on `location.pin` (17.535588, 78.145298), zoom 13, brass pin, "Get directions" → `https://www.google.com/maps/dir/?api=1&destination=17.535588,78.145298`. Right: tabbed distance grid from `locationAdvantages.categories` (Connectivity: Mumbai Highway — Nearby · Education: GITAM University — Nearby). Two rows is thin; the seed must grow (airport, ORR exit, Patancheru, Sangareddy town, Kokapet with km) — §10.

**D-6 · Approvals (dark `--navy-deep`, 128 px)** — Eyebrow "APPROVALS & LEGAL", H2 `legal.title` (kept), body `legal.description`. Two approval cards from `legal.approvals` (authority icon from `ICONS`, `title`, `reference` in `font-numeral-sm`, `date` via `formatDate`, `description` ("Survey nos 426/P, 427/P, 428, 432, 433/P and 434/P"), status chip green for approved/registered). Document list from `legal.documents`: name + "Available on request" (no `file` in the seed → button "Request copy" opens the enquiry sheet with `doc=…`); when `file` exists it becomes a download link with size. Right column: `approvals-still.webp` 4:3 (the `approvals-still` job already in `kie-generate.py`, "Artist's impression"). A `caption` line: "Verify TS RERA P01100009270 at rera.telangana.gov.in".

**D-7 · Site gallery (light, 96 px)** — Eyebrow "ON SITE", H2 **[new copy]** "Progress on the *ground*", `caption` "Site photos, Greater Infra Projects". Masonry Lightbox with the 14 `media.gallery` images (3:2 / 4:5 crops via `object-fit`), 3 columns desktop / 2 mobile, blur-in stagger, lightbox with prev/next, keyboard, focus trap, counter "4 / 14". Alt text pattern: "Global City VI site — photo 4 of 14".

**D-8 · FAQ (light, 96 px)** — shadcn Accordion, `FAQPage` JSON-LD. Five questions **[new copy]**, answers from data where possible:
1. "Is Global City VI HMDA and RERA approved?" — "Yes. HMDA Final Layout Permit 2046/HMDA/SWFL/2026 (23 Apr 2026) and TS RERA registration P01100009270. Both can be verified with the issuing authority."
2. "What plot sizes are available?" — from `summarize()`: "288 plots from about 147 to 731 sq yd; most are 200–300 sq yd, with a few larger villa plots. Ask us for the current list of available sizes." (adjust once the band is confirmed)
3. "What roads and infrastructure are included?" — "40 ft and 30 ft cement-concrete internal roads, underground drainage and electricity, overhead water tank, avenue plantation and rainwater harvesting; the layout faces a 100 ft road."
4. "Can I visit the site?" — "Yes, site visits run Monday to Saturday. Call +91 97001 23900 or book from this page."
5. "What documents will I get?" — from `legal.documents`.

**D-9 · Enquiry CTA (dark `--ink`, 160 px)** — eyebrow `cta.subheading`, H2 `cta.title` with the last word as accent, body `cta.description`, `caption` `cta.urgency` ("Limited Premium Plots Available") shown as a quiet chip, not a flashing banner. Inline enquiry form (§5.7) prefilled with the project; thank-you state uses `cta.thankYou`.

---

### 5.4 About `/about`

**A-1 · Hero (dark, 72svh)** — `hills-dusk.webp` 21:9 with parallax, eyebrow "ABOUT GREATER INFRA PROJECTS · EST. 2014", H1 (kept) "A Legacy of Trust. A Standard of *Excellence*.", lead (kept) "Building with integrity, planning with precision, and delivering enduring value for generations." Tagline under it in `caption`: "Turning your property dreams into trusted reality" (kept, demoted).

**A-2 · Who we are (light, 160 px)** — Sticky label "WHO WE ARE", H2 (kept) "Purpose-Driven Development", body p1 (kept) "Greater Infra Projects is a real estate development firm guided by a singular philosophy — to build with integrity, plan with precision, and deliver enduring value. Every development is conceived with a long-term perspective, grounded in transparency, ethical practices, and disciplined execution." Pull quote in accent italic 28 px (kept) "Each project is backed by clear land titles, approved layouts, and complete documentation." Right: the real launch collage `about-us.png` (re-encoded to WebP 1600 px) 16:6 with `caption` "Global City VI launch, Rudraram".

**A-3 · Numbers (light `--surface-2`, survey grid)** — Four numerals at 160 px with count-up, each with the kept description, corrected for the contradictions: 11+ Years of industry experience ("With over a decade of hands-on experience…" kept) · 20+ Layouts delivered ("From premium gated communities to open villa plots, we have delivered more than twenty layouts across strategic locations…" — "21 diverse projects" removed) · 600+ Acres developed (kept) · 6000+ Customers ("Our greatest achievement is the trust of thousands of customers who chose us…" — "100+" removed). Zig-zag the four blocks (1–6, 7–12, 1–6, 7–12) as Honer does, but with hairlines instead of stripes.

**A-4 · Mission & vision (dark `--navy-deep`, 160 px)** — Two rows with a hairline: "Our *Mission*" + p1, p2 (kept) + blockquote in accent italic (kept: "Through disciplined execution and ethical practices, we continuously strive to elevate industry standards and deliver on every commitment we make."); "Our *Vision*" + "Building for Generations" as `h3`, p1, p2, blockquote (kept).

**A-5 · Values (light, 128 px)** — Eyebrow "OUR VALUES", H2 (kept) "Investing in tomorrow: building a *lasting legacy*", lead (kept from Home) "A philosophy that guides every decision we make. At Greater Infra Projects, our values are not statements—they are standards." Three tiles with the converted loops and the About copy (kept): **Integrity** `integrity-transparency` — "We conduct ourselves with honesty, transparency, and ethical standards in all aspects of our business." · **Quality** `quality-craftsmanship` — "We are committed to delivering the highest quality in every project we undertake, ensuring durability, functionality, and aesthetic appeal." · **Customer Focus** `customer-first-focus` — "We are dedicated to understanding and exceeding the expectations of our clients, providing exceptional service and value in every interaction."

**A-6 · How we choose land (light, 128 px)** — Eyebrow "CORPORATE STRENGTHS", H2 (kept sub-line) "Premium open plots & real estate development in *Hyderabad*", lead (kept) "Delivering high-value residential plotting ventures with clear titles, prime locations, and strong growth potential across Hyderabad." Bento (kokonutd) of the 8 strengths kept verbatim (Value-driven investments, Strategic Location Selection, Fast & Structured Development, End-to-End In-House Support, Clear Title & Legal Transparency, High Growth Micro-Markets, Financially Disciplined Operations, Projects Selected with Vision); the large tile hosts the `strategic-land-investment-opportunities` loop (transparent, black line-art — light background only, which this is).

**A-7 · Milestones (light, 96 px)** — Interactive Timeline needs per-year photos the client has not supplied; use the Milestone Timeline (no images) with the facts we actually hold: **2014** Founded in Hyderabad (`COMPANY.founded`) · **2021** Global City VI launched at Rudraram (`launchYear`) · **2023** Ninth anniversary (the event collage; year inferred from 2014 + 9 — confirm) · **2026** HMDA Final Layout Permit for Global City VI (23 Apr 2026, `legal.approvals[0].date`). Below: the two real event collages `gallery-land.png` and `gallery-events.png` (WebP 1600) in a 2-up with captions "Global City VI launch" / "9th anniversary celebration". This is where the old `/gallery` content lives now.

**A-8 · Leadership (light, 128 px)** — Eyebrow "LEADERSHIP", H2 (kept) "Visionary leadership. *Disciplined execution*.", lead (kept) "Leadership at Greater Infra Projects defines direction, values, and standards…". Two 4:5 portraits with bios kept verbatim: **Syed Imam**, Chairman & Managing Director (`teams/syed-imam.png` → WebP 800 px) and **Syed Ismail Kashif**, Director – Strategy & Urban Development (`teams/syed-ismail-kashif.png`, crop to 4:5 around the face). The six unnamed real staff are NOT shown until names and roles arrive (§10); the two Unsplash portraits are dropped.

**A-9 · Closing CTA** — as H-8.

The "Greater Infra Projects vs typical plot sellers" table is kept, but it lives on Home (H-6) where first-time visitors do the comparing; it is not repeated on About.

---

### 5.5 Contact `/contact`

No hero image; the H1 is the LCP.

**C-1 · Heading + form (light, 112 px top)** — Eyebrow "CONTACT", H1 (kept) "Let's start a *conversation*.", lead (kept) "We believe investment starts with a conversation, not pressure. Reach out and let us understand your vision." Left (cols 1–5): contact rows with lucide icons as real links — Call `+91 97001 23900` (`tel:`), WhatsApp (`wa.me` with "Hi, I'd like to know more about your layouts."), Email `Gip@greaterinfraprojects.in` (`mailto:`), Office address, Hours "Mon – Sat, 10:00 – 19:00". Response promise `caption` **[new copy]** "We reply within one working day." (client to confirm). Right (cols 7–12): the enquiry form (§5.7) with `h2` (kept) "Begin your journey" and (kept) "Share your details and we'll arrange a personal consultation at your convenience."; `?intent=site-visit` preselects "Book a site visit" and `?project=global-city-vi` preselects the project.

**C-2 · Office (dark `--navy-deep`, 128 px)** — Expanded Map centred on Ameerpet (17.4373, 78.4487; regenerate the exact pin from Google Maps — the old embed string is fabricated), "Get directions" → `https://www.google.com/maps/dir//Vasavi+MPM+Grand,+Metro+Junction,+Ameerpet,+Hyderabad,+Telangana+500016`. Beside it the `<address>`, hours, and a second row "Site office" for Global City VI with its pin and directions link (from `location.pin`) so a buyer can navigate to the layout.

### 5.6 Gallery — merge, do not build

Argument: the old `/gallery` has two images, no title, no indexing value, and both images are event collages that belong with the company story. The project page now carries the 14 real site photos with a proper lightbox. Building a third photo surface would spread 16 images across three pages. Decision: no `/gallery` route in v1; the collages live in A-7, the site photos in D-7. On the Node/Vercel host add `redirects: [{ source: '/gallery', destination: '/about#milestones', permanent: true }]` in `next.config.ts` (redirects are a no-op in the GitHub Pages export; acceptable because the preview is `noindex`). Revisit as a real gallery once drone footage and dated progress photos exist (that is a data model change: `media.progress[]` with dates).

### 5.7 Enquiry form — behaviour (no backend)

Decision: **WhatsApp deep link as the submit action, mailto as the fallback, no server action.** Reason: WhatsApp is the channel GIP's buyers already use; it works identically on the GitHub Pages export and the Node host; it needs no backend, no spam handling and no email deliverability; and the message carries the structured fields so the sales team gets a usable lead. When Supabase lands, `submitEnquiry()` gains an insert before opening the link — the UI does not change.

```ts
// src/lib/enquiry.ts
export interface Enquiry { name: string; phone: string; email?: string; intent: 'site-visit' | 'enquiry' | 'brochure' | 'document'; project?: string; plot?: string; message?: string; }
export function buildWhatsAppUrl(e: Enquiry): string  // https://wa.me/919700123900?text=<encoded multi-line message>
export function buildMailto(e: Enquiry): string       // mailto:Gip@greaterinfraprojects.in?subject=…&body=…
// ponytail: add the Supabase insert here when the backend ships; keep both builders.
```

Fields (Floating Label inputs, native validation, `name` attributes): Name (required, 2–60 chars) · Phone (required, `inputmode="tel"`, +91 prefix shown as a static adornment, 10 digits) · Email (optional, `type="email"`) · I'm interested in (`Select`: Global City VI · Another layout · General enquiry; from `getProjects()` + two fixed options) · Plot (read-only chip when prefilled from the plan, with an × to clear) · Preferred contact (radio: WhatsApp · Call) · Message (textarea, optional, 500 chars) · consent checkbox **[new copy]** "You may contact me about this enquiry." (required) · honeypot `<input name="website" tabindex="-1" aria-hidden>`.

Submit button: brass/navy "Send on WhatsApp" (opens `buildWhatsAppUrl` in a new tab via `window.open` after validation); below it a text link "Prefer email? Send the same message by email" → `buildMailto`. On submit the card swaps (AnimatePresence, 300 ms) to a success state: check icon, `h3` "Thanks, {name}." `body` = `cta.thankYou` for a project ("Our sales team will contact you with complete project details.") or **[new copy]** "We'll reply within one working day, Mon–Sat 10:00–19:00." plus a "Call now" text link. The form is also exposed as a shadcn **Sheet** (`side="right"` desktop, `side="bottom"` mobile) opened by every "Enquire" button; the Sheet and the page form are one component. Errors: inline under the field, `--destructive` text, `aria-describedby`. Nothing is stored in `localStorage` except an unsent draft (name/phone) for convenience, wrapped in try/catch.

---

## 6. Imagery plan

### 6.1 Reuse (exact placements)

| Asset | Where | Treatment |
|---|---|---|
| `public/images/hero-aerial.webp` (kie, 2400×1340) | Home hero H-1 | LCP `<img>`; also 1080/1600 WebP + AVIF sizes |
| `hero-aerial-mobile.webp` | Home hero mobile until K1 exists | replace with K1 |
| `hills-dusk.webp` (2400×1018) | H-4 film band, About hero A-1, 404 | parallax; 30 % on 404 |
| `entrance-arch.webp` | Projects P-1 right column (4:3 crop) | "Artist's impression" caption |
| `avenue-road.webp` | D-2 right, D-4 card 1 | caption |
| `clubhouse-pool.webp` | D-4 card 2 | caption |
| `park-walk.webp` | D-4 card 3 | caption |
| `media.cover` + 14 `media.gallery` Supabase JPEGs | D-1 hero, H-2/P-2 card, D-7 masonry | remote via `next/image` on Node; raw on export; `caption` "Site photo" |
| Old `about-us.png` (2048×768 collage) | A-2 | → WebP 1600, ≤ 220 KB |
| Old `gallery-land.png`, `gallery-events.png` | A-7 | → WebP 1600 each |
| Old `teams/syed-imam.png`, `teams/syed-ismail-kashif.png` | A-8 | → WebP 800×1000 (4:5), Kashif cropped |
| Brochure cum Layout PDF page 2 | D-3 comparison (left) | render once to `gc6-layout-scan.webp` 1600 px; do not ship react-pdf |
| Brochure PDF (23.7 MB) | download links only | label the size; ask the client for a ≤ 5 MB export |
| `GIP_Home_page_video.mp4` (31.7 MB), `Kompally County.mp4` (11 MB) | not in v1 | wrong project / too heavy; re-encode later for an About "ground truth" band, labelled by project |
| `homepage/cover-image1.jpg` (Urban Eden creative) | not used | villa project with an external site; out of scope |

**GIF loops** (`public/illustrations/*.gif`, convert with the ffmpeg lines in `next16-cheatsheet.md` §9 to 512 px MP4 + WebM + poster; play with the `LoopVideo` component, `preload="none"`, paused under reduced motion):

| Loop | Placement |
|---|---|
| `transparency` | H-3 principle 1 |
| `quality-driven-planning` | H-3 principle 2 |
| `trust-reliability` | H-3 principle 3 |
| `timely-responsible-execution` | H-3 principle 4 |
| `integrity-transparency` | A-5 Integrity |
| `quality-craftsmanship` | A-5 Quality |
| `customer-first-focus` | A-5 Customer Focus |
| `strategic-land-investment-opportunities` (transparent, black lines) | A-6 large bento tile — light background only |
| `timely-completion` | P-4 card 4 "Register in your name" (small, 96 px) |
| `gip-logo-animation` (white on transparent) | first-visit brand reveal (§7), as VP9 WebM with alpha (`-c:v libvpx-vp9 -pix_fmt yuva420p`), 760×428, on `--navy-deep` only |
| `customization-options`, `customer-first-focus-7` (duplicate) | not used (off-brand for plots / duplicate) |

Ten of the loops have opaque white backgrounds: place them on white tiles (`oklch(1 0 0)`) inside the warm sections, with an 8 px radius and a hairline, so the white reads as a deliberate card rather than a mismatch.

### 6.2 New kie.ai renders (model `nano-banana-2`, resolution `2K`, `output_format` jpg; add as jobs in `scripts/kie-generate.py`, then `scripts/optimize-images.py`)

Budget: ~70 credits left at ~12 per 2K image ≈ 5 images. Two jobs are already defined in the script and not yet generated (`weekend-villa` 3:2 → D-2 / P-4 lifestyle; `approvals-still` 4:3 → D-6 Approvals). That leaves **three** new prompts, all essential to this direction; nothing optional is proposed. Every prompt ends with the script's `PLACE` suffix (Deccan plateau near Hyderabad, photorealistic, golden hour, no people, no faces, no text, no signboards, no logos, no watermark). Confirm `4:5` is accepted by the endpoint before running K1 (the script has only used 16:9, 3:2, 4:3, 21:9); if not, use `3:4`.

| # | Job name | Aspect | Prompt (before the PLACE suffix) | Where |
|---|---|---|---|---|
| K1 | `hero-aerial-portrait` | 4:5 | "High aerial drone photograph at golden hour, portrait framing, of a newly developed gated plotted layout: a grid of empty plots with low kerbs and survey stones, wide pale cement-concrete roads, young avenue trees with guards, slim LED street lights, a small landscaped park, a white two-storey clubhouse with a blue pool near the centre, the entrance arch at the bottom edge, a 100-foot main road along the bottom, scrubland and low rocky hills at the top, long warm shadows." | Home hero on mobile (designed, not cropped). Until it exists, `hero-aerial-mobile.webp` |
| K2 | `aerial-blue-hour` | 16:9 | "High aerial drone photograph at blue hour, twenty minutes after sunset, of a gated plotted layout: street lights just switched on along a grid of pale concrete roads, warm pools of light on empty plots with survey stones, a lit entrance arch, a clubhouse with a glowing pool, deep blue sky fading to a thin orange band over a low hill line, scrubland dark around the layout." | Home hero beat 2 frame (cross-fades from the golden-hour image as the frame forms); Projects P-2 fallback cover when a future project has no image |
| K3 | `survey-stone-macro` | 3:2 | "Close-up at ground level at golden hour of a plot corner inside a plotted layout: a painted concrete survey stone at the junction of two low granite kerbs, fresh pale cement-concrete road surface, a young avenue tree with a green guard, long shadow, soft bokeh of the layout behind." | Plot sheet header image, enquiry success state, empty states |

Run order if credits run short: `weekend-villa`, `approvals-still` (already queued), then K1, K2, K3. K2 is the first to drop (beat 2 works with the golden-hour image alone). Every kie image on the site carries a `caption` "Artist's impression" and the disclaimer covers it; the project hero and gallery stay real photographs.

---

## 7. Motion system

Library: `motion` (installed, `motion/react`), `lenis` (add). All motion components are client leaves; pages stay Server Components. `MotionConfig reducedMotion="user"` wraps `{children}` in the root layout.

| Moment | Spec |
|---|---|
| **First visit brand reveal** | Once per session (`sessionStorage.gip_seen`), only when the hero image is not yet decoded: a `--navy-deep` overlay plays `gip-logo-animation.webm` (alpha, 760×428 at 50 % width max 420 px) for its 0.8 s, then the overlay slides up (`translateY(-100%)`, 500 ms, `--ease-standard`) while the hero scales 1.06 → 1. Total ≤ 1.3 s. Skipped on reduced motion, on `navigator.connection?.saveData`, on every later navigation, and the hero `<img>` is in the HTML regardless (LCP is the image either way). No Lottie, no spinner, no percentage. |
| **Hero scroll (desktop)** | `useScroll` on a 200vh runway; `useTransform` drives image scale (1.06→1→0.92), frame inset (0→24 px) and radius (0→12 px), headline opacity (1→0 over 35–50 %), numeral strip y (80→0) and opacity (0→1 over 55–85 %). Springless, scrubbed to scroll. Under 1024 px or reduced motion: static stack. |
| **Nav** | Transparent→solid flip 300 ms; hide/show on scroll direction (threshold 8 px, debounced by rAF); anchor-rail dock 200 ms slide. |
| **Section reveals** | `whileInView` once, `margin: "-10% 0px"`: `opacity 0→1, y 24→0`, 600 ms, `cubic-bezier(0.2, 0, 0, 1)` (= admin `--ease-standard`). Children stagger 80 ms, max 6 per group (tables, lists reveal as a whole after the 6th). Headlines h1/h2: Vertical Cut Reveal **per line**, 700 ms, 90 ms stagger; never per character. Images inside reveals also scale 1.04→1. |
| **Parallax** | Only inside `overflow-hidden` frames that are ≥ 50vh tall (H-4, A-1, D-1): `useScroll({ target, offset: ["start end", "end start"] })` → `y: ["-6%", "6%"]`. Off on touch and reduced motion. |
| **Count-ups** | On in-view (40 %), 1.2 s, `easeOut`, `tabular-nums`, odometer slide of the last digit; the "+" is static. Write it with `animate()` on a `useMotionValue` (≈ 25 lines) instead of adding `react-use-measure`. Final values are in the HTML for SEO; the counter only animates the displayed text. |
| **Buttons** | Fill: background darkens 8 % (navy → `oklch(0.30 0.096 251)`, brass → `oklch(0.70 0.11 82)`), arrow icon travels 4 px, 200 ms. Press: scale 0.98, 80 ms. Magnetic pull (Magnetic Button) **only** on the hero's primary button and the D-3 "Enquire about Plot" button — strength 0.25, radius 80 px, pointer: fine only. |
| **Links** | Underline grows from left (`background-size 0→100%`), 250 ms; nav active underline slides between items (shared `layoutId`). |
| **Cards** | Border `--border` → `--foreground-2` (light) / `--border-dark` → `--on-dark-2` (dark), image scale 1→1.03 over 500 ms, caption `y` −2 px. No lift, no shadow. Tilt + Spotlight only on the one project card (H-2/P-2), rotation 4°, spotlight in `--brass-soft`. |
| **Plot plan** | Draw-in (§5.3), hover glow 150 ms, select ring 150 ms, legend filter dims non-matching plots 250 ms, zoom 300 ms `--ease-standard`. |
| **Sheet / dialog** | shadcn defaults (tw-animate-css) with the opaque scrim; 250 ms. |
| **Marquee** | None in v1. If the client later supplies partner-bank logos, use diceui Marquee at 40 s, pause on hover. |
| **Cursor** | **No custom cursor.** The plan's pointer is `cursor: pointer` on plots and `grab/grabbing` when zoomed. |
| **Smooth scrolling** | **Lenis, yes, desktop only** (`lerp 0.1, wheelMultiplier 1, smoothTouch false`), mounted in a client `SmoothScroll` provider, destroyed on `(pointer: coarse)` and reduced motion. Reason: the pinned hero and the parallax scrub are visibly stepped with native wheel scrolling on Windows; Lenis costs 6 kB. `motion`'s `useScroll` reads `window.scrollY`, which Lenis drives, so nothing else changes. Anchor links use `lenis.scrollTo(hash, { offset: -128 })`; `html { scroll-padding-top: 8rem }` covers the no-JS case. |
| **View transitions** | React 19.3 `<ViewTransition>` on the project card → project hero image (shared element, 350 ms) and a 200 ms cross-fade for page roots. Reduced motion: none. |
| **Reduced motion** | `MotionConfig reducedMotion="user"` + the admin global `@media (prefers-reduced-motion: reduce)` rule; loops show posters; hero and parallax static; counters show final values; plan draws instantly; reveals render visible (never leave content at opacity 0). |

What NOT to do: no custom cursor; no film grain, noise or vignette overlays; no gradient or glowing text; no glass; no 3D tilt on lists; no per-character text animation; no scroll-jacking beyond the one hero runway; no autoplay carousels; no bounce/elastic easings; no pulsing dots or "live" badges; no parallax on text; no animations longer than 900 ms except the plan draw-in and the count-ups; no motion that moves layout (reveals use transform/opacity only); no preloader that waits for assets.

---

## 8. Component mapping

Saved references live in `C:\Users\purne\AppData\Local\Temp\claude\J--Jaggu-Projects-gip-platform\a4e3adf4-041d-4c96-8844-7f1972088045\scratchpad\21st\`. Target files under `src/components/site/` (shell), `src/components/sections/` (page blocks), `src/components/plan/` (master plan), `src/components/ui/` (shadcn).

| Section | Build from | Notes |
|---|---|---|
| Header (desktop/mobile), hide-on-scroll, state flip | `navbar-morphing-scroll.tsx` (logic) + `header-3-mega-menu.tsx` (`MenuToggleIcon`, portal drawer) | "use client"; drop the CSS string and blur; `usePathname` for active; no mega-menu (three links) |
| Project anchor rail | hand-build (60 lines, IntersectionObserver scroll-spy) | — |
| Mobile action tray | hand-build (Server Component + `tel:`/`wa.me` links; only the "Enquire" button is a client leaf) | — |
| Home hero | `hero-smooth-scroll-hero.tsx` (useScroll/useTransform pattern) — **not** the gallery-scroll hero (five images scaling into a bento fights the single-image cinematic idea) | rewrite the clip-path into inset/radius transforms; static fallback |
| Headline reveal | `vertical-cut-reveal.tsx` | per-line mode only; keep the sr-only full text; rename `DynamicAnimationOptions` → `Transition` |
| Count-up numerals | hand-build with `motion` `animate()` (skip `count-up.tsx` and `react-use-measure`) | tabular-nums |
| Featured project card | `tilt-spotlight.tsx` | fix `isRevese` typo and the listener leak; rotation 4 |
| Principles / values tiles | plain grid + `LoopVideo` (cheatsheet §9) | Server Component except `LoopVideo` |
| Bento (About strengths) | `bento-grid-kokonutd.tsx` | retoken, drop blur, Server Component |
| Promise rows, difference table, nearby grid | hand-build (semantic lists/tables) | — |
| Stacking "how it works" | `stacking-cards.tsx` | 4 cards |
| Master plan | hand-build `PlotPlan` (`src/components/plan/plot-plan.tsx`, `plot-sheet.tsx`, `legend.tsx`, `use-pan-zoom.ts`) from `gc6-masterplan.json` + `GC6_UNITS` | the one genuinely new component; ~450 lines; snapshot test of the SVG path count (288) |
| Layout scan vs plan | `image-comparison.tsx` | add `role="slider"` + arrow keys |
| Gallery + lightbox | `masonry-lightbox.tsx` + prev/next & focus trap from `gallery-grid-lightbox.tsx` (or wrap in shadcn Dialog) | `motion/react` import; drop blur |
| Timeline (About) | `timeline-milestone.tsx` | de-duplicate the double-rendered cards; four entries |
| Map (Contact, Project) | `expanded-map.tsx` | Carto tiles + attribution; keyboard toggle; "Get directions" link |
| Enquiry form + sheet | `floating-label-input.tsx` + shadcn `sheet`, `select`, `checkbox`, `radio-group` | textarea variant from the exported hook; `src/lib/enquiry.ts` builders |
| FAQ | shadcn `accordion` | `FAQPage` JSON-LD |
| CTA bands | `gradient-cta-banner.tsx` — take only the arrow-travel button as `ArrowButton`; the band itself is a plain dark section with the survey grid | no blob gradient |
| Footer | `footer-with-suite.tsx` (structure) | Server Component; outline wordmark; disclaimer Dialog is a client leaf |
| Primary CTA magnetism | `magnetic-button.tsx` | `asChild` + `next/link`; two instances only |
| Smooth scroll | `lenis/react` `ReactLenis` in `src/components/site/smooth-scroll.tsx` | desktop only |
| Testimonials | hand-build two quotes (skip `reviews-carousel.tsx`) | only if confirmed |

Install: `npm i lenis` (`motion` is already installed) · `npx shadcn@latest add badge card accordion dialog sheet select checkbox radio-group tooltip`. Not installed: `framer-motion` (never beside `motion`), `embla`, `react-pdf`, `react-use-measure`, GSAP, any map library.

Verify `src/lib/utils.ts` first: it re-exports `cn` from the `cn` npm package; every 21st component relies on `className` overrides winning, so swap to `clsx` + `tailwind-merge` if `cn("p-4", "p-2")` does not yield `p-2`.

Globals.css additions: the font utilities (§2), the tokens (§3), `.theme-dark` alias, `@utility no-scrollbar`, the survey-grid `background-image` utilities (`bg-survey-light`, `bg-survey-dark`), the SVG plan keyframes (`draw`, `plot-in`) under `@theme inline`.

---

## 9. SEO and performance

**Metadata (root `layout.tsx` as in cheatsheet §3.2, `lang="en-IN"`, `metadataBase = https://www.greaterinfraprojects.in`, `robots noindex` when `GITHUB_PAGES=true`).** Per page:

| Route | `<title>` | Description | Canonical | OG image |
|---|---|---|---|---|
| `/` | "HMDA & DTCP Approved Plots in Hyderabad \| Greater Infra Projects" | "Greater Infra Projects develops HMDA, DTCP and TS RERA approved open plots and villa plots across Hyderabad — 11+ years, 20+ layouts, 600+ acres. See Global City VI at Rudraram." | `/` | `app/opengraph-image.jpg` (hero aerial, 1200×630) |
| `/projects` | "Plotted Layouts & Villa Plots in Hyderabad \| Greater Infra Projects" | "Current and completed Greater Infra layouts across Hyderabad. HMDA / DTCP approved, TS RERA registered. Filter by status, type and location." | `/projects` | same |
| `/projects/global-city-vi` | "Global City VI – HMDA Approved Villa Plots at Rudraram, Shankarapally" | "288 HMDA-approved plots on 21 acres at Rudraram / Shankarapally near Mumbai Highway. TS RERA P01100009270. 40/30 ft CC roads, 100 ft frontage. See live plot availability." | `/projects/global-city-vi` | `app/projects/[slug]/opengraph-image.tsx` (cover + name + RERA, build-time) |
| `/about` | "About Greater Infra Projects – 11+ Years, 20+ Layouts, 600+ Acres" | "Hyderabad plotted-development company founded 2014. Our principles, leadership and the standard behind every approved layout." | `/about` | collage |
| `/contact` | "Contact Greater Infra Projects – Ameerpet, Hyderabad" | "Call +91 97001 23900, WhatsApp, or visit our Ameerpet office. Book a site visit to Global City VI." | `/contact` | default |

`app/sitemap.ts` (home, projects, each published project with `publishing.updatedAt` as `lastModified`, about, contact), `app/robots.ts` (allow all + sitemap; disallow all on the Pages build), `app/manifest.ts`, `app/icon.svg` from `gip-roof-navy.svg` on a white tile (the old white-on-transparent favicon bug), `apple-icon.png`.

**JSON-LD** (via the `<`-escaping `JsonLd` helper, dates from data only):
- Root: one node `@type: ["Organization","RealEstateAgent"]` (name, url, logo, telephone `+919700123900`, email, address, `areaServed: "Hyderabad"`, `foundingDate: "2014"`, `sameAs` Facebook/Instagram) + `WebSite` (no SearchAction).
- Project page: `RealEstateListing` (name, description, url, image[], `datePosted: publishing.publishedAt`, `about: { "@type": "Place", geo, address }`, `offers: { "@type": "Offer", availability: InStock when counts.available > 0, priceSpecification omitted while showPrice is false }`) + `BreadcrumbList` (Home › Projects › Global City VI) + `FAQPage`.
- About: `AboutPage` + two `Person` nodes (`jobTitle`, `worksFor`).
- Contact: `ContactPage`; the Organization node already carries `contactPoint`.

**Headings outline** (one H1 per page): Home — H1 hero; H2 per section (Global City VI, Built on principle, Brand story, Why choose…, GIP vs typical…, What customers say, Let's start…); H3 for principle/promise items. Projects — H1; H2 "Global City VI", "Delivered since 2014", "How buying a plot works", CTA. Project — H1 name; H2 Vision, Master plan, Amenities, Location, Approvals, Gallery, FAQ, CTA; H3 for approval cards and the selected plot. About — H1; H2 per section; H3 leaders. Contact — H1; H2 "Begin your journey", "Office". Icons have empty `alt`; photos have descriptive alt; the plan has an `aria-label` and the table fallback.

**Images**: extend `scripts/optimize-images.py` (or the sharp script from the cheatsheet) to emit each source at 640 / 1080 / 1600 / 2400 px in WebP (q 78) and AVIF (q 55) into `public/images/<name>-<w>.{webp,avif}`; a `<Picture>` Server Component writes `<picture><source type="image/avif" srcset…><source type="image/webp"…><img width height loading decoding sizes>`. On the Node host use `next/image` with `sizes` and `images.qualities: [60, 78]`; on the export the `<Picture>` path serves the pre-built files via `withBase()`. Budgets: hero ≤ 180 KB at 1080 w, ≤ 420 KB at 2400 w; cards ≤ 90 KB; portraits ≤ 60 KB; collages ≤ 220 KB. Every `<img>` has `width`/`height` (CLS 0). Supabase JPEGs get `sizes="(min-width:1024px) 66vw, 100vw"`. Loops `preload="none"` with posters.

**LCP element per page**: Home — hero `<img>` (`fetchpriority="high"`, `<link rel=preload imagesrcset>` from `next/image` `preload` prop; the brand reveal overlay must not delay the image request). Projects — the P-2 cover. Project — the D-1 hero image. About — A-1 `hills-dusk`. Contact — the H1 text (no hero image, fonts preloaded). 404 — H1.

**Fonts**: two `next/font` instances (Archivo wdth, Newsreader italic opsz), `display: swap`, automatic `size-adjust` fallbacks, preloaded from the root layout; ≈ 120 KB total. No icon font (lucide tree-shaken).

**Budgets**: first-load JS ≤ 160 KB gz on Home (motion ≈ 35 KB, lenis 6 KB, React/Next baseline), ≤ 220 KB on the project page (plan + sheet); no third-party scripts in v1 (analytics tag added as a single `next/script` `afterInteractive` later); Lighthouse mobile ≥ 90 on every route; INP < 200 ms on the plan (pointer handlers are passive, hover state via CSS, not React state).

**cacheComponents rules in force**: no `new Date()`/`Math.random()` in Server Components (year is a constant, "as of" dates come from data), no `"use cache"` anywhere while the Pages export exists, `params` awaited, `generateStaticParams` non-empty, hooks only in client leaves, `next/image` string `src` and `<video>`/`poster` wrapped in `withBase()`.

---

## 10. Risks and open questions

**Client confirmations needed**
1. **HMDA numbers**: the seed carries two — `legal.approvals` says Final Layout Permit `2046/HMDA/SWFL/2026` (23 Apr 2026) while `vision.features[2]` says "Approval No. 007133/LO/HMDA/1700/SKP/2024". Both are shown (permit in the rail/approvals, the 2024 number in Vision as a feature) — confirm whether the 2024 number is the Layout Order application and whether both should appear.
2. **Plot statuses**: Mortgaged 229–266 and the 9 Registered plots are flagged `sample: true`. The page shows a "Sample" chip and the description tooltip; the client must replace them in the admin before launch or the chip stays.
3. **Plot-size band**: `summarize()` gives the real min/max from the 288 polygons; the brochure says "150 – 400 and 700". Decide which the facts strip shows (design uses the computed band, with the brochure string available as a label override).
4. **Price**: `showPrice: false` — the ₹28,000 / sq yd figure is never rendered. Confirm.
5. **Nearby places**: only "Mumbai Highway — Nearby" and "GITAM University — Nearby" exist. The location section needs 6–10 real entries with km (ORR exit, Patancheru, Sangareddy, Kokapet, RGIA, schools, hospitals).
6. **Testimonials**: use only Rakesh Kota and Ravi Kiran, and only if confirmed; otherwise the section is dropped.
7. **Team**: six real staff photos exist under Figma placeholder names; they stay off the site until real names/roles arrive. Confirm Syed Ismail Kashif's portrait crop.
8. **Stats copy**: "20+ layouts" vs "21 diverse projects", "6000+" vs "100+ satisfied" — the design uses 11+/20+/600+/6000+ and rewrites the two contradicting sentences; confirm the four numbers.
9. **Response promise** ("within one working day") and office hours — confirm before publishing.
10. **Milestone years**: 2023 for the ninth anniversary is inferred (2014 + 9).
11. **Brochure**: 23.7 MB PDF — ask for a ≤ 5 MB export; the link is labelled with its size until then.
12. **Drone footage**: the film band is designed for it; until then it is a still.

**Design/technical risks**
- **Dark sections and AI imagery honesty**: every kie render is captioned "Artist's impression" and covered by the disclaimer; the project hero and gallery must stay real photos even though they are phone-quality. Grade the real JPEGs (slight warm, lifted blacks) in the optimize script so they sit next to the renders.
- **Newsreader italic cliché risk**: the accent face is used only for one phrase per heading and quotes. If it reads "template", swap to Archivo Italic wdth 100 wght 300 in brass — one token change (`--font-accent`).
- **Lenis on low-end devices**: desktop only, destroyed on coarse pointers; test on a 4 GB Windows laptop (the dev machine) at 1366 px.
- **Pinned hero + Windows mouse wheels**: scrub steps are the reason for Lenis; if it still judders, drop beat 2 to a plain reveal (the frame + numerals appear on `whileInView`) — the design survives without the pin.
- **Brand reveal vs LCP**: the overlay must not block the hero image request; measure. If LCP > 2.5 s on 4G, remove the reveal (it is a 40-line client component).
- **288 SVG paths + glow filter**: `feGaussianBlur` on a duplicated layer is cheap on desktop, heavier on mid-range Android; gate the glow layer behind `(pointer: fine)` and keep the static fills on touch.
- **Plan accessibility**: 288 focusable paths is a long Tab list; provide the "View as table" `<details>` and a skip link "Skip the layout map".
- **Supabase JPEG hotlinking**: the cover/gallery URLs come from the client's bucket; on the Pages export they are unoptimised ~110 KB each (fine). If the bucket moves, `remotePatterns` and the seed change together.
- **GitHub Pages export**: no redirects (the `/gallery` redirect is Node-only), no server actions (the form is client-side by design), `images.unoptimized` (the `<Picture>` path covers it), `noindex` mandatory.
- **cacheComponents**: any later "Status as of" that reads the clock, or a `Math.random()` placeholder, breaks the build — all dates come from `inventoryUpdatedAt`/`statusDate`.
- **Carto/OSM tiles**: brochure-level traffic is within Carto's free basemap terms; attribution text is required in the map corner.
- **GIF → video conversion** needs ffmpeg on the build machine; keep the GIFs as the `<noscript>` fallback only, never as the default (12.8 MB).
- **Two accent-colour temptations**: WhatsApp green is icon-only; status teal is plan-only. If either leaks into buttons the palette collapses to five colours — enforce in review.
