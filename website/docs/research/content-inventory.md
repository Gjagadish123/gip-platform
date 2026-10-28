# Old GIP website — complete content inventory

Source: `J:\Jaggu Projects\GIP Website\gipproperties\` (Vite + React 18, Rocket.new/DhiWise generated, framer-motion 12, @studio-freight/react-lenis, react-helmet, react-pdf, react-router-dom 6.0.2, Tailwind 3 with CSS-var theme).
Routes (`src/Routes.jsx`): `/` Homepage, `/about` AboutUsPage, `/properties` PropertiesPage, `/property/:slug` PropertyDetailPage, `/contact` ContactPage, `/gallery` GalleryPage. All pages lazy-loaded; `<Preloader/>`, `<ScrollToTop/>`, `<Header/>` mounted once above the router outlet; every page renders its own `<Footer/>`.

Sizes below are from the filesystem (KB = 1024 bytes). Image descriptions are from viewing the files. "AI render" = synthetic architecture image, not a GIP property.

---

## 0. Global shell

### `index.html`
- `<title>Greater Infra Projects - Real Estate Platform</title>`
- `meta description`: "Greater Infra Projects - Leading real estate developer in Hyderabad with 11+ years experience, 21 delivered projects, 600+ acres developed. Explore Global City RRR & Global Village developments."
- `og:title`: "Greater Infra Projects - Trusted Real Estate Developer | 11+ Years Experience"; `og:description` = same as description. No `og:image`, no canonical, no twitter card, no JSON-LD.
- `theme-color #033967`; `robots index, follow`.
- Fonts via Google Fonts: Inter, Lato, Manrope, Poppins (400–700). Actual use: Inter everywhere; Lato in Footer; Poppins in dead RecentProjectsSection; Manrope never used; Georgia italic (system) for the Properties hero H1.
- `<link rel="preload" as="image" href="/images/img-.png" fetchpriority="high">` — preloads a 1,827 KB PNG.
- Favicon / apple-touch-icon = `/images/img-link.svg` (white logo on transparent → invisible on light browser tabs).
- `/public/manifest.json`: short_name "Greater Infra", name "Greater Infra Projects", icons [], theme #033967, bg #ffffff.
- `public/.htaccess`, `public/_redirects` (SPA rewrite, ~0 KB). No robots.txt, no sitemap.

### `src/App.jsx`
- Renders Routes. A floating WhatsApp FAB is **commented out**; its number `919876543210` is the placeholder.

### `components/common/Preloader.jsx`
- Full-screen navy (`bg-primary-background`) overlay, z 99999, shows `/gip-logo-animation.gif` (max-w 450/600px) for 2,500 ms then framer `exit opacity 0` over 0.5 s. Runs on every hard load.

### `components/common/ScrollToTop.jsx`
- `window.scrollTo(0,0)` on pathname change.

### `components/common/Header.jsx`
- Logo `/images/img-link.svg` (alt "Greater Infra Projects Logo"), 132×62 → shrinks to 100×47 when scrolled.
- Nav (desktop ≥lg): Home `/`, About Us `/about`, Projects `/properties`, Gallery `/gallery`, Contact Us `/contact`. Hover: framer spring `scale 1.05` + underline grows 0→100% (`bg-accent-light`).
- CTA: "Start exploring" → `/properties`. Black pill 175×42, radius 300px, Inter 14/500, white circle with diagonal-arrow SVG.
- Scroll ≥20px: header switches `absolute transparent` → `fixed bg-[#033967]/90 backdrop-blur-xl shadow`, padding shrinks (500 ms transition). Header enters with `y:-100→0` 0.8 s.
- Mobile: hamburger → full-screen navy drawer slides in from left (`x:-100%→0`, 0.5 s, ease [0.16,1,0.3,1]); links 28px staggered `delay index*0.1+0.2`; "Start exploring" white button → `/properties`; drawer footer "© 2025 Greater Infra Projects" / "Ameerpet, Hyderabad". Body scroll locked while open.
- Odd behaviour: on `/contact` and `/about` the hamburger first smooth-scrolls to page bottom, then opens the menu after 800 ms.

### `components/common/Footer.jsx` (navy `bg-primary-background`, Lato)
- Paragraph: "Thank you for considering Greater Infra Projects for your real estate needs. We look forward to hearing from you and assisting you on your real estate journey."
- Button "Get in touch" (white pill, arrow) → `/contact`.
- Logo `/images/img-asset-1-2.svg` (white lockup, 220–280px wide) → `/`.
- Links: About Us `/about`, Projects `/properties`, Gallery `/gallery`, Contact Us `/contact`.
- Social (framer `whileHover scale 1.2`): Facebook `https://www.facebook.com/Greaterinfragip/` (icon `/images/img-frame.svg`), Instagram `https://www.instagram.com/greaterinfraprojects/` (icon `/images/img-frame-white-a700.svg`). YouTube (`https://www.youtube.com/`) and Twitter (`https://twitter.com/`) are commented out — generic URLs, not real handles.
- Divider + "© 2026. All rights reserved" (mobile drawer says 2025).

### `components/ui/Button.jsx`, `EditText.jsx`
- Rocket.new generated CVA wrappers with Figma-style props (`text_font_size`, `fill_background_color`…). Default text "Start exploring"; EditText default placeholder "Why Choose Us". Nothing worth keeping.

