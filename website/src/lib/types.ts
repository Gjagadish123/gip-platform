// Domain types for the GIP admin (UI-only build). Source: research/domain.md §3, plus the build-spec §1 extras
// (StatusEvent/history, mortgagedTo, documentNo, sample, showPrice, amenities.visible, legal document files,
// publishing.legacySlug, inventoryUpdatedAt, statusSample, ActivityEvent). Numbers and enums are stored;
// display strings are derived in src/lib/format.ts.

export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'

/* ---------- shared value types ---------- */

export type AreaUnit = 'sq_yd' | 'sq_ft' | 'acre' | 'gunta';

/** Matches masterplan.json `f` / `f2` values exactly. Abbreviated only on display. */
export type Facing =
  | 'East' | 'West' | 'North' | 'South'
  | 'North-East' | 'North-West' | 'South-East' | 'South-West';

/** Rupees, integers. Formatting (₹28,000 / ₹96 L / ₹1.69 Cr) lives in format.ts. */
export type Price =
  | { mode: 'per_area'; amount: number; per: 'sq_yd' | 'sq_ft' } // ₹28,000 / sq yd
  | { mode: 'total'; amount: number; from?: boolean }            // From ₹1.69 Cr
  | { mode: 'on_request' };                                      // Contact for price

/** 21 acres 10 guntas → {acres:21, guntas:10}; "16+ Acres" → {acres:16, approx:true}; 25.17 → {acres:25.17} */
export interface LandArea { acres: number; guntas?: number; approx?: boolean }

/** Unit size band shown on hero/cards. Derived from inventory when inventory exists. */
export interface SizeRange { min: number; max: number; unit: AreaUnit; label?: string /* display override, e.g. "160, 200, 300+" */ }

export interface Asset {
  id: ID;
  /** 'https://…' (remote), '/brand/…' or '/sample/…' (public), or 'idb:<assetId>' (upload kept in IndexedDB). */
  url: string;
  kind: 'image' | 'pdf';
  name?: string;               // original filename
  alt?: string;
  width?: number;
  height?: number;
  source?: 'upload' | 'external' | 'generated'; // 'generated' = kie.ai
}

/** One registry for all sections (lucide mapping in constants.ts ICONS). */
export type IconKey =
  | 'target' | 'trending' | 'shield' | 'leaf'                                            // vision
  | 'connectivity' | 'education' | 'employment' | 'healthcare' | 'growth' | 'leisure'    // location
  | 'plots' | 'roads' | 'mainRoad' | 'greenSpaces' | 'totalArea' | 'drainage' | 'location' // layout stats
  | 'clubhouse' | 'pool' | 'play' | 'lighting' | 'water' | 'harvesting' | 'plantation'
  | 'gate' | 'wall' | 'openSpaces' | 'security' | 'infrastructure' | 'highway'          // amenities
  | 'hmda' | 'dtcp' | 'rera' | 'clearTitle' | 'bank';                                    // approvals

export interface IconCard { id: ID; icon: IconKey; title: string; description: string }

/* ---------- project types (configurable) ---------- */

export type UnitField =
  | 'block'            // block / phase / sector
  | 'dimensions'       // widthFt × depthFt
  | 'facing'           // facing (+ facing2 for corner/through)
  | 'roadWidth'        // roadWidthFt (+ roadWidth2Ft)
  | 'corner'
  | 'builtUpArea'      // villas
  | 'bedrooms'         // villas
  | 'tower' | 'floor' | 'bhk' | 'carpetArea'; // apartments

export interface ProjectType {
  id: ID;                     // 'open-plots'
  name: string;               // 'Open Plots'
  category: 'Residential' | 'Farm' | 'Commercial' | 'Hospitality'; // public "Category" filter
  unitNoun: string;           // 'Plot' | 'Villa' | 'Flat' | 'Farm Plot' | 'Unit'
  unitNounPlural: string;
  areaUnit: AreaUnit;         // unit of Unit.area
  areaLabel: string;          // 'Plot area' | 'Super built-up area'
  priceMode: 'per_area' | 'total';
  hasInventory: boolean;
  hasConfigurations: boolean; // villa options / BHK types
  unitFields: UnitField[];
  /** One line for the create flow's type cards. */
  description?: string;
}

