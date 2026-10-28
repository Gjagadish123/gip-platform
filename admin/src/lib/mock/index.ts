// SEED = the demo's starting state (also the server snapshot of the store): the four projects in the live
// layouts app, this phase's working set. CATALOGUE = every project on file; scripts/gen-seed.ts writes the others to
// supabase/seed.catalogue.sql, loaded on request. Deterministic: no clock, no Math.random.
import { isLiveLayout } from '../layouts';
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

export const CATALOGUE: SeedData = {
  projects,
  units: SEED_UNITS,
  activity: deriveActivity(projects, SEED_UNITS),
};

export const SEED: SeedData = {
  projects: projects.filter((p) => isLiveLayout(p.id)),
  units: Object.fromEntries(Object.entries(SEED_UNITS).filter(([id]) => isLiveLayout(id))),
  activity: CATALOGUE.activity.filter((a) => isLiveLayout(a.projectId)),
};

/** Bumped (in checks/gen-projects.mjs) whenever any seed file changes; the store drops demo edits saved on an older seed. */
export { SEED_VERSION } from './projects';
export { GC6_PLAN, GC6_PROJECT_ID } from './units';
export type { Gc6Plan, PlanPlot, PlanRing } from './units';
