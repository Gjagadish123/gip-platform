// Database reads and writes for Supabase mode. The store (../store.tsx) owns the state and calls these from its
// write queue; every function throws on failure so the queue can roll the screen back.
import type { ActivityEvent, Asset, ID, Project, StatusEvent, Unit, UnitStatus } from '../types';
import type { Db } from './client';
import {
  activityToRow, projectToRow, rowToActivity, rowToEvent, rowToProject, rowToUnit, unitPayload, type ProjectWrite,
} from './rows';
import { naturalCompare } from '../inventory';

const PAGE = 1000; // PostgREST max_rows (supabase/config.toml [api], and the hosted default)
export const MEDIA_BUCKET = 'project-media';

type Result<T> = { data: T; error: { message: string; code?: string } | null };

/** The data, or the PostgREST / Storage error thrown. */
function ok<T>({ data, error }: Result<T>): T {
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data;
}

/**
 * Every row, PAGE at a time by key, until an empty page: rows added or deleted mid-load are neither skipped nor
 * doubled, and a project whose max_rows is below PAGE still loads in full.
 */
async function allRows<T extends { id: string | number }>(page: (after: T['id'] | null) => PromiseLike<Result<T[] | null>>) {
  const rows: T[] = [];
  for (let after: T['id'] | null = null; ;) {
    const batch: T[] = ok(await page(after)) ?? [];
    if (!batch.length) return rows;
    rows.push(...batch);
    after = batch[batch.length - 1].id;
  }
}

/** One line for a toast. Expected failures get plain words; anything else shows the database's message. */
export function describeError(e: unknown): string {
  const { code, message } = (e ?? {}) as { code?: string; message?: string };
  if (code === '23505') return 'another project or unit already uses that slug or number';
  if (code === '42501' || code === 'PGRST301') return 'your session has no permission for this; sign in again';
  if (code === '22P02') return 'a value is not in a form the database accepts (floor and bedrooms are whole numbers)';
  return (message || 'unknown error').replace(/\.$/, ''); // 40001 (changed by another admin) carries its own wording
}

/* ---------- load ---------- */

// ponytail: loads every project, unit and status event at sign-in (the store is in-memory, like the demo).
// Fine at today's ~10 projects / ~2k units; page per project if inventories reach tens of thousands.
export async function loadAll(db: Db, maxActivity: number) {
  const [projects, units, events, activity] = await Promise.all([
    allRows((after: string | null) => {
      const q = db.from('projects').select('*');
      return (after == null ? q : q.gt('id', after)).order('id').limit(PAGE);
    }),
    allRows((after: string | null) => {
      const q = db.from('units').select('*');
      return (after == null ? q : q.gt('id', after)).order('id').limit(PAGE);
    }),
    allRows((after: number | null) => {
      const q = db.from('unit_status_events').select('id, unit_id, from_status, to_status, at, actor_name, note, batch_id, prev');
      return (after == null ? q : q.gt('id', after)).order('id').limit(PAGE);
    }),
    db.from('activity').select('*').order('at', { ascending: false }).order('id', { ascending: false }).limit(maxActivity),
  ]);

  const history = new Map<string, StatusEvent[]>();
  for (const e of events) {
    const list = history.get(e.unit_id);
    if (list) list.push(rowToEvent(e)); else history.set(e.unit_id, [rowToEvent(e)]);
  }
  // Restored units get new event ids for old events: order history by time (stable, so same-time events keep id order).
  for (const list of history.values()) list.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  const byProject: Record<ID, Unit[]> = {};
  for (const r of units) (byProject[r.project_id] ??= []).push(rowToUnit(r, history.get(r.id) ?? []));
  for (const list of Object.values(byProject)) list.sort((a, b) => naturalCompare(a.number, b.number));

  return {
    projects: projects.map(rowToProject).sort((a, b) => a.publishing.sortOrder - b.publishing.sortOrder),
    units: byProject,
    activity: (ok(activity) ?? []).map(rowToActivity),
  };
}

/* ---------- projects ---------- */

// Save-conflict guard. Every loaded Project carries `rev`, the row's updated_at when this tab read it, and a dirty
// editor draft keeps the rev it started from: a write only lands if nobody changed the row since. This tab's own
// writes move that expectation forward (rev → the updated_at the write produced), so one draft can save twice.
const forward = new Map<string, string>(); // `${id}@${rev}` → updated_at after this tab's write on top of it

