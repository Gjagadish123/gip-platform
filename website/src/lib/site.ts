// Company content that is not project data: nav, stats, principles, values, leadership, completed projects.
// Copy is verbatim from the old live site (docs/research/content-inventory.md) unless marked NEW.
// ponytail: delete COMPLETED_PROJECTS when completed projects come from the backend.
import { teamSyedImam, teamSyedIsmailKashif } from "@/assets/images";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const COPYRIGHT_YEAR = 2026; // build constant: a Date in render is a prerender error under cacheComponents

export const STATS = [
  { value: 11, suffix: "+", label: "Years of Industry Experience" },
  { value: 20, suffix: "+", label: "Projects" },
  { value: 600, suffix: "+", label: "Acres Developed" },
  { value: 6000, suffix: "+", label: "Happy Customers" },
] as const;

export const TAGLINE = "Premium Open Plots & Real Estate Development in Hyderabad";

export const OFFICE = {
  line1: "Flat No. 1314, 12th Floor, Vasavi MPM Grand",
  line2: "Metro Junction, Ameerpet, Hyderabad, Telangana 500016",
  hours: "Mon – Sat, 10:00 – 19:00 IST",
  pin: { lat: 17.4373, lng: 78.4487 },
  directionsUrl:
    "https://www.google.com/maps/dir//Vasavi+MPM+Grand,+Metro+Junction,+Ameerpet,+Hyderabad,+Telangana+500016",
} as const;

export const PRINCIPLES = [
  {
    title: "Transparency",
    description:
      "We believe transparency is the foundation of trust. From approvals and documentation to pricing and timelines, we ensure absolute clarity at every stage of the customer journey.",
  },
  {
    title: "Quality-Driven Planning",
    description:
      "Every project is thoughtfully planned with a strong emphasis on layout design, infrastructure, and long-term usability. We focus on building developments that stand the test of time.",
  },
  {
    title: "Trust & Reliability",
    description:
      "We value relationships over transactions. By delivering what we promise and standing by our commitments, we build long-term confidence with every customer.",
  },
  {
    title: "Timely & Responsible Execution",
    description:
      "We understand the significance of a real estate investment. With disciplined execution and structured planning, we strive to deliver our projects responsibly and on schedule.",
  },
] as const;

export const PROMISES = {
  lede: "A value proposition built on trust, planning, and execution. We define how we select land, design communities, engage with customers, and deliver long-term value.",
  items: [
    {
      title: "Trusted by Buyers & Investors",
      description:
        "Our reputation is built on consistent delivery, transparent practices, and long-standing relationships with customers and investors.",
    },
    {
      title: "Prime Locations with Strong Connectivity",
      description:
        "Each project is carefully chosen for its present livability and future appreciation—aligned with government plans and infrastructure corridors.",
    },
    {
      title: "End-to-End Customer Care",
      description:
        "We remain involved beyond the sale, offering guidance, support, and clarity throughout the ownership journey.",
    },
    {
      title: "Proven Track Record of Delivery",
      description:
        "Our developments reflect disciplined execution, adherence to commitments, and respect for timelines.",
    },
  ],
} as const;

export const BRAND_STORY = {
  p1: "Greater Infra Projects is a real estate development firm driven by a clear philosophy—build with integrity, plan with purpose, and deliver enduring value. We are committed to creating thoughtfully planned developments that stand the test of time, guided by transparency, ethics, and disciplined execution.",
  p2: "At the core of our approach lies an unwavering belief in doing business the right way. Every project is founded on clear titles, approved layouts, and complete documentation, ensuring absolute clarity and confidence for our customers. We place ethics and transparency at the forefront of every decision, treating trust as the most valuable asset we build.",
} as const;

export const WHO_WE_ARE = {
  heading: "Purpose-Driven Development",
  p1: "Greater Infra Projects is a real estate development firm guided by a singular philosophy — to build with integrity, plan with precision, and deliver enduring value. Every development is conceived with a long-term perspective, grounded in transparency, ethical practices, and disciplined execution.",
  quote:
    "At the core of our approach lies a simple belief: each project is backed by clear land titles, approved layouts, and complete documentation.",
  stats: [
    { value: 11, suffix: "+", label: "Years of Trust" },
    { value: 6000, suffix: "+", label: "Happy Customers" },
    { value: 20, suffix: "+", label: "Projects" },
  ],
} as const;

export const MISSION = {
  heading: "Trust, transparency, responsibility", // NEW (old H2 duplicated "Purpose-Driven Development")
  p1: "Our mission is to uphold a development philosophy rooted in trust, transparency, and responsibility.",
  p2: "We are committed to delivering a real estate experience defined by fairness, clear communication, and uncompromising quality. Every Greater Infra Projects development begins with a promise — to create thoughtfully planned communities that offer long-term value, superior living standards, and the assurance of a secure investment.",
  quote:
    "Through disciplined execution and ethical practices, we continuously strive to elevate industry standards and deliver on every commitment we make.",
} as const;

export const VISION = {
  heading: "Building for Generations",
  p1: "Our vision is to establish Greater Infra Projects as one of the most trusted and respected real estate brands.",
  p2: "We aim to grow alongside our customers' confidence by developing homes and communities that meaningfully enhance everyday living. With a strong focus on responsible development, design excellence, and continuous innovation, our projects are created to remain relevant — not just today, but for generations to come.",
  quote:
    "Each development reflects our core values of quality, reliability, and customer satisfaction, aligned seamlessly with evolving lifestyles and expectations.",
} as const;

