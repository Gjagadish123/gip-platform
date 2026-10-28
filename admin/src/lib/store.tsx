'use client';
// The admin's one store. Every screen reads it synchronously; actions update it at once (optimistic) and:
// - Supabase mode (BACKEND): queue the same change for the database, strictly in order. A refused write drops the
//   rest of the queue and reloads the saved data, so the screen never keeps a change the database didn't take.
//   Data loads after sign-in and again when the tab comes back into view (other admins' changes).
// - Demo (GitHub Pages preview): seed → hydrate from localStorage once mounted (server snapshot = seed, so no
//   hydration mismatch) → debounced writes.
// Ids and timestamps are minted only inside actions (event time), never in render.
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { DEMO_NOW, getProjectType, NEW_PROJECT_IDS } from './constants';
import { slugify, toIsoDate, toIstIso } from './format';
import { compressRanges, describeStatusChange, naturalCompare } from './inventory';
import { SEED, SEED_VERSION } from './mock';
import { BACKEND, createClient, type Db } from './supabase/client';
import * as remote from './supabase/data';
import type { ActivityEvent, ID, Lifecycle, MortgagedTo, Project, PublishState, Unit, UnitStatus } from './types';

/** Holds `{ v: SEED_VERSION, state }`. Exported for the error page's "Reset demo data". */
export const STORAGE_KEY = 'gip-admin-demo:v1';
const WRITE_DELAY_MS = 300;
const MAX_ACTIVITY = 500; // ponytail: bounds localStorage size; older entries drop off
const MAX_UNDO = 20;
const REFRESH_MIN_MS = 30_000; // tab-focus reloads at most this often

export interface DemoState {
  projects: Project[];
  units: Record<ID, Unit[]>;
  activity: ActivityEvent[];
  session: { username: string };
}
/** signedIn is always true in the demo (any name signs in). loadError: the first load failed (Supabase mode). */
interface Snapshot { state: DemoState; hydrated: boolean; signedIn: boolean; loadError?: string }

const SEED_STATE: DemoState = { ...SEED, session: { username: 'Admin' } };
const EMPTY_STATE: DemoState = { projects: [], units: {}, activity: [], session: { username: '' } };
const SERVER_SNAPSHOT: Snapshot = BACKEND
  ? { state: EMPTY_STATE, hydrated: false, signedIn: false }
  : { state: SEED_STATE, hydrated: false, signedIn: true };
const getServerSnapshot = () => SERVER_SNAPSHOT;
const EMPTY_UNITS: Unit[] = [];

/* Called only from actions (event handlers). crypto.randomUUID needs a secure context, which a LAN demo may lack. */
const mintId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
/* First pre-built id not used by a project or its activity (a reused id would inherit a deleted project's log).
   Supabase mode always mints: the store holds only the latest activity, so it can't prove a slot was never used. */
const nextProjectId = (s: DemoState) =>
  (BACKEND ? undefined : NEW_PROJECT_IDS.find((id) => !s.projects.some((p) => p.id === id) && !s.activity.some((a) => a.projectId === id)))
  ?? mintId('p');

/* ---------- clock: the seed is set at DEMO_NOW; after that the demo runs on real time, never earlier ---------- */

const atLeastDemoNow = (iso: string) => (iso > DEMO_NOW ? iso : DEMO_NOW); // same '+05:30' format, so strings compare
/** Reads the clock: event handlers and effects only (cacheComponents), never render. */
export const nowIso = () => atLeastDemoNow(toIstIso(Date.now()));
/** Today's IST date, never before DEMO_TODAY. Handlers and effects only; render uses useNow(). */
export const todayIso = () => toIsoDate(nowIso());
const minuteNow = () => atLeastDemoNow(toIstIso(Math.floor(Date.now() / 60_000) * 60_000));
const subscribeMinute = (tick: () => void) => {
  const id = setInterval(tick, 15_000); // React re-renders only when the minute string changes
  return () => clearInterval(id);
};
/** "Now" for relative dates: DEMO_NOW on the server and first paint, then the real clock, ticking each minute. */
export const useNow = () => useSyncExternalStore(subscribeMinute, minuteNow, () => DEMO_NOW);

