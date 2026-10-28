// Data access for the public site. Every page reads projects through these functions and nothing else.
// Backend mode (BACKEND, see ./supabase): the published projects and their plots come from Supabase, what the admin
// publishes, cached for a minute (./projects-backend). Without it (the GitHub Pages preview) the bundled Global City
// VI data stands in.
import { loadProjects, loadUnits } from '@/lib/projects-backend';

import { UNIT_STATUSES } from './constants';
import { GLOBAL_CITY_VI } from './data/global-city-vi';
import LAYOUT_INDEX from './data/layouts/index.json';
import { GC6_PLAN, GC6_PROJECT_ID, GC6_UNITS, type Gc6Plan } from './data/units';
import { formatLandArea, percents } from './format';
import { isLiveLayout, toLiveUnit, type LiveProject, type LiveUnit } from './layouts';
import { BACKEND } from './supabase';
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

const byOrder = (a: Project, b: Project) => a.publishing.sortOrder - b.publishing.sortOrder;

/* ---------- reads ---------- */

/** Every published project, in the admin's order. */
export async function getProjects(): Promise<Project[]> {
  if (BACKEND) return [...(await loadProjects())].sort(byOrder);
  return SEED_PROJECTS.map(withInventoryMeta).filter((p) => p.publishing.state === 'published').sort(byOrder);
}

export async function getProject(slug: string): Promise<Project | null> {
  return (await getProjects()).find((p) => p.publishing.slug === slug) ?? null;
}

/** A project's plots (public columns only: no notes, deed numbers or prices), by plot number. */
export async function getUnits(projectId: ID): Promise<Unit[]> {
  if (BACKEND) return loadUnits(projectId);
  return SEED_UNITS[projectId] ?? [];
}

/** Plot outlines for the interactive layout; only Global City VI is digitised today. */
export function getPlan(projectId: ID): Gc6Plan | null {
  return projectId === GC6_PROJECT_ID ? GC6_PLAN : null;
}

// ponytail: the project page carries Global City VI's brochure copy and renders (components/project/content.ts), so
// only projects with their own page content get one; the rest are enquired about from the list. Add an id here when
// a project's page content lands.
const PAGE_CONTENT = new Set<ID>([GC6_PROJECT_ID]);
export const hasDetailPage = (p: Project) =>
  PAGE_CONTENT.has(p.id) && p.lifecycle !== 'completed' && !p.publishing.externalUrl;

/**
 * /layouts: the mapped projects that are published (RLS hides the rest from the site), in the admin's order, with
 * their plots' public columns. Only the four projects with an approved layout on file can appear (LIVE_LAYOUT_IDS).
 */
export async function getLiveLayouts(): Promise<{ projects: LiveProject[]; units: Record<ID, LiveUnit[]> }> {
  const projects = (await getProjects()).filter((p) => isLiveLayout(p.id));
  const units = await Promise.all(projects.map(async (p) => [p.id, (await getUnits(p.id)).map(toLiveUnit)] as const));
  return { projects: projects.map(toLiveProject), units: Object.fromEntries(units) };
}

const DRAWINGS: Record<string, { landArea: string; source: { reference?: string; pending?: boolean } }> = LAYOUT_INDEX;

function toLiveProject(p: Project): LiveProject {
  // The approved drawing's own figures win: its land area, and its approval number when the record has none. From
  // the small index, so the facts are final on first paint instead of changing when the drawing loads.
  const drawing = DRAWINGS[p.id];
  const drawingRef = drawing && !drawing.source.pending ? drawing.source.reference : undefined;
  const landArea = drawing?.landArea ?? (p.landArea && formatLandArea(p.landArea));
  return {
    id: p.id as LiveProject['id'],
    slug: p.publishing.slug,
    name: p.name,
    place: p.location.short.replace(/,\s*Hyderabad$/i, ''),
    lifecycle: p.lifecycle,
    ...(landArea && { landArea }),
    approvals: p.legal.approvals.map((a) => {
      const reference = a.reference ?? (a.authority === 'HMDA' || a.authority === 'DTCP' ? drawingRef : undefined);
      return { authority: a.authority, title: a.title, ...(reference && { reference }), ...(a.date && { date: a.date }) };
    }),
    ...(p.inventoryUpdatedAt && { inventoryUpdatedAt: p.inventoryUpdatedAt }),
    ...(p.statusSample && { statusSample: true }),
    ...(hasDetailPage(p) && { detailHref: `/projects/${p.publishing.slug}` }),
    ...(p.media.brochure?.url && { brochure: p.media.brochure.url }),
  };
}

export interface InventorySummary {
  total: number;
  counts: Record<UnitStatus, number>;
  percents: Record<UnitStatus, number>;
  sellable: number;
  minArea: number;
  maxArea: number;
}

export function summarize(units: Unit[]): InventorySummary {
  const counts = Object.fromEntries(UNIT_STATUSES.map((s) => [s, 0])) as Record<UnitStatus, number>;
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
