// Project-page content: what the data model holds today plus the client's brochure claims,
// and the small derivations the sections share.
// ponytail: the brochure constants describe the one hardcoded project (Global City VI); move them into Project when
// the admin can edit highlights, amenities and nearby places.
import {
  BadgeCheck,
  Building,
  Droplets,
  FileCheck2,
  GraduationCap,
  LayoutGrid,
  Maximize2,
  Milestone,
  Route,
  Ruler,
  ShieldCheck,
  Trees,
  Waves,
  WavesLadder,
  type LucideIcon,
} from "lucide-react";

import { formatDate } from "@/lib/format";
import type { Approval, Asset, Project, Unit } from "@/lib/types";

/** "Rudraram" from "Rudraram / Shankarapally, Sangareddy District, Hyderabad". */
export const firstPlace = (short: string) => short.split(",")[0].split("/")[0].trim();

export function approvalFacts(project: Project) {
  const find = (a: Approval["authority"]) => project.legal.approvals.find((x) => x.authority === a);
  const hmda = find("HMDA");
  const rera = find("RERA");
  const parts = [hmda ? `${hmda.authority} approved` : null, rera ? "TS RERA registered" : null].filter((p): p is string => !!p);
  return { hmda, rera, parts };
}

/** The earlier layout approval printed on the brochure's layout copy (the final permit is in project.legal). */
export const BROCHURE_LP = { reference: "007133/LO/HMDA/1700/SKP/2024", date: "28 Nov 2024" } as const;

/** The gallery's real photographs: images that are not renders (flagged in the admin, or generated). */
export const sitePhotos = (project: Project): Asset[] =>
  project.media.gallery.filter((a) => a.kind === "image" && !a.impression && a.source !== "generated");

/** "2026-03-06" from "WhatsApp Image 2026-03-06 at 4.13.29 PM.jpeg": the only date the site photos carry. */
export const photoDate = (a: Asset) => /\d{4}-\d{2}-\d{2}/.exec(a.name ?? "")?.[0];

/** The address as the brochure gives it, ahead of the village / mandal / district line from the data. */
export const BROCHURE_ADDRESS = ["Near GITAM University, Rudraram to Indrakaran Road", "On the Mumbai Highway (NH-65)"];

export const mapsEmbed = (pin: { lat: number; lng: number }) =>
  `https://maps.google.com/maps?q=${pin.lat},${pin.lng}&z=14&output=embed`;
