// Seed inventories.
// - Global City VI: 288 REAL plots from layout_demo masterplan.json (number, area, facing, road, corner, dimensions).
//   Sold list REAL (39 plots, pen marks on the brochure scan dated 21 Sep 2026). The Registered/Sold Out split and the
//   Mortgaged block 229–266 are SAMPLE. Totals 211 Available / 30 Sold Out / 38 Mortgaged / 9 Registered.
// - Global City V (332 plots), Western County (176 plots), Urban Eden (24 villas): counts REAL, everything else
//   SAMPLE, generated with a seeded RNG so the demo never changes between reloads.
// - Skyline Residences (sample): 2 towers × 12 floors × 4 flats, all SAMPLE.
// - Global City RRR, Kompally County III, Godavari Green Farms, Global Nature View City: empty (count unknown).
import { DEMO_TODAY } from '../constants';
import { toIstIso } from '../format';
import { hashSeed, mulberry32 } from '../rng';
import type { Facing, ID, MortgagedTo, StatusEvent, Unit, UnitStatus } from '../types';
import plan from './gc6-masterplan.json';

/* ---------- Global City VI master plan (for the Layout view) ---------- */

export interface PlanRing { outer: number[][]; holes: number[][][] }
export interface PlanPlot {
  n: number; a: number;
  xy: number[][];        // polygon corners
  c: number[];           // label point
  f: Facing; rw: number; f2?: Facing; rw2?: number; corner?: boolean; through?: boolean; w?: number; d?: number;
}
/** Coordinates are metres east (x) / north (y) of the site origin: flip y for SVG (`scale(1,-1)` or y → -y). */
export interface Gc6Plan {
  extent: { minX: number; maxX: number; minY: number; maxY: number };
  landUse: { plotted: number; roads: number; park: number; social: number; utility: number; net: number; totalPlots: number; totalArea: string };
  plots: PlanPlot[];
  roads: PlanRing[]; road100: PlanRing[]; greens: PlanRing[];
  boundary: number[][]; wall: number[][];
  zones: Record<string, { name?: string; xy: number[][] }>;
  features: Record<string, { at: number[] }>;
}
export const GC6_PLAN = plan as Gc6Plan;
export const GC6_PROJECT_ID = 'global-city-vi';

/* ---------- time helpers (fixed demo clock) ---------- */

const DAY = 86_400_000;
const TODAY_MS = Date.parse(`${DEMO_TODAY}T00:00:00+05:30`);
const dayMs = (iso: string) => Date.parse(`${iso}T00:00:00+05:30`);
const IST = 330 * 60_000;
/** A working-hours time (10:00–17:55 IST) on the IST day containing `ms`. */
const stamp = (ms: number, rnd: () => number) => toIstIso(Math.floor((ms + IST) / DAY) * DAY - IST + (600 + Math.floor(rnd() * 96) * 5) * 60_000);
const fixed = (iso: string, hhmm: string) => `${iso}T${hhmm}:00+05:30`;
const dateOf = (at: string) => at.slice(0, 10);
const BY = 'Admin';

function finish(u: Omit<Unit, 'statusDate'>): Unit {
  const last = u.history[u.history.length - 1];
  return { ...u, statusDate: last ? dateOf(last.at) : undefined };
}

/* ---------- Global City VI (real plots) ---------- */

const GC6_SOLD = [3, 4, 6, 7, 8, 10, 11, 12, 13, 37, 38, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 169, 181, 205, 228, 267, 285, 288];
const GC6_REGISTERED = new Set([3, 4, 6, 7, 8, 10, 11, 12, 13]); // SAMPLE split of the sold list
const GC6_LP = '2046/HMDA/SWFL/2026';

function gc6Units(): Unit[] {
  const sold = new Set(GC6_SOLD);
  const added = fixed('2026-04-24', '10:00');
  return GC6_PLAN.plots.map((p) => {
    const history: StatusEvent[] = [{ from: null, to: 'available', at: added, by: BY }];
    let status: UnitStatus = 'available', sample = false, statusNote: string | undefined, mortgagedTo: MortgagedTo | undefined;
    if (p.n >= 229 && p.n <= 266) {
      status = 'mortgaged'; sample = true; mortgagedTo = 'HMDA';
      statusNote = `Mortgaged to HMDA under LP ${GC6_LP} (sample)`;
      history.push({ from: 'available', to: 'mortgaged', at: fixed('2026-04-28', '11:00'), by: BY, note: statusNote, batchId: 'seed-gc6-mortgage' });
    } else if (sold.has(p.n)) {
      status = 'sold_out';
      history.push({ from: 'available', to: 'sold_out', at: fixed('2026-09-21', '17:00'), by: BY, note: 'From brochure scan, 21 Sep 2026', batchId: 'seed-gc6-scan' });
      if (GC6_REGISTERED.has(p.n)) {
        status = 'registered'; sample = true;
        history.push({ from: 'sold_out', to: 'registered', at: fixed('2026-10-06', '12:30'), by: BY, note: 'Sale deeds registered (sample)', batchId: 'seed-gc6-registered' });
      }
    }
    return finish({
      id: `${GC6_PROJECT_ID}:${p.n}`, projectId: GC6_PROJECT_ID, number: String(p.n), area: p.a,
      ...(p.w && { widthFt: p.w, depthFt: p.d }),
      facing: p.f, ...(p.f2 && { facing2: p.f2 }),
      roadWidthFt: p.rw, ...(p.rw2 && { roadWidth2Ft: p.rw2 }),
      ...(p.corner && { corner: true }),
      status, ...(statusNote && { statusNote }), ...(mortgagedTo && { mortgagedTo }), sample, history,
    });
  });
}