function expectedRev(p: Pick<Project, 'id' | 'rev'>) {
  let rev = p.rev ?? forward.get(`${p.id}@`); // '' key: a project this tab created and hasn't reloaded
  for (let next = rev && forward.get(`${p.id}@${rev}`); next; next = forward.get(`${p.id}@${rev}`)) rev = next;
  return rev;
}

async function guardedUpdate(db: Db, p: Pick<Project, 'id' | 'name' | 'rev'>, patch: Partial<ProjectWrite>) {
  const rev = expectedRev(p);
  let q = db.from('projects').update(patch).eq('id', p.id);
  if (rev) q = q.eq('updated_at', rev);
  const rows = ok(await q.select('updated_at'));
  if (!rows?.length) throw new Error(`${p.name} was changed or deleted by another admin, so make the change again`);
  forward.set(`${p.id}@${rev ?? ''}`, rows[0].updated_at);
}

export async function insertProject(db: Db, p: Project) {
  const rows = ok(await db.from('projects').insert(projectToRow(p)).select('updated_at'));
  if (rows?.[0]) forward.set(`${p.id}@`, rows[0].updated_at);
}

export const updateProject = (db: Db, p: Project) => guardedUpdate(db, p, projectToRow(p));

/** Only the state column, so a publish never rewrites content; guarded like a save. */
export const setPublishState = (db: Db, p: Project, state: Project['publishing']['state']) =>
  guardedUpdate(db, p, { publish_state: state });

export async function deleteProject(db: Db, id: ID) {
  ok(await db.from('projects').delete().eq('id', id));
}

export async function logActivity(db: Db, e: Pick<ActivityEvent, 'projectId' | 'kind' | 'message' | 'batchId'>) {
  ok(await db.from('activity').insert(activityToRow(e)));
}

/* ---------- units (RPCs: atomic with history, activity and the inventory stamp; refuse stale views) ---------- */

/** `from`: the status this tab showed for each of `numbers` (the RPC refuses the change if one differs). */
export async function setUnitStatuses(db: Db, a: {
  projectId: ID; numbers: string[]; from: UnitStatus[]; to: UnitStatus; batchId: string; message: string;
  note?: string; date?: string; mortgagedTo?: string; documentNo?: string;
}) {
  ok(await db.rpc('set_unit_statuses', {
    p_project_id: a.projectId, p_numbers: a.numbers, p_from: a.from, p_to: a.to, p_batch_id: a.batchId,
    p_message: a.message, p_note: a.note, p_date: a.date, p_mortgaged_to: a.mortgagedTo, p_document_no: a.documentNo,
  }));
}

/** `was`: the unit as this tab last showed it (absent = a new unit). `message`: the activity line when its status changed. */
export async function saveUnit(db: Db, projectId: ID, unit: Unit, was?: Unit, message?: string) {
  ok(await db.rpc('save_unit', { p_project_id: projectId, p_unit: unitPayload(unit, was), p_message: message }));
}

/** A generate / remove as a change: only `add` and `remove` are touched (`remove` as the screen showed them). */
export async function replaceUnits(db: Db, projectId: ID, add: Unit[], remove: Unit[], batchId: string, message: string) {
  ok(await db.rpc('replace_units', {
    p_project_id: projectId, p_add: add.map((u) => unitPayload(u)), p_batch_id: batchId, p_message: message,
    p_remove: remove.map((u) => u.number), p_remove_from: remove.map((u) => u.status),
  }));
}

/** A status batch is undone from its history; a replace passes its inverse (units to put back, units to drop). */
export async function undoBatch(db: Db, batchId: string, projectId: ID, inverse?: { add: Unit[]; remove: Unit[] }) {
  ok(await db.rpc('undo_batch', {
    p_batch_id: batchId, p_project_id: projectId, p_add: inverse?.add.map((u) => unitPayload(u)),
    p_remove: inverse?.remove.map((u) => u.number), p_remove_from: inverse?.remove.map((u) => u.status),
  }));
}

/* ---------- media ---------- */

/** Uploads to the public media bucket under a fresh name (files are immutable, so they cache for a year). */
export async function uploadMedia(db: Db, file: File, id: string): Promise<Asset['url']> {
  const ext = /\.[a-z0-9]{1,5}$/i.exec(file.name)?.[0].toLowerCase() ?? '';
  const path = `${id}${ext}`;
  ok(await db.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000' }));
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