/** Toasts from the store wait a tick: the <Toaster> subscribes in its own mount effect, after the store hydrates. */
const notify = (show: () => void) => { if (typeof window !== 'undefined') setTimeout(show, 0); };

export interface StatusChangeOptions { note?: string; date?: string; mortgagedTo?: MortgagedTo; documentNo?: string }

export interface DemoActions {
  createProject(input: { name: string; typeId: ID; lifecycle: Lifecycle }): ID;
  saveProject(project: Project): void;
  /** Returns the new id ('' if the source no longer exists). */
  duplicateProject(id: ID): ID;
  setPublishState(id: ID, state: PublishState): void;
  archiveProject(id: ID): void;
  deleteProject(id: ID): void;
  /** Changes every listed unit not already in `to`; one history event each, sharing the returned batchId. */
  setUnitStatuses(projectId: ID, unitIds: ID[], to: UnitStatus, opts?: StatusChangeOptions): string;
  /** Reverts a batch from setUnitStatuses or replaceUnits made this session. False when it can't (unknown / reset). */
  undoBatch(batchId: string): boolean;
  saveUnit(projectId: ID, unit: Unit): void;
  /** Generate / remove: `units` is the new full list, but only the units added or dropped are written (kept units
   *  are never rewritten; edit those with saveUnit). Returns a batchId usable with undoBatch. */
  replaceUnits(projectId: ID, units: Unit[]): string;
  setSession(username: string): void;
  /** Supabase mode: email + password, then loads the data. Demo: takes the name. Resolves to an error message or null. */
  signIn(email: string, password: string): Promise<string | null>;
  /** Resolves to false when it couldn't (offline with an expired token): still signed in, and told why. */
  signOut(): Promise<boolean>;
  /** Supabase mode: load everything again (retry after a failed load). */
  reload(): void;
  resetDemo(): void;
}

type UndoRecord =
  | { kind: 'status'; projectId: ID; prev: Map<ID, Unit>; prevProject?: Project }
  | { kind: 'replace'; projectId: ID; prevProject?: Project; added: string[]; removed: Unit[] };

interface Persisted { v: number; state: DemoState }

function isState(s: unknown): s is DemoState {
  const x = s as DemoState;
  return !!x && Array.isArray(x.projects) && !!x.units && typeof x.units === 'object' && Array.isArray(x.activity) && typeof x.session?.username === 'string';
}

function uniqueSlug(base: string, projects: Project[], exceptId?: ID) {
  const taken = new Set(projects.filter((p) => p.id !== exceptId).map((p) => p.publishing.slug));
  let slug = base || 'project';
  for (let n = 2; taken.has(slug); n++) slug = `${base || 'project'}-${n}`;
  return slug;
}

function blankProject(id: ID, name: string, typeId: ID, lifecycle: Lifecycle, slug: string, sortOrder: number, today: string): Project {
  const type = getProjectType(typeId);
  return {
    id, name, typeId, lifecycle, description: '', highlights: [],
    price: type.priceMode === 'per_area' ? { mode: 'per_area', amount: 0, per: type.areaUnit === 'sq_ft' ? 'sq_ft' : 'sq_yd' } : { mode: 'total', amount: 0, from: true },
    showPrice: false, configurations: [],
    location: { short: '', full: '', district: '', state: 'Telangana' },
    locationAdvantages: { title: '', description: '', badge: '', categories: [] },
    media: { cover: null, hero: null, gallery: [], amenityGallery: [], locationImage: null, masterPlan: null, masterPlanPage: 1, brochure: null },
    vision: { title: '', description: '', features: [] },
    masterPlan: { title: '', description: '', stats: [] },
    amenities: { title: '', description: '', items: [], visible: false },
    legal: { title: '', description: '', approvals: [], documents: [] },
    cta: { subheading: '', title: '', description: '', phone: '', whatsapp: '', urgency: '', thankYou: '' },
    publishing: { slug, state: 'draft', homepageSlot: null, sortOrder, updatedAt: today },
  };
}

