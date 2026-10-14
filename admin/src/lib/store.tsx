'use client';
// Demo store (UI-only build). Seed → hydrate from localStorage once mounted (server snapshot = seed, so no hydration
// mismatch) → debounced writes. Ids and timestamps are minted only inside actions (event time), never in render.
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { toast } from 'sonner';
import { DEMO_NOW, getProjectType } from './constants';
import { slugify, toIsoDate, toIstIso } from './format';
import { describeStatusChange } from './inventory';
import { SEED, SEED_VERSION } from './mock';
import type { ActivityEvent, ID, Lifecycle, MortgagedTo, Project, PublishState, Unit, UnitStatus } from './types';

/** Holds `{ v: SEED_VERSION, state }`. Exported for the error page's "Reset demo data". */
export const STORAGE_KEY = 'gip-admin-demo:v1';
const WRITE_DELAY_MS = 300;
const MAX_ACTIVITY = 500; // ponytail: bounds localStorage size; older entries drop off
const MAX_UNDO = 20;

export interface DemoState {
  projects: Project[];
  units: Record<ID, Unit[]>;
  activity: ActivityEvent[];
  session: { username: string };
}
interface Snapshot { state: DemoState; hydrated: boolean }

const SEED_STATE: DemoState = { ...SEED, session: { username: 'Admin' } };
const SERVER_SNAPSHOT: Snapshot = { state: SEED_STATE, hydrated: false };
const getServerSnapshot = () => SERVER_SNAPSHOT;
const EMPTY_UNITS: Unit[] = [];

/* Called only from actions (event handlers). crypto.randomUUID needs a secure context, which a LAN demo may lack. */
const mintId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

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
  /** Generate / import. Returns a batchId usable with undoBatch. */
  replaceUnits(projectId: ID, units: Unit[]): string;
  setSession(username: string): void;
  resetDemo(): void;
}

type UndoRecord =
  | { kind: 'status'; projectId: ID; prev: Map<ID, Unit>; prevProject?: Project }
  | { kind: 'replace'; projectId: ID; prevList: Unit[]; prevProject?: Project };

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