export const VALUES = {
  lede: "A philosophy that guides every decision we make. At Greater Infra Projects, our values are not statements—they are standards.",
  items: [
    {
      title: "Integrity",
      description:
        "We conduct ourselves with honesty, transparency, and ethical standards in all aspects of our business.",
    },
    {
      title: "Quality",
      description:
        "We are committed to delivering the highest quality in every project we undertake, ensuring durability, functionality, and aesthetic appeal.",
    },
    {
      title: "Customer Focus",
      description:
        "We are dedicated to understanding and exceeding the expectations of our clients, providing exceptional service and value in every interaction.",
    },
  ],
} as const;

export const STRENGTHS = {
  lede: "Delivering high-value residential plotting ventures with clear titles, prime locations, and strong growth potential across Hyderabad.",
  items: [
    {
      title: "We build Value driven investments",
      description:
        "Our projects are carefully planned plotting ventures focused on appreciation, transparency, and long-term returns — not just land parcels.",
    },
    {
      title: "Strategic Location Selection",
      description:
        "We focus on high-growth corridors around Hyderabad including developing zones near ORR, upcoming infrastructure hubs, and fast-expanding suburbs.",
    },
    {
      title: "Fast & Structured Development",
      description:
        "From land acquisition to layout development, we ensure timely execution with planned roads, clear demarcation, and ready-to-register plots.",
    },
    {
      title: "End-to-End In-House Support",
      description:
        "From site visits and documentation to registration assistance and after-sales support — everything is managed professionally.",
    },
    {
      title: "Clear Title & Legal Transparency",
      description:
        "100% clear documentation with verified layouts to ensure safe and secure investment for every customer.",
    },
    {
      title: "High Growth Micro-Markets",
      description:
        "We identify emerging real estate hotspots with strong appreciation potential and infrastructure expansion.",
    },
    {
      title: "Financially Disciplined Operations",
      description: "Sustainable project planning ensuring smooth development cycles and investor confidence.",
    },
    {
      title: "Projects Selected with Vision",
      description:
        "Every venture is chosen based on connectivity, future developments, accessibility, and lifestyle value.",
    },
  ],
} as const;


export const LEADERSHIP = {
  heading: "Visionary Leadership. Disciplined Execution.",
  lede: "Leadership at Greater Infra Projects defines direction, values, and standards. Guided by experience, integrity, and strategic foresight, our leaders shape developments that inspire trust and deliver lasting value.",
  people: [
    {
      name: "Syed Imam",
      role: "Chairman & Managing Director",
      photo: teamSyedImam,
      bio: "With a clear vision and strong entrepreneurial leadership, Syed Imam has laid the foundation of Greater Infra Projects on the principles of transparency, trust, and customer-centricity. His approach emphasizes ethical growth, meticulous planning, and delivering enduring value—ensuring every project reflects excellence in both execution and intent.",
    },
    {
      name: "Syed Ismail Kashif",
      role: "Director – Strategy & Urban Development",
      photo: teamSyedIsmailKashif,
      bio: "Syed Ismail Kashif brings a strategic, future-focused perspective to Greater Infra Projects, overseeing planning and brand direction. With a strong grounding in business strategy and real estate development, he plays a pivotal role in shaping sustainable growth, strengthening systems, and ensuring that every project aligns with the company's promise of quality, integrity, and thoughtful design.",
    },
  ],
} as const;

/** Delivered layouts (old live site). Names and locations only; years and districts are unconfirmed. */
export const COMPLETED_PROJECTS = [
  { name: "Green Hill Farms", location: "Yadadri" },
  { name: "Global City", location: "Rudraram" },
  { name: "Global City II", location: "Nandigama" },
  { name: "Global City III", location: "Isnapur" },
  { name: "Greater Infra Resorts", location: "Shadnagar" },
  { name: "LR Palm Meadows", location: "Rampally" },
  { name: "Highway City", location: "Yadadri" },
  { name: "True Pride", location: "Bachara" },
  { name: "LR Medchal County", location: "Medchal" },
  { name: "Keesara County", location: "Bogaram" },
  { name: "RR Kompally County", location: "Kompally" },
  { name: "Sri Yadadri Gardens", location: "Yadadri" },
  { name: "Rampally County", location: "Rampally" },
  { name: "Global Highway City", location: "Sangareddy" },
  { name: "Kompally County II", location: "Medchal" },
  { name: "Global Village", location: "Kadthal" },
] as const;

export const CLOSING_CTA = {
  heading: "Let's start a",
  accent: "conversation",
  lede: "We believe investment starts with a conversation, not pressure. Reach out and let us understand your vision.",
} as const;

export const THANK_YOU =
  "Thank you for considering Greater Infra Projects for your real estate needs. We look forward to hearing from you and assisting you on your real estate journey.";

export const DISCLAIMER =
  "Images marked “Artist’s impression” are indicative and not a representation of the final development. Plot availability is updated by Greater Infra Projects and is correct as of the date shown. TS RERA P01100009270 (Global City VI).";

export const RERA_PORTAL = "https://rera.telangana.gov.in/";
