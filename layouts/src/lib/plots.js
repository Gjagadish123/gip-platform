// Per-project model: the approved layout's geometry (masterplan) plus the live inventory (Supabase units).
// Plot numbers are strings everywhere ('26'), as in the units table.

import { makeProjector, buildPlotIndex } from './geo.js';

/** Client order, as in the admin. */
export const STATUSES = ['available', 'sold_out', 'mortgaged', 'registered', 'hold'];
export const STATUS_LABEL = { available: 'Available', sold_out: 'Sold Out', mortgaged: 'Mortgaged', registered: 'Registered', hold: 'Hold' };
/** On satellite: the demo's green, red and amber, plus blue and violet. Unknown = no live status (not loaded). */
export const STATUS_COLOR = { available: '#1e9e5a', sold_out: '#d8443c', mortgaged: '#f0a020', registered: '#2f5fbf', hold: '#8e5bd0', unknown: '#dfe6ee' };
/** Swatch classes: the admin's non-colour cues (plain, hatch, dots, folded corner, stripes). */
export const STATUS_SWATCH = {
  available: 'bg-status-available',
  sold_out: 'bg-status-sold_out pattern-sold',
  mortgaged: 'bg-status-mortgaged pattern-mortgaged',
  registered: 'bg-status-registered pattern-registered',
  hold: 'bg-status-hold pattern-hold',
};
/** Sample villas stand on these. */
export const VILLA_STATUSES = new Set(['sold_out', 'registered']);
export const isStatus = (s) => Object.prototype.hasOwnProperty.call(STATUS_LABEL, s);

export const SIZE_BANDS = [
  { id: 's', label: 'Up to 170', min: 0, max: 170 },
  { id: 'm', label: '171 to 225', min: 170.0001, max: 225 },
  { id: 'l', label: '226 to 310', min: 225.0001, max: 310 },
  { id: 'xl', label: 'Above 310', min: 310.0001, max: Infinity },
];
export const bandOf = (a) => SIZE_BANDS.find((b) => a >= b.min && a <= b.max)?.id;
export const byNumber = new Intl.Collator('en', { numeric: true }).compare;

/** Geometry of one approved layout; built once per project and handed to the renderers. */
export function buildGeo(masterplan) {
  const plots = masterplan.plots.map((p) => ({ ...p, n: String(p.n) }));
  const data = { ...masterplan, plots };
  return { data, projector: makeProjector(masterplan.origin), hit: buildPlotIndex(plots) };
}

export function countStatuses(rows) {
  const c = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of rows || []) if (r.s in c) c[r.s]++;
  return c;
}

/** What the availability card shows, from the live units alone (works without a drawn layout). null = not read yet. */
export function statsOf(rows, project) {
  if (!rows) return null;
  return {
    counts: countStatuses(rows),
    total: rows.length,
    sample: Boolean(project?.status_sample) || rows.some((r) => r.x),
    asOf: rows.reduce((m, r) => (r.dt && r.dt > m ? r.dt : m), project?.inventory_updated_at || '') || null,
  };
}

/**
 * Live facts on top of the geometry. A unit's own value wins; the drawn layout fills what the unit row leaves empty.
 * `rows` is null until the units are read: then no plot has a status (never a made-up one).
 */
export function buildModel(geo, rows, project) {
  const byNum = new Map((rows || []).map((r) => [r.n, r]));
  const plots = geo.data.plots.map((p) => {
    const u = byNum.get(p.n) || {};
    const a = u.a ?? p.a;
    const corner = Boolean(u.c ?? p.corner);
    const f2 = u.f2 ?? p.f2;
    return {
      n: p.n,
      c: p.c,
      a,
      f: u.f ?? p.f,
      f2,
      corner,
      through: !corner && Boolean(f2),
      rw: u.rw ?? p.rw,
      rw2: u.rw2 ?? p.rw2,
      w: u.w ?? p.w,
      d: u.d ?? p.d,
      block: u.block,
      status: rows ? (isStatus(u.s) ? u.s : null) : null,
      dt: u.dt,
      sample: Boolean(u.x),
      band: bandOf(a),
    };
  });
  const plotByNumber = new Map(plots.map((p) => [p.n, p]));
  const statusByPlot = Object.fromEntries(plots.map((p) => [p.n, p.status]));
  const sorted = [...plotByNumber.keys()].sort(byNumber);
  const uniq = (xs) => [...new Set(xs.filter(Boolean))];
  return {
    plots,
    plotByNumber,
    statusByPlot,
    stats: statsOf(rows, project),
    firstPlot: sorted[0],
    lastPlot: sorted[sorted.length - 1],
    facings: uniq(plots.map((p) => p.f)).sort((x, y) => FACING_ORDER.indexOf(x) - FACING_ORDER.indexOf(y)),
    roads: uniq(plots.flatMap((p) => [p.rw, p.rw2])).sort((x, y) => x - y),
    bands: SIZE_BANDS.filter((b) => plots.some((p) => p.band === b.id)),
  };
}
const FACING_ORDER = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];

// ---------------------------------------------------------------- filters
export const emptyFilters = () => ({ status: new Set(), facing: new Set(), band: new Set(), corner: false, road: new Set() });
export const filterCount = (f) => f.status.size + f.facing.size + f.band.size + f.road.size + (f.corner ? 1 : 0);
export function matches(p, f) {
  if (f.status.size && !f.status.has(p.status)) return false;
  if (f.facing.size && !f.facing.has(p.f)) return false;
  if (f.band.size && !f.band.has(p.band)) return false;
  if (f.road.size && !f.road.has(p.rw) && !f.road.has(p.rw2)) return false;
  if (f.corner && !p.corner) return false;
  return true;
}

// ---------------------------------------------------------------- formatting
export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
export const inrShort = (n) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)} L`);
export const sqyd = (a) => (Number.isInteger(a) ? a.toLocaleString('en-IN') : a.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

/** 'East', 'West and South (corner)', 'West and East (road on both sides)' */
export function facingText(p) {
  if (!p.f) return null;
  if (p.corner && p.f2) return `${p.f} and ${p.f2} (corner)`;
  if (p.corner) return `${p.f} (corner)`;
  if (p.through) return `${p.f} and ${p.f2} (road on both sides)`;
  return p.f;
}
export function roadText(p) {
  if (!p.rw) return null;
  if (!p.rw2) return `${p.rw}' road`;
  return p.rw2 !== p.rw ? `${p.rw}' and ${p.rw2}' roads` : `two ${p.rw}' roads`;
}

/** Indicative value, only when the project shows prices (public_content keeps `price` only then). */
export function plotPrice(p, content) {
  const pr = content?.showPrice ? content.price : null;
  if (!pr || pr.mode !== 'per_area' || !pr.amount) return null;
  return { total: p.a * (pr.per === 'sq_ft' ? 9 : 1) * pr.amount, rate: pr.amount, per: pr.per === 'sq_ft' ? 'sq ft' : 'sq yd' };
}
