// Global City VI inventory: 288 REAL plots from the digitised brochure layout (number, area, facing, road width,
// corner, dimensions). The sold list is real (pen marks on the brochure scan, 21 Sep 2026); the Registered split and
// the Mortgaged block 229–266 are SAMPLE, flagged with `sample: true` so the page can say so.
// Mirrors admin/src/lib/mock/units.ts gc6Units(). ponytail: delete when getUnits() reads from Supabase.
import type { Facing, MortgagedTo, StatusEvent, Unit, UnitStatus } from '../types';
import plan from './gc6-masterplan.json';

export interface PlanRing { outer: number[][]; holes: number[][][] }
export interface PlanPlot {
  n: number; a: number;
  xy: number[][];
  c: number[];
  f: Facing; rw: number; f2?: Facing; rw2?: number; corner?: boolean; through?: boolean; w?: number; d?: number;
}
/** Coordinates are metres east (x) / north (y) of the site origin: flip y for SVG. */
export interface Gc6Plan {
  pin: { lat: number; lng: number };
  extent: { minX: number; maxX: number; minY: number; maxY: number };
  landUse: { plotted: number; roads: number; park: number; social: number; utility: number; net: number; totalPlots: number; totalArea: string };
  plots: PlanPlot[];
  roads: PlanRing[]; road100: PlanRing[]; greens: PlanRing[];
  boundary: number[][]; wall: number[][];
  zones: Record<string, { name?: string; xy: number[][]; c?: number[] }>;
  features: Record<string, { at: number[] }>;
}
export const GC6_PLAN = plan as unknown as Gc6Plan;
export const GC6_PROJECT_ID = 'global-city-vi';

const GC6_SOLD = [3, 4, 6, 7, 8, 10, 11, 12, 13, 37, 38, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 169, 181, 205, 228, 267, 285, 288];
const GC6_REGISTERED = new Set([3, 4, 6, 7, 8, 10, 11, 12, 13]);
const GC6_LP = '2046/HMDA/SWFL/2026';
const BY = 'Admin';
const at = (date: string, hhmm: string) => `${date}T${hhmm}:00+05:30`;

function gc6Units(): Unit[] {
  const sold = new Set(GC6_SOLD);
  return GC6_PLAN.plots.map((p) => {
    const history: StatusEvent[] = [{ from: null, to: 'available', at: at('2026-04-24', '10:00'), by: BY }];
    let status: UnitStatus = 'available';
    let sample = false;
    let statusNote: string | undefined;
    let mortgagedTo: MortgagedTo | undefined;
    if (p.n >= 229 && p.n <= 266) {
      status = 'mortgaged'; sample = true; mortgagedTo = 'HMDA';
      statusNote = `Mortgaged to HMDA under LP ${GC6_LP} (sample)`;
      history.push({ from: 'available', to: 'mortgaged', at: at('2026-04-28', '11:00'), by: BY, note: statusNote });
    } else if (sold.has(p.n)) {
      status = 'sold_out';
      history.push({ from: 'available', to: 'sold_out', at: at('2026-09-21', '17:00'), by: BY, note: 'From brochure scan, 21 Sep 2026' });
      if (GC6_REGISTERED.has(p.n)) {
        status = 'registered'; sample = true;
        history.push({ from: 'sold_out', to: 'registered', at: at('2026-10-06', '12:30'), by: BY, note: 'Sale deeds registered (sample)' });
      }
    }
    const last = history[history.length - 1];
    return {
      id: `${GC6_PROJECT_ID}:${p.n}`, projectId: GC6_PROJECT_ID, number: String(p.n), area: p.a,
      ...(p.w && { widthFt: p.w, depthFt: p.d }),
      facing: p.f, ...(p.f2 && { facing2: p.f2 }),
      roadWidthFt: p.rw, ...(p.rw2 && { roadWidth2Ft: p.rw2 }),
      ...(p.corner && { corner: true }),
      status, ...(statusNote && { statusNote }), ...(mortgagedTo && { mortgagedTo }), sample, history,
      statusDate: last.at.slice(0, 10),
    };
  });
}

export const GC6_UNITS: Unit[] = gc6Units();