/* ---------- inventory ---------- */

export type UnitStatus = 'available' | 'sold_out' | 'mortgaged' | 'registered';

export type MortgagedTo = 'HMDA' | 'DTCP' | 'Gram Panchayat' | 'Bank' | 'Other';

/** One status change. `from: null` = the unit was added with this status. Events sharing a batchId came from one bulk change. */
export interface StatusEvent {
  from: UnitStatus | null;
  to: UnitStatus;
  at: string;        // ISO datetime, '2026-09-21T17:00:00+05:30'
  by: string;        // 'Admin' (login username in the demo)
  note?: string;
  batchId?: string;
}

export interface Unit {
  id: ID;                     // `${projectId}:${number}`, globally unique (used for DOM ids)
  projectId: ID;
  number: string;             // '1'…'288', 'A-1204'. Unique per project
  block?: string;
  area: number;               // in ProjectType.areaUnit (plots: sq yd, flats: super built-up sq ft)
  widthFt?: number;
  depthFt?: number;
  facing?: Facing;
  facing2?: Facing;           // corner, or through-plot when !corner
  roadWidthFt?: number;
  roadWidth2Ft?: number;
  corner?: boolean;
  builtUpAreaSqFt?: number;   // villas
  bedrooms?: number;          // villas
  tower?: string;             // flats
  floor?: number;             // flats (0 = ground)
  bhk?: number;               // flats
  carpetAreaSqFt?: number;    // flats
  price?: number;             // ₹ total override; default = area × project per-area rate
  status: UnitStatus;
  statusDate?: ISODate;
  statusNote?: string;        // e.g. 'Mortgaged to HMDA under LP 2046/HMDA/SWFL/2026'
  mortgagedTo?: MortgagedTo;  // only while status = mortgaged
  documentNo?: string;        // sale deed document no., only while status = registered
  sample?: boolean;           // status is demo data, not client-confirmed
  history: StatusEvent[];     // oldest first
}

/* ---------- project ---------- */

export type Lifecycle = 'upcoming' | 'ongoing' | 'completed';
export type PublishState = 'draft' | 'published' | 'archived';
export type HomepageSlot = 'large' | 'small'; // homepage: max 2 large (top row), 3 small (bottom row)

export interface Configuration {   // generalises villaOptions; also BHK types for flats
  id: ID;
  label: string;                   // 'Villa on 167 sq yd', '2 BHK'
  plotAreaSqYd?: number;
  builtUpAreaSqFt?: number;
  carpetAreaSqFt?: number;
  bhk?: number;
  price?: Price;
  floorPlan?: Asset;
}

export interface LocationArea { id: ID; name: string } // managed list: 'Indrakaran - Rudraram', 'Kompally', …

export interface ProjectLocation {
  short: string;        // cards: 'Peddapur, Sangareddy District, Hyderabad'
  full: string;         // hero:  'Nagulapally, Peddapur, Sangareddy District, Hyderabad'
  village?: string;
  mandal?: string;
  district: string;
  state: string;        // default 'Telangana'
  areaId?: ID;          // public location filter (old locationFilter)
  pin?: { lat: number; lng: number };
}

export type Distance = { value: number; unit: 'm' | 'km' | 'min' } | { text: string }; // 'Nearby', 'Adjacent'
export interface NearbyPlace { id: ID; name: string; distance: Distance }
export interface LocationCategory { id: ID; icon: IconKey; title: string; places: NearbyPlace[] }
export interface LocationAdvantages {
  title: string;
  description: string;
  badge: string;                    // shown under fixed label "Prime Location"
  categories: LocationCategory[];
}

export interface ProjectMedia {
  cover: Asset | null;              // card + homepage (old image)
  hero: Asset | null;               // detail hero; null → cover (old heroImage)
  gallery: Asset[];                 // ordered, de-duplicated
  amenityGallery: { id: ID; image: Asset; caption: string }[];
  locationImage: Asset | null;
  masterPlan: Asset | null;         // image or PDF
  masterPlanPage: number;           // PDF page to render, default 1
  brochure: Asset | null;           // PDF; used by Master Plan + CTA buttons
}

