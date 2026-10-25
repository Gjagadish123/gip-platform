// Home page copy, verbatim from greaterinfraprojects.in (captured 2026-10-21), in the live page's section order.
// The client asked for the live home's exact content; only the presentation is new. Pictures point at the client's
// own Supabase storage (an allowed image host), as the live page does; the two films, the Get in touch picture and the
// two Why drawings are optimised local copies of the live site's own files (2026-10-22).
// ponytail: RECENT_PROJECTS and the legacy slides are hardcoded until the admin portal publishes projects.
import { touchVilla } from "@/assets/images";

import { BRAND_STORY, PRINCIPLES, PROMISES } from "./site";

const STORAGE = "https://jjskgxbshmjsfrowlzsj.supabase.co/storage/v1/object/public/gip%20-%20akshay";

export const HERO = {
  title: ["Turning Your Property", "Dreams into Trusted Reality"],
  lede: "Premium Plots & Lifestyle Communities in Hyderabad — Crafted for Your Lifestyle & Investment Growth.",
} as const;

export const ABOUT = {
  label: "About us",
  title: "Greater Infra Projects",
  p1: "We take great pride in ensuring the satisfaction of our customers. That's why we proudly guarantee the quality and reliability of our products.",
  p2: "Hyderabad's evolving landscape is the foundation of our vision. At Greater Infra Projects, we see every development as an opportunity to create trust, value, and enduring communities. Rooted in strategic planning and driven by a customer-first approach, we focus on developing legally sound, thoughtfully designed residential and lifestyle projects that balance modern living with long-term investment growth.",
  // GIP_Home_page_video.mp4 re-encoded: 1280 px for desktop, 960 px for phones, fast-start, with posters.
  video: { src: "/media/about-film.mp4", poster: "/media/about-film-poster.webp" },
  videoMobile: { src: "/media/about-film-mobile.mp4", poster: "/media/about-film-poster-mobile.webp" },
  story: { title: "Our Brand Story", p1: BRAND_STORY.p1, p2: BRAND_STORY.p2 },
} as const;

// "100+ satisfied customers" under 6000+ is the live site's own wording; kept as published (flagged to the client).
export const HOME_STATS = [
  {
    value: 11,
    suffix: "+",
    label: ["Years of Industry", "Experience"],
    text: "With over a decade of hands-on experience in real estate development, we bring deep market knowledge, strong execution capabilities, and a proven understanding of customer needs. Our journey is built on trust, transparency, and long-term relationships.",
  },
  {
    value: 20,
    suffix: "+",
    label: ["Successfully", "Delivered Projects"],
    text: "From premium gated communities to open villa plots, we have successfully delivered 21 diverse projects across strategic locations. Each project reflects our commitment to quality planning, timely delivery, and superior construction standards.",
  },
  {
    value: 600,
    suffix: "+",
    label: ["Acres", "Developed"],
    text: "We have transformed more than 600 acres of land into thoughtfully planned developments that balance modern infrastructure with sustainable living. Our large-scale developments stand as landmarks of smart urban growth.",
  },
  {
    value: 6000,
    suffix: "+",
    label: ["Happy", "Customers"],
    text: "Our greatest achievement is the trust of 100+ satisfied customers who chose us for their dream homes and investments. Their confidence fuels our passion to consistently exceed expectations and deliver lasting value.",
  },
] as const;

export const PRINCIPLES_BLOCK = { label: "Key Principles", title: "Built on Principle", items: PRINCIPLES } as const;

export const LEGACY = {
  label: "The Projects",
  title: "A Legacy Built on Trust and Planning",
  text: "Together, we can conquer challenges, utilize our strengths, and achieve remarkable success in this ambitious home project.",
  slides: [
    { src: `${STORAGE}/urban-eden-1.jpg`, alt: "Artist's impression of the Urban Eden club house" },
    { src: `${STORAGE}/urban-eden-2.jpg`, alt: "Artist's impression of the Urban Eden club house, second view" },
  ],
} as const;

export const PROMISE = { label: "Our Promise", title: "Why Choose Greater Infra Projects", lede: PROMISES.lede, items: PROMISES.items } as const;

export const HOME_VALUES = {
  label: "Values",
  title: "Our Values",
  lede: "A philosophy that guides every decision we make. At Greater Infra Projects, our values are not statements—they are standards.",
  items: [
    {
      title: "Integrity & Transparency",
      text: "We operate with absolute clarity—clear titles, approved layouts, and honest communication at every stage. Trust is built through transparency, and we treat it as non-negotiable.",
      art: "integrity-transparency",
    },
    {
      title: "Enduring Excellence",
      text: "From infrastructure planning to finishing standards, every detail reflects precision and permanence. We build with a long-term perspective, not short-term compromises.",
      art: "strategic-land-investment-opportunities",
    },
    {
      title: "Customer-First Focus",
      text: "Every project is designed around the needs, aspirations, and peace of mind of our customers—before, during, and long after possession.",
      art: "customer-first-focus",
    },
  ],
} as const;