/* ---------- generated (sample) inventories ---------- */

type Physical = Omit<Unit, 'id' | 'projectId' | 'number' | 'status' | 'statusDate' | 'history' | 'sample'>;

interface GenSpec {
  projectId: ID;
  launch: string;                                     // first day units existed
  numbers: string[];
  physical: (i: number, rnd: () => number) => Physical;
  counts: { registered: number; sold_out: number };   // exact counts among non-mortgaged units
  mortgage?: { from: number; to: number; note: string; releasedTo?: number; releaseOn?: string; releaseNote?: string }; // index range, inclusive
  cancellations?: number;                             // available units with a cancelled booking in their history
  regGapDays?: [number, number];                      // sold → registered delay
}

function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function generate(spec: GenSpec): Unit[] {
  const rnd = mulberry32(hashSeed(spec.projectId));
  const launchMs = dayMs(spec.launch);
  const span = (TODAY_MS - DAY) - launchMs;
  // ~35% of sales land in the last 6 months so the dashboard has recent activity; the rest spread back to launch.
  const recentDays = Math.min(180, Math.floor(span / DAY) - 5);
  const pick = () => (rnd() < 0.35 || span < 200 * DAY
    ? TODAY_MS - (1 + Math.floor(rnd() * recentDays)) * DAY
    : launchMs + 20 * DAY + Math.floor(rnd() * (span - 200 * DAY)));
  const [gapLo, gapHi] = spec.regGapDays ?? [20, 120];
  const m = spec.mortgage;
  const inBlock = (i: number) => !!m && i >= m.from && i <= m.to;
  const free = spec.numbers.map((_, i) => i).filter((i) => !inBlock(i));
  const order = shuffle(free, rnd);
  const fate = new Map<number, UnitStatus>();
  order.forEach((i, k) => fate.set(i, k < spec.counts.registered ? 'registered' : k < spec.counts.registered + spec.counts.sold_out ? 'sold_out' : 'available'));
  const cancelled = new Set(order.slice(spec.counts.registered + spec.counts.sold_out).slice(0, spec.cancellations ?? 0));

  return spec.numbers.map((number, i) => {
    const added = stamp(launchMs, rnd);
    const history: StatusEvent[] = [];
    let status: UnitStatus;
    let statusNote: string | undefined, mortgagedTo: MortgagedTo | undefined;
    if (m && inBlock(i)) {
      history.push({ from: null, to: 'mortgaged', at: added, by: BY, note: m.note });
      status = 'mortgaged'; statusNote = m.note; mortgagedTo = 'HMDA';
      if (m.releasedTo != null && i <= m.releasedTo && m.releaseOn) {
        history.push({ from: 'mortgaged', to: 'available', at: fixed(m.releaseOn, '15:00'), by: BY, note: m.releaseNote, batchId: `seed-${spec.projectId}-release` });
        status = 'available'; statusNote = undefined; mortgagedTo = undefined;
      }
    } else {
      history.push({ from: null, to: 'available', at: added, by: BY });
      status = fate.get(i)!;
      if (status !== 'available') {
        let soldMs = pick();
        if (status === 'registered') {
          const gap = (gapLo + Math.floor(rnd() * (gapHi - gapLo))) * DAY;
          soldMs = Math.max(launchMs + DAY, Math.min(soldMs, TODAY_MS - gap - DAY));
          history.push({ from: 'available', to: 'sold_out', at: stamp(soldMs, rnd), by: BY });
          history.push({ from: 'sold_out', to: 'registered', at: stamp(soldMs + gap, rnd), by: BY });
        } else {
          history.push({ from: 'available', to: 'sold_out', at: stamp(soldMs, rnd), by: BY });
        }
      } else if (cancelled.has(i)) {
        const soldMs = Math.min(pick(), TODAY_MS - 40 * DAY);
        history.push({ from: 'available', to: 'sold_out', at: stamp(soldMs, rnd), by: BY });
        history.push({ from: 'sold_out', to: 'available', at: stamp(soldMs + (15 + Math.floor(rnd() * 20)) * DAY, rnd), by: BY, note: 'Booking cancelled (sample)' });
      }
    }
    return finish({
      id: `${spec.projectId}:${number}`, projectId: spec.projectId, number,
      ...spec.physical(i, rnd),
      status, ...(statusNote && { statusNote }), ...(mortgagedTo && { mortgagedTo }), sample: true, history,
    });
  });
}

/* ---------- plot layouts: back-to-back rows, East/West facing, corner plots at row ends ---------- */

