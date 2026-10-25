import {
  BadgeCheck, Blocks, BrickWall, Building, Building2, Cctv, CloudRain, DoorOpen, Droplets, FileCheck2,
  GraduationCap, Hospital, Landmark, LayoutGrid, Leaf, Lightbulb, MapPin, Maximize2, Milestone, Route,
  ScrollText, ShieldCheck, Sprout, Target, TreePalm, Trees, TrendingUp, Waves, WavesLadder,
  type LucideIcon,
} from 'lucide-react';
import type { AreaUnit, IconKey, Lifecycle, Project, ProjectType, UnitStatus } from './types';

/* ---------- company (from the live /contact page; the old site's +91 98765 43210 is a placeholder) ---------- */

export const COMPANY = {
  name: 'Greater Infra Projects',
  shortName: 'GIP',
  legalName: 'Greater Infra Projects',
  phone: '+91 97001 23900',
  phoneE164: '+919700123900',
  whatsappE164: '919700123900',
  email: 'Gip@greaterinfraprojects.in',
  office: 'Ameerpet, Hyderabad, Telangana',
  city: 'Hyderabad',
  website: 'https://www.greaterinfraprojects.in',
  social: {
    facebook: 'https://www.facebook.com/Greaterinfragip/',
    instagram: 'https://www.instagram.com/greaterinfraprojects/',
  },
} as const;

/* ---------- unit statuses (client order everywhere: Available, Sold Out, Mortgaged, Registered) ---------- */

export const UNIT_STATUSES: UnitStatus[] = ['available', 'sold_out', 'mortgaged', 'registered'];

export const UNIT_STATUS_META: Record<UnitStatus, {
  label: string;
  token: 'available' | 'sold' | 'mortgaged' | 'registered'; // → --status-<token>
  description: string; // buyer-facing
}> = {
  available: { label: 'Available', token: 'available', description: 'Open for booking today.' },
  sold_out: { label: 'Sold Out', token: 'sold', description: 'Booked or agreement signed.' },
  mortgaged: { label: 'Mortgaged', token: 'mortgaged', description: 'Held with the approving authority until released; not for sale yet.' },
  registered: { label: 'Registered', token: 'registered', description: 'Sale deed registered with the owner.' },
};

/* ---------- areas / types ---------- */

export const AREA_UNIT_LABEL: Record<AreaUnit, string> = {
  sq_yd: 'sq yd', sq_ft: 'sq ft', acre: 'acres', gunta: 'guntas',
};

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'open-plots', name: 'Open Plots', category: 'Residential', unitNoun: 'Plot', unitNounPlural: 'Plots',
    areaUnit: 'sq_yd', areaLabel: 'Plot area', priceMode: 'per_area', hasInventory: true, hasConfigurations: false,
    unitFields: ['block', 'dimensions', 'facing', 'roadWidth', 'corner'],
  },
  {
    id: 'villa-plots', name: 'Villa Plots', category: 'Residential', unitNoun: 'Plot', unitNounPlural: 'Plots',
    areaUnit: 'sq_yd', areaLabel: 'Plot area', priceMode: 'per_area', hasInventory: true, hasConfigurations: true,
    unitFields: ['block', 'dimensions', 'facing', 'roadWidth', 'corner'],
  },
  {
    id: 'villas', name: 'Villas', category: 'Residential', unitNoun: 'Villa', unitNounPlural: 'Villas',
    areaUnit: 'sq_yd', areaLabel: 'Plot area', priceMode: 'total', hasInventory: true, hasConfigurations: true,
    unitFields: ['block', 'facing', 'roadWidth', 'corner', 'builtUpArea', 'bedrooms'],
  },
  {
    id: 'apartments', name: 'Apartments', category: 'Residential', unitNoun: 'Flat', unitNounPlural: 'Flats',
    areaUnit: 'sq_ft', areaLabel: 'Super built-up area', priceMode: 'total', hasInventory: true, hasConfigurations: true,
    unitFields: ['tower', 'floor', 'bhk', 'carpetArea', 'facing'],
  },
  {
    id: 'farm-land', name: 'Farm Land', category: 'Farm', unitNoun: 'Farm Plot', unitNounPlural: 'Farm Plots',
    areaUnit: 'sq_yd', areaLabel: 'Plot area', priceMode: 'per_area', hasInventory: true, hasConfigurations: false,
    unitFields: ['block', 'dimensions', 'facing', 'roadWidth'],
  },
  {
    id: 'resorts-commercial', name: 'Resorts & Commercial', category: 'Hospitality', unitNoun: 'Unit', unitNounPlural: 'Units',
    areaUnit: 'sq_ft', areaLabel: 'Area', priceMode: 'total', hasInventory: false, hasConfigurations: false,
    unitFields: ['block', 'floor'],
  },
];

export function getProjectType(id: string): ProjectType {
  return PROJECT_TYPES.find((t) => t.id === id) ?? PROJECT_TYPES[0];
}

export const projectTypeLabel = (p: Pick<Project, 'typeId' | 'typeLabel'>) =>
  p.typeLabel?.trim() || getProjectType(p.typeId).name;

export const LIFECYCLE_LABEL: Record<Lifecycle, string> = { upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed' };

/* ---------- icons (same registry as the admin so admin-chosen icons render identically) ---------- */

export const ICONS: Record<IconKey, LucideIcon> = {
  target: Target, trending: TrendingUp, shield: ShieldCheck, leaf: Leaf,
  connectivity: Route, education: GraduationCap, employment: Building2, healthcare: Hospital, growth: TrendingUp, leisure: TreePalm,
  plots: LayoutGrid, roads: Route, mainRoad: Milestone, greenSpaces: Trees, totalArea: Maximize2, drainage: Waves, location: MapPin,
  clubhouse: Building, pool: WavesLadder, play: Blocks, lighting: Lightbulb, water: Droplets, harvesting: CloudRain, plantation: Sprout,
  gate: DoorOpen, wall: BrickWall, openSpaces: Trees, security: Cctv, infrastructure: Building2, highway: Milestone,
  hmda: FileCheck2, dtcp: FileCheck2, rera: BadgeCheck, clearTitle: ScrollText, bank: Landmark,
};