export interface Vision { title: string; description: string; features: IconCard[] }

export interface LayoutStat { id: ID; icon: IconKey; value: string; label: string } // old {title, subtitle}
export interface MasterPlan { title: string; description: string; stats: LayoutStat[] }

export interface Amenity {          // one list replaces amenities[] + amenitiesFeatures[]
  id: ID;
  name: string;
  icon?: IconKey;
  description?: string;
  featured: boolean;                // featured → card with icon + description
}
export interface Amenities {
  title: string;
  description: string;
  items: Amenity[];
  visible: boolean;                 // the live site has the section unmounted today
}

export type ApprovalAuthority = 'HMDA' | 'DTCP' | 'RERA' | 'GramPanchayat' | 'Bank' | 'Title' | 'Other';
export type ApprovalStatus = 'approved' | 'registered' | 'verified' | 'applied' | 'pending';
export interface Approval {
  id: ID;
  authority: ApprovalAuthority;     // drives icon: HMDA→hmda, DTCP→dtcp, RERA→rera, Title→clearTitle, Bank→bank
  title: string;                    // 'HMDA Final Layout Permit'
  reference?: string;               // '2046/HMDA/SWFL/2026', 'P01100009270'
  date?: ISODate;
  status: ApprovalStatus;           // approved/registered/verified → green; applied/pending → amber
  description?: string;
}
export interface LegalDocument { id: ID; name: string; available: boolean; file?: Asset }
export interface Legal { title: string; description: string; approvals: Approval[]; documents: LegalDocument[] }

export interface Cta {
  subheading: string;
  title: string;
  description: string;
  phone?: string;                   // E.164 '+91…'; empty → COMPANY.phone
  whatsapp?: string;                // E.164; empty → phone
  urgency?: string;
  thankYou?: string;
}

export interface Publishing {
  slug: string;                     // kebab-case, unique
  state: PublishState;
  homepageSlot: HomepageSlot | null;// replaces featured + size
  sortOrder: number;                // replaces year sort + hard-coded swaps
  externalUrl?: string;             // replaces redirectUrl (cards link out, no detail page)
  legacySlug?: string;              // old live-site slug ('GLOBAL CITY VI') for "View on live site"
  seo?: { title?: string; description?: string };
  updatedAt: ISODate;
  publishedAt?: ISODate;
}

export interface Project {
  id: ID;
  // Overview
  name: string;                     // 'Global City VI' (natural case; uppercase via CSS)
  displayName?: string;             // hero title; default name (old fullName)
  typeId: ID;
  typeLabel?: string;               // badge override: 'Villa Plots & Open Plots'
  lifecycle: Lifecycle;
  description: string;
  highlights: string[];
  launchYear?: number;
  completionYear?: number;
  progressNote?: string;            // old developmentStatus
  // Pricing & size
  price: Price;
  priceLabel?: string;              // display override
  showPrice: boolean;               // the live site hides price today
  landArea?: LandArea;
  totalUnits?: number;              // manual only when no inventory
  unitSize?: SizeRange;             // manual only when no inventory
  configurations: Configuration[];
  // Location
  location: ProjectLocation;
  locationAdvantages: LocationAdvantages;
  // Media
  media: ProjectMedia;
  // Page sections
  vision: Vision;
  masterPlan: MasterPlan;
  amenities: Amenities;
  legal: Legal;
  cta: Cta;
  // Publishing
  publishing: Publishing;
  // Inventory meta
  inventoryUpdatedAt?: ISODate;     // stamped by every status change ("Status as of …" on the buyer site)
  statusSample?: boolean;           // some unit statuses are sample data → "Sample" badge
  sample?: boolean;                 // the whole project is demo data (Skyline Residences)
}

/* ---------- activity ---------- */

export interface ActivityEvent {
  id: ID;
  at: string;                       // ISO datetime
  by: string;
  projectId: ID;
  kind: 'status' | 'project';
  message: string;                  // 'Marked 9 plots Registered: 3–4, 6–8, 10–13'
  batchId?: string;
  unitNumbers?: string[];
  to?: UnitStatus;
}
