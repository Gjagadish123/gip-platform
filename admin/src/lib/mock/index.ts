// SEED = the demo's starting state (also the server snapshot of the store). Deterministic: no clock, no Math.random.
import type { ActivityEvent, ID, Project, Unit } from '../types';
import { deriveActivity } from './activity';
import { PROJECTS } from './projects';
import { SEED_UNITS } from './units';

export interface SeedData { projects: Project[]; units: Record<ID, Unit[]>; activity: ActivityEvent[] }

/** Stamp inventory meta (inventoryUpdatedAt, statusSample) from the units so it can never disagree with them. */
function withInventoryMeta(p: Project, units: Unit[] | undefined): Project {
  if (!units?.length) return p;
  const latest = units.reduce((d, u) => (u.statusDate && u.statusDate > d ? u.statusDate : d), '');
  return { ...p, inventoryUpdatedAt: latest || undefined, statusSample: units.some((u) => u.sample) };
}

const projects = PROJECTS.map((p) => withInventoryMeta(p, SEED_UNITS[p.id]));

export const SEED: SeedData = {
  projects,
  units: SEED_UNITS,
  activity: deriveActivity(projects, SEED_UNITS),
};

/** Bumped (in checks/gen-projects.mjs) whenever any seed file changes; the store drops demo edits saved on an older seed. */
export { SEED_VERSION } from './projects';
export { GC6_PLAN, GC6_PROJECT_ID } from './units';
export type { Gc6Plan, PlanPlot, PlanRing } from './units';
