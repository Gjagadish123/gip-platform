// Domain objects (../types) ⇄ database rows (supabase/migrations). Pure, no client: the data layer and
// scripts/gen-seed.ts both use it. Timestamps come back from Postgres in UTC; the app stores IST ('+05:30').
import { toIsoDate, toIstIso } from '../format';
import type { ActivityEvent, HomepageSlot, Project, Publishing, StatusEvent, Unit } from '../types';
import type { Database, Json } from './database.types';

type Tables = Database['public']['Tables'];
export type ProjectRow = Tables['projects']['Row'];
export type ProjectWrite = Tables['projects']['Insert'];
export type UnitRow = Tables['units']['Row'];
export type EventRow = Tables['unit_status_events']['Row'];
export type ActivityRow = Tables['activity']['Row'];
export type ActivityWrite = Tables['activity']['Insert'];

const ist = (ts: string) => toIstIso(Date.parse(ts));

function omit<T extends object, K extends keyof T>(o: T, keys: readonly K[]): Omit<T, K> {
  const out = { ...o };
  for (const k of keys) delete out[k];
  return out;
}

/* ---------- projects: identity, publishing and ordering are columns; the rest is `content` ---------- */

/** Fields the database owns: stamped by triggers (dates) or by the inventory RPCs (inventory meta). */
type ServerOwned = 'inventoryUpdatedAt' | 'statusSample' | 'sample' | 'rev';
type Content = Omit<Project, 'id' | 'name' | 'typeId' | 'lifecycle' | ServerOwned | 'publishing'> & {
  publishing: Omit<Publishing, 'slug' | 'state' | 'homepageSlot' | 'sortOrder' | 'updatedAt' | 'publishedAt'>;
};

export function projectToRow(p: Project): ProjectWrite {
  const { id, name, typeId, lifecycle, publishing } = p;
  const { slug, state, homepageSlot, sortOrder } = publishing;
  // Server-owned fields (stamped by triggers and the inventory RPCs) are never written back.
  const content: Content = {
    ...omit(p, ['id', 'name', 'typeId', 'lifecycle', 'publishing', 'inventoryUpdatedAt', 'statusSample', 'sample', 'rev']),
    publishing: omit(publishing, ['slug', 'state', 'homepageSlot', 'sortOrder', 'updatedAt', 'publishedAt']),
  };
  return {
    id, name, slug, type_id: typeId, lifecycle, publish_state: state, homepage_slot: homepageSlot, sort_order: sortOrder,
    content: content as unknown as Json,
  };
}

export function rowToProject(r: ProjectRow): Project {
  const c = r.content as unknown as Content;
  return {
    ...c,
    id: r.id, name: r.name, typeId: r.type_id, lifecycle: r.lifecycle,
    publishing: {
      ...c.publishing,
      slug: r.slug, state: r.publish_state, homepageSlot: r.homepage_slot as HomepageSlot | null, sortOrder: r.sort_order,
      updatedAt: toIsoDate(r.updated_at),
      ...(r.published_at && { publishedAt: toIsoDate(r.published_at) }),
    },
    ...(r.inventory_updated_at && { inventoryUpdatedAt: r.inventory_updated_at }),
    statusSample: r.status_sample,
    ...(r.sample && { sample: true }),
    rev: r.updated_at,
  };
}

/* ---------- units ---------- */

/** Unit field → column, for everything a unit stores except id, projectId and history (compile error if one's missing). */
const UNIT_COLUMNS = {
  number: 'number', block: 'block', area: 'area', widthFt: 'width_ft', depthFt: 'depth_ft', facing: 'facing',
  facing2: 'facing2', roadWidthFt: 'road_width_ft', roadWidth2Ft: 'road_width2_ft', corner: 'corner',
  builtUpAreaSqFt: 'built_up_area_sqft', bedrooms: 'bedrooms', tower: 'tower', floor: 'floor', bhk: 'bhk',
  carpetAreaSqFt: 'carpet_area_sqft', price: 'price', status: 'status', statusDate: 'status_date',
  statusNote: 'status_note', mortgagedTo: 'mortgaged_to', documentNo: 'document_no', sample: 'sample',
} as const satisfies Record<Exclude<keyof Unit, 'id' | 'projectId' | 'history'>, keyof UnitRow>;
const UNIT_FIELDS = Object.entries(UNIT_COLUMNS) as [keyof typeof UNIT_COLUMNS, keyof UnitRow][];

/**
 * The RPC payload for one unit (save_unit / replace_units / undo_batch): its columns and its history (written only
 * when restoring removed units). `was`: the unit as the screen showed it before an edit; the database refuses the
 * edit if its number or status no longer match (another admin got there first).
 */
export function unitPayload(u: Unit, was?: Pick<Unit, 'number' | 'status'>): Json {
  const row: Record<string, unknown> = { history: u.history };
  for (const [field, col] of UNIT_FIELDS) row[col] = u[field] ?? null;
  if (was) Object.assign(row, { number_was: was.number, status_was: was.status });
  return row as Json;
}

export function rowToUnit(r: Pick<UnitRow, 'project_id'> & Partial<UnitRow>, history: StatusEvent[]): Unit {
  const u: Record<string, unknown> = {};
  for (const [field, col] of UNIT_FIELDS) if (r[col] != null) u[field] = r[col];
  return { ...(u as Omit<Unit, 'id' | 'projectId' | 'history'>), id: `${r.project_id}:${r.number}`, projectId: r.project_id, history };
}

export const rowToEvent = (e: Pick<EventRow, 'from_status' | 'to_status' | 'at' | 'actor_name' | 'note' | 'batch_id' | 'prev'>): StatusEvent => ({
  from: e.from_status, to: e.to_status, at: ist(e.at), by: e.actor_name,
  ...(e.note && { note: e.note }), ...(e.batch_id && { batchId: e.batch_id }),
  ...(e.prev && typeof e.prev === 'object' && !Array.isArray(e.prev) && { prev: e.prev }),
});

/* ---------- activity ---------- */

export const rowToActivity = (a: ActivityRow): ActivityEvent => ({
  id: `act-${a.id}`, at: ist(a.at), by: a.actor_name, projectId: a.project_id, kind: a.kind as ActivityEvent['kind'],
  message: a.message,
  ...(a.batch_id && { batchId: a.batch_id }), ...(a.unit_numbers && { unitNumbers: a.unit_numbers }), ...(a.to_status && { to: a.to_status }),
});

/** Activity insert; id, time and actor come from the database. */
export const activityToRow = (e: Pick<ActivityEvent, 'projectId' | 'kind' | 'message' | 'batchId'>): ActivityWrite => ({
  project_id: e.projectId, kind: e.kind, message: e.message, batch_id: e.batchId ?? null,
});