### `components/ui/PropertyCard.jsx`
- Card (rounded-2xl, border, `whileInView y:30→0` with `delay index*0.1`): image 280/320px with `group-hover:scale-110` (700 ms) + bottom gradient on hover; badge top-left `propertyType` (navy); badge top-right "Approved" (class `.approved` = #e6f4ea/#1e7e34, hardcoded for every card); H3 `name` + `(year)` when status ≠ Ongoing; `location`; divider; button "Explore Project" (navy, `whileHover 1.02`) or, for `status === 'Completed'`, a non-clickable green (#10b981) block "Project Completed".
- Click: Completed → nothing; `redirectUrl` → `window.open(url,'_blank')` (Urban Eden → `https://urbaneden.in/`); else `navigate('/property/'+slug)`. Slugs such as `'GLOBAL CITY VI'` contain spaces/uppercase → `/property/GLOBAL%20CITY%20VI`.
- Bed/bath/area/garage feature row is commented out (Webflow template remnant).

### Theme tokens (`src/styles/tailwind.css`, `global.css`)
- `--primary-background #033967`, `--primary-light #085b9e`, `--primary-dark #011a35`, `--secondary-dark #202127`, accents `#eaf0ff / #f0f4ff / #085b9e`, text `#000 / #676f7e / #a4a6b0 / #033967 / #14161c / #464851`, bg `#fff / #faf8f5 / #eeeff1 / #202127`, borders `#eeeff1 / #f1f0ed / #0f7ed9 / #03396733`, button-search `#033967`. `global.css` later overrides `--text-main #033967`, `--text-muted #64748B`, `--bg-light #F1F5F9`, `--button-primary-bg #000`. Radii 4–54px. Container 1254px (components actually use 1440px).

---

## 1. Homepage `/` (`src/pages/Homepage/index.jsx`)

Helmet: title "Greater Infra Projects - Trusted Real Estate Developer | 11+ Years Experience in Hyderabad"; description "Greater Infra Projects - Leading real estate developer in Hyderabad with 11+ years experience, 21 delivered projects, 600+ acres developed. Premium plots & lifestyle communities including Global City RRR and Global Village. Built on transparency, quality planning, and customer-first approach."; same text as og:title/og:description; preload `/images/img-.png`.

Render order: PopupContactForm, HeroSection, AboutSection, StatsSection, PrinciplesSection, ProjectsSection, PromiseSection, ValuesSection, PropertiesHome, CTASection, ConstructionStandardsSection, TestimonialsSection, Footer.
**Not rendered (dead files):** `RecentProjectsSection.jsx`, `BrandStorySection.jsx`.

### 1.0 `PopupContactForm`
- Modal after 10 s unless `localStorage.popupContactFormDismissed`. Backdrop black/60 blur; card scale 0.9→1.
- H2 "Begin Your Journey"; p "Share your details and we'll arrange a personal consultation at your convenience."
- Fields: Your Name (text, placeholder "Enter your name"), Phone Number (tel, "Enter your phone number"), Area of Interest (text, "e.g., Villa Plots, Commercial, Residential"). No `required`, no validation. Submit "Request Consultation" → `console.log` only, then dismiss.

### 1.1 `HeroSection`
- Wraps itself in `<ReactLenis root options={{duration:1.2, smoothTouch:true}}>` — Lenis smooth scroll is therefore active **only on the homepage**.
- Desktop: 250vh navy container, sticky 100vh viewport. `useScroll` → `clipPath: inset(14% 18% round 24px)` → `inset(0 0 round 0)` over scrollYProgress 0→0.35; image `scale 1→1.1` over 0.3→1. 5 % fractal-noise SVG overlay; gradient `from-black/40 via-black/10 to-black/15`. Mobile (<1024): plain 100vh, no clip-path.
- Background `/images/img-.png` (1440×1021, 1,827 KB, AI render), `fetchpriority="high"`.
- H1 (Inter 48/500, letter-spacing -2.16px): "Turning Your Property **br** Dreams into Trusted Reality".
- p (Inter 16/300): "Premium Plots & Lifestyle Communities in Hyderabad — Crafted for Your Lifestyle & Investment Growth."
- CTAs: "Start exploring" (black pill + white arrow circle, `whileHover 1.02`) → `/properties`; "Request Callback" (text + chevron, `whileHover x:4`) → `/contact`.

### 1.2 `AboutSection` (bg `background-secondary`)
- Badge "About us" (icon `/images/img-vector-white-a700-14x12.svg`).
- H2 "Greater Infra Projects".
- p: "We take great pride in ensuring the satisfaction of our customers. That's why we proudly guarantee the quality and reliability of our products." + "Hyderabad's evolving landscape is the foundation of our vision. At Greater Infra Projects, we see every development as an opportunity to create trust, value, and enduring communities. Rooted in strategic planning and driven by a customer-first approach, we focus on developing legally sound, thoughtfully designed residential and lifestyle projects that balance modern living with long-term investment growth."
- Button "Read More" (black pill, `/images/img-arrow-right.svg`) → `scrollIntoView('#stats-section')`.
- Right: `/purpose-driven-image.png` (1024×1024, 1,747 KB, AI "VILLA 05" render), rounded-32px, `whileHover 1.02`, 400–500px tall. Floating "3 bathrooms / 4,821 sqft / 6 parking zones / 3 bedrooms" chips commented out (template remnant with Webflow icon SVGs).
- Brand story block: 16:9 rounded-3xl `<video autoPlay loop muted playsInline controls poster="/homepage/home-brand.png">` src `https://jjskgxbshmjsfrowlzsj.supabase.co/storage/v1/object/public/gip%20-%20akshay/GIP_Home_page_video.mp4` (**31,743 KB**); onError → shows poster `/homepage/home-brand.png` (14,545 KB).
- H3 "Our Brand Story" (#033967). p1 "Greater Infra Projects is a real estate development firm driven by a clear philosophy—build with integrity, plan with purpose, and deliver enduring value. We are committed to creating thoughtfully planned developments that stand the test of time, guided by transparency, ethics, and disciplined execution." p2 "At the core of our approach lies an unwavering belief in doing business the right way. Every project is founded on clear titles, approved layouts, and complete documentation, ensuring absolute clarity and confidence for our customers. We place ethics and transparency at the forefront of every decision, treating trust as the most valuable asset we build."

### 1.3 `StatsSection` (`#stats-section`, bg #FAFAFB, 12 faint vertical guide lines)
Alternating left/right blocks, 110px italic Inter numbers with superscript "+", `whileInView y:40→0`:
| number | label | description |
|---|---|---|
| 11+ | Years of Industry Experience | "With over a decade of hands-on experience in real estate development, we bring deep market knowledge, strong execution capabilities, and a proven understanding of customer needs. Our journey is built on trust, transparency, and long-term relationships." |
| 20+ | Successfully Delivered Projects | "From premium gated communities to open villa plots, we have successfully delivered 21 diverse projects across strategic locations. Each project reflects our commitment to quality planning, timely delivery, and superior construction standards." |
| 600+ | Acres Developed | "We have transformed more than 600 acres of land into thoughtfully planned developments that balance modern infrastructure with sustainable living. Our large-scale developments stand as landmarks of smart urban growth." |
| 6000+ | Happy Customers | "Our greatest achievement is the trust of 100+ satisfied customers who chose us for their dream homes and investments. Their confidence fuels our passion to consistently exceed expectations and deliver lasting value." |
Inconsistencies: 20+ vs "21 diverse projects"; 6000+ vs "100+ satisfied customers".

### 1.4 `PrinciplesSection` (white)
- Badge "Key Principles" (icon `/images/img-background.svg`). H2 "Built on Principle" + 96px #0EA5E9 underline.
- 2×2 bordered cards, big grey "01–04" numeral top-right, `whileHover y:-5 + shadow`:
  1. **Transparency** — "We believe transparency is the foundation of trust. From approvals and documentation to pricing and timelines, we ensure absolute clarity at every stage of the customer journey."
  2. **Quality-Driven Planning** — "Every project is thoughtfully planned with a strong emphasis on layout design, infrastructure, and long-term usability. We focus on building developments that stand the test of time."
  3. **Trust & Reliability** — "We value relationships over transactions. By delivering what we promise and standing by our commitments, we build long-term confidence with every customer."
  4. **Timely & Responsible Execution** — "We understand the significance of a real estate investment. With disciplined execution and structured planning, we strive to deliver our projects responsibly and on schedule."
  (These four titles map 1:1 to the GIFs transparency / quality-driven-planning / trust-reliability / timely-responsible-execution, which the old site never wired up.)

### 1.5 `ProjectsSection` (bg secondary)
- Badge "The Projects" (icon `/images/img-background-white-a700.svg`). H2 "A Legacy Built on Trust and Planning".
- p (right-aligned): "Together, we can conquer challenges, utilize our strengths, and achieve remarkable success in this ambitious home project." (filler)
- 2-slide carousel (framer `AnimatePresence popLayout`, slide ±100 %, 0.5 s), max-h 600, `object-contain`: `…/gip%20-%20akshay/urban-eden-1.jpg` (2,108 KB, alt "A Legacy Built on Trust and Planning") and `urban-eden-2.jpg` (653 KB, alt "Our Projects Overview") — Urban Eden villa marketing renders. Round outline prev/next buttons (navy, fill on hover).

### 1.6 `PromiseSection` (navy)
- Badge "Our Promise" (icon `/images/img-ph-handshake-light.svg`). H2 "Why Choose **br** Greater Infra Projects" (second line grey-200).
- p: "A value proposition built on trust, planning, and execution. We define how we select land, design communities, engage with customers, and deliver long-term value." + 96px white/30 bar.
- 4 glass rows (white/5, hover white/10, check-circle icon; `icon` fields `/images/img-vector-blue-50.svg` / `img-component-1.svg` are defined but not rendered):
  1. **Trusted by Buyers & Investors** — "Our reputation is built on consistent delivery, transparent practices, and long-standing relationships with customers and investors."
  2. **Prime Locations with Strong Connectivity** — "Each project is carefully chosen for its present livability and future appreciation—aligned with government plans and infrastructure corridors."
  3. **End-to-End Customer Care** — "We remain involved beyond the sale, offering guidance, support, and clarity throughout the ownership journey."
  4. **Proven Track Record of Delivery** — "Our developments reflect disciplined execution, adherence to commitments, and respect for timelines."

### 1.7 `ValuesSection` (bg #F0F4FF)
- Badge "Values". H2 "Our Values" + animated 0→96px blue underline. p: "A philosophy that guides every decision we make. At Greater Infra Projects, our values are not statements—they are standards."
- 3 white cards, 256×256 GIF, `whileHover y:-8`:
  1. **Integrity & Transparency** — GIF `/integrity-transparency.gif` — "We operate with absolute clarity—clear titles, approved layouts, and honest communication at every stage. Trust is built through transparency, and we treat it as non-negotiable."
  2. **Enduring Excellence** — GIF `/strategic-land-investment-opportunities.gif` (map/plot-pin — mismatch) — "From infrastructure planning to finishing standards, every detail reflects precision and permanence. We build with a long-term perspective, not short-term compromises."
  3. **Customer-First Focus** — GIF `/customer-first-focus.gif` — "Every project is designed around the needs, aspirations, and peace of mind of our customers—before, during, and long after possession."

### 1.8 `PropertiesHome` (white)
- Italic small "Best Project of the Years" (sic); H2 "Our recent projects"; pill "Start exploring" → `/properties` (black arrow circle rotates 45° on hover).
- Data: `getFeaturedProperties()` from `propertiesData.js` → `size:'large'` row (Global City RRR, GLOBAL CITY VI) + `size:'small'` row (GLOBAL NATURE VIEW CITY, GODAVARI GREEN FARMS, KOMPALLY COUNTY III). Card: image 280/320 or 200/240px rounded-2xl, hover `scale 1.1` + gradient, name (hover #1e3a8a), location. Stagger 0.15 s; `whileHover y:-8 scale 1.02`. Links to `/property/{slug}` or `redirectUrl`.

### 1.9 `CTASection` (bg light)
- Banner rounded-2xl 300–400px, bg `/images/img--0x0.png` (3804×2130, 5,300 KB, AI golden skyline), `group-hover:scale-105` over 3 s, gradient `from-black/20 via-black/50 to-black/90`.
- Right-aligned: badge "Get in touch" (star), H2 "Explore your **br** dream home today", p "Discover the perfect blend of luxury, convenience, and community at Global City RRR. Your dream home awaits.", button "Get in touch" (white pill, arrow rotates -45°→0) → `/contact`.

### 1.10 `ConstructionStandardsSection` (white)
- Badge "Why Choose Us". H2 "Why Choose Greater Infra Projects"; italic p "A value proposition built on trust, planning, and execution" (duplicate of §1.6).
- 3 cards, 256×256 GIF, `whileHover y:-5` (titles/descriptions are verbatim repeats of §1.6 items 2–4):
  1. **Prime Locations with Strong Connectivity** — GIF `/quality-craftsmanship.gif` (gear/house — mismatch)
  2. **End-to-End Customer Care** — GIF `/customization-options.gif` (sliders — mismatch)
  3. **Proven Track Record of Delivery** — GIF `/timely-completion.gif`
- 1px black separator.
- Pill-shaped (`rounded-[999px]`, aspect 2.1/1, max-w 5xl) `<video autoPlay loop muted playsInline>` src `…/gip%20-%20akshay/Kompally%20County.mp4` (11,017 KB), hover scale 1.05, gradient overlay. onError fallback `<img src="/GC-VI-Website-2048x1152.png" alt="Kompally County">` — **that file is NOT in `public/`** (it sits at repo root) → 404.

### 1.11 `TestimonialsSection` (bg light)
- Badge "Testimonials". H2 "Client Feedbacks".
- Two infinite marquee rows (framer `animate x 0→-50%` 40 s / `-50%→0` 45 s, linear, triple-duplicated list), side gradient masks. Card: 96–112px property thumb (`group-hover:scale-110`), italic 3-line-clamped quote, 32px avatar, name; `whileHover y:-5 scale 1.02`.
| # | name | quote | thumb / avatar |
|---|---|---|---|
| 1 | Rakesh Kota | "Nice plotting at Rudraram, really liked the spacious roads and good infrastructure. Definitely the best open plots in the Rudraram area for long-term investment." | img-rectangle-4.png / img-ellipse-7.png |
| 2 | Ravi Kiran | "A very promising group with a dedicated attitude and uncompromising sincerity. They completed Green Hills Farms in Yadadri and LR Medchal County. Their project planning and execution are excellent." | img-rectangle-4-180x180.png / img-ellipse-7-30x30.png |
| 3 | Srinivas G | "I've invested in multiple projects with GIP Properties and have always been impressed with their transparency and quality of work. The team is knowledgeable and genuinely cares about client success." | -1 / -1 |
| 4 | Venkata Ramana | "Purchased a plot in Medchal County recently. The development progress is impressive, and the legal documentation was handled very professionally by the GIP team." | -2 / -2 |
| 5 | Anitha Reddy | "Choosing GIP Properties for our investment in Shadnagar was a great decision. The location is strategic and the team provided excellent support throughout the registration process." | -3 / -2 |
| 6 | Karthik Sharma | "Finding a reliable developer in the Hyderabad market can be tough, but GIP stands out for their transparency. Their Yadadri projects are well-planned with great future potential." | -4 / -2 |
| 7 | Mahesh Rao | "Investing in GIP's Srisailam Highway project has given me great peace of mind. The property appreciation in this belt is fantastic and the layout maintenance is top-notch." | -5 / -3 |
- Assessment: #1 and #2 read like real Google reviews (specific, slightly unpolished, name real past projects); #3–#7 are polished marketing voice and reuse the same avatar → treat as invented unless the client confirms. All 7 thumbs are stock western houses; all 5 avatars are Unsplash-style western faces. "GIP Properties" is not the company name.

### Dead: `RecentProjectsSection.jsx` (not imported)
- 592px bg `/images/img-abackyardwithawoodendeckandalargecouch…-1.png` + play button `/images/img-icon-play.png`; "Best Project of the Years" / "Our recent projects"; hardcoded 5 cards (Poppins): Global City RRR – Peddapur (img-image-18.png), Global Village – Kadthal Village (img-image-18-374x612.png), Global City V – Shankarpalli (img-image-18-374x400.png), Kompally County III – Kandlakoya (img-image-18-1.png), Global City VI – Indrakaran – Rudraram (img-image-18-2.png).
### Dead: `BrandStorySection.jsx` — same "Our Brand Story" copy as §1.2.

---

## 2. About Us `/about` (`src/pages/AboutUsPage/index.jsx`)

Helmet: title "About Us - Greater Infra Projects"; description "Learn about Greater Infra Projects, a legacy of trust and standard of excellence in real estate development."
Order: AboutHero, AboutDetails, MissionVisionSection, CommitmentSection, ValuesAndTeamSection, CorporateStrengthsSection, DifferenceSection, TeamSection, PartnerCTASection, Footer.

### 2.1 `AboutHero` (min-h-screen)
- bg `/about-us-hero.png` (4096×2296, **9,162 KB**, AI cantilevered glass villa at dusk), black/40 overlay.
- H1 (64/500): "A Legacy of Trust. **br** A Standard of Excellence."
- p: "Building with integrity, planning with precision, and delivering enduring value for generations."
- CTAs: "Start exploring" (black pill, `/images/img-vector.svg` arrow) → `/properties`; "Request Callback" (underline on hover, `whileHover x:5`) → `/contact`.

### 2.2 `AboutDetails` (white)
- Left: `/purpose-driven-image.png` (same AI villa as home) rounded-2xl + floating navy badge "11+ / YEARS OF TRUST".
- Badge "WHO WE ARE". H2 "Purpose-Driven Development".
- p1: "Greater Infra Projects is a real estate development firm guided by a singular philosophy — to build with integrity, plan with precision, and deliver enduring value. Every development is conceived with a long-term perspective, grounded in transparency, ethical practices, and disciplined execution."
- p2 (italic, navy left border): "At the core of our approach lies a simple belief: **br** Each project is backed by clear land titles, approved layouts, and complete documentation."
- Stats strip: 11+ Years of Trust · 6000+ Happy Customers · 20+ Projects Delivered.

### 2.3 `MissionVisionSection` (navy, two columns with centre divider)
- "OUR MISSION" (bolt icon) → H2 "Purpose-Driven Development" (duplicate of §2.2 heading). p1 "Our mission is to uphold a development philosophy rooted in trust, transparency, and responsibility." p2 "We are committed to delivering a real estate experience defined by fairness, clear communication, and uncompromising quality. Every Greater Infra Projects development begins with a promise — to create thoughtfully planned communities that offer long-term value, superior living standards, and the assurance of a secure investment." blockquote "Through disciplined execution and ethical practices, we continuously strive to elevate industry standards and deliver on every commitment we make."
- "OUR VISION" (eye icon) → H2 "Building for Generations". p1 "Our vision is to establish Greater Infra Projects as one of the most trusted and respected real estate brands." p2 "We aim to grow alongside our customers' confidence by developing homes and communities that meaningfully enhance everyday living. With a strong focus on responsible development, design excellence, and continuous innovation, our projects are created to remain relevant — not just today, but for generations to come." blockquote "Each development reflects our core values of quality, reliability, and customer satisfaction, aligned seamlessly with evolving lifestyles and expectations."

### 2.4 `CommitmentSection` (white)
- H2 "Our Commitment" (#003056). Stats 2×2: 11+ Years of Legacy · 100% Happy Investors · 20+ Completed Projects · 6000+ Customers.
- p (appears **twice verbatim**): "At Greater Infra Projects, excellence is not just a goal; it's our standard. We are dedicated to exceeding expectations, delivering projects on time and within budget, and building enduring relationships based on trust, integrity, and mutual respect."
- H3 "The Rarefied and Luxury Real Estate" (off-brand for a plot developer).
- Buttons "Explore Project" (black pill) → `/properties`; "Request Callback" (white outline pill) → `/contact`.

### 2.5 `ValuesAndTeamSection` (white)
- Top image `/about-us.png` (2048×768, 2,598 KB, rounded-2xl, max-h 600) — **real** Global City VI launch-event collage (HMDA sign board "Global City-VI VILLA PLOTS", flags, ground-breaking, team with awards, GIP logo).
- Badge "Our Value". p (template filler, sentence repeats): "Our team is made up of dedicated real estate professionals who share a passion for what they do. We are not just agents; we are your trusted advisors. Our agents are experienced, knowledgeable, and ready to assist you in achieving your real estate goals. Our team is made up of dedicated real estate professionals who share a passion for what they do. We are not just agents."
- H2 (right): "Investing in Tomorrow: Building a Lasting Legacy".
- 3 value cards (256px GIF, hover bg-gray-50 + shadow-2xl):
  1. **Integrity** — `/integrity-transparency.gif` — "We conduct ourselves with honesty, transparency, and ethical standards in all aspects of our business."
  2. **Quality** — `/quality-craftsmanship.gif` — "We are committed to delivering the highest quality in every project we undertake, ensuring durability, functionality, and aesthetic appeal."
  3. **Customer Focus** — `/customer-first-focus.gif` — "We are dedicated to understanding and exceeding the expectations of our clients, providing exceptional service and value in every interaction."

### 2.6 `CorporateStrengthsSection` (navy)
- H2 "Greater Infra Projects" + sub-line "Premium Open Plots & Real Estate Development in Hyderabad". p "Delivering high-value residential plotting ventures with clear titles, prime locations, and strong growth potential across Hyderabad."
- 4-col bordered grid (white/10 lines, hover white/5), inline stroke SVG icons:
  1. **We build Value driven investments** (building icon) — "Our projects are carefully planned plotting ventures focused on appreciation, transparency, and long-term returns — not just land parcels."
  2. **Strategic Location Selection** (clock) — "We focus on high-growth corridors around Hyderabad including developing zones near ORR, upcoming infrastructure hubs, and fast-expanding suburbs."
  3. **Fast & Structured Development** (bolt) — "From land acquisition to layout development, we ensure timely execution with planned roads, clear demarcation, and ready-to-register plots."
  4. **End-to-End In-House Support** (users) — "From site visits and documentation to registration assistance and after-sales support — everything is managed professionally."
  5. **Clear Title & Legal Transparency** (check-circle) — "100% clear documentation with verified layouts to ensure safe and secure investment for every customer."
  6. **High Growth Micro-Markets** (trend) — "We identify emerging real estate hotspots with strong appreciation potential and infrastructure expansion."
  7. **Financially Disciplined Operations** (rupee/dollar) — "Sustainable project planning ensuring smooth development cycles and investor confidence."
  8. **Projects Selected with Vision** (target) — "Every venture is chosen based on connectivity, future developments, accessibility, and lifestyle value."

### 2.7 `DifferenceSection` (bg #ecf2ff)
- Badge "The Difference". H2 "Greater Infra Projects vs Typical Plot Sellers" + 80px #3b82f6 bar. p "The difference is in the details."
- Comparison table (headers "Greater Infra Projects" navy #1e4e8c / "Typical Plot Sellers" grey; GIP cells #a7c5e3 with check, typical cells #f1f5f9 with ×):
| label | GIP | Typical |
|---|---|---|
| Community Planning | Master-planned communities | Isolated plots |
| Documentation | Fully approved documentation | Documentation inconsistencies |
| Development Control | End-to-end development control | Sale-only involvement |
| After Sales | Structured after-sales support | No post-sale accountability |
| Vision | Long-term development vision | Short-term transactions |

### 2.8 `TeamSection` (white)
- Badge "Leadership". H2 "Visionary Leadership. Disciplined Execution." + 100px #1e40af bar. p "Leadership at Greater Infra Projects defines direction, values, and standards. Guided by experience, integrity, and strategic foresight, our leaders shape developments that inspire trust and deliver lasting value."
- Leaders (300×350 / 350×400 photo, hover scale 1.05):
  - **Syed Imam** — Chairman & Managing Director — `/teams/syed-imam.png` (1114×1066, 1,089 KB; real photo, beige blazer, indoor) — "With a clear vision and strong entrepreneurial leadership, Syed Imam has laid the foundation of Greater Infra Projects on the principles of transparency, trust, and customer-centricity. His approach emphasizes ethical growth, meticulous planning, and delivering enduring value—ensuring every project reflects excellence in both execution and intent."
  - **Syed Ismail Kashif** — Director – Strategy & Urban Development — `/teams/syed-ismail-kashif.png` (2048×1365 landscape, 2,441 KB; real photo, checked blazer + sunglasses, outdoor event; needs portrait crop) — "Syed Ismail Kashif brings a strategic, future-focused perspective to Greater Infra Projects, overseeing planning and brand direction. With a strong grounding in business strategy and real estate development, he plays a pivotal role in shaping sustainable growth, strengthening systems, and ensuring that every project aligns with the company's promise of quality, integrity, and thoughtful design."
- "Meet Our Team" grid is **commented out** but the data + photos exist:
| name in code (Figma placeholder) | role | file | what the photo actually is |
|---|---|---|---|
| Cameron Williamson | Marketing Coordinator | teams/cameron-williamson.png 947×1020, 1,134 KB | **real** Indian man, yellow shirt, studio |
| Floyd Miles | Leading Design Engineer | teams/floyd-miles.png 947×1020, 734 KB | **real** man in navy blazer at desk |
| Esther Howard | Assistant Manager | teams/esther-howard.png 947×1020, 1,284 KB | **real** man in blue blazer wearing a GIP "DIRECTOR" rosette |
| Savannah Nguyen | Head of the Group | teams/savannah-nguyen.png 947×1020, 904 KB | **real** man in white shirt wearing a GIP "DIRECTOR" rosette |
| Courtney Henry | Assistant Manager | teams/courtney-henry.png 947×1020, 797 KB | **real** man speaking at a mic (event) |
| Robert Fox | Chief Engineer | teams/robert-fox.png 947×1020, 702 KB | **real** man, white shirt, red tie, studio |
| Kathryn Murphy | Assistant Manager | teams/kathryn-murphy.jpg 400×600, 42 KB | Unsplash stock (EXIF `unsplash.com/photos/Zz5LQe-VSMY`) |
| Devon Lane | Project Coordinator | teams/devon-lane.jpg 600×600, 71 KB | Unsplash stock (EXIF `unsplash.com/photos/MTZTGvDsHFY`) |
→ Six real GIP people (at least two are directors) exist with no real names/roles. Ask the client for names before publishing; drop the two Unsplash ones.

### 2.9 `PartnerCTASection` (white page bg)
- Banner rounded-32px min-h 500, bg **remote Unsplash** `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?…w=2000` with #0f172a/80 multiply + gradient.
- Badge "Get in touch". H2 "Your Ultimate **br** Home Finding Partner". p "Driven by a powerful vision to become India's foremost and highly respected real estate company, Greater Infra Projects prioritizes the creation and delivery of distinctive, all-encompassing lifestyles." Button "Start exploring" (white pill) → `/properties`.

---

## 3. Projects `/properties` (`src/pages/PropertiesPage/index.jsx`) — **no Helmet / no page title**

Order: PropertiesHero, PropertiesSection, ExploreSection, CompletedPropertiesSection, ContactFormSection, (TestimonialsSection commented out), Footer. Page holds `category / propertyType / location` state; `handleSearch` only logs and scrolls.

### 3.1 `PropertiesHero` (min-h 95vh)
- bg `/properties-hero.png` (4096×2296, **11,200 KB**, AI cut-away "dollhouse" house at night), black/50.
- H1 (Georgia italic, up to 70px): "Discover Your Dream Property".
- p: "Experience the finest collection of premium villas, plots, and luxury apartments crafted for those who seek distinction in every detail." (apartments = off-brand)
- "Start exploring" hidden (`showStartExploring={false}`); "Request Callback" → `window.location.href='/contact'` (full reload).
- Search bar (selects Category / Property Type / Location + filter icon + "SEARCH") is commented out. Options from data: `categoryOptions ['Residential']`, `propertyTypeOptions ['Villa','Plot']`, `locationOptions ['Indrakaran - Rudraram','Kompally']`.

### 3.2 `PropertiesSection` (`pt-[120px]`)
- Badge "Ongoing" (pulsing dot). H2 "Indulge in Luxury: Villas & Plots for Distinction" + 80px navy bar. p "Explore our open villa plots and embark on the journey to create your dream home."
- Grid 3-col of `properties` filtered by search state only — **status is not filtered**, so completed projects also appear here (code comment admits it). Empty state: "No properties found" / "Try adjusting your search filters to find more properties."

### 3.3 `ExploreSection`
- Banner 280–400px rounded-2xl, bg `/explore.png` (3760×2120, **8,609 KB**, AI green-roof eco house), `whileHover scale 1.03`, gradient to black/70. Right-aligned: badge "Get in touch", H2 "Delivering secure, well-planned properties", p "with unmatched craftsmanship possession" (garbled). No button.

### 3.4 `CompletedPropertiesSection`
- Badge "Completed" (green dot). H2 "Open Villa Plots: Create Your Dream Home". p same as §3.2. 4-col grid of `status === 'Completed'` (17 entries). Empty state "No completed properties yet" / "Check back soon for our completed projects."

### 3.5 `ContactFormSection`
- bg `/properties-contact.png` (4096×2731, **19,808 KB**, AI aerial of green fields with white plot-boundary lines and pins — the only render that is thematically "plots"), `whileInView scale 1.1→1` 1.5 s, navy/85 overlay. 8 white pulsing dots positioned with `Math.random()` on every render.
- Card (navy/90 blur): H3 "Get in touch"; p "We engage in projects of varying scales and budgets, from affordable apartments to luxury villas. Get in touch to see how we can help you." Fields (placeholders): "Your name" (text), "Your mail" (email), "Your phone" (tel), "Your message" (textarea 4 rows). Button "Send message" (#1a73e8). No validation; `console.log` only.
- Right: H2 "Putting a plan to action, **br** to assure your satisfaction!" p "Being Innovative, Socially responsible and Trusted Real Estate brand in diversified markets, leading the industry and delivering radiance to all our valued stakeholders."

### 3.6 `TestimonialsSection` (commented out in page)
- H2 "What our clients say **br** about us"; big serif quote mark; dot nav (active dot widens to 32px); portrait 280–400px with "floating tablet" placeholder block and offset navy/10 shape.
| name | role | Unsplash portrait | quote |
|---|---|---|---|
| Ramesh Varma | Business Owner | photo-1560250097 | "Greater Infra Projects made my open plot investment completely stress-free. Their team explained every detail clearly — from layout approvals to future growth potential. Their market knowledge and transparent approach gave me full confidence in my decision. I highly recommend them to anyone looking for secure land investment opportunities." |
| Sowmya Reddy | IT Professional | photo-1573496359142 | "As a first-time plot buyer, I had many doubts, but the team at Greater Infra Projects guided me patiently through every step. Their professionalism, clarity in documentation, and well-planned layout impressed me the most. The entire process was smooth and trustworthy. I'm happy to be part of their project." |
| Mahesh Kumar | Real Estate Investor | photo-1472099645785 | "I've invested in multiple properties before, but my experience with Greater Infra Projects stands out. Their strategic project locations, proper infrastructure planning, and honest communication reflect their commitment to quality. It was a seamless transaction, and I look forward to investing with them again." |
All three look invented (stock portraits, uniform marketing voice).

### `propertiesData.js` — structure only
- `rawProperties[]` (24 entries, ids 1–24) sorted by `year` desc with a hack that swaps GLOBAL CITY VI ↔ GODAVARI GREEN FARMS order. Exports `properties`, `getFeaturedProperties`, `getCompletedProperties`, `getOngoingProperties`, `getPropertyBySlug`, `getPropertyById`, `categoryOptions`, `propertyTypeOptions`, `locationOptions`. 70 unique Supabase URLs, header comment claims "Images sourced from Unsplash".
- Per-entry fields: `id, year, slug, name, fullName, location, fullLocation, locationFilter, category, propertyType, bedrooms/bathrooms/totalArea/garages (unused), image, heroImage, status ('Ongoing'|'Completed'), featured, size ('large'|'small'|'medium'), redirectUrl?, description, startingPrice, pricePerSqYard, totalAcres, totalPlots, reraNumber, highlights[], amenities[], gallery[], visionTitle?, visionDescription, visionFeatures[{icon,title,description}], locationImage, primeLocationBadge, locationTitle, locationDescription, locationCategories[{icon,title,locations[{name,distance}]}], masterPlanTitle, masterPlanDescription, masterPlanImage (png/jpg or PDF), masterPlanPageNumber, brochureLink, layoutStats[{icon,title,subtitle}], amenitiesTitle, amenitiesDescription, amenitiesFeatures[], amenitiesGallery[], legalTitle, legalDescription, legalApprovals[{icon,title,description,status}], legalDocuments[], ctaSubheading, ctaTitle, ctaDescription, ctaPhone, ctaWhatsApp, ctaUrgencyMessage, ctaThankYouMessage`.
- Ongoing (7): Global City RRR (2022, RERA P01100006467, 9 acres, ₹15,500/sq yd), GLOBAL CITY VI, GLOBAL NATURE VIEW CITY (Yacharam, P02400002122), GODAVARI GREEN FARMS (2024, Shamirpet), KOMPALLY COUNTY III (2024, P02200006896), Western County – Shankarpalli (2017, P02400001474), URBAN EDEN (Villas, `redirectUrl https://urbaneden.in/`), Global City – V (Indrakaran, 2021, P01100003856). Completed (16): Green Hill Farms (Yadadri), Global City – Rudraram, Global City – II (Nandigama), Global City – III (Isnapur), Greater Infra Resorts (Shadnagar), LR Palm Meadows (Rampally), Highway City (Yadadri), True Pride (Bachara), LR Medchal County, Keesara County (Bogaram), RR Kompally County, Sri Yadadri Gardens, Rampally County, Global Highway City (Sangareddy), Kompally County – II (Medchal), Global Village (Kadthal).

### `propertiesData.js` — GLOBAL CITY VI entry (id 2) verbatim
- year 2021 (sorted as 2024), slug/name/fullName `'GLOBAL CITY VI'`, location/fullLocation "Rudraram / Shankarapally, Sangareddy District, Hyderabad", locationFilter "Indrakaran - Rudraram", category Residential, propertyType "Open Plots", totalArea 22, status Ongoing, featured true, size large.
- image/heroImage: `…/GLOBAL%20CITY%20VI/WhatsApp%20Image%202026-03-06%20at%204.13.29%20PM.jpeg` (117 KB).
- description: "Global City VI is a premium HMDA & RERA approved 22-acre weekend villas and open plots project located at Rudraram / Shankarapally with excellent access to Mumbai Highway and educational hubs."
- startingPrice "₹28,000"; pricePerSqYard "₹28,000 / Sq. Yard"; totalAcres "22 Acres"; totalPlots "200 to 400 and 730 Sq. Yds."; reraNumber "P01100009270".
- highlights: 100 Feet Road Facing Project · HMDA & RERA Approved · CC Internal Roads (40 / 30 Feet) · Grand Entrance Arch · Swimming Pool · Avenue Plantation · Rainwater Harvesting.
- amenities: Clubhouse (25,000 Sq. Yards) · CC Roads · Underground Drainage · Underground Electricity · Plot Fencing · Overhead Water Tank · Children's Play Area.
- gallery: 15 Supabase WhatsApp JPEGs (`4.13.26 PM (1)` … `4.13.30 PM`; one duplicate `4.13.27 PM (1)` twice), ~100–120 KB each.
- visionDescription: "Strategically located near Mumbai Highway and GITAM University, Global City VI offers a secure and premium plotted development ideal for weekend homes and long-term appreciation." visionFeatures: Prime Corridor ("Located at Rudraram / Shankarapally near Mumbai Highway."), High Growth Zone ("Rapid infrastructure growth in Sangareddy district."), HMDA Approved ("Approval No. 007133/LO/HMDA/1700/SKP/2024."), Green Infrastructure ("Avenue plantations and rainwater harvesting system.").
- locationImage `/images/global-locations.png` (640×640 JPEG-in-PNG, 94 KB, stock aerial of a planned layout); primeLocationBadge "Near Mumbai Highway"; locationTitle "Excellent Connectivity & Access"; locationDescription "Well connected to Mumbai Highway and major educational institutions, offering a peaceful yet accessible lifestyle."; locationCategories: Connectivity → Mumbai Highway "Nearby"; Education → GITAM University "Nearby".
- masterPlanTitle "Integrated Villa & Plot Layout"; masterPlanDescription "22-acre master-planned community with 40 / 30 feet CC internal roads, premium amenities and well-defined villa & plot layouts."; masterPlanImage = PDF `…/GLOBAL%20CITY%20VI/pdf/Global%20City%20-%20VI%20@%20Rudraram%20_%20Greater%20Infra%20Projects%20_%20Brochure%20cum%20Layout.pdf` (9,935 KB) page 2; brochureLink `…/GLOBAL%20CITY%20VI/pdf/Global%20City%20VI-Greater%20Infra%20Project%20Brochure.pdf` (**23,663 KB**).
- layoutStats: "150 – 400 and 700 " / "Available Plot Sizes (Sq. Yds.)"; "22 Acres" / "Total Project Area"; "40 / 30 Ft" / "CC Internal Roads"; "100 Ft" / "Main Road Facing" (icon 'road' not in map).
- amenitiesTitle "Premium Community Amenities"; amenitiesDescription "Designed to offer comfort, recreation and sustainable living within a secure gated community."; amenitiesFeatures (9): Clubhouse "25,000 Sq. Yards clubhouse facility." · CC Roads "40 / 30 feet wide internal roads." · Drainage "Underground drainage system." · Electricity "Underground electrical infrastructure." · Water Tank "Overhead water tank provision." · Avenue Plantation "Green landscaped internal roads." · Play Area "Children's recreational space." · Rainwater Harvesting "Eco-friendly water conservation system." · Swimming Pool "Recreational swimming facility." (section not rendered).
- legalTitle "Approvals & Legal Compliance"; legalDescription "Fully HMDA approved and RERA registered project ensuring transparent and secure investment."; legalApprovals: HMDA Approval "007133/LO/HMDA/1700/SKP/2024" Approved · RERA Registration "P01100009270" Registered; legalDocuments: HMDA Layout Approval · RERA Registration Certificate · Layout Copy · Link Documents.
- cta: subheading "INVEST IN SHANKARAPALLY GROWTH CORRIDOR"; title "Weekend Villas & Premium Plots Available"; description "Secure your premium villa plot in a 100-feet road facing HMDA approved community near Mumbai Highway."; ctaPhone "+91 98765 43210" / ctaWhatsApp "+919876543210" (**placeholders**); urgency "Limited Premium Plots Available"; thankYou "Our sales team will contact you with complete project details."
- Note: `totalPlots` "200 to 400 and 730" vs layoutStats "150 – 400 and 700" conflict; admin seed (`admin/src/lib/mock/units.ts`, 288 plots) is the authority.

---

## 4. Project detail `/property/:slug` (`src/pages/PropertyDetailPage/index.jsx`) — **no Helmet**

`getPropertyBySlug(slug)`; unknown slug → `<Navigate to="/properties" replace/>`. Order: PropertyDetailHero, `#property-content` VisionSection, LocationAdvantagesSection, MasterPlanSection, GallerySection, LegalApprovalsSection, CTASection, Footer. `AmenitiesSection` is imported but **not rendered**.

### 4.1 `PropertyDetailHero` (min-h-screen)
- bg `heroImage`; overlay `linear-gradient(135deg, #033967/85, #0f172a/75, #033967/65)` + two faint radial highlights.
- Desktop: vertical rotated label left "TS RERA : {reraNumber}". Mobile: pill with green pulse "RERA : {reraNumber}".
- H1 `fullName` (up to 64px, `y:40→0`); location pin (spring scale) + `fullLocation`; p `description`.
- Glass card "TOTAL AREA / {totalAcres} / {totalPlots}" (`whileHover scale 1.05`). "Just {startingPrice}" price card commented out.
- Bouncing down-arrow (`y 0→8→0` 1.5 s loop) → scroll to `#property-content`.

### 4.2 `VisionSection` (bg #F0F4FF)
- Badge "Our Vision" with eye icon rotating 360° every 8 s. H2 `visionTitle || "Building Tomorrow's Premier Address"`; 64px navy bar; p `visionDescription || "{name} is envisioned as a landmark residential development…"`.
- 4 cards (`rounded-none`, icons target/trending/shield/leaf, hover `y:-10 scale 1.03`), defaults: Strategic Investment / High Growth Corridor / Fully Approved / Sustainable Living (generic copy).

### 4.3 `LocationAdvantagesSection` (white)
- Badge "Locations". H2 `locationTitle || "Strategic Location Advantages"`; bar; p `locationDescription || "Perfectly positioned at the intersection of growth corridors…"`.
- Left: `locationImage || Unsplash photo-1545558014` 400–700px with gradient + navy-gradient badge "PRIME LOCATION / {primeLocationBadge}". Right: category cards (connectivity/education/employment/healthcare icons) with name + distance chips, hover `x:8`. Defaults are invented ("Major Highway 2 km", "Airport 30 km"…).

### 4.4 `MasterPlanSection`
- Header band (bg #EAF0FF80): badge "Layout"; H2 `masterPlanTitle || "Master Plan"`; p `masterPlanDescription || "A thoughtfully designed layout featuring wide roads…"`; 4 stat cards `layoutStats` (icons plots/roads/greenSpaces/totalArea).
- Grey band: if `masterPlanImage` ends `.pdf` → `react-pdf <Document><Page pageNumber={masterPlanPageNumber||1} width=container-40/80>` with worker from `//unpkg.com/pdfjs-dist@{v}/build/pdf.worker.min.mjs` (CDN); spinner; error "Failed to load PDF". Else `<img>` 400–800px. Default image Unsplash photo-1524661135.
- Button bottom-right "Download Brochure" (navy, download icon) → `brochureLink || '#'` new tab.

### 4.5 `GallerySection` (white)
- Badge "Gallery". H2 "Project Gallery"; bar; p "Explore visually stunning captures of {name}, designed for superior living." 3-col grid of `gallery[]` (default 4 Unsplash), 240–320px tiles, hover `scale 1.03 y:-8` + image `scale 1.1`. No lightbox.

### 4.6 `LegalApprovalsSection` (navy)
- Badge "Legal". H2 `legalTitle || "Legal Approvals & Documentation"`; p `legalDescription || "Complete peace of mind with all necessary approvals and legal documentation in place. Invest with confidence."`
- Approval cards (white/5, icons dtcp/rera/clearTitle/bank — 'hmda' not mapped → falls back to document icon), green status pill. Defaults: DTCP Approved / RERA Registered / Clear Title / Bank Approved (invented).
- Panel "Available Legal Documents": checklist `legalDocuments` (defaults: Layout Approval, Registration Certificate, Encumbrance Certificate, Sale Deed, NOC Certificate, Land Use Certificate, Survey Documents, Tax Receipts).

### 4.7 `CTASection`
- Card (bg #f8fafc page): small caps `ctaSubheading || 'BOOK YOUR PLOT TODAY'`; H2 `ctaTitle || 'Ready to Invest in Your Future?'`; p `ctaDescription || 'Limited plots available at pre-launch prices. Connect with our team for exclusive offers, site visits, and personalized assistance.'`
- Contact option: "Site Visit / Schedule Today" → `/contact` (phone/WhatsApp options are defined by data but **never rendered** — defaults `+91 98765 43210` / `+919876543210` placeholders).
- Buttons "Schedule Site Visit" → `/contact`; "Download Brochure" → `brochureLink`. Urgency line `ctaUrgencyMessage || 'Limited plots remaining • Pre-launch prices ending soon'`.
- Band (#e8eef3): `ctaThankYouMessage || 'Thank you for considering Greater Infra PROJECTS…'` + "Get in touch" → `/contact`.

### Dead: `AmenitiesSection`
- "World-Class Amenities" defaults: CC Roads, Street Lighting, Water Supply, Drainage, Avenue Plantation, Gated Entry, Open Spaces, Compound Wall + 3 Unsplash gallery tiles. GC VI's `amenitiesFeatures` icons clubhouse/play/harvesting/pool aren't in the icon map.

---

## 5. Contact `/contact` (`src/pages/ContactPage/index.jsx`) — **no Helmet**

### 5.1 `ContactHeroSection` (min-h-screen)
- bg `/contact-us.jpg` (1920×1080, 320 KB, AI penthouse living room at sunset), gradient `#033967/40 → /30`.
- H1 "Let's Start a Conversation". p "We believe investment starts with a conversation, not pressure. Reach out and let us understand your vision."
- Contact details (outlined circle icons, stagger 0.1 s):
  - Call Us Directly — **+91 9700123900** (real; matches admin constants +91 97001 23900)
  - Email Us — **Gip@greaterinfraprojects.in**
  - Visit Our Office — **Flat No. 1314, 12th Floor Vasavi MPM Grand, Metro Junction, Ameerpet, Hyderabad, Telangana 500016**
  - Office Hours — **Mon – Sat: 10:00 AM – 7:00 PM**
  (Values are plain text, not `tel:`/`mailto:` links.)
- Form card (white, shadow-2xl): H2 "Begin Your Journey"; p "Share your details and we'll arrange a personal consultation at your convenience."; fields Your Name (text, "Enter your name"), Phone Number (tel, "Enter your phone number"), Area of Interest (text, "e.g., Villa Plots, Commercial, Residential"); button "Request Consultation" (navy, `whileHover scale 1.02 + navy glow`). No validation; `console.log` only; no backend.

### 5.2 `MapSection` (white)
- Badge "Visit Us". H2 "Experience Our Space"; 64px grey bar (`scaleX 0→1`); p "We welcome you for a private viewing. Let's discuss your aspirations over a cup of artisan coffee."
- `<iframe>` 400–550px, keyless Google Maps embed: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.7123456789!2d78.44874231487656!3d17.43726878804567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb90c8c000e9c7%3A0x3b8c1234567890ab!2sVasavi%20MPM%20Grand!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin` — coordinates 17.43727 N, 78.44874 E (Ameerpet) but the place-id `0x3b8c1234567890ab` and `4v1234567890123` are obviously hand-typed → embed likely broken; regenerate from Google Maps.
- Floating card: "GREATER INFRA" / "Flat No. 1314, 12th Floor Vasavi MPM" / "Grand, Metro Junction, Ameerpet," / "Hyderabad, Telangana 500016"; link "Get Directions" → `https://www.google.com/maps/dir//Vasavi+MPM+Grand,+Metro+Junction,+Ameerpet,+Hyderabad,+Telangana+500016` (`whileHover x:5`, card `whileHover y:-5`).

---

## 6. Gallery `/gallery` (`src/pages/GalleryPage/index.jsx`) — **no Helmet**

### 6.1 `GalleryHero` (100vh)
- bg **remote Unsplash** `https://images.unsplash.com/photo-1600607686527-6fb886090705?…w=2000` (brightness .85) + two gradients (black/80→transparent, navy/90 bottom).
- H1 (72/600) "Experience the Luxury". p "Discover a world where elegance meets innovation, and every detail speaks to the art of refined living." Button "Explore The Gallery" (glass, `whileHover 1.05`) → scroll `#gallery-grid`. Bouncing chevron bottom-centre.

### 6.2 `GalleryGrid` (`#gallery-grid`)
- `galleryData.js` (2 items), fixed 400×300 tiles, hover overlay black/40 with centred "VIEW" chip + title/subtitle sliding up. No lightbox, no categories.
  1. "Global City VI - Villa Plots" / "Premium villa plots with world-class infrastructure." → `/gallery-land.png` (2048×1152, 3,796 KB) — **real** GC VI launch collage (identical bytes to root `GC-VI-Website-2048x1152.png`).
  2. "9th Anniversary Celebration" / "Celebrating milestones with our team and partners." → `/gallery-events.png` (2048×1046, 2,926 KB) — **real** 12-photo collage of the 9-year anniversary (stage, "9 YEARS ANNIVERSARY" screen, cake cutting, awards; identical bytes to root `gallery land image.png`).

---

## 7. Animation libraries & interactions present
- **framer-motion 12**: `whileInView` fade/slide-in (`once:true`) on nearly every block; stagger `containerVariants/itemVariants` on detail-page grids; `whileHover` lifts (y -5…-10, scale 1.02–1.08, shadow); `whileTap 0.95`; marquee testimonials (`animate x` infinite); carousel (`AnimatePresence` slide); `AnimatePresence` for preloader/modal/mobile drawer; animated underline widths; rotating eye icon; bouncing scroll arrows; `useScroll/useTransform/useMotionTemplate` for the hero clip-path reveal + parallax zoom.
- **Lenis** (`@studio-freight/react-lenis` 0.0.47): `<ReactLenis root>` is inside HeroSection, so smooth scroll exists only on `/`.
- **Preloader**: logo GIF on navy for 2.5 s on every load.
- **Header**: transparent→navy/90 blur on scroll, logo shrink, nav underline + spring scale, slide-in mobile drawer with staggered links.
- CSS: `.animate-shine` keyframe defined, unused; Tailwind `animate-pulse`/`animate-ping` dots.
- **react-pdf** for master-plan PDFs (worker from unpkg CDN).
- **react-helmet** only on Home + About.
- Unused deps: recharts, @dhiwise/component-tagger, Manrope font.

---

## 8. Real, must-keep content vs placeholder/drop

### Real, must keep
- Company facts: phone **+91 9700123900**, email **Gip@greaterinfraprojects.in**, office **Flat No. 1314, 12th Floor, Vasavi MPM Grand, Metro Junction, Ameerpet, Hyderabad, Telangana 500016**, hours **Mon–Sat 10:00–19:00**, Facebook `facebook.com/Greaterinfragip`, Instagram `instagram.com/greaterinfraprojects`, directions URL, map coordinates ~17.4373, 78.4487.
- Stats: 11+ years, 20+ projects, 600+ acres, 6000+ customers (fix the contradictory body copy). About-page variants: "100% Happy Investors", "11+ Years of Legacy".
- Copy worth keeping (edit lightly): Brand Story (2 paras), Mission/Vision (incl. both blockquotes), Key Principles ×4, Promise/Why-choose ×4, Values ×3 (home) + ×3 (about), Corporate Strengths ×8, Difference table ×5, Leadership intro, hero lines "Turning Your Property Dreams into Trusted Reality" / "A Legacy of Trust. A Standard of Excellence." / "Let's Start a Conversation" / "Begin Your Journey", footer thank-you line, About hero sub-line, Corporate Strengths sub-line "Premium Open Plots & Real Estate Development in Hyderabad".
- SEO strings: meta description, og:title (reuse; add og:image, canonical, per-page titles, JSON-LD Organization/RealEstateAgent).
- Leadership: **Syed Imam** (Chairman & MD) and **Syed Ismail Kashif** (Director – Strategy & Urban Development) with bios + photos. Six further real staff/director photos in `teams/*.png` (need real names from client).
- Global City VI facts: HMDA No. 007133/LO/HMDA/1700/SKP/2024, TS RERA P01100009270, 22 acres, 100 ft road facing, 40/30 ft CC roads, Rudraram/Shankarapally near Mumbai Highway & GITAM University, highlights/amenities lists, 15 real site photos, 2 PDFs (layout 9.9 MB, brochure 23.7 MB), ₹28,000/sq yd (verify with client before showing). Cross-check with `admin/src/lib/mock/projects.ts` + `gc6-masterplan.json` (288 plots) — admin seed wins on conflicts.
- Other real project names/locations/RERA numbers in `propertiesData.js` (for the admin backend, not for hardcoding).
- Real photos: `about-us.png`, `gallery-land.png`, `gallery-events.png` (event/launch collages), `homepage/cover-image1.jpg` (Urban Eden marketing creative), Supabase project JPEGs, two site videos (31.7 MB + 11 MB, re-encode), Urban Eden renders, `img-image-18-374x400.png` ("GLOBAL CITY - V CLUB HOUSE" brochure render).
- Testimonials #1 Rakesh Kota, #2 Ravi Kiran (plausibly real; confirm).
- GIF animation set (12 files, consistent line-art style) + logo animation.

### Placeholder / drop
- Phone **+91 98765 43210** / WhatsApp **919876543210** (App.jsx FAB, detail-page CTA defaults, GC VI `ctaPhone/ctaWhatsApp`).
- Figma names: Cameron Williamson, Floyd Miles, Esther Howard, Savannah Nguyen, Courtney Henry, Robert Fox, Kathryn Murphy, Devon Lane (+ their roles). Unsplash files `kathryn-murphy.jpg`, `devon-lane.jpg`.
- All Unsplash URLs (29 refs): About PartnerCTA bg, Gallery hero bg, detail-page defaults (location image, master plan, gallery ×4, amenities ×3), Properties-page testimonial portraits.
- AI renders: `images/img-.png` (home hero), `images/img--0x0.png`, `about-us-hero.png`, `properties-hero.png`, `explore.png`, `properties-contact.png`, `homepage/home-brand.png`, `purpose-driven-image.png`, `contact-us.jpg`, `gallery-hero.jpg`, `about-us-detail.png`, `images/img-abackyard…png`, `images/img-group-1171274717.png`, `images/img-the-best-way-to.png`, `homepage/legacy-built.svg` + `construction-standard.svg` (embedded rasters), `gallery/component-4*.png`, `images/img-image-18*.png` (except the GC-V clubhouse one), `images/global-locations.png` (stock aerial).
- Stock testimonial thumbs `images/img-rectangle-4*.png` and avatars `images/img-ellipse-7*.png`; testimonials #3–#7 and the three on the Properties page unless confirmed.
- Template/filler copy: "We take great pride in ensuring the satisfaction of our customers… our products", "Together, we can conquer challenges…", "Best Project of the Years", "Our team is made up of dedicated real estate professionals… agents", "The Rarefied and Luxury Real Estate", "Your Ultimate Home Finding Partner", "Experience the Luxury / …art of refined living", "Discover Your Dream Property / …luxury apartments", "affordable apartments to luxury villas", "with unmatched craftsmanship possession", "delivering radiance to all our valued stakeholders", "cup of artisan coffee", generic detail-page defaults (distances, "Bank Approved", "pre-launch prices ending soon").
- Webflow/Rocket icon SVGs under `images/img-*.svg` (bedrooms/bathrooms/sqft/parking, vectors, frames) → replace with lucide. Keep only the two logo SVGs as reference (admin already has clean brand SVGs).
- Bugs not to carry over: 404 video fallback (`/GC-VI-Website-2048x1152.png` lives at repo root), slugs with spaces, "Ongoing" grid showing completed projects, `Math.random()` dots, duplicate headings (Purpose-Driven Development ×2, Why Choose ×2, Promise items ×2), CommitmentSection paragraph ×2, GIF/title mismatches, Lenis only on home, hamburger scroll hack, `window.location.href` navigation, fabricated map `pb` string, pdf.js from unpkg, white-on-transparent SVG favicon, preloading a 1.8 MB PNG, every card hardcoded "Approved".

---

## 9. Asset map

### 9.1 GIFs (`public/*.gif`) — all 25 fps, ~3.0 s loop, GIF89a; style = thin black line-art with navy (#1e3a5f) / light-blue (#a0c0e0) / coral-red (#e06060) fills, white background unless noted
| file | KB | px | frames | bg | subject → meaning (original name from `icon_updates.md`) | used on |
|---|---|---|---|---|---|---|
| gip-logo-animation.gif | 310 | 760×428 | 76 | **transparent**, art is white #f0f0f0 | roof mark draws in, then "GREATER INFRA PROJECTS" wordmark types in with underline → brand logo reveal ("GIP Logo animation_V01") — navy/dark backgrounds only | Preloader |
| integrity-transparency.gif | 968 | 1024² | 75 | white | handshake + documents + magnifier + blue check + navy shield-star → Integrity & Transparency / clear title ("Intergrity & Transperency 5") | Home Values #1, About Values #1 |
| transparency.gif | 633 | 1024² | 76 | white | person at browser window with star rating, review card, chat "…" bubble → Transparency / honest communication / reviews ("Transparency 1") | unused |
| quality-driven-planning.gif | 879 | 1024² | 75 | white | hand with quill drawing a layout on a scroll, house outline, clock, calendar-check, dotted path to checked doc → Quality-Driven Planning ("Quality Driven Planning 2") | unused |
| trust-reliability.gif | 1,693 | 1024² | 76 | white | handshake under a shield with check + five stars + rosette ribbon → Trust & Reliability / approved ("Trust & Reliability 3") | unused |
| timely-responsible-execution.gif | 1,417 | 1024² | 75 | white | stopwatch + calendar with ticked days + clipboard checklist being ticked → Timely & Responsible Execution ("Timely Responsible execution 4") | unused |
| quality-craftsmanship.gif | 390 | 1024² | 75 | white | hand turning a gear, second gear, small house above → Quality / craftsmanship ("Quality Craftmanship 6") | Home "Prime Locations" (mismatch), About Values #2 |
| customer-first-focus.gif (= customer-first-focus-7.gif, identical md5) | 682 ×2 | 1024² | 75 | white | hand holding phone with star, three people icons, open padlock → Customer-First Focus / secure ("Customer First Focus 7") | Home Values #3, About Values #3 |
| customization-options.gif | 1,893 | 1024² | 76 | white | hand holding phone with house icon, finger dragging sliders, star/square/circle → Customization options ("customization options 9") | Home "End-to-End Customer Care" (mismatch) |
| timely-completion.gif | 583 | 1024² | 75 | white | wall clock with curved blue arrow, red dots, hand holding checklist → Timely Completion / delivery ("Timely completion 10") | Home "Proven Track Record" |
| strategic-land-investment-opportunities.gif | 1,710 | 1024² | 76 | **transparent**, black lines + light-blue plot + red target pin | map with roads, highlighted plot parcel, red target pin, scattered dots/triangles → Strategic land / location selection (not in icon_updates.md) — light backgrounds only (black lines) | Home Values #2 "Enduring Excellence" (mismatch) |
Total 12.8 MB; displayed at 256 px → 4× oversized. Re-encode as looping WebM/MP4 (or Lottie if sources exist) at ≤512 px; the logo GIF keeps its alpha only as WebM/APNG. Natural mapping for the rebuild: Transparency→transparency, Quality-Driven Planning→quality-driven-planning, Trust & Reliability→trust-reliability, Timely & Responsible Execution→timely-responsible-execution, Integrity→integrity-transparency, Quality→quality-craftsmanship, Customer focus→customer-first-focus, Delivery→timely-completion, Location→strategic-land, Customisation→customization-options.

### 9.2 Large raster/SVG images
| file | px | KB | what it shows | provenance | verdict |
|---|---|---|---|---|---|
| about-us-hero.png | 4096×2296 | 9,162 | cantilevered glass villa at dusk, pool | AI render | drop or re-encode ≤250 KB AVIF if kept as mood |
| explore.png | 3760×2120 | 8,609 | curved green-roof eco house, lit interior | AI render | drop |
| properties-hero.png | 4096×2296 | 11,200 | cut-away three-storey "dollhouse" at night | AI render | drop |
| properties-contact.png | 4096×2731 | 19,808 | aerial green fields with white plot lines + pins | AI render (on-theme) | re-encode ≤300 KB if kept |
| homepage/cover-image1.jpg | 7200 wide, 300 dpi | 5,064 | "URBAN EDEN 400 SQ YARDS VILLAS" three bungalows, mirrored | real GIP marketing creative, unreferenced | keep, re-encode |
| homepage/home-brand.png | 4096×2305 | 14,545 | white modern villa aerial at dusk (video poster) | AI render | drop (use a video frame) |
| homepage/construction-standard.svg | 1100×460 wrapper | 21,933 | pill mask + embedded 16.4 MB PNG 4096×2732 of dense high-rise condo towers | stock photo in SVG, unreferenced | drop |
| homepage/legacy-built.svg | 1297×403 wrapper | 15,287 | trapezoid mask + embedded 11.5 MB PNG 4096×2027 dark apartment tower at dusk | AI render in SVG, unreferenced | drop |
| about-us.png | 2048×768 | 2,598 | GC VI launch collage (HMDA board, flags, ground-breaking, awards, logo) | real | keep; ask for source photos |
| gallery-land.png (= root GC-VI-Website-2048x1152.png) | 2048×1152 | 3,796 | same GC VI launch collage, wider | real | keep / split into photos |
| gallery-events.png (= root "gallery land image.png") | 2048×1046 | 2,926 | 9th-anniversary event collage | real | keep / split |
| about-us-detail.png | 577×611 | 555 | twin high-rise towers at sunset, rounded | AI render, unreferenced | drop |
| purpose-driven-image.png (dup at root) | 1024×1024 | 1,747 | "VILLA 05" brown/beige villa, black sedan, wet road | AI render | drop |
| contact-us.jpg | 1920×1080 | 320 | penthouse living room, sunset skyline | AI render | drop |
| gallery-hero.jpg | 1920×1080 | 161 | white villa with pool at dusk | AI render, unreferenced | drop |
| images/img-.png | 1440×1021 | 1,827 | timber-clad apartment block at dusk, palms (home hero) | AI render | drop |
| images/img--0x0.png | 3804×2130 | 5,300 | golden skyscraper skyline at night | AI render | drop |
| images/img-abackyard…-1.png (+ -459x1100 variant 1,502 KB) | 1423×950 | 2,057 | white villa aerial with black letterbox bars | AI render, dead section | drop |
| images/img-group-1171274717.png | 1262×403 | 731 | dark apartment tower in rounded mask | AI render, unreferenced | drop |
| images/img-the-best-way-to.png | 576×458 | 492 | curved white apartment tower | AI render, unreferenced | drop |
| images/global-locations.png | 640×640 (JPEG) | 94 | aerial of a planned plotted layout with tree-lined avenues | stock | replace with a real GC VI map |
| images/img-image-18*.png (5) | 612×374 … 374×612 | 185–415 | villa elevation renders; `-374x400` is "GLOBAL CITY - V CLUB HOUSE" | GIP brochure renders, dead section | keep only the clubhouse render |
| images/img-rectangle-4*.png (7) | 180×180 | 51–72 | western houses | stock | drop |
| images/img-ellipse-7*.png (5) | 30×30 | 2–3 | western faces | stock | drop |
| gallery/component-4*.png (6) | 396×297 | 126–302 | luxury bedroom, kitchen, pool, bathroom, couple, tower aerial | AI, unreferenced | drop |
| teams/syed-imam.png | 1114×1066 | 1,089 | real portrait | real | keep, re-encode |
| teams/syed-ismail-kashif.png | 2048×1365 | 2,442 | real event photo, landscape | real | keep, crop portrait |
| teams/{cameron-williamson,floyd-miles,esther-howard,savannah-nguyen,courtney-henry,robert-fox}.png | 947×1020 | 702–1,284 | six real GIP men (two with "DIRECTOR" rosettes) | real, mislabeled | keep pending names |
| teams/kathryn-murphy.jpg, devon-lane.jpg | 400×600 / 600×600 | 42 / 71 | stock portraits | Unsplash | drop |
| images/img-link.svg | 133×63 | 36 | white GIP lockup (header/favicon) | brand | superseded by `admin/public/brand/*.svg` |
| images/img-asset-1-2.svg | 349×195 | 25 | white GIP lockup (footer) | brand | superseded |
| images/img-*.svg (≈30 small) | ≤8 | ≤8 | Webflow/Rocket icons | template | drop |

### 9.3 Remote assets (Supabase bucket `gip - akshay`, project `jjskgxbshmjsfrowlzsj`)
- 70 unique URLs in `propertiesData.js`: WhatsApp-named project JPEGs (~100–120 KB each; GC VI hero 117 KB, GC RRR hero 108 KB), `urban-eden-1.jpg` 2,108 KB, `urban-eden-2.jpg` 653 KB, `highway city.jpeg`, `keesara county.jpg`, etc.
- Videos: `GIP_Home_page_video.mp4` **31,743 KB**, `Kompally County.mp4` 11,017 KB — re-encode (H.264/AV1, ≤5 MB, poster frame) before reuse.
- PDFs: GC VI "Brochure cum Layout" 9,935 KB (page 2 = layout), GC VI Brochure **23,663 KB**.
- `.env` has `VITE_SUPABASE_URL` only; anon key not available in this account.

### 9.4 Too heavy — must re-encode or drop before shipping
Anything over ~300 KB above: the 8 multi-MB AI PNGs (about-us-hero, explore, properties-hero, properties-contact, home-brand, img--0x0, img-backyard, purpose-driven), both SVG-wrapped rasters (37 MB combined), the three real collages (2.6–3.8 MB → AVIF ≈150–250 KB or split into individual photos), the 10 team PNGs (0.7–2.4 MB → ≤80 KB WebP each), cover-image1.jpg (5 MB), all 12 GIFs (12.8 MB → WebM/MP4), both videos, both PDFs (serve as download links only, never inline).