export const mapsDirections = (pin: { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;

/* ---------- key highlights (icon, value, label: the ledger beside the sticky heading) ---------- */

export function highlights(project: Project, units: Unit[], min: number, max: number, hmda?: Approval, rera?: Approval) {
  const area = project.landArea;
  const items: { icon: LucideIcon; value: string; label: string }[] = [
    area ? { icon: Maximize2, value: `${area.acres} Acres ${area.guntas ?? 0} Guntas`, label: "Total layout area" } : null,
    { icon: LayoutGrid, value: `${units.length} Plots`, label: "Villa and open plots" },
    { icon: Ruler, value: `${min}–${max} sq yd`, label: "Plot sizes" },
    { icon: Milestone, value: "100 ft road", label: "Master-plan road on the frontage" },
    { icon: Route, value: "40′ & 30′ CC roads", label: "All internal roads" },
    hmda ? { icon: FileCheck2, value: "HMDA approved", label: `Final layout permit ${hmda.reference}` } : null,
    rera ? { icon: BadgeCheck, value: "TS RERA registered", label: rera.reference ?? "" } : null,
    { icon: WavesLadder, value: "Clubhouse & pool", label: "With a community hall" },
    { icon: Waves, value: "Underground services", label: "Drainage, electricity, LED street lights" },
    { icon: GraduationCap, value: "Near GITAM University", label: "On the Mumbai Highway, NH-65" },
  ].filter((i) => i !== null);
  return items;
}

/* ---------- amenities, grouped from the brochure's project highlights ---------- */

export const AMENITY_GROUPS: { icon: LucideIcon; title: string; items: string[] }[] = [
  { icon: Building, title: "Clubhouse", items: ["Clubhouse", "Swimming pool", "Community hall"] },
  { icon: Route, title: "Roads and lighting", items: ["Grand entrance arch", "40′ & 30′ CC roads", "Underground electricity", "LED street lights"] },
  {
    icon: Droplets,
    title: "Water and drainage",
    items: ["Overhead water tank", "Water connection to each plot", "Underground drainage", "Rainwater harvesting pits"],
  },
  { icon: Trees, title: "Green and leisure", items: ["Avenue plantation with tree guards", "Children's park", "Cycle track", "Landscaped parks"] },
  {
    icon: ShieldCheck,
    title: "Security and legal",
    items: ["All-round compound wall", "24/7 security", "Clear title", "Bank loan available", "Vaastu compliant"],
  },
];

/* ---------- nearby, as the brochure states it (no measured distances exist) ---------- */

export const NEARBY: { id: string; label: string; places: { name: string; time: string }[] }[] = [
  {
    id: "connectivity",
    label: "Connectivity",
    places: [
      { name: "Mumbai Highway (NH-65)", time: "Near" },
      { name: "Isnapur X Road", time: "Near" },
      { name: "Muttangi Junction, ORR Exit 3", time: "Near" },
      { name: "Patancheru junction", time: "10 min drive" },
      { name: "Kollur, ORR Exit 2", time: "15 min drive" },
      { name: "Kokapet Neopolis IT SEZ", time: "20 min" },
      { name: "JNTU & Miyapur", time: "25 min drive" },
      { name: "HITEC City", time: "30 min drive" },
    ],
  },
  {
    id: "education",
    label: "Education",
    places: [
      { name: "GITAM University", time: "Near" },
      { name: "IIT Hyderabad, Kandi", time: "Near" },
      { name: "ICFAI University", time: "Near" },
    ],
  },
  { id: "healthcare", label: "Healthcare", places: [{ name: "TRR Medical College & General Hospital", time: "Near" }] },
  {
    id: "townships",
    label: "Townships",
    places: [
      { name: "BDL township", time: "Near" },
      { name: "ODF township", time: "Near" },
      { name: "ODF Shankarpally", time: "Near" },
    ],
  },
];

/* ---------- FAQ: answers only from the approvals, the inventory and the brochure ---------- */

export function faqItems({ hmda, rera, plots, min, max, hours }: {
  hmda?: Approval;
  rera?: Approval;
  plots: number;
  min: number;
  max: number;
  hours: string;
}) {
  const approvals = [
    hmda ? `HMDA issued the final layout permit ${hmda.reference}${hmda.date ? ` on ${formatDate(hmda.date)}` : ""}.` : null,
    `The brochure's layout copy carries HMDA LP ${BROCHURE_LP.reference} dated ${BROCHURE_LP.date}.`,
    rera ? `The project is registered with TS RERA under ${rera.reference}, which you can check on rera.telangana.gov.in.` : null,
  ].filter(Boolean);
  return [
    { q: "Is the layout approved?", a: `Yes. ${approvals.join(" ")}` },
    {
      q: "What plot sizes are there?",
      a: `The layout has ${plots} plots from ${min} to ${max} sq yd, most of them under 300 sq yd, almost all facing east or west, on 40 ft and 30 ft CC roads. Ask us which sizes and facings are open today.`,
    },
    {
      q: "Can I get a bank loan for a plot?",
      a: "Bank loans are available, as the project brochure states, and the titles are clear. We can share the documents your bank will ask for.",
    },
    {
      q: "How do I visit the site?",
      a: `Use Schedule site visit at the bottom of the page or message us on WhatsApp (${hours}). We arrange the visit at a time that suits you.`,
    },
    {
      q: "Do you build villas on the plots?",
      a: "Yes, on request. The brochure shows an east-facing and a west-facing villa design for this layout; once you have chosen a plot we can take you through construction.",
    },
    {
      q: "Can NRIs buy a plot here?",
      a: "Yes. Indian rules allow NRIs and OCI cardholders to buy residential plots. We share the documents, site photos and plot details on WhatsApp, and can show the site to family members in Hyderabad.",
    },
  ];
}

/* ---------- plot sizes by facing (the plot finder, without prices) ---------- */

export const FACINGS = ["East", "West", "North", "South"] as const;
export type MainFacing = (typeof FACINGS)[number];

const BANDS = [
  { id: "all", label: "All sizes", min: 0, max: Infinity },
  { id: "u200", label: "Under 200 sq yd", min: 0, max: 200 },
  { id: "200", label: "200–299 sq yd", min: 200, max: 300 },
  { id: "300", label: "300–399 sq yd", min: 300, max: 400 },
  { id: "400", label: "400 sq yd and above", min: 400, max: Infinity },
];

export interface BandStat {
  id: string;
  label: string;
  total: number;
  available: number;
  min: number;
  max: number;
}
export interface FacingStat {
  facing: MainFacing;
  /** "all" first, then only the size bands this facing has. */
  bands: BandStat[];
}

/** Counts by each plot's main facing and size band. Plain numbers, so the client band stays small. */
export function plotsByFacing(units: Pick<Unit, "facing" | "area" | "status">[]): FacingStat[] {
  return FACINGS.map((facing) => {
    const of = units.filter((u) => u.facing === facing);
    const bands = BANDS.map((b) => {
      const inBand = of.filter((u) => u.area >= b.min && u.area < b.max);
      const areas = inBand.map((u) => u.area);
      return {
        id: b.id,
        label: b.label,
        total: inBand.length,
        available: inBand.filter((u) => u.status === "available").length,
        min: Math.round(Math.min(...areas)),
        max: Math.round(Math.max(...areas)),
      };
    }).filter((b) => b.total > 0);
    return { facing, bands };
  }).filter((f) => f.bands.length > 0);
}

if (process.env.NODE_ENV === "test") {
  // ponytail: run with NODE_ENV=test npx jiti src/components/project/content.ts
  const rows = plotsByFacing([
    { facing: "East", area: 150, status: "available" },
    { facing: "East", area: 250.4, status: "sold_out" },
    { facing: "East", area: 450, status: "available" },
    { facing: "West", area: 199.9, status: "mortgaged" },
  ]);
  const east = rows.find((r) => r.facing === "East")!;
  console.assert(rows.length === 2, "facings without plots are dropped");
  console.assert(east.bands[0].id === "all" && east.bands[0].total === 3 && east.bands[0].available === 2, "all band counts");
  console.assert(east.bands.slice(1).reduce((n, b) => n + b.total, 0) === 3, "bands partition the facing");
  console.assert(east.bands[0].min === 150 && east.bands[0].max === 450, "size range");
}
