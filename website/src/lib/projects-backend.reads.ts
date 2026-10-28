// Supabase reads behind ./projects-backend, uncached. The server build wraps them in "use cache"
// (./projects-backend.ts); the GitHub Pages export can't run that (no cacheComponents there), so next.config.ts points
// '@/lib/projects-backend' straight at this file when the export has the Supabase variables: its pages then hold a
// build-time copy.
import { supabase } from './supabase';
import type { ID, Price, Project, Unit, UnitStatus } from './types';

const byNumber = new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare;

/* ---------- rows (the columns anon may read; supabase/migrations) ---------- */

interface ProjectRow {
  id: string; slug: string; name: string; type_id: string; lifecycle: Project['lifecycle'];
  publish_state: Project['publishing']['state']; homepage_slot: string | null; sort_order: number;
  public_content: Record<string, unknown>; inventory_updated_at: string | null; status_sample: boolean;
  sample: boolean; published_at: string | null; updated_at: string;
}
const PROJECT_COLS = 'id, slug, name, type_id, lifecycle, publish_state, homepage_slot, sort_order, public_content, '
  + 'inventory_updated_at, status_sample, sample, published_at, updated_at';

type UnitRow = Record<string, string | number | boolean | null> & { number: string; area: number; status: UnitStatus };
const UNIT_COLS = 'number, block, area, width_ft, depth_ft, facing, facing2, road_width_ft, road_width2_ft, corner, '
  + 'built_up_area_sqft, bedrooms, tower, floor, bhk, carpet_area_sqft, status, status_date, sample';

/** The IST calendar date of a UTC timestamp, 'YYYY-MM-DD'. */
const istDate = (ts: string) => new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

// public_content is the admin's Project content minus a hidden price (supabase/migrations: private.public_content).
function rowToProject(r: ProjectRow): Project {
  const c = r.public_content as unknown as Omit<Project, 'price'> & { price?: Price };
  return {
    ...c,
    price: c.price ?? { mode: 'on_request' },
    id: r.id, name: r.name, typeId: r.type_id, lifecycle: r.lifecycle,
    publishing: {
      ...c.publishing,
      slug: r.slug, state: r.publish_state, homepageSlot: r.homepage_slot as Project['publishing']['homepageSlot'],
      sortOrder: r.sort_order, updatedAt: istDate(r.updated_at),
      ...(r.published_at && { publishedAt: istDate(r.published_at) }),
    },
    ...(r.inventory_updated_at && { inventoryUpdatedAt: r.inventory_updated_at }),
    statusSample: r.status_sample,
    ...(r.sample && { sample: true }),
  };
}

const UNIT_FIELDS = {
  block: 'block', widthFt: 'width_ft', depthFt: 'depth_ft', facing: 'facing', facing2: 'facing2',
  roadWidthFt: 'road_width_ft', roadWidth2Ft: 'road_width2_ft', corner: 'corner', builtUpAreaSqFt: 'built_up_area_sqft',
  bedrooms: 'bedrooms', tower: 'tower', floor: 'floor', bhk: 'bhk', carpetAreaSqFt: 'carpet_area_sqft',
  statusDate: 'status_date', sample: 'sample',
} as const;

function rowToUnit(projectId: ID, r: UnitRow): Unit {
  const u: Record<string, unknown> = {
    id: `${projectId}:${r.number}`, projectId, number: r.number, area: Number(r.area), status: r.status, history: [],
  };
  for (const [field, col] of Object.entries(UNIT_FIELDS)) if (r[col] != null && r[col] !== false) u[field] = r[col];
  return u as unknown as Unit;
}

/** Every published project (RLS shows anon nothing else). */
export async function loadProjects(): Promise<Project[]> {
  const { data, error } = await supabase().from('projects').select(PROJECT_COLS).eq('publish_state', 'published');
  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return (data as unknown as ProjectRow[]).map(rowToProject);
}

/** A project's plots (public columns only: no notes, deed numbers or prices), by plot number. */
export async function loadUnits(projectId: ID): Promise<Unit[]> {
  // ponytail: one request (the API returns up to 1000 rows); page it when a project passes 1000 plots.
  const { data, error } = await supabase().from('units').select(UNIT_COLS).eq('project_id', projectId);
  if (error) throw new Error(`Could not load plots: ${error.message}`);
  return (data as unknown as UnitRow[]).map((r) => rowToUnit(projectId, r)).sort((a, b) => byNumber(a.number, b.number));
}
