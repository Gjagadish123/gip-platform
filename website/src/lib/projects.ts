// Data access for the public site. Every page reads projects through these functions and nothing else, so the
// backend phase is a body swap: replace the seed reads with Supabase queries and keep the signatures.
// ponytail: one hardcoded project (Global City VI) until the admin/Supabase backend ships.
import { UNIT_STATUSES } from './constants';
import { GLOBAL_CITY_VI } from './data/global-city-vi';
import { GC6_PLAN, GC6_PROJECT_ID, GC6_UNITS, type Gc6Plan } from './data/units';
import { percents } from './format';
import type { ID, Project, Unit, UnitStatus } from './types';

const SEED_PROJECTS: Project[] = [GLOBAL_CITY_VI];
const SEED_UNITS: Record<ID, Unit[]> = { [GC6_PROJECT_ID]: GC6_UNITS };

/** Stamp inventory meta from the units so "as of" dates can never disagree with the plots. */
function withInventoryMeta(p: Project): Project {
  const units = SEED_UNITS[p.id];
  if (!units?.length) return p;
  const latest = units.reduce((d, u) => (u.statusDate && u.statusDate > d ? u.statusDate : d), '');
  return { ...p, inventoryUpdatedAt: latest || undefined, statusSample: units.some((u) => u.sample) };
}

const PROJECTS = SEED_PROJECTS.map(withInventoryMeta)
  .filter((p) => p.publishing.state === 'published')
  .sort((a, b) => a.publishing.sortOrder - b.publishing.sortOrder);

export async function getProjects(): Promise<Project[]> {
  return PROJECTS;
}

export async function getProject(slug: string): Promise<Project | null> {
  return PROJECTS.find((p) => p.publishing.slug === slug) ?? null;
}

export async function getUnits(projectId: ID): Promise<Unit[]> {
  return SEED_UNITS[projectId] ?? [];
}

/** Plot outlines for the interactive layout; only Global City VI is digitised today. */
export function getPlan(projectId: ID): Gc6Plan | null {
  return projectId === GC6_PROJECT_ID ? GC6_PLAN : null;
}

export const hasDetailPage = (p: Project) => p.lifecycle !== 'completed' && !p.publishing.externalUrl;

export interface InventorySummary {
  total: number;
  counts: Record<UnitStatus, number>;
  percents: Record<UnitStatus, number>;
  sellable: number;
  minArea: number;
  maxArea: number;
}

export function summarize(units: Unit[]): InventorySummary {
  const counts: Record<UnitStatus, number> = { available: 0, sold_out: 0, mortgaged: 0, registered: 0 };
  let minArea = Infinity, maxArea = -Infinity;
  for (const u of units) {
    counts[u.status]++;
    if (u.area < minArea) minArea = u.area;
    if (u.area > maxArea) maxArea = u.area;
  }
  const pcts = percents(UNIT_STATUSES.map((s) => counts[s]));
  return {
    total: units.length,
    counts,
    percents: Object.fromEntries(UNIT_STATUSES.map((s, i) => [s, pcts[i]])) as Record<UnitStatus, number>,
    sellable: counts.available,
    minArea: units.length ? minArea : 0,
    maxArea: units.length ? maxArea : 0,
  };
}
