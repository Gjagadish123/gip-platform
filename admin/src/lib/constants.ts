import {
  BadgeCheck, Blocks, BrickWall, Building, Building2, Cctv, CloudRain, DoorOpen, Droplets, FileCheck2,
  GraduationCap, Hospital, Landmark, LayoutGrid, Leaf, Lightbulb, MapPin, Maximize2, Milestone, Route,
  ScrollText, ShieldCheck, Sprout, Target, TreePalm, Trees, TrendingUp, Waves, WavesLadder,
  type LucideIcon,
} from 'lucide-react';
import type {
  AreaUnit, IconKey, Lifecycle, LocationArea, MortgagedTo, Project, ProjectType, PublishState, UnitStatus,
} from './types';

/* ---------- demo clock (never read the real clock in render / module scope: cacheComponents) ---------- */

export const DEMO_TODAY = '2026-10-14';
export const DEMO_NOW = '2026-10-14T11:30:00+05:30';

/* ---------- company (from the live /contact page) ---------- */

export const COMPANY = {
  name: 'Greater Infra Projects',
  phone: '+91 97001 23900',
  phoneE164: '+919700123900',
  email: 'Gip@greaterinfraprojects.in',
  office: 'Ameerpet, Hyderabad',
  website: 'https://www.greaterinfraprojects.in',
} as const;

/** The dummy number the live site ships everywhere. Never accept it as a real phone. */
export const PLACEHOLDER_PHONES = ['+919876543210'];

/* ---------- unit statuses (client order everywhere: legend, bars, menus, keys 1–5) ---------- */

// Hold came after the first four, so it goes last: keys 1–4 keep the meaning admins learned.
export const UNIT_STATUSES: UnitStatus[] = ['available', 'sold_out', 'mortgaged', 'registered', 'hold'];

export const UNIT_STATUS_META: Record<UnitStatus, {
  label: string;
  token: 'available' | 'sold' | 'mortgaged' | 'registered' | 'hold'; // → --status-<token>, .tile[data-s]
  pattern: 'plain' | 'hatch' | 'dots' | 'corner' | 'stripes';
  key: '1' | '2' | '3' | '4' | '5';
  dateLabel: string;    // label of the status-date input
  description: string;  // one line for tooltips / the sheet
}> = {
  available: { label: 'Available', token: 'available', pattern: 'plain', key: '1', dateLabel: 'Available from', description: 'Open for sale.' },
  sold_out: { label: 'Sold Out', token: 'sold', pattern: 'hatch', key: '2', dateLabel: 'Sold on', description: 'Booked or agreement signed; sale deed not yet registered.' },
  mortgaged: { label: 'Mortgaged', token: 'mortgaged', pattern: 'dots', key: '3', dateLabel: 'Mortgaged on', description: 'Held as security with the approving authority until released.' },
  registered: { label: 'Registered', token: 'registered', pattern: 'corner', key: '4', dateLabel: 'Registered on', description: 'Sale deed registered at the Sub-Registrar office. Final.' },
  hold: { label: 'Hold', token: 'hold', pattern: 'stripes', key: '5', dateLabel: 'On hold since', description: 'Blocked for a buyer while the booking is confirmed. Not open for sale.' },
};

export const MORTGAGEES: MortgagedTo[] = ['HMDA', 'DTCP', 'Gram Panchayat', 'Bank', 'Other'];

/* ---------- areas ---------- */

export const AREA_UNIT_LABEL: Record<AreaUnit, string> = {
  sq_yd: 'sq yd', sq_ft: 'sq ft', acre: 'acres', gunta: 'guntas',
};

/** Public "location" filter areas (old locationFilter values first). */
export const LOCATION_AREAS: LocationArea[] = [
  { id: 'indrakaran-rudraram', name: 'Indrakaran - Rudraram' },
  { id: 'kompally', name: 'Kompally' },
  { id: 'shankarpalli', name: 'Shankarpalli' },
  { id: 'peddapur', name: 'Peddapur' },
  { id: 'yacharam', name: 'Yacharam' },
  { id: 'shamirpet', name: 'Shamirpet' },
];

/* ---------- project types (domain §3.1) ---------- */