const PLOT_SIZES = [
  { a: 150, w: 30, d: 45 }, { a: 166.66, w: 30, d: 50 }, { a: 200, w: 30, d: 60 },
  { a: 250, w: 45, d: 50 }, { a: 266.66, w: 40, d: 60 }, { a: 300, w: 45, d: 60 },
];

function plotPhysical(weights: number[], roads: number[], rowLen: number) {
  const total = weights.reduce((a, b) => a + b, 0);
  return (i: number, rnd: () => number): Physical => {
    let r = rnd() * total, k = 0;
    while (r >= weights[k]) r -= weights[k++];
    const s = PLOT_SIZES[k];
    const row = Math.floor(i / rowLen), pos = i % rowLen;
    const corner = pos === 0 || pos === rowLen - 1;
    const facing: Facing = row % 2 ? 'West' : 'East';
    return {
      area: s.a, widthFt: s.w, depthFt: s.d, facing,
      roadWidthFt: roads[Math.floor(row / 2) % roads.length],
      ...(corner && { corner: true, facing2: pos === 0 ? 'North' : 'South', roadWidth2Ft: 30 }),
    };
  };
}

const range = (n: number, start = 1) => Array.from({ length: n }, (_, i) => String(i + start));

function gc5Units(): Unit[] {
  return generate({
    projectId: 'global-city-v', launch: '2021-06-01', numbers: range(332),
    physical: plotPhysical([8, 12, 60, 10, 0, 10], [40, 30, 33, 30], 14),
    counts: { registered: 92, sold_out: 46 },
    mortgage: { from: 286, to: 331, note: 'Mortgaged to HMDA under LP 000299/LO/Plg/HMDA/2021 (sample)' },
    cancellations: 6,
  });
}

function westernCountyUnits(): Unit[] {
  return generate({
    projectId: 'western-county', launch: '2019-08-03', numbers: range(176),
    physical: plotPhysical([6, 14, 56, 12, 4, 8], [40, 30], 11),
    counts: { registered: 76, sold_out: 21 },
    mortgage: {
      from: 151, to: 175, note: 'Mortgaged to HMDA under LP 0002364/LO/Plg/HMDA/2019 (sample)',
      releasedTo: 162, releaseOn: '2026-08-12', releaseNote: 'Released by HMDA after layout works (sample)',
    },
    cancellations: 3,
  });
}

const VILLA_MODELS = [
  { area: 200, builtUpAreaSqFt: 2400, bedrooms: 3, price: 16_900_000 },
  { area: 233, builtUpAreaSqFt: 2750, bedrooms: 4, price: 19_500_000 },
  { area: 267, builtUpAreaSqFt: 3100, bedrooms: 4, price: 22_000_000 },
];

function urbanEdenUnits(): Unit[] {
  return generate({
    projectId: 'urban-eden', launch: '2025-04-15', numbers: range(24),
    physical: (i) => {
      const pos = i % 6;
      return {
        ...VILLA_MODELS[pos === 0 || pos === 5 ? 2 : pos % 2], facing: Math.floor(i / 6) % 2 ? 'West' : 'East', roadWidthFt: 30,
        ...((pos === 0 || pos === 5) && { corner: true }),
      };
    },
    counts: { registered: 4, sold_out: 6 },
    regGapDays: [30, 90],
  });
}

// Stack positions 01–04: same BHK, size and facing on every floor.
const FLAT_STACK = [
  { bhk: 3, carpetAreaSqFt: 1240, area: 1650, facing: 'East' as Facing },
  { bhk: 2, carpetAreaSqFt: 905, area: 1210, facing: 'East' as Facing },
  { bhk: 2, carpetAreaSqFt: 905, area: 1210, facing: 'West' as Facing },
  { bhk: 3, carpetAreaSqFt: 1240, area: 1650, facing: 'West' as Facing },
];
const FLAT_RATE = 6800, FLOOR_RISE = 40; // ₹/sq ft on SBA, + ₹/sq ft per floor (sample)

function skylineUnits(): Unit[] {
  const flats = ['A', 'B'].flatMap((tower) => Array.from({ length: 12 }, (_, f) => [1, 2, 3, 4].map((pos) => ({ tower, floor: f + 1, pos })))).flat();
  return generate({
    projectId: 'skyline-residences', launch: '2026-07-01',
    numbers: flats.map((x) => `${x.tower}-${x.floor}${String(x.pos).padStart(2, '0')}`),
    physical: (i) => {
      const { tower, floor, pos } = flats[i];
      const s = FLAT_STACK[pos - 1];
      return { tower, floor, ...s, price: s.area * (FLAT_RATE + FLOOR_RISE * floor) };
    },
    counts: { registered: 6, sold_out: 20 },
    regGapDays: [15, 45],
  });
}

export const SEED_UNITS: Record<ID, Unit[]> = {
  [GC6_PROJECT_ID]: gc6Units(),
  'global-city-v': gc5Units(),
  'western-county': westernCountyUnits(),
  'urban-eden': urbanEdenUnits(),
  'skyline-residences': skylineUnits(),
};