/** Inventory meta always follows the units. Action time only (reads the clock). */
const withInventoryMeta = (p: Project, units: Unit[]): Project =>
  ({ ...p, inventoryUpdatedAt: todayIso(), statusSample: units.some((u) => u.sample) });

const isAdmin = (u: { app_metadata?: Record<string, unknown> }) => u.app_metadata?.role === 'admin';
const NOT_ADMIN = "This account isn't an admin yet. Ask your administrator to give it access.";
const displayName = (u: { email?: string; user_metadata?: { name?: unknown } }) =>
  (typeof u.user_metadata?.name === 'string' && u.user_metadata.name.trim()) || u.email || 'Admin';

/** Exported for the data self-check; the app uses <DemoStoreProvider>. */
export function createDemoStore() {
  let snap: Snapshot = SERVER_SNAPSHOT;
  const listeners = new Set<() => void>();
  const undo = new Map<string, UndoRecord>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let warned = false;

  /* ---------- Supabase mode: client, ordered write queue, load ---------- */

  let client: Db | null = null;
  const db = () => (client ??= createClient()); // lazily: never during the server render
  let queue: Promise<void> = Promise.resolve();
  let pending = 0, writes = 0, failed = false, loading: Promise<void> | null = null, loadedAt = 0, started = false;
  let authGen = 0; // bumped on every sign-out: a load that started before one must not put the data back

  /** Runs `job` after every earlier write. No-op in the demo. */
  const write = (job: (db: Db) => Promise<unknown>) => {
    if (!BACKEND) return;
    pending++;
    writes++;
    queue = queue
      .then(async () => {
        if (failed) return; // an earlier write failed: the reload below replaces this change too
        try {
          await job(db());
        } catch (e) {
          failed = true;
          notify(() => toast.error(`Couldn't save: ${remote.describeError(e)}. Showing the saved data.`));
        }
      })
      .finally(() => {
        if (--pending === 0 && failed) void load();
      });
  };

  /** Session check + full load, one at a time. A failure keeps what's on screen (or shows the error page). */
  const load = () => (loading ??= (async () => {
    const gen = authGen;
    let owed = false; // a write was refused: what's on screen may not be saved until this load lands
    try {
      const { data: { session }, error } = await db().auth.getSession();
      if (error && isAuthRetryableFetchError(error)) throw error; // offline: keep the session, show the error
      if (!session || !isAdmin(session.user)) {
        if (session) await db().auth.signOut(); // RLS would hide everything and refuse every write
        snap = { state: EMPTY_STATE, hydrated: true, signedIn: false };
        return;
      }
      let seen: number, data: Awaited<ReturnType<typeof remote.loadAll>>;
      do {
        while (pending) await queue; // read after every queued write has landed (or been dropped after a failure)
        if (failed) {
          undo.clear(); // undoing a change that was dropped would replay it
          owed = true;
        }
        failed = false;
        seen = writes;
        data = await remote.loadAll(db(), MAX_ACTIVITY);
      } while (seen !== writes); // a change made while reading: read again, or the old data would wipe it off screen
      if (gen !== authGen) return;
      snap = { state: { ...data, session: { username: displayName(session.user) } }, hydrated: true, signedIn: true };
      loadedAt = Date.now();
    } catch (e) {
      if (gen !== authGen) return;
      const why = remote.describeError(e);
      if (owed || failed) {
        owed = true;
        undo.clear();
        loadedAt = 0; // the next tab focus reloads too
      }
      if (!(snap.hydrated && snap.signedIn && !snap.loadError)) snap = { ...snap, hydrated: true, signedIn: true, loadError: why };
      else if (!owed) notify(() => toast.error(`Couldn't load the latest data: ${why}`));
      else notify(() => toast.error(`Couldn't load the saved data: ${why}. Changes on screen may not be saved.`, {
        duration: Infinity, action: { label: 'Retry', onClick: () => void load() },
      }));
    } finally {
      failed = false; // also after a failed load: later writes must not be dropped
      loading = null;
      emit();
    }
  })());

  const emit = () => listeners.forEach((l) => l());
  const persist = () => {
    if (BACKEND) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: SEED_VERSION, state: snap.state } satisfies Persisted));
    } catch {
      // Quota / private mode: the demo keeps working in memory. Say so once.
      if (warned || typeof window === 'undefined') return;
      warned = true;
      notify(() => toast.warning("This browser isn't saving demo changes; they'll be lost on refresh."));
    }
  };
  const flush = () => { if (timer) { clearTimeout(timer); timer = undefined; persist(); } };
  const set = (fn: (s: DemoState) => DemoState) => {
    const next = fn(snap.state);
    if (next === snap.state) return;
    snap = { ...snap, state: next };
    emit();
    if (BACKEND) return;
    clearTimeout(timer);
    timer = setTimeout(() => { timer = undefined; persist(); }, WRITE_DELAY_MS);
  };
  const get = () => snap.state;
  const remember = (batchId: string, rec: UndoRecord) => {
    undo.set(batchId, rec);
    if (undo.size > MAX_UNDO) undo.delete(undo.keys().next().value!);
  };
  const log = (s: DemoState, e: Omit<ActivityEvent, 'id' | 'at' | 'by'>): ActivityEvent[] =>
    [{ id: mintId('act'), at: nowIso(), by: s.session.username || 'Admin', ...e }, ...s.activity].slice(0, MAX_ACTIVITY);
  const mapProject = (s: DemoState, id: ID, fn: (p: Project) => Project) => s.projects.map((p) => (p.id === id ? fn(p) : p));

  const actions: DemoActions = {
    createProject({ name, typeId, lifecycle }) {
      const id = nextProjectId(get());
      const message = 'Created as draft';
      let project!: Project;
      set((s) => {
        const sort = Math.max(0, ...s.projects.map((p) => p.publishing.sortOrder)) + 1;
        project = blankProject(id, name.trim(), typeId, lifecycle, uniqueSlug(slugify(name), s.projects), sort, todayIso());
        return { ...s, projects: [...s.projects, project], activity: log(s, { projectId: id, kind: 'project', message }) };
      });
      write(async (db) => {
        await remote.insertProject(db, project);
        await remote.logActivity(db, { projectId: id, kind: 'project', message });
      });
      return id;
    },

    saveProject(project) {
      const message = 'Edited project details';
      set((s) => ({
        ...s,
        projects: mapProject(s, project.id, () => ({ ...project, publishing: { ...project.publishing, updatedAt: todayIso() } })),
        activity: log(s, { projectId: project.id, kind: 'project', message }),
      }));
      write(async (db) => {
        await remote.updateProject(db, project);
        await remote.logActivity(db, { projectId: project.id, kind: 'project', message });
      });
    },

    duplicateProject(id) {
      const src = get().projects.find((p) => p.id === id);
      if (!src) return '';
      const newId = nextProjectId(get());
      const message = `Duplicated from ${src.name}`;
      let copy!: Project;
      set((s) => {
        const name = `${src.name} (copy)`;
        const sort = Math.max(0, ...s.projects.map((p) => p.publishing.sortOrder)) + 1;
        const blank = blankProject(newId, name, src.typeId, src.lifecycle, uniqueSlug(slugify(name), s.projects), sort, todayIso());
        // Identity fields cleared (domain §4 #11): RERA/approvals, media, slug, live links, inventory.
        copy = {
          ...structuredClone(src), id: newId, name, displayName: undefined,
          media: blank.media, publishing: blank.publishing,
          legal: { ...structuredClone(src.legal), approvals: [], documents: src.legal.documents.map((d) => ({ ...d, id: mintId('doc'), file: undefined })) },
          inventoryUpdatedAt: undefined, statusSample: undefined, sample: undefined, rev: undefined,
        };
        return { ...s, projects: [...s.projects, copy], activity: log(s, { projectId: newId, kind: 'project', message }) };
      });
      write(async (db) => {
        await remote.insertProject(db, copy);
        await remote.logActivity(db, { projectId: newId, kind: 'project', message });
      });
      return newId;
    },

    setPublishState(id, state) {
      let message = '', before!: Project;
      set((s) => {
        const p = s.projects.find((x) => x.id === id);
        if (!p || p.publishing.state === state) return s;
        before = p;
        message = state === 'published' ? 'Published' : state === 'archived' ? 'Archived' : 'Unpublished (moved to draft)';
        const today = todayIso();
        return {
          ...s,
          projects: mapProject(s, id, (x) => ({
            ...x,
            publishing: { ...x.publishing, state, updatedAt: today, ...(state === 'published' && { publishedAt: today }) },
          })),
          activity: log(s, { projectId: id, kind: 'project', message }),
        };
      });
      if (message) write(async (db) => {
        await remote.setPublishState(db, before, state);
        await remote.logActivity(db, { projectId: id, kind: 'project', message });
      });
    },

    archiveProject(id) { actions.setPublishState(id, 'archived'); },

    deleteProject(id) {
      let message = '';
      set((s) => {
        const p = s.projects.find((x) => x.id === id);
        if (!p) return s;
        message = `Deleted ${p.name}`;
        const units = { ...s.units };
        delete units[id];
        return { ...s, projects: s.projects.filter((x) => x.id !== id), units, activity: log(s, { projectId: id, kind: 'project', message }) };
      });
      if (message) write(async (db) => {
        await remote.deleteProject(db, id);
        await remote.logActivity(db, { projectId: id, kind: 'project', message });
      });
    },

    setUnitStatuses(projectId, unitIds, to, opts = {}) {
      const batchId = mintId('batch');
      const at = nowIso(), today = toIsoDate(at);
      const note = opts.note?.trim() || undefined;
      let numbers: string[] = [], from: UnitStatus[] = [], message = '';
      set((s) => {
        const list = s.units[projectId] ?? EMPTY_UNITS;
        const ids = new Set(unitIds);
        const prev = new Map<ID, Unit>();
        const by = s.session.username || 'Admin';
        const next = list.map((u) => {
          if (!ids.has(u.id) || u.status === to) return u;
          prev.set(u.id, u);
          return {
            ...u, status: to, statusDate: opts.date ?? today, statusNote: note,
            mortgagedTo: to === 'mortgaged' ? (opts.mortgagedTo ?? u.mortgagedTo) : undefined,
            documentNo: to === 'registered' ? (opts.documentNo ?? u.documentNo) : undefined,
            sample: false,
            history: [...u.history, {
              from: u.status, to, at, by, ...(note && { note }), batchId,
              prev: { status: u.status, status_date: u.statusDate ?? null, status_note: u.statusNote ?? null,
                mortgaged_to: u.mortgagedTo ?? null, document_no: u.documentNo ?? null, sample: !!u.sample },
            }],
          };
        });
        if (!prev.size) return s;
        const project = s.projects.find((p) => p.id === projectId);
        remember(batchId, { kind: 'status', projectId, prev, prevProject: project });
        const changed = next.filter((u) => prev.has(u.id));
        numbers = changed.map((u) => u.number);
        from = changed.map((u) => prev.get(u.id)!.status);
        message = describeStatusChange(getProjectType(project?.typeId ?? ''), numbers, to) + (note ? ` · ${note}` : '');
        return {
          ...s,
          units: { ...s.units, [projectId]: next },
          projects: mapProject(s, projectId, (p) => withInventoryMeta(p, next)),
          activity: log(s, { projectId, kind: 'status', batchId, unitNumbers: numbers, to, message }),
        };
      });
      if (numbers.length) write((db) => remote.setUnitStatuses(db, {
        projectId, numbers, from, to, batchId, message, note, date: opts.date ?? today,
        mortgagedTo: opts.mortgagedTo, documentNo: opts.documentNo,
      }));
      return batchId;
    },

    undoBatch(batchId) {
      const rec = undo.get(batchId);
      if (!rec) return false;
      undo.delete(batchId);
      let inverse: { add: Unit[]; remove: Unit[] } | undefined;
      set((s) => {
        const list = s.units[rec.projectId] ?? EMPTY_UNITS;
        // Undo touches only what the batch changed, exactly as undo_batch does, so later edits survive: a status batch
        // reverts the status fields of the units still sitting on it; a replace drops the units it added and puts back
        // the ones it removed.
        let next: Unit[];
        if (rec.kind === 'replace') {
          const added = new Set(rec.added.map((n) => `${rec.projectId}:${n}`));
          const now = new Set(list.map((u) => u.id));
          inverse = { add: rec.removed.filter((u) => !now.has(u.id)), remove: list.filter((u) => added.has(u.id)) };
          next = [...list.filter((u) => !added.has(u.id)), ...inverse.add].sort((a, b) => naturalCompare(a.number, b.number));
        } else {
          next = list.map((u) => {
            const p = rec.prev.get(u.id);
            if (!p || u.history.at(-1)?.batchId !== batchId) return u;
            const { status, statusDate, statusNote, mortgagedTo, documentNo, sample } = p;
            return { ...u, status, statusDate, statusNote, mortgagedTo, documentNo, sample, history: u.history.slice(0, -1) };
          });
        }
        const meta = rec.prevProject;
        return {
          ...s,
          units: { ...s.units, [rec.projectId]: next },
          projects: mapProject(s, rec.projectId, (p) => ({ ...p, inventoryUpdatedAt: meta?.inventoryUpdatedAt, statusSample: meta?.statusSample })),
          activity: s.activity.filter((a) => a.batchId !== batchId),
        };
      });
      write((db) => remote.undoBatch(db, batchId, rec.projectId, inverse));
      return true;
    },

    saveUnit(projectId, unit) {
      let saved!: Unit, was: Unit | undefined, message: string | undefined;
      set((s) => {
        const list = s.units[projectId] ?? EMPTY_UNITS;
        const old = list.find((u) => u.id === unit.id);
        const at = nowIso(), by = s.session.username || 'Admin';
        const statusChanged = !old || old.status !== unit.status;
        let next: Unit = {
          ...unit, id: `${projectId}:${unit.number}`, projectId,
          mortgagedTo: unit.status === 'mortgaged' ? unit.mortgagedTo : undefined,
          documentNo: unit.status === 'registered' ? unit.documentNo : undefined,
        };
        if (statusChanged && next.history.at(-1)?.to !== unit.status) {
          next = {
            ...next, sample: false, statusDate: unit.statusDate ?? toIsoDate(at),
            history: [...next.history, { from: old?.status ?? null, to: unit.status, at, by, ...(unit.statusNote && { note: unit.statusNote }) }],
          };
        }
        const units = old ? list.map((u) => (u.id === unit.id ? next : u)) : [...list, next];
        const type = getProjectType(s.projects.find((p) => p.id === projectId)?.typeId ?? '');
        saved = next;
        was = old;
        message = statusChanged ? describeStatusChange(type, [next.number], next.status) : undefined;
        return {
          ...s,
          units: { ...s.units, [projectId]: units },
          projects: statusChanged ? mapProject(s, projectId, (p) => withInventoryMeta(p, units)) : s.projects,
          activity: message
            ? log(s, { projectId, kind: 'status', unitNumbers: [next.number], to: next.status, message })
            : s.activity,
        };
      });
      write((db) => remote.saveUnit(db, projectId, saved, was, message));
    },

    replaceUnits(projectId, units) {
      const batchId = mintId('batch');
      const at = nowIso(), today = toIsoDate(at);
      let next: Unit[] = [], added: Unit[] = [], removed: Unit[] = [], message = '';
      set((s) => {
        const prevList = s.units[projectId] ?? EMPTY_UNITS;
        const project = s.projects.find((p) => p.id === projectId);
        const by = s.session.username || 'Admin';
        const known = new Set(prevList.map((u) => u.id));
        // New units start with one creation event stamped now (callers can't know the action time).
        next = units.map((u): Unit => {
          const id = `${projectId}:${u.number}`;
          return known.has(id)
            ? { ...u, id, projectId }
            : { ...u, id, projectId, statusDate: today, history: [{ from: null, to: u.status, at, by, batchId }] };
        });
        const kept = new Set(next.map((u) => u.id));
        added = next.filter((u) => !known.has(u.id));
        removed = prevList.filter((u) => !kept.has(u.id));
        remember(batchId, { kind: 'replace', projectId, prevProject: project, added: added.map((u) => u.number), removed });
        const type = getProjectType(project?.typeId ?? '');
        const count = (n: number) => `${n} ${(n === 1 ? type.unitNoun : type.unitNounPlural).toLowerCase()}`;
        message = [
          added.length ? `Added ${count(added.length)}` : '',
          removed.length ? `Removed ${count(removed.length)}: ${compressRanges(removed.map((u) => u.number))}` : '',
        ].filter(Boolean).join(' · ') || `No change to the ${type.unitNounPlural.toLowerCase()}`;
        return {
          ...s,
          units: { ...s.units, [projectId]: next },
          projects: mapProject(s, projectId, (p) => withInventoryMeta(p, next)),
          activity: log(s, { projectId, kind: 'project', batchId, message }),
        };
      });
      write((db) => remote.replaceUnits(db, projectId, added, removed, batchId, message));
      return batchId;
    },

    setSession(username) {
      set((s) => ({ ...s, session: { username: username.trim() || 'Admin' } }));
    },

    async signIn(email, password) {
      if (!BACKEND) {
        actions.setSession(email);
        return null;
      }
      const { data, error } = await db().auth.signInWithPassword({ email: email.trim(), password });
      if (error) return error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message;
      if (!isAdmin(data.user)) {
        await db().auth.signOut();
        return NOT_ADMIN;
      }
      snap = { ...snap, loadError: undefined };
      await loading; // a load started before sign-in saw no session: let it finish, then load for real
      await load();
      return snap.loadError ? `Signed in, but the data didn't load: ${snap.loadError}` : null;
    },

    async signOut() {
      if (!BACKEND) return true;
      await queue; // queued writes land first
      // This browser only: the admin's other devices stay signed in. SIGNED_OUT (hydrate) drops the data and stops
      // any load in flight; offline with an expired token auth-js can't end the session and keeps it.
      const { error } = await db().auth.signOut({ scope: 'local' });
      if (error && snap.signedIn) {
        notify(() => toast.error(`Couldn't sign out: ${remote.describeError(error)}. Check the connection and try again.`));
        return false;
      }
      undo.clear();
      snap = { state: EMPTY_STATE, hydrated: true, signedIn: false };
      emit();
      return true;
    },

    reload() {
      if (!BACKEND) return;
      snap = { ...snap, hydrated: false, loadError: undefined };
      emit();
      void load();
    },

    resetDemo() {
      clearTimeout(timer);
      timer = undefined;
      undo.clear();
      snap = { state: { ...SEED_STATE, session: snap.state.session }, hydrated: true, signedIn: true }; // keeps the signed-in name
      persist();
      emit();
    },
  };

  return {
    actions,
    flush,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    getSnapshot: () => snap,
    /** Writes still on their way to the database (Supabase mode). */
    pending: () => pending,
    /** Tab came back into view: pick up other admins' changes, unless writes are in flight or it just loaded. */
    refresh() {
      if (BACKEND && snap.signedIn && !pending && Date.now() - loadedAt > REFRESH_MIN_MS) void load();
    },
    /** Supabase mode: load the database. Demo: load persisted edits (the first client render must match the seed). */
    hydrate() {
      if (BACKEND) {
        if (started) return;
        started = true;
        // Another tab signed out, or the session ended: drop the data; the app gate sends us to /login.
        db().auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT') authGen++;
          if (event !== 'SIGNED_OUT' || !snap.signedIn) return;
          undo.clear();
          snap = { state: EMPTY_STATE, hydrated: true, signedIn: false };
          emit();
        });
        void load();
        return;
      }
      if (snap.hydrated) return;
      let state = snap.state, outdated = false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const saved = raw ? (JSON.parse(raw) as Partial<Persisted> & Partial<DemoState>) : null;
        if (saved?.v === SEED_VERSION && isState(saved.state)) state = saved.state;
        else if (saved) {
          // Saved on an older seed (v1 stored the bare state): start from the new seed, keep who is signed in.
          const username = saved.state?.session?.username ?? saved.session?.username;
          if (typeof username === 'string') state = { ...state, session: { username } };
          outdated = true;
        }
      } catch { /* corrupt or blocked storage: start from the seed */ }
      snap = { state, hydrated: true, signedIn: true };
      if (outdated) {
        persist(); // so the notice shows once
        notify(() => toast.info('Demo data was updated; earlier demo edits were reset.'));
      }
      emit();
    },
    /** Another tab saved: take its state as-is (no write back, so tabs never ping-pong). */
    adopt(raw: string | null) {
      if (BACKEND) return;
      try {
        const saved = raw ? (JSON.parse(raw) as Partial<Persisted>) : null;
        if (saved?.v !== SEED_VERSION || !isState(saved.state)) return;
        snap = { state: saved.state, hydrated: true, signedIn: true };
        emit();
      } catch { /* half-written or foreign value: ignore */ }
    },
  };
}