export const DEFAULT_PROJECT_TYPES: ProjectType[] = [
  {
    id: 'open-plots', name: 'Open Plots', category: 'Residential', unitNoun: 'Plot', unitNounPlural: 'Plots',
    areaUnit: 'sq_yd', areaLabel: 'Plot area', priceMode: 'per_area', hasInventory: true, hasConfigurations: false,
    unitFields: ['block', 'dimensions', 'facing', 'roadWidth', 'corner'],
    description: 'Plotted layouts sold per sq yd.',
  },
  {
    id: 'villa-plots', name: 'Villa Plots', category: 'Residential', unitNoun: 'Plot', unitNounPlural: 'Plots',
    areaUnit: 'sq_yd', areaLabel: 'Plot area', priceMode: 'per_area', hasInventory: true, hasConfigurations: true,
    unitFields: ['block', 'dimensions', 'facing', 'roadWidth', 'corner'],
    description: 'Plots with optional villa construction packages.',
  },
  {
    id: 'villas', name: 'Villas', category: 'Residential', unitNoun: 'Villa', unitNounPlural: 'Villas',
    areaUnit: 'sq_yd', areaLabel: 'Plot area', priceMode: 'total', hasInventory: true, hasConfigurations: true,
    unitFields: ['block', 'facing', 'roadWidth', 'corner', 'builtUpArea', 'bedrooms'],
    description: 'Independent houses sold as a package.',
  },
  {
    id: 'apartments', name: 'Apartments', category: 'Residential', unitNoun: 'Flat', unitNounPlural: 'Flats',
    areaUnit: 'sq_ft', areaLabel: 'Super built-up area', priceMode: 'total', hasInventory: true, hasConfigurations: true,
    unitFields: ['tower', 'floor', 'bhk', 'carpetArea', 'facing'],
    description: 'Flats in towers, by floor and BHK.',
  },
  {
    id: 'farm-land', name: 'Farm Land', category: 'Farm', unitNoun: 'Farm Plot', unitNounPlural: 'Farm Plots',
    areaUnit: 'sq_yd', areaLabel: 'Plot area', priceMode: 'per_area', hasInventory: true, hasConfigurations: false,
    unitFields: ['block', 'dimensions', 'facing', 'roadWidth'],
    description: 'Farm plots sold per sq yd.',
  },
  {
    id: 'resorts-commercial', name: 'Resorts & Commercial', category: 'Hospitality', unitNoun: 'Unit', unitNounPlural: 'Units',
    areaUnit: 'sq_ft', areaLabel: 'Area', priceMode: 'total', hasInventory: false, hasConfigurations: false,
    unitFields: ['block', 'floor'],
    description: 'Listing and detail page, no unit inventory.',
  },
];

/** Unknown ids fall back to Open Plots so a stale draft never crashes a page. */
export function getProjectType(id: string): ProjectType {
  return DEFAULT_PROJECT_TYPES.find((t) => t.id === id) ?? DEFAULT_PROJECT_TYPES[0];
}

/** What buyers see as the type: the per-project override ('Villa Plots & Open Plots') or the type name. */
export const projectTypeLabel = (p: Pick<Project, 'typeId' | 'typeLabel'>) =>
  p.typeLabel?.trim() || getProjectType(p.typeId).name;

/** Longest project name the create form and editor accept. */
export const MAX_NAME = 80;

/* ---------- icons (domain §1.2) ---------- */

export const ICONS: Record<IconKey, LucideIcon> = {
  target: Target, trending: TrendingUp, shield: ShieldCheck, leaf: Leaf,
  connectivity: Route, education: GraduationCap, employment: Building2, healthcare: Hospital, growth: TrendingUp, leisure: TreePalm,
  plots: LayoutGrid, roads: Route, mainRoad: Milestone, greenSpaces: Trees, totalArea: Maximize2, drainage: Waves, location: MapPin,
  clubhouse: Building, pool: WavesLadder, play: Blocks, lighting: Lightbulb, water: Droplets, harvesting: CloudRain, plantation: Sprout,
  gate: DoorOpen, wall: BrickWall, openSpaces: Trees, security: Cctv, infrastructure: Building2, highway: Milestone,
  hmda: FileCheck2, dtcp: FileCheck2, rera: BadgeCheck, clearTitle: ScrollText, bank: Landmark,
};

export const ICON_LABELS: Record<IconKey, string> = {
  target: 'Target', trending: 'Growth trend', shield: 'Shield', leaf: 'Leaf',
  connectivity: 'Connectivity', education: 'Education', employment: 'Employment', healthcare: 'Healthcare', growth: 'Growth', leisure: 'Leisure',
  plots: 'Plots', roads: 'Roads', mainRoad: 'Main road', greenSpaces: 'Green spaces', totalArea: 'Total area', drainage: 'Drainage', location: 'Location',
  clubhouse: 'Clubhouse', pool: 'Pool', play: 'Play area', lighting: 'Lighting', water: 'Water', harvesting: 'Rainwater harvesting', plantation: 'Plantation',
  gate: 'Gate', wall: 'Compound wall', openSpaces: 'Open spaces', security: 'Security', infrastructure: 'Infrastructure', highway: 'Highway',
  hmda: 'HMDA', dtcp: 'DTCP', rera: 'RERA', clearTitle: 'Clear title', bank: 'Bank',
};

