// SEED = the demo's starting state (also the server snapshot of the store): every ongoing project (the admin manages
// all of them; plots only for the four in the live layouts app). CATALOGUE = every project on file; scripts/gen-seed.ts writes the others to
// supabase/seed.catalogue.sql, loaded on request. Deterministic: no clock, no Math.random.
import { isLiveLayout } from '../layouts';
import type { ActivityEvent, ID, Project, Unit } from '../types';
import { deriveActivity } from './activity';
import PAGE_CONTENT from './page-content.json';
import { PROJECTS } from './projects';
import { SEED_UNITS } from './units';

export interface SeedData { projects: Project[]; units: Record<ID, Unit[]>; activity: ActivityEvent[] }

/** Stamp inventory meta (inventoryUpdatedAt, statusSample) from the units so it can never disagree with them. */
function withInventoryMeta(p: Project, units: Unit[] | undefined): Project {
  if (!units?.length) return p;
  const latest = units.reduce((d, u) => (u.statusDate && u.statusDate > d ? u.statusDate : d), '');
  return { ...p, inventoryUpdatedAt: latest || undefined, statusSample: units.some((u) => u.sample) };
}

/** Project-page content written after the generated seed (Global City VI's page, listing pins): each top-level key
 *  replaces the project's, and an object merges one level deep (the same merge as the live update). */
function withPageContent(p: Project): Project {
  const patch = (PAGE_CONTENT as Record<string, Record<string, unknown>>)[p.id];
  if (!patch) return p;
  const out: Record<string, unknown> = { ...p };
  for (const [k, v] of Object.entries(patch)) {
    const cur = out[k];
    out[k] = v && cur && typeof v === 'object' && typeof cur === 'object' && !Array.isArray(v) ? { ...cur, ...v } : v;
  }
  return out as unknown as Project;
}

const projects = PROJECTS.map((p) => withInventoryMeta(withPageContent(p), SEED_UNITS[p.id]));

export const CATALOGUE: SeedData = {
  projects,
  units: SEED_UNITS,
  activity: deriveActivity(projects, SEED_UNITS),
};

export const SEED: SeedData = {
  projects: projects.filter((p) => p.lifecycle !== 'completed' && !p.sample),
  units: Object.fromEntries(Object.entries(SEED_UNITS).filter(([id]) => isLiveLayout(id))),
  activity: CATALOGUE.activity.filter((a) => isLiveLayout(a.projectId)),
};

/** Bumped (in checks/gen-projects.mjs) whenever any seed file changes; the store drops demo edits saved on an older seed. */
export { SEED_VERSION } from './projects';
export { GC6_PLAN, GC6_PROJECT_ID } from './units';
export type { Gc6Plan, PlanPlot, PlanRing } from './units';