type DemoStore = ReturnType<typeof createDemoStore>;
interface DemoContextValue { state: DemoState; hydrated: boolean; signedIn: boolean; loadError?: string; actions: DemoActions }
const DemoContext = createContext<DemoStore | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState<DemoStore>(createDemoStore);
  useEffect(() => {
    store.hydrate();
    const flush = () => store.flush();
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) store.adopt(e.newValue); };
    const onVisible = () => { if (document.visibilityState === 'visible') store.refresh(); };
    // Closing the tab while a save is still on its way would lose it: ask first.
    const onBeforeUnload = (e: BeforeUnloadEvent) => { if (store.pending()) e.preventDefault(); };
    window.addEventListener('pagehide', flush);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('beforeunload', onBeforeUnload);
      flush();
    };
  }, [store]);
  return <DemoContext.Provider value={store}>{children}</DemoContext.Provider>;
}

/**
 * Each consumer subscribes itself (the context only carries the store): a Suspense boundary that hydrates after the
 * data arrived still renders the server snapshot during its own hydration, so it matches the server HTML, then updates.
 */
export function useDemo(): DemoContextValue {
  const store = useContext(DemoContext);
  if (!store) throw new Error('useDemo() must be used inside <DemoStoreProvider>.');
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
  return useMemo(
    () => ({ state: snap.state, hydrated: snap.hydrated, signedIn: snap.signedIn, loadError: snap.loadError, actions: store.actions }),
    [snap, store],
  );
}
export const useProjects = () => useDemo().state.projects;
export const useProject = (id: ID) => useDemo().state.projects.find((p) => p.id === id);
export const useUnits = (projectId: ID) => useDemo().state.units[projectId] ?? EMPTY_UNITS;
export const useActivity = () => useDemo().state.activity;
export const useSession = () => useDemo().state.session;
