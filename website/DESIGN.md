---
name: Greater Infra Projects
description: GIP's own premium site for its approved plotted layouts. The company's content told through its own components, set in Inter on GIP navy and white.
colors:
  canvas: "#ffffff"
  brand: "#033967"
  navy: "#033967"
  navy-deep: "#01223f"
  navy-soft: "#1d5a92"
  text: "#3a4b5e"
  muted: "#5f6f82"
  line: "#e7e1d6"
  line-strong: "#d3c9b8"
  mist: "#f6f2ea"
  mist-2: "#ece5d8"
  teal: "#2cc4b6"
  teal-deep: "#0d7068"
  teal-soft: "#dcf2ef"
  selection: "#ecdcb9"
  go: "#13804a"
  go-soft: "#e3f4ea"
  on-navy: "#ffffff"
  on-navy-2: "#b8c8da"
  scrim: "rgb(1 20 38 / 0.55)"
  destructive: "#c62828"
  whatsapp: "#25d366"
typography:
  hero:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.875rem, 1.05rem + 6vw, 6.5rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.05em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.35rem + 3.3vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  mega:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(6.5rem, 1rem + 17vw, 17.5rem)"
    fontWeight: 500
    lineHeight: 0.8
    letterSpacing: "-0.06em"
    fontFeature: "\"tnum\", \"lnum\""
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 2.05rem + 1.85vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  stat:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(4.5rem, 2.4rem + 7.4vw, 9rem)"
    fontWeight: 500
    lineHeight: 0.88
    letterSpacing: "-0.055em"
    fontFeature: "\"tnum\", \"lnum\""
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 1.55rem + 1.35vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.14
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 2.05rem + 1.85vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "\"tnum\", \"lnum\""
  lede:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.08rem + 0.18vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.011em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.98rem + 0.09vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.65
  ui:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
  small:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.35
  chip:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  2xl: "20px"
spacing:
  gutter: "20px phone, 32px from 640px"
  content: "1280px"
  section-primary: "96px phone, 144px desktop"
  section-secondary: "80px phone, 112px desktop"
---

# Greater Infra Projects — design system

GIP's own identity. It must stay completely different from honerhomes.com (the client's copyright worry): no coral,
no sky-blue italic accents, no serif display, no pill-shaped actions, no inset navy hero frame, no floating three-pill
tray, no diagonal-panel menu, no uppercase tracked eyebrows, no giant italic numerals, no grey pill nav. The calibre of
that site is the bar; nothing of its look is.

The palette and type come from GIP's own live site (greaterinfraprojects.in): Inter throughout, GIP navy `#033967`
for headings, slate text, white; teal and a cool teal-white mist were added as the secondary layer (2026-10-23,
chosen by the client from four rendered options after a champagne-gold version was rejected).

## Colour

- **White** is the page. **Mist** is a cool teal-white `#f0f6f6`, the alternate surface (footer, quiet panels,
  image wells); hairlines carry a faint teal cast to match.
- **GIP navy** carries headings (`h1–h3` are navy by default), the one primary action in view, and the closing band
  (`navy-deep`). `brand` is the same navy but never flips; use `bg-brand` for filled controls.