export const RECENT_PROJECTS = {
  kicker: "Best Project of the Years",
  title: "Our recent projects",
  items: [
    {
      name: "GLOBAL CITY VI",
      location: "Rudraram / Shankarapally, Sangareddy District, Hyderabad",
      image: `${STORAGE}/GLOBAL%20CITY%20VI/WhatsApp%20Image%202026-03-06%20at%204.13.29%20PM.jpeg`,
      href: "/projects/global-city-vi",
    },
    {
      name: "Global City RRR",
      location: "Peddapur, Sangareddy District, Hyderabad",
      image: `${STORAGE}/GLOBAL%20CITY%20RRR/WhatsApp%20Image%202026-03-06%20at%204.14.59%20PM.jpeg`,
    },
    {
      name: "KOMPALLY COUNTY III",
      location: "Near Gundlapochampally, Medchal–Malkajgiri District, Hyderabad",
      image: `${STORAGE}/KOMPALLY%20COUNTY%20III/WhatsApp%20Image%202026-03-07%20at%203.31.42%20PM.jpeg`,
      impression: true, // a villa render, not a photograph
    },
    {
      name: "GLOBAL NATURE VIEW CITY",
      location: "Yacharam, Nagarjuna Sagar Road, Hyderabad",
      image: `${STORAGE}/GLOBAL%20NATURE%20VIEW%20CITY/WhatsApp%20Image%202026-03-06%20at%204.14.44%20PM%20(1).jpeg`,
    },
    {
      name: "GODAVARI GREEN FARMS",
      location: "Near Shamirpet & Mediciti Hospital Road, Medchal–Malkajgiri District, Hyderabad",
      image: `${STORAGE}/GODAVARI%20GREEN%20FARMS/WhatsApp%20Image%202026-03-06%20at%204.13.53%20PM%20(1).jpeg`,
      trimTop: true, // the photo carries a thin black band along its top edge
    },
  ],
} as const;

export const TOUCH = {
  label: "Get in touch",
  title: ["Explore your", "dream home today"],
  text: "Discover the perfect blend of luxury, convenience, and community at Global City RRR. Your dream home awaits.",
  image: touchVilla,
} as const;

export const WHY = {
  label: "Why Choose Us",
  title: "Why Choose Greater Infra Projects",
  sub: "A value proposition built on trust, planning, and execution",
  items: [
    { ...PROMISES.items[1], art: "quality-craftsmanship" },
    { ...PROMISES.items[2], art: "customization-options" },
    { ...PROMISES.items[3], art: "timely-completion" },
  ],
  // Kompally County.mp4 re-encoded at its own 640 px, 24 fps, fast-start, with a poster.
  video: { src: "/media/why-film.mp4", poster: "/media/why-film-poster.webp" },
} as const;

export const TESTIMONIALS = {
  label: "Testimonials",
  title: "Client Feedbacks",
  items: [
    { quote: "Nice plotting at Rudraram, really liked the spacious roads and good infrastructure. Definitely the best open plots in the Rudraram area for long-term investment.", name: "Rakesh Kota" },
    { quote: "A very promising group with a dedicated attitude and uncompromising sincerity. They completed Green Hills Farms in Yadadri and LR Medchal County. Their project planning and execution are excellent.", name: "Ravi Kiran" },
    { quote: "I've invested in multiple projects with GIP Properties and have always been impressed with their transparency and quality of work. The team is knowledgeable and genuinely cares about client success.", name: "Srinivas G" },
    { quote: "Purchased a plot in Medchal County recently. The development progress is impressive, and the legal documentation was handled very professionally by the GIP team.", name: "Venkata Ramana" },
    { quote: "Choosing GIP Properties for our investment in Shadnagar was a great decision. The location is strategic and the team provided excellent support throughout the registration process.", name: "Anitha Reddy" },
    { quote: "Finding a reliable developer in the Hyderabad market can be tough, but GIP stands out for their transparency. Their Yadadri projects are well-planned with great future potential.", name: "Karthik Sharma" },
    { quote: "Investing in GIP's Srisailam Highway project has given me great peace of mind. The property appreciation in this belt is fantastic and the layout maintenance is top-notch.", name: "Mahesh Rao" },
  ],
} as const;
