// Live layouts (/layouts): the four projects whose plots are drawn on the map, their geometry and the small types the
// page passes from server to client. Geometry is built by gip-platform/tools/layouts/build_layouts.py from the
// approved layout copies (traceable sources there) and lives in ./data/layouts/<id>.json, one chunk per project.
import { UNIT_STATUSES } from "./constants";
import type { Facing, ID, Unit, UnitStatus } from "./types";

/** Only these projects appear on /layouts (and only while published): the ones with an approved layout on file. */
export const LIVE_LAYOUT_IDS = ["global-city-vi", "global-city-v", "global-city-rrr", "western-county"] as const;
export type LiveLayoutId = (typeof LIVE_LAYOUT_IDS)[number];
export const isLiveLayout = (id: string): id is LiveLayoutId => (LIVE_LAYOUT_IDS as readonly string[]).includes(id);

/* ---------- geometry (format v2, metres east/north of `origin`) ---------- */

export type XY = [number, number];
export interface Ring { outer: XY[]; holes: XY[][] }
export interface LayoutPlot {
  n: string; a: number; xy: XY[]; c: XY; la: number;
  f?: Facing; rw?: number; f2?: Facing; rw2?: number; corner?: boolean; through?: boolean; w?: number; d?: number;
}
export interface LayoutPlan {
  v: 2;
  id: LiveLayoutId;
  name: string;
  origin: { lat: number; lng: number };
  pin: { lat: number; lng: number; source: string };
  source: { title: string; reference?: string; date?: string; pending?: boolean };
  georef: { method: string; rmsMetres: number } | null;
  extent: { minX: number; maxX: number; minY: number; maxY: number } | null;
  landUse: { label: string; sqyd: number }[];
  landTotal: number | null;
  landArea: string;
  plotCount: number;
  plots: LayoutPlot[];
  boundary: XY[] | null;
  roads: Ring[];
  roadLabels: { t: string; at: XY; r: number }[];
  access: { name: string; w?: number; st?: "existing" | "proposed"; xy: XY[] }[];
  greens: Ring[];
  /** c: label point (centre of the largest circle inside); room: free half-width and half-height there, metres. */
  zones: { id: string; name: string; xy: XY[]; c: XY; room: [number, number]; area?: number }[];
  points: { id: string; name: string; at: XY }[];
  outline: { d: string; w: number; h: number } | null;
}

const cache = new Map<string, Promise<LayoutPlan>>();

/** The project's plan, fetched once per page view (a separate chunk per project). */
export function loadLayout(id: LiveLayoutId): Promise<LayoutPlan> {
  let p = cache.get(id);
  if (!p) {
    p = import(`./data/layouts/${id}.json`).then((m) => m.default as LayoutPlan);
    p.catch(() => cache.delete(id)); // a failed chunk load can be retried
    cache.set(id, p);
  }
  return p;
}

/* ---------- small-area geodesy: a local tangent plane is exact to millimetres over a site this size ---------- */

const R = 6378137;
const rad = (d: number) => (d * Math.PI) / 180;

export function projector(origin: { lat: number; lng: number }) {
  const cos = Math.cos(rad(origin.lat));
  return {
    toLatLng: ([x, y]: readonly number[]) => ({
      lat: origin.lat + (y / R) * (180 / Math.PI),
      lng: origin.lng + (x / (R * cos)) * (180 / Math.PI),
    }),
    toXY: (p: { lat: number; lng: number }): XY => [rad(p.lng - origin.lng) * R * cos, rad(p.lat - origin.lat) * R],
  };
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const s = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(s))) / 1000;
}

export const pathOf = (xy: readonly (readonly number[])[]) => `M${xy.map(([x, y]) => `${x},${-y}`).join("L")}Z`;
export const ringsPath = (rings: readonly Ring[]) => rings.map((r) => [r.outer, ...r.holes].map(pathOf).join("")).join("");

/* ---------- what the server hands the page ---------- */

/** One plot as the page needs it (the public columns of a unit, short keys: up to ~900 travel in the page data). */
export interface LiveUnit {
  n: string;
  s: UnitStatus;
  a: number;
  w?: number; d?: number; f?: Facing; f2?: Facing; rw?: number; rw2?: number;
  c?: true;      // corner
  dt?: string;   // status date
  x?: true;      // sample status, not confirmed by sales
}

export const toLiveUnit = (u: Unit): LiveUnit => ({
  n: u.number, s: u.status, a: u.area,
  ...(u.widthFt && u.depthFt && { w: u.widthFt, d: u.depthFt }),
  ...(u.facing && { f: u.facing }), ...(u.facing2 && { f2: u.facing2 }),
  ...(u.roadWidthFt && { rw: u.roadWidthFt }), ...(u.roadWidth2Ft && { rw2: u.roadWidth2Ft }),
  ...(u.corner && { c: true as const }), ...(u.statusDate && { dt: u.statusDate }), ...(u.sample && { x: true as const }),
});

export interface LiveProject {
  id: LiveLayoutId;
  slug: string;
  name: string;
  place: string;        // "Indrakaran, Sangareddy District"
  lifecycle: "upcoming" | "ongoing" | "completed";
  landArea?: string;
  approvals: { authority: string; title: string; reference?: string; date?: string }[];
  inventoryUpdatedAt?: string;
  statusSample?: boolean;
  detailHref?: string;  // the project page, when the project has one
  brochure?: string;
}

export type StatusCounts = Record<UnitStatus, number>;
export function countStatuses(units: readonly LiveUnit[]): StatusCounts {
  const c = Object.fromEntries(UNIT_STATUSES.map((s) => [s, 0])) as StatusCounts;
  for (const u of units) c[u.s]++;
  return c;
}
export type { ID };