/** Exported for the data self-check; the app uses <DemoStoreProvider>. */
export function createDemoStore() {
  let snap: Snapshot = SERVER_SNAPSHOT;
  const listeners = new Set<() => void>();
  const undo = new Map<string, UndoRecord>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let warned = false;

  const emit = () => listeners.forEach((l) => l());
  const persist = () => {
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
    snap = { state: next, hydrated: snap.hydrated };
    emit();
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
      const id = mintId('p');
      set((s) => {
        const sort = Math.max(0, ...s.projects.map((p) => p.publishing.sortOrder)) + 1;
        const project = blankProject(id, name.trim(), typeId, lifecycle, uniqueSlug(slugify(name), s.projects), sort, todayIso());
        return { ...s, projects: [...s.projects, project], activity: log(s, { projectId: id, kind: 'project', message: 'Created as draft' }) };
      });
      return id;
    },

    saveProject(project) {
      set((s) => ({
        ...s,
        projects: mapProject(s, project.id, () => ({ ...project, publishing: { ...project.publishing, updatedAt: todayIso() } })),
        activity: log(s, { projectId: project.id, kind: 'project', message: 'Edited project details' }),
      }));
    },

    duplicateProject(id) {
      const src = get().projects.find((p) => p.id === id);
      if (!src) return '';
      const newId = mintId('p');
      set((s) => {
        const name = `${src.name} (copy)`;
        const sort = Math.max(0, ...s.projects.map((p) => p.publishing.sortOrder)) + 1;
        const blank = blankProject(newId, name, src.typeId, src.lifecycle, uniqueSlug(slugify(name), s.projects), sort, todayIso());
        // Identity fields cleared (domain §4 #11): RERA/approvals, media, slug, live links, inventory.
        const copy: Project = {
          ...structuredClone(src), id: newId, name, displayName: undefined,
          media: blank.media, publishing: blank.publishing,
          legal: { ...structuredClone(src.legal), approvals: [], documents: src.legal.documents.map((d) => ({ ...d, id: mintId('doc'), file: undefined })) },
          inventoryUpdatedAt: undefined, statusSample: undefined, sample: undefined,
        };
        return { ...s, projects: [...s.projects, copy], activity: log(s, { projectId: newId, kind: 'project', message: `Duplicated from ${src.name}` }) };
      });
      return newId;
    },

    setPublishState(id, state) {
      set((s) => {
        const p = s.projects.find((x) => x.id === id);
        if (!p || p.publishing.state === state) return s;
        const message = state === 'published' ? 'Published' : state === 'archived' ? 'Archived' : 'Unpublished (moved to draft)';
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
    },

    archiveProject(id) { actions.setPublishState(id, 'archived'); },

    deleteProject(id) {
      set((s) => {
        const p = s.projects.find((x) => x.id === id);
        if (!p) return s;
        const units = { ...s.units };
        delete units[id];
        return { ...s, projects: s.projects.filter((x) => x.id !== id), units, activity: log(s, { projectId: id, kind: 'project', message: `Deleted ${p.name}` }) };
      });
    },

    setUnitStatuses(projectId, unitIds, to, opts = {}) {
      const batchId = mintId('batch');
      const at = nowIso(), today = toIsoDate(at);
      const note = opts.note?.trim() || undefined;
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
            history: [...u.history, { from: u.status, to, at, by, ...(note && { note }), batchId }],
          };
        });
        if (!prev.size) return s;
        const project = s.projects.find((p) => p.id === projectId);
        remember(batchId, { kind: 'status', projectId, prev, prevProject: project });
        const numbers = next.filter((u) => prev.has(u.id)).map((u) => u.number);
        return {
          ...s,
          units: { ...s.units, [projectId]: next },
          projects: mapProject(s, projectId, (p) => withInventoryMeta(p, next)),
          activity: log(s, {
            projectId, kind: 'status', batchId, unitNumbers: numbers, to,
            message: describeStatusChange(getProjectType(project?.typeId ?? ''), numbers, to) + (note ? ` · ${note}` : ''),
          }),
        };
      });
      return batchId;
    },

    undoBatch(batchId) {
      const rec = undo.get(batchId);
      if (!rec) return false;
      undo.delete(batchId);
      set((s) => {
        const list = s.units[rec.projectId] ?? EMPTY_UNITS;
        // Status undo touches only units still sitting on this batch, so later edits survive.
        const next = rec.kind === 'replace' ? rec.prevList
          : list.map((u) => { const p = rec.prev.get(u.id); return p && u.history.at(-1)?.batchId === batchId ? p : u; });
        const meta = rec.prevProject;
        return {
          ...s,
          units: { ...s.units, [rec.projectId]: next },
          projects: mapProject(s, rec.projectId, (p) => ({ ...p, inventoryUpdatedAt: meta?.inventoryUpdatedAt, statusSample: meta?.statusSample })),
          activity: s.activity.filter((a) => a.batchId !== batchId),
        };
      });
      return true;
    },

    saveUnit(projectId, unit) {
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
        return {
          ...s,
          units: { ...s.units, [projectId]: units },
          projects: statusChanged ? mapProject(s, projectId, (p) => withInventoryMeta(p, units)) : s.projects,
          activity: statusChanged
            ? log(s, { projectId, kind: 'status', unitNumbers: [next.number], to: next.status, message: describeStatusChange(type, [next.number], next.status) })
            : s.activity,
        };
      });
    },

    replaceUnits(projectId, units) {
      const batchId = mintId('batch');
      const at = nowIso(), today = toIsoDate(at);
      set((s) => {
        const prevList = s.units[projectId] ?? EMPTY_UNITS;
        const project = s.projects.find((p) => p.id === projectId);
        const by = s.session.username || 'Admin';
        const known = new Set(prevList.map((u) => u.id));
        // New units start with one creation event stamped now (callers can't know the action time).
        const next = units.map((u): Unit => {
          const id = `${projectId}:${u.number}`;
          return known.has(id)
            ? { ...u, id, projectId }
            : { ...u, id, projectId, statusDate: today, history: [{ from: null, to: u.status, at, by, batchId }] };
        });
        remember(batchId, { kind: 'replace', projectId, prevList, prevProject: project });
        const noun = getProjectType(project?.typeId ?? '').unitNounPlural.toLowerCase();
        return {
          ...s,
          units: { ...s.units, [projectId]: next },
          projects: mapProject(s, projectId, (p) => withInventoryMeta(p, next)),
          activity: log(s, {
            projectId, kind: 'project', batchId,
            message: prevList.length ? `Replaced inventory with ${next.length} ${noun}` : `Added ${next.length} ${noun}`,
          }),
        };
      });
      return batchId;
    },

    setSession(username) {
      set((s) => ({ ...s, session: { username: username.trim() || 'Admin' } }));
    },

    resetDemo() {
      clearTimeout(timer);
      timer = undefined;
      undo.clear();
      snap = { state: { ...SEED_STATE, session: snap.state.session }, hydrated: true }; // keeps the signed-in name
      persist();
      emit();
    },
  };

  return {
    actions,
    flush,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    getSnapshot: () => snap,
    /** Load persisted edits once, after mount (the first client render must match the server's seed). */
    hydrate() {
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
      snap = { state, hydrated: true };
      if (outdated) {
        persist(); // so the notice shows once
        notify(() => toast.info('Demo data was updated; earlier demo edits were reset.'));
      }
      emit();
    },
    /** Another tab saved: take its state as-is (no write back, so tabs never ping-pong). */
    adopt(raw: string | null) {
      try {
        const saved = raw ? (JSON.parse(raw) as Partial<Persisted>) : null;
        if (saved?.v !== SEED_VERSION || !isState(saved.state)) return;
        snap = { state: saved.state, hydrated: true };
        emit();
      } catch { /* half-written or foreign value: ignore */ }
    },
  };
}

type DemoStore = ReturnType<typeof createDemoStore>;
interface DemoContextValue { state: DemoState; hydrated: boolean; actions: DemoActions }
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState<DemoStore>(createDemoStore);
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
  useEffect(() => {
    store.hydrate();
    const flush = () => store.flush();
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) store.adopt(e.newValue); };
    window.addEventListener('pagehide', flush);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('storage', onStorage);
      flush();
    };
  }, [store]);
  const value = useMemo(() => ({ state: snap.state, hydrated: snap.hydrated, actions: store.actions }), [snap, store]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const v = useContext(DemoContext);
  if (!v) throw new Error('useDemo() must be used inside <DemoStoreProvider>.');
  return v;
}
export const useProjects = () => useDemo().state.projects;
export const useProject = (id: ID) => useDemo().state.projects.find((p) => p.id === id);
export const useUnits = (projectId: ID) => useDemo().state.units[projectId] ?? EMPTY_UNITS;
export const useActivity = () => useDemo().state.activity;
export const useSession = () => useDemo().state.session;
