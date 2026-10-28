// The four projects drawn on the website's live layouts page (gip-platform/tools/layouts/build_layouts.py writes
// ./layouts/<id>.json from the approved layout copies). Only projects with plot outlines get the inventory's Layout
// view; the geometry loads per project, so the inventory doesn't carry every drawing.
import index from './layouts/index.json';
import type { Facing } from './types';

export const LIVE_LAYOUT_IDS = ['global-city-vi', 'global-city-v', 'global-city-rrr', 'western-county'] as const;
export const isLiveLayout = (projectId: string) => (LIVE_LAYOUT_IDS as readonly string[]).includes(projectId);

export interface LayoutInfo {
  plots: number;
  plotCount: number;
  fit: number | null; // metres: 90% of the drawing's roads lie this close to the built ones
  source: { title: string; reference?: string; pending?: boolean };
}
const INDEX = index as Record<string, LayoutInfo>;
/** What is on file for a live-layout project, without loading its geometry. */
export const layoutInfo = (projectId: string): LayoutInfo | undefined => INDEX[projectId];
/** Plot outlines are on file (a project can be mapped, pin only, before its drawing is digitised). */
export const hasDigitalLayout = (projectId: string) => (INDEX[projectId]?.plots ?? 0) > 0;

export type XY = [number, number];
export interface PlanRing { outer: XY[]; holes: XY[][] }
export interface PlanPlot {
  n: string; a: number; xy: XY[]; c: XY; la: number;
  f?: Facing; rw?: number; f2?: Facing; rw2?: number; corner?: boolean; through?: boolean; w?: number; d?: number;
}
/** Metres east (x) / north (y) of the site origin: flip y for SVG. */
export interface LayoutPlan {
  id: string;
  name: string;
  extent: { minX: number; maxX: number; minY: number; maxY: number } | null;
  plots: PlanPlot[];
  boundary: XY[] | null;
  roads: PlanRing[];
  access: { name: string; w?: number; xy: XY[] }[];
  greens: PlanRing[];
  zones: { id: string; name: string; xy: XY[]; c: XY; area?: number }[];
  source: { title: string; reference?: string };
}

const cache = new Map<string, Promise<LayoutPlan>>();
export function loadLayout(projectId: string): Promise<LayoutPlan> {
  let p = cache.get(projectId);
  if (!p) {
    p = import(`./layouts/${projectId}.json`).then((m) => m.default as LayoutPlan);
    p.catch(() => cache.delete(projectId));
    cache.set(projectId, p);
  }
  return p;
}