- **Slate** `text` for body, `muted` for meta. **Hairlines** `line` / `line-strong` divide lists and frame cards.
- **Teal** is the secondary colour, used boldly (the client's pick): `teal` #2cc4b6 on navy surfaces, as a solid band
  under navy text (7.4:1) and for decorative marks; `teal-deep` #0d7068 for small text and marks on white / mist
  (never `teal` as small text on light grounds); `teal-soft` #dcf2ef as a tinted section ground. Its roles, the same
  everywhere: index numerals, short accent rules, progress lines, active states, quote marks, the primary action on
  navy (`Button variant="teal"`), the record's figures on its dark stage, the Client Feedbacks band, the Values tint, the
  loader's drawing line. Navy stays dominant: outside the two teal grounds, teal stays an accent. Not coral (Honer),
  not sky-blue italics.
- **Aurora** (`@/components/site/aurora`): the light sections (About, Principles, the club house, Values, Recent
  projects, Why Choose Us, the footer) sit on white with soft teal, mint and sky light drifting slowly behind them and a
  film grain; each section has its own arrangement (`scene` a–f) so the light never repeats. The client picked it from
  four rendered options (2026-10-26). Navy, the teal band and the film/picture sections keep their own grounds.
- **Green** `go` only means "available" / "selling now".
- The old line drawings keep their live-site colours (the client asked for them unchanged), on white tiles.
- `.on-navy` flips tokens for navy surfaces: `text-navy` becomes white, `text`/`muted` become `on-navy-2`, lines turn
  white at 14 %. Use `variant="teal"` (the primary there), `"light"` or `"outline-light"` buttons, never `primary`.

## Type (globals.css utilities, all Inter)

| utility | size | weight | use |
| --- | --- | --- | --- |
| `text-hero` | 46 → 104 px | 500, -0.05em | the home hero line only |
| `text-title` | 40 → 72 px | 500, -0.045em | home section headings |
| `text-mega` | 104 → 280 px | 500, -0.06em, tabular | the home record on its stage (11+, 20+, 600+, 6000+) only |
| `text-display` | 40 → 56 px | 500, -0.04em | page H1 on inner pages |
| `text-stat` | 72 → 144 px | 500, -0.055em, tabular | the record under reduced motion; the principle indexes |
| `text-h2` | 30 → 44 px | 500, -0.035em | section headings |
| `text-h3` | 20 → 24 px | 600, -0.02em | item titles |
| `text-figure` | 40 → 56 px | 500, tabular | counts in data components only |
| `text-lede` | 18 → 20 px | 400 | the paragraph after a heading |
| `text-body` | 16 → 17 px | 400, 1.65 | running text |
| `text-ui` | 15 px | (500 via class) | nav, buttons, controls |
| `text-small` | 14 px | 400 | meta, captions |
| `text-label` | 13 px | 600 | field labels, chips, column heads |

Rules: one heading per section. Home is the exception the client asked for (2026-10-21): it mirrors the live
greaterinfraprojects.in home word for word, including its section labels and the projects kicker, drawn as
`SectionChip` (white pill with a teal dot; `tone="dark"` on navy). Other pages keep no label or kicker above a
heading. No italics, no two-tone headlines, no gradient text.
Emphasis comes from weight (500 → 600) or size. Body measure ≤ 70ch. Numbers in data use `tabular-nums`.

## Shape and depth

Radii: 10 px (`rounded-md`) for buttons, inputs, small media; 14 px (`rounded-lg`) for pictures and panels; 20 px
(`rounded-2xl`) for the large home frames and the principle cards; 28 px only on a film window while it opens. Cards
are white with a `border-line` hairline, not grey fills. Shadows on things that float (header panel, dock, drawer) and
on the stacked principle cards: `shadow-raise`, `shadow-overlay`. Navy surfaces carry `grain` (film grain).

## Components (reuse; do not re-invent)

- `Button` (`@/components/ui/button`): variants `primary` (navy), `secondary` (white + hairline), `light`,
  `outline-light`, `ghost`, `link`; sizes `sm` 40, `default` 48, `lg` 56. Add `<Arrow />` (same module) inside a
  button for the sliding-arrow hover. Icons left of text only for Call / WhatsApp / Download.
- `EnquireButton` (`@/components/site/enquire-button`): opens the enquiry drawer; props `interest`, `variant`, `size`,
  `arrow`.
- `TextLink` (`@/components/site/text-link`): navy-soft medium text, underline draws in, sliding arrow. External,
  tel:, mailto:, # links render `<a>`.
- `Container` (1280 content, 20/32 px gutters), `Section` (`tone` white | mist | navy, `rhythm` primary | secondary |
  none).
- `Plate` + `ImpressionChip` (`@/components/site/plate`): pictures in a 14 px frame; every render passes
  `impression` (chip bottom-left, "Artist's impression").
- `Lede`, `StatusChip` (`@/components/site/typography`): `StatusChip` is the green dot chip ("Selling now"); `tone="plain"`
  for neutral states ("Completed").
- `Reveal`, `RevealGroup` (`@/components/site/reveal`): fade + 14 px rise, once. Use on a few blocks per page, never on
  every heading, never above the fold.
- `Closing` (`@/components/site/closing`): the navy close on every page (props `title`, `text`, `interest`,
  `whatsapp`).
- `LineArt` (`@/components/site/line-art`): the old site's animated line drawings in their own live colours, on a
  white ground (multiply drops their white into it).
- Motion (`@/components/motion/*`): `Choreo` wraps a server-rendered section and runs its `data-anim` entrances (see
  Motion); `Magnetic` around primary CTAs; `ContextCursor` + `data-cursor="View"` labels what a click does;
  `SmoothScroll` (Lenis, Home only); `gsap.ts` exports `MOTION_OK`, `DESKTOP` / `PHONE` (rem, same as Tailwind `lg`).
- `Accordion` (`@/components/ui/accordion`), `Dialog`, `Sheet` from `@/components/ui/*`.
- `StatusChip` (`go`, `go-navy` hairline version for navy surfaces, `plain`), tabs and segmented controls are drawn
  with hairlines; active state = navy text + a 2 px teal bar, or a white segment on mist.

## Header, menu and contact

- **Header** (every page): only the logo, Book a site visit (from `sm`) and a Menu button, so a first screen gets the
  whole viewport. Over the Home hero it is transparent with the white logo and white hairline buttons (the hero keeps
  the one teal action); elsewhere a white blurred bar with a hairline. It slides away while scrolling down past 120 px and returns on scroll up, near
  the top or on focus (never under reduced motion).
- **Menu** (`SiteMenu`): a full-screen navy-deep page with grain, wiping down from the top (0.8 s, `expo.inOut`;
  reduced motion: a fade). Left: Home, Projects (with Global City VI and Delivered layouts), About, Contact at
  `text-title` with teal indexes, the current page marked with a teal dot. Right, behind a hairline: call, email,
  office and hours, the social icons and a teal Book a site visit. Our own layout, not Honer's diagonal panel.
- **Contact in reach**: phones keep the navy action bar (Call, WhatsApp, Site visit); desktop shows a small dock
  (brochure on project pages, WhatsApp, the phone number) once the first screen has scrolled away.

## Patterns that make the site GIP's

- **Spec sheet**: facts as a `dl` of label / value rows on hairlines (label `text-small text-muted`, value
  `text-ui font-medium text-navy`), not icon grids.
- **Switchers**: one big picture with tabbed thumbnails or a segmented control under it, crossfading 500 ms.
- **Rows, not cards**: lists of items (promises, strengths, FAQs) are rows on hairlines with a title and a line of
  text. Same-size icon cards as page structure are banned.
- **Projects page** (the client's choices, 2026-10-26): it opens on `ProjectsHero`, the "full-screen" hero picked
  from three rendered heroes after a navy band with a photo mosaic was called too dark and basic. Its background was
  Home's film until 2026-10-27, when the client asked for one generated still instead: a kie.ai aerial render of a
  plotted layout at golden hour (`projects-hero.webp`; phones frame its entrance arch). It fills the first screen
  under the transparent header, scrims only from the foot and the left (light, contrast-checked), the H1 large in the
  lower-left third in rising word masks, teal rule, lede with the live counts, teal Book a site visit + See current
  projects; along the foot the record (live counts, then 600+ acres and 6,000+ customers from HOME_STATS) with the
  Artist's impression note and a scroll cue; a short 140svh runway on desktop lifts the copy away while the picture
  pushes in. Then `ProjectGrid`s of `ProjectCard`, three to a row: the "editorial frame"
  card the client picked from three rendered styles: the picture inset in a light 20 px card, status chip, name,
  place with a pin, facts as a spec row on hairlines, a full-width primary action only when there is somewhere to go
  (View project, Visit website; no Enquire). Real photographs only: no photo, a stock image from the old data or a
  render (`Asset.impression`, `source: 'generated'`) draws a plotted layout instead (`LayoutDrawing`). Fed by the
  backend (`getProjects`). The project gallery likewise shows real site photographs only.
- **Sticky split**: a heading + short copy that stays while a list or picture column scrolls (lg only).
- **Bands**: one full-bleed film moment per page at most; the navy `Closing` ends every page.

## Home (src/lib/home.ts is the copy, verbatim from the live site)

The live greaterinfraprojects.in home, section for section and word for word, each section its own scroll moment:

0. **Logo loader** (first visit in a session; skipped under reduced motion) — upgraded from the live site's animated
   logo: on navy-deep the roof mark is drawn in teal outline, its six pieces fly in and fill white, the wordmark rises
   letter by letter while a teal counter and hairline run to 100; then the roof turns into a window onto the hero film
   and the screen pushes through it. Scroll is held meanwhile; without script it fades after 4.5 s.
1. **Hero** — the hero film fills the first screen: a 15 s seamless montage (the entrance arch at golden hour, the
   tree-lined avenue at sunset, the layout's lights at dusk; renders animated with kie.ai, chosen by the client); the line at `text-hero` along the foot,
   a light first line over a medium second line set against the right edge, words rising out of masks; a teal rule,
   the lede and the two actions (teal primary) above it on the right; a foot bar with the impression note, a scroll
   cue and the film's progress as a teal hairline. Scroll (250vh sticky runway): the lines part and fade, the film
   pushes in, then About slides up over the hero like a sheet (rounded top) while the hero recedes and darkens.
2. **About** — editorial spread: the name large, a drawn rule, the first paragraph as a statement whose words brighten
   as it is read, the villa picture (wipes open, drifts) beside the second paragraph and Read More; the live film wipes
   open from the left; Our Brand Story with its heading held while the paragraphs pass.
3. **The record** — the page's dark beat: a 420vh grained navy-deep stage, the figures in teal: one figure at a time in `text-mega`, an odometer rolling 11 → 20 → 600 →
   6000 with the label and paragraph crossfading and a 01–04 index filling along the foot. Phones: a stacked list,
   each figure rolling up once. Screen readers get one ordered list.
4. **Built on Principle** — four large sticky cards that stack into a deck as the page scrolls (covered cards shrink
   and dim); the fourth is GIP navy.
5. **A Legacy Built on Trust and Planning** — a sticky stage: the club house panorama pans, then the second render
   wipes up over it.
6. **Our Promise** — navy index: the four promises as numbered hairline rows, a soft light following the pointer.
7. **Our Values** — on a soft teal band, a sticky split: heading, lede and one drawing held on the left, the three values as tall rows on the
   right; the drawing switches to the row crossing the middle of the screen.
8. **Our recent projects** — a horizontal gallery: the five cards travel left as the page scrolls (sticky stage),
   photographs drifting inside their frames. Phones: a swipe strip.
9. **Get in touch** — the live section's picture as a window that opens to the full bleed, the line at `text-hero`.
10. **Why Choose Us** — three numbered columns between drawn hairlines, then the film morphing from a pill to its frame.
11. **Client Feedbacks** — a solid teal band (all text navy): a quote stage: one quote at a time in `text-h2`, counter, prev/next, pause and a progress
    hairline (autoplay only on screen, visible and motion allowed).
12. **Thank you** — navy-deep close: the sentence brightening word by word over the faint roof mark, Get in touch.

## Motion

GSAP 3.15 (ScrollTrigger, SplitText via `@gsap/react`) with Lenis smooth scrolling on Home; the hero runs on motion's
`useScroll`. The site ease is `--ease-out` (cubic-bezier(0.16, 1, 0.3, 1), GSAP `expo.out`); wipes use `expo.inOut`;
scrubbed tweens ease `none`.

- **Entrances** come from `Choreo` + `data-anim`: `lines` / `words` / `chars` (SplitText masks, padded for
  descenders), `scrub-words` (words brighten as read), `fade-up`, `stagger`, `line-x` / `line-y` (drawn hairlines),
  `reveal` (a frame wipes open, its media settles), `parallax`, `scale-in`. They play once and are skipped when
  already scrolled past at load. `chars` only on h1–h3.
- **Stages** (hero, record, legacy, gallery) are a tall runway with a CSS-sticky screen, driven by a scrubbed
  timeline from the runway's top to its bottom. Never ScrollTrigger `pin` (order-independent under Lenis).
- Every query uses `DESKTOP` / `PHONE` from `gsap.ts` (rem), inside `gsap.matchMedia` under `MOTION_OK`. Phones get no
  pinned stages; light scrubs (film morph, window opening, panorama pan) and entrances only.
- Reduced motion: no smoothing, no runways, no autoplay, no animation; every section has a static layout with all
  content shown.
- Only transform, opacity, clip-path (and object-position for the panorama). Films play only while on screen and pause
  on demand.

## Content rules

Never invent facts (prices, dates, distances, testimonials, awards). Renders always carry "Artist's impression". Real
phone +91 97001 23900. Keep Honer's name, colours, copy and patterns out of everything that ships.
