# 21st.dev component catalog — GIP website revamp

Scouted 2026-10-19 for the Next.js 16.4 / React 19 / Tailwind v4 / shadcn "radix-nova" rebuild of greaterinfraprojects.in.
Full source (component + demo + custom registry deps) for every pick is saved OUTSIDE the repo (paid 21st content) at:

`C:\Users\purne\AppData\Local\Temp\claude\J--Jaggu-Projects-gip-platform\a4e3adf4-041d-4c96-8844-7f1972088045\scratchpad\21st\`

Each saved file starts with a header: 21st URL, author, demo id, install command, npm/registry deps and Next-16 / RSC / Tailwind-v4 / GIP-token adaptation notes. The "Saved path" column below is relative to that folder.

## Ground rules that apply to every pick

1. **Motion library**: install `motion` and import from `"motion/react"`. Several picks still import `framer-motion`; the API is identical, only the import changes. Do not install `framer-motion` and `motion` side by side.
2. **shadcn is already initialised** (`components.json` style radix-nova, `src/components/ui/button.tsx`, `@/lib/utils`). Caveat: `src/lib/utils.ts` re-exports `cn` from the `cn` npm package, not shadcn's clsx + tailwind-merge. Every 21st component assumes a `className` override beats the base classes; verify the `cn` package merges conflicting Tailwind utilities, and if not swap to `clsx` + `tailwind-merge`. Add the remaining primitives with `npx shadcn@latest add badge card navigation-menu accordion dialog sheet`. The shadcn v4 CLI emits the unified `radix-ui` package (installed); never add the per-package `@radix-ui/react-*` deps that some 21st entries list.
3. **Design tokens are not ported yet**: `src/app/globals.css` and `layout.tsx` still carry the neutral shadcn defaults (black primary, Geist, radius 0.625rem). Port the admin tokens (Archivo with wdth axis, navy `--primary: oklch(0.34 0.096 251)`, radius 0.375rem, the single overlay shadow) BEFORE restyling any component, or every retoken pass gets redone.
4. **Tailwind v4**: no `tailwind.config`. Any keyframes a component needs go in `globals.css` under `@theme inline { --animate-*: ... @keyframes ... }`. Most picks already use v4 syntax (`bg-linear-to-r`, `gap-(--var)`, `px-5!`).
5. **No frosted glass** (admin rule): every `backdrop-blur-*` in these components gets replaced with an opaque token background. Blurred gradient *glows* (spotlight, CTA blob) are fine.
6. **RSC**: only leaves that use hooks need `"use client"`. Footer and the bento grids can stay Server Components.
7. **Two build targets**: `next.config.ts` switches to `output: "export"` + `images.unoptimized` when `GITHUB_PAGES=true`. In that build there are no server actions or route handlers, so the contact form must post client-side to Supabase (RLS insert policy) and `next/image` serves the raw webp. `cacheComponents` is on for the normal build: keep hooks out of `page.tsx`.
8. **Assets already in place**: kie renders at `public/images/` (`hero-aerial.webp` + `hero-aerial-mobile.webp`, `avenue-road`, `clubhouse-pool`, `entrance-arch`, `hills-dusk`, `park-walk`), the old site's value-prop GIFs at `public/illustrations/` (0.3-1.9 MB each: convert to animated webp or webm before shipping), brand SVGs at `public/brand/`. Remaining photos come from `J:\Jaggu Projects\GIP Website\gipproperties\public`.
9. **Content**: real data only (`src/lib/constants.ts`, `src/lib/data/global-city-vi.ts`, old-site copy). The projects page hardcodes ONLY Global City VI (already modelled in `src/lib/data/`).

## Chosen components

| # | Need | Chosen (author) | 21st URL | Deps | Where on our site | Effort | Saved path |
|---|------|-----------------|----------|------|-------------------|--------|------------|
| 1 | Hero, scroll-driven reveal | **Hero Gallery Scroll Animation** (youcefbnm) | https://21st.dev/@youcefbnm/components/hero-gallery-scroll-animation | motion, cva, cn | Home hero: the five kie renders already in `public/images/` (avenue-road, clubhouse-pool, entrance-arch, hills-dusk, park-walk) scale/translate into a bento as you scroll; H1 + CTA stay real DOM text | S | `hero-gallery-scroll-animation.tsx` |
| 1b | Hero, parallax alt | Smooth Scroll Hero (ishamsu) | https://21st.dev/@ishamsu/components/smooth-scroll-hero | motion | Alternative single-image/video parallax hero with clip-path reveal; `public/images/hero-aerial.webp` + `hero-aerial-mobile.webp` map 1:1 onto its desktopImage/mobileImage props; swap bg-image for `<Image fill priority>` or a drone `<video>` | S/M | `hero-smooth-scroll-hero.tsx` |
| 2 | Navbar, scroll shrink | **Morphing Scroll Navbar** (laziekiki) | https://21st.dev/@laziekiki/components/morphing-scroll-navbar | none (CSS string) | Site header: full-width -> floating capsule, compacts on scroll-down, restores on scroll-up, reading progress. Needs "use client", CSS moved to globals, blur removed, `usePathname` for active link | M | `navbar-morphing-scroll.tsx` |
| 2b | Mega menu + mobile drawer | Header 3 (efferd) | https://21st.dev/@efferd/components/header-3 | radix navigation-menu (via `radix-ui`), lucide, tw-animate-css | Source for the Projects/Company mega-menu, the portal mobile drawer and the zero-dep hamburger->X `MenuToggleIcon`. Combine with 2 | M | `header-3-mega-menu.tsx` |
| 3 | Bento / feature grid | **Bento Grid** (kokonutd) | https://21st.dev/@kokonutd/components/bento-grid | lucide, cn | "Why GIP" grid: HMDA/DTCP/RERA approved, clear title, bank-loan eligible, gated layouts. Tiles can host the old site's value GIFs from `public/illustrations/` (transparency, trust-reliability, timely-completion...) once converted to animated webp. Retoken colours, drop blur | S | `bento-grid-kokonutd.tsx` |
| 3b | Bento layout recipe | Feature Bento (uilayout) | https://21st.dev/@uilayout.contact/components/feature-bento | lucide | Home "At a glance": big GC VI image card + stat tiles (hosting CountUp). Static layout, no props | S | `feature-bento-uilayout.tsx` |
| 4 | Animated stats | **Count Up** (unlumen) | https://21st.dev/@unlumen/components/count-up | motion, react-use-measure | 11+ years / 20+ projects / 600+ acres / 288 plots; `digitEffect="slide"` odometer, in-view trigger | S | `count-up.tsx` |
| 5 | Infinite marquee | **Marquee** (diceui) | https://21st.dev/@diceui/components/marquee | radix-ui (installed), cva; needs 12-line `useComposedRefs` + keyframes in globals.css | Approvals / bank-partner logo strip, or locations ticker. Accessible (role=marquee, reduced-motion, pause on hover) | M | `marquee-diceui.tsx` |
| 6 | Testimonials | **Reviews Carousel** (educalvolpz / SmoothUI) | https://21st.dev/@educalvolpz/components/reviews-carousel | motion, lucide | Spring-stacked quote cards with keyboard + autoplay. Only if the old site has real testimonials; retoken `bg-brand`, drop blur, scope key listener | S | `reviews-carousel.tsx` |
| 7 | Gallery + lightbox | **Masonry Lightbox** (ayushmxxn) | https://21st.dev/@ayushmxxn/components/masonry-lightbox | motion, next/image | /gallery and GC VI photo strip: CSS-columns masonry, blur-in stagger, `layoutId` shared-element zoom. Needs prev/next + focus trap (take from 7b or wrap in shadcn Dialog) | M | `masonry-lightbox.tsx` |
| 7b | Gallery filter + nav | Gallery Grid with Lightbox (moumensoliman) | https://21st.dev/@moumensoliman/components/gallery-grid-block-shadcnui | motion, shadcn badge/button/card | Donor for category filter chips (popLayout reflow) and prev/next keyboard logic; merge into 7 | S | `gallery-grid-lightbox.tsx` |
| 8 | Sticky scroll stack | **Stacking Cards** (danielpetho / fancycomponents) | https://21st.dev/@danielpetho/components/stacking-cards | motion, cn | "Buying a plot with GIP in 4 steps" or "What a GIP layout includes": pinned cards scale down as the next slides over | S | `stacking-cards.tsx` |
| 9 | Text reveal | **Vertical Cut Reveal** (danielpetho / fancycomponents) | https://21st.dev/@danielpetho/components/vertical-cut-reveal | motion, cn | Hero H1, section headings, eyebrows. Keeps full text in `sr-only` (SEO safe). Rename `DynamicAnimationOptions` -> `Transition` | S | `vertical-cut-reveal.tsx` |
| 10 | Magnetic button | **Magnetic Button** (mohammadshehadeh / Hirael) | https://21st.dev/@mohammadshehadeh/components/magnetic-button | motion, radix Slot | Primary CTAs ("View Global City VI", "Book a site visit") via `asChild` + next/link. Reduced-motion aware | S | `magnetic-button.tsx` |
| 11 | Tilt / spotlight card | **Tilt + Spotlight** (ibelick / motion-primitives) | https://21st.dev/@ibelick/components/tilt | motion, cn | Global City VI project card and plot-type cards; rotationFactor 4-6, subtle spotlight glow. Fix `isRevese` typo and Spotlight listener leak | S | `tilt-spotlight.tsx` |
| 12 | Timeline | **Interactive Timeline** (shadcnspace) | https://21st.dev/@shadcnspace/components/timeline-02 | motion, lucide, shadcn button/badge | About page journey 2013/14 -> 2026, one real project photo per year. Add `no-scrollbar` utility, guard `scrollIntoView` on mount, drop `href="#"` fallback | M | `timeline-interactive.tsx` |
| 12b | Timeline, no images | Milestone Timeline (uiable) | https://21st.dev/@uiable/components/feature-24-milestone-timeline | motion | Lighter alternating vertical timeline if the client cannot supply per-year photos; de-duplicate the double-rendered cards | S | `timeline-milestone.tsx` |
| 13 | FAQ accordion | **shadcn `accordion`** (radix, already installed) | n/a | radix-ui | Project page FAQ (approvals, registration, loan). Nothing on 21st beats the native primitive; the animated ones add Base UI or spring deps for no gain | S | not saved (run `npx shadcn@latest add accordion`) |
| 14 | Contact form, floating labels | **Floating Label** (ddoemonn) | https://21st.dev/@ddoemonn/components/floating-label | motion | Contact + enquiry forms (Name, Phone, Email, Project, Message). Keeps native `required`/`name`; submit via a server action on the normal build, but the GitHub Pages export has no server actions, so post client-side to Supabase there; add a textarea variant from the exported hook | M | `floating-label-input.tsx` |
| 15 | Footer | **Footer with Suite** (scrollxui) | https://21st.dev/@scrollxui/components/footer-with-suite | none | Site footer: link columns + contact `<address>` + oversized "GREATER INFRA" wordmark (Archivo wdth) or white lockup on navy. Make it a Server Component, remove `select-none` | S | `footer-with-suite.tsx` |
| 16 | Preloader / page transition | **None** (see rejected) | n/a | n/a | Use Next 16 View Transitions for route changes; skip a gating preloader (hurts LCP). If the client insists, a 20-line `motion` AnimatePresence overlay in `app/template.tsx` | S | not saved |
| 17 | Smooth scroll | **`lenis` package directly** (`ReactLenis root` from `lenis/react`) | https://21st.dev/@uilayout.contact/components/smooth-scroll (confirms the pattern) | lenis | Client `SmoothScroll` provider in `app/layout.tsx`; `motion`'s `useScroll` works unchanged with Lenis. Nothing to copy from 21st | S | not saved |
| 18 | Map / location | **Expanded Map** (dev.shejanmahamud) | https://21st.dev/@dev.shejanmahamud/components/expanded-map | motion, next/image (unoptimized tiles) | Contact page (Ameerpet office) and GC VI location card: tilt card expands to real Carto/OSM tiles, no map lib, no API key. Add OSM/CARTO attribution, keyboard toggle, "Get directions" link to Google Maps | S | `expanded-map.tsx` |
| 19 | Before / after slider | **Image Comparison** (ibelick / motion-primitives) | https://21st.dev/@ibelick/components/image-comparison | motion, cn | GC VI page: scanned approved layout vs digitised 288-plot master plan, or site then/now. Add keyboard (role=slider) and next/image | S | `image-comparison.tsx` |
| 20 | CTA banner | **Gradient CTA Banner** (shadcnspace) | https://21st.dev/@shadcnspace/components/cta-01 | motion, lucide, shadcn button | Closing CTA on Home / About / Project: recolour blob to navy + sand; extract the text-slide / arrow-travel button as a shared `ArrowButton` | S | `gradient-cta-banner.tsx` |

Effort key: S = retoken + swap imports (< 1 h), M = structural edits (merge, a11y, CSS moved) (1-3 h), L = rewrite.

## Looked at and rejected

| Component | Why rejected |
|-----------|--------------|
| Hero Scroll Video Pin Reveal (ajith66310, id 25482) — saved as `hero-scroll-video-pin-reveal.tsx` for reference only | Needs GSAP + ScrollTrigger + SplitText and dynamically imports the deprecated `@studio-freight/lenis`; injects `body,html{background:#0d0f0d!important}`; cleanup kills ALL ScrollTriggers on the page; creates its own Lenis instance; glassmorphic play button; hardcoded hex. The one good idea (circle clip-path video expand on a sticky section) is ~40 lines with `motion` `useScroll` + `useTransform`; build that instead with the old site's drone GIF converted to mp4. |
| Growth Story Timeline (shadcnspace, id 28273) | Registry entry is incomplete: `get_component` returned only the Badge dep, not the `timeline-01-utils/timeline` file that does all the work. Replaced by Interactive Timeline (28276). |
| 3D Flip Card property card (shadcnspace, id 28229) | Pure-CSS 3D flip is nice, but the plot specs and CTA live on the hover-only back face: no touch/keyboard path, and listing data hidden from first paint is bad UX and SEO for project cards. |
| Preloader (gaxocif204, id 13967) | Adds GSAP for two tweens, polls `document.readyState` in rAF, no `"use client"`, blocks LCP. |
| Greeting / Card-Fan / Mono-Contrast / Neon / Zero-Melt preloaders (kedhareswer, odysseyui) | WebGL or novelty effects; off-brand for a real-estate developer and heavy on a low-RAM target. |
| Page Transition (su2491251, id 29262) | Stair/wave overlays fight the App Router; Next 16 View Transitions do this natively. |
| Navbar Menu (aceternity, id 1024), Navbar Section 2 (solaceui), Scroll Navigation Menu (spaceboydavey) | Hover-only mega menus or hamburger-only patterns; weaker a11y than radix NavigationMenu in Header 3. |
| Bento Grid (aceternity, id 1197), bento grid 01 (avanishverma4), Bento Grid canvas (luv-jeri, id 37507) | Either skewed/decorative, or a "compose then install renderer" tool rather than a component. |
| Number Ticker (danielpetho, id 20459), Segmented LCD ticker (shadcnspace) | Solid but ref-triggered instead of in-view; LCD look is off-brand. Count Up covers it. |
| Logo Cloud 15 (shadcnui-blocks), Cinematic Logo Cloud / Logo Clouds (nexus-ui), Blurred Marquee (grootstudio) | Border-beam / blur-mask decorations violate the restraint rule; diceui Marquee is the accessible primitive. |
| Testimonial Carousel Section checkerboard (kedhareswer), Connected Carousel (arunachalam), Testimonial Section 3 (solaceui) | Require many portrait photos or squircle SVG plumbing; GIP has few, if any, real testimonials. |
| Lighthouse Spotlight Gallery (dhxwhy), Elastic Gallery, Arch Gallery, Hover Image Gallery | Showpiece interactions that make browsing 50+ layout photos harder, not easier. |
| Sticky Scroll Reveal (aceternity, id 952), Scroll Reveal Content A (abui), Services Stack (ivarunchaudhary) | Film-grain / canvas drawings or text-only variants; Stacking Cards is simpler and image-friendly. |
| Reveal Text (paceui), Text Animation / Text Reveal Block (GSAP SplitText) | Pull in GSAP; Vertical Cut Reveal does the same with `motion` and keeps sr-only text. |
| Shimmer Button (magicui, id 833), Magnetic Liquid Button (himansujha), Klyv Shimmer | Shimmer sweeps read as "AI-slop" on a navy brand; one magnetic CTA is enough. |
| Optimized Tilt Card (sh20raj), 3D parallax on hover (minhxthanh), Spotlight Card (preetsuthar17) | Heavier variants of what motion-primitives Tilt + Spotlight do in 120 lines. |
| Accordion (wensity, Base UI), Accordion (ddoemonn, spring), Proximity Accordion, Slit-type FAQ | New headless lib or extra animation code for a FAQ; shadcn/radix accordion already installed. |
| Contact Form (kevingirelli), Centered Contact Form (ln-dev7) | Plain forms with no field micro-interaction; the floating-label primitive composes into any layout. |
| Large Name Footer (arihantcodes), Dithered Footer (otatechie), Footer with Newsletter (balick) | Newsletter/status widgets GIP does not have, or drifting-dot effects; Footer with Suite is the quiet one. |
| Location Map (gammaui, id 10422), Interactive Globe Explorer (nexus-ui), Map Controls (terrae, Mapbox) | Need Mapbox/MapLibre or a 3D globe for a single office pin. |
| Compare Slider (diceui, id 19955) | Fine (has keyboard support); motion-primitives version chosen for consistency with Tilt/Spotlight. Fall back to this if adding keyboard support to 19 is more work than expected. |
| CTA Section with Noise Shader (shadcnui-blocks), Dithered Shader CTA (hirael), Tron CTA Banner (thegridcn) | WebGL shaders / scanlines; too loud for the brand and heavy on low-RAM devices. |

## Install summary (when the build phase starts)

```
npm i motion lenis react-use-measure
npx shadcn@latest add badge card navigation-menu accordion dialog sheet
```

`globals.css` additions required by the picks: diceui marquee keyframes under `@theme inline` (left/right/up/down + rtl), a `@utility no-scrollbar` for the timeline rail, and the morphing navbar's `.msn-*` rules re-expressed with GIP tokens.