/** Picker grouping; every key appears once. */
export const ICON_GROUPS: { label: string; keys: IconKey[] }[] = [
  { label: 'Vision', keys: ['target', 'trending', 'shield', 'leaf'] },
  { label: 'Location', keys: ['connectivity', 'education', 'employment', 'healthcare', 'growth', 'leisure'] },
  { label: 'Layout', keys: ['plots', 'roads', 'mainRoad', 'greenSpaces', 'totalArea', 'drainage', 'location'] },
  { label: 'Amenities', keys: ['clubhouse', 'pool', 'play', 'lighting', 'water', 'harvesting', 'plantation', 'gate', 'wall', 'openSpaces', 'security', 'infrastructure', 'highway'] },
  { label: 'Approvals', keys: ['hmda', 'dtcp', 'rera', 'clearTitle', 'bank'] },
];

/* ---------- lifecycle / publishing ---------- */

export const LIFECYCLES: Lifecycle[] = ['upcoming', 'ongoing', 'completed'];
export const LIFECYCLE_META: Record<Lifecycle, { label: string; description: string }> = {
  upcoming: { label: 'Upcoming', description: 'Announced, not yet selling.' },
  ongoing: { label: 'Ongoing', description: 'Selling now. Has a detail page.' },
  completed: { label: 'Completed', description: 'Sold out or handed over. Card only.' },
};

export const PUBLISH_STATES: PublishState[] = ['draft', 'published', 'archived'];
export const PUBLISH_META: Record<PublishState, { label: string; description: string }> = {
  draft: { label: 'Draft', description: 'Not on the website.' },
  published: { label: 'Published', description: 'Live on the website.' },
  archived: { label: 'Archived', description: 'Hidden from the website and lists.' },
};

/** Homepage capacity: top row 2 large cards, bottom row 3 small cards. */
export const HOMEPAGE_CAPACITY = { large: 2, small: 3 } as const;

/* ---------- editor sections ---------- */

export const SECTION_IDS = ['overview', 'pricing', 'location', 'media', 'vision', 'masterplan', 'amenities', 'legal', 'cta', 'publishing'] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type SectionGroup = 'Essentials' | 'Media' | 'Page content' | 'Publishing';

export const SECTION_META: Record<SectionId, { label: string; group: SectionGroup }> = {
  overview: { label: 'Overview', group: 'Essentials' },
  pricing: { label: 'Pricing & size', group: 'Essentials' },
  location: { label: 'Location', group: 'Essentials' },
  media: { label: 'Media', group: 'Media' },
  vision: { label: 'Vision', group: 'Page content' },
  masterplan: { label: 'Master plan', group: 'Page content' },
  amenities: { label: 'Amenities', group: 'Page content' },
  legal: { label: 'Legal', group: 'Page content' },
  cta: { label: 'Call to action', group: 'Page content' },
  publishing: { label: 'Publishing', group: 'Publishing' },
};

/** Sections that collapse to "Not shown: no detail page" when hasDetailPage(p) is false. */
export const PAGE_CONTENT_SECTIONS: SectionId[] = ['vision', 'masterplan', 'amenities', 'legal', 'cta'];

/** Ids for projects created in the demo. The static GitHub Pages preview pre-builds a page per id, so new projects get
 *  one of these instead of a random id. ponytail: 40 per browser, then random ids (fine on any server deploy). */
export const NEW_PROJECT_IDS = Array.from({ length: 40 }, (_, i) => `new-project-${i + 1}`);

/** The live layouts app (gip-platform/layouts, NEXT_PUBLIC_LAYOUTS_URL), for "Live layout ↗" on the mapped projects. */
export const LAYOUTS_URL = process.env.NEXT_PUBLIC_LAYOUTS_URL || 'https://gjagadish123.github.io/gip-platform/layouts/';
export const liveLayoutUrl = (projectId: string) => `${LAYOUTS_URL}?project=${encodeURIComponent(projectId)}`;

/** Old live site, for "View on live site ↗" (only projects with publishing.legacySlug). */
export const LIVE_SITE_URL = 'https://www.greaterinfraprojects.in';
