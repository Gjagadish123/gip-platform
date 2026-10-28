// Live data. Reads the published projects and their units from Supabase (RLS decides what is public), then follows
// the admin in real time: the database broadcasts every status change of a published project on the private
// Realtime channel "live-layouts" (supabase/migrations/20261027120000_live_layouts.sql: pages may listen, nobody may
// send). A change is patched at once; everything is re-read whenever something may have been missed: on (re)connect,
// when the browser comes back online, when the tab returns after a minute, and every 30 s while the socket is down or
// a read failed. Port of the website's use-live.ts.

import { useCallback, useEffect, useRef, useState } from 'react';
import { PROJECT_IDS, isProjectId } from './projects.js';
import { byNumber, isStatus } from './plots.js';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const BACKEND = Boolean(URL_ && KEY);

// ponytail: public reads only, so no session, no token refresh. Every request gives up after 10 s, so a hung backend
// shows as an error, not a hang. supabase-js is its own chunk, loaded after first paint.
let client = null;
const db = () =>
  (client ??= import('@supabase/supabase-js')
    .then(({ createClient }) =>
      createClient(URL_, KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(10_000) }) },
      })
    )
    .catch((e) => {
      client = null; // try the chunk again next time
      throw e;
    }));

const PROJECT_COLS = 'id, slug, name, type_id, lifecycle, publish_state, sort_order, public_content, inventory_updated_at, status_sample, sample, published_at, updated_at';
const UNIT_COLS = 'number, block, area, width_ft, depth_ft, facing, facing2, road_width_ft, road_width2_ft, corner, status, status_date, sample';
const STATUS_COLS = 'number, status, status_date, sample'; // the other projects: enough for the switcher's counts
const STALE_MS = 60_000;

const num = (v) => (v == null ? undefined : Number(v));
function rowToUnit(r) {
  const u = { n: String(r.number), s: r.status };
  if (r.area != null) u.a = Number(r.area);
  if (r.width_ft && r.depth_ft) Object.assign(u, { w: num(r.width_ft), d: num(r.depth_ft) });
  if (r.facing) u.f = r.facing;
  if (r.facing2) u.f2 = r.facing2;
  if (r.road_width_ft) u.rw = num(r.road_width_ft);
  if (r.road_width2_ft) u.rw2 = num(r.road_width2_ft);
  if (r.corner) u.c = true;
  if (r.block) u.block = r.block;
  if (r.status_date) u.dt = r.status_date;
  if (r.sample) u.x = true;
  return u;
}
const KEYS = ['n', 's', 'a', 'w', 'd', 'f', 'f2', 'rw', 'rw2', 'c', 'block', 'dt', 'x'];
const sameUnits = (a, b) => a?.length === b.length && b.every((u, i) => KEYS.every((k) => a[i][k] === u[k]));

async function fetchUnits(id, full) {
  const { data, error } = await (await db()).from('units').select(full ? UNIT_COLS : STATUS_COLS).eq('project_id', id);
  if (error) throw error;
  return data.map(rowToUnit).sort((a, b) => byNumber(a.n, b.n));
}
async function fetchProjects() {
  const { data, error } = await (await db()).from('projects').select(PROJECT_COLS).eq('publish_state', 'published').in('id', PROJECT_IDS);
  if (error) throw error;
  return data
    .map((p) => ({ ...p, content: p.public_content && typeof p.public_content === 'object' ? p.public_content : {} }))
    .sort((a, b) => a.sort_order - b.sort_order || PROJECT_IDS.indexOf(a.id) - PROJECT_IDS.indexOf(b.id));
}

/**
 * projects: null until the first read; then the published ones in sort_order.
 * units: project id -> rows {n, s, a?, w?, d?, f?, f2?, rw?, rw2?, c?, dt?, x?} (the open project has every column).
 * conn: 'none' (no Supabase env) | 'connecting' | 'live' | 'offline'. loadFailed: the first read failed.
 */
export function useLive(active) {
  const [projects, setProjects] = useState(null);
  const [units, setUnits] = useState({});
  const [conn, setConn] = useState(BACKEND ? 'connecting' : 'none');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [syncedAt, setSyncedAt] = useState(null);
  const [error, setError] = useState(null);
  const [loadFailed, setLoadFailed] = useState(!BACKEND);
  const [lastChange, setLastChange] = useState(null);
  const [linkTry, setLinkTry] = useState(0);
  // Reads are numbered: only the newest read of a project may set its plots (and of the list, the list), so an older
  // answer that lands late cannot undo a newer one or a live change.
  const seq = useRef(0);
  const reading = useRef(new Map());
  const listFrom = useRef(0);
  const failed = useRef(new Set());
  const loaded = useRef(false);
  const hiddenAt = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  const refresh = useCallback((ids) => {
    if (!BACKEND || !ids.length) return;
    const id = ++seq.current;
    const fullFor = new Set(ids.filter((p) => p === activeRef.current));
    for (const p of ids) reading.current.set(p, id);
    Promise.all([fetchProjects(), Promise.all(ids.map((p) => fetchUnits(p, fullFor.has(p))))]).then(
      ([list, rows]) => {
        loaded.current = true;
        setLoadFailed(false);
        if (id > listFrom.current) {
          listFrom.current = id;
          setProjects((cur) => (cur && cur.length === list.length && cur.every((p, i) => p.id === list[i].id && p.updated_at === list[i].updated_at && p.lifecycle === list[i].lifecycle && p.inventory_updated_at === list[i].inventory_updated_at && p.status_sample === list[i].status_sample) ? cur : list));
        }
        const fresh = ids.flatMap((p, i) => (reading.current.get(p) === id ? [[p, rows[i], fullFor.has(p)]] : []));
        for (const [p] of fresh) {
          reading.current.delete(p);
          failed.current.delete(p);
        }
        if (fresh.length) {
          setUnits((u) => {
            let next = u;
            for (const [p, r, full] of fresh) {
              // a status-only read keeps the plot facts an earlier full read brought
              const prev = new Map((u[p] || []).map((x) => [x.n, x]));
              const merged = full ? r : r.map((x) => (prev.has(x.n) ? { ...prev.get(x.n), s: x.s, dt: x.dt, x: x.x } : x));
              if (!sameUnits(u[p], merged)) next = { ...next, [p]: merged };
            }
            return next;
          });
        }
        setSyncedAt(Date.now());
        if (!failed.current.size) setError(null);
      },
      () => {
        for (const p of ids) {
          if (reading.current.get(p) !== id) continue;
          reading.current.delete(p);
          failed.current.add(p);
        }
        if (!loaded.current) setLoadFailed(true);
        if (failed.current.size) setError("Couldn't refresh availability. Retrying shortly.");
      }
    );
  }, []);

  // Every project's statuses (the switcher shows all counts), the open one in full.
  const catchUp = useCallback(() => refresh([...PROJECT_IDS]), [refresh]);
  useEffect(() => catchUp(), [catchUp]);
  // Opening another project reads it in full.
  const firstActive = useRef(true);
  useEffect(() => {
    if (firstActive.current) {
      firstActive.current = false;
      return;
    }
    if (active) refresh([active]);
  }, [active, refresh]);

  useEffect(() => {
    if (!BACKEND) return;
    let gone = false;
    let cleanup = () => {};
    db().then(
      (sb) => {
        if (gone) return;
        const channel = sb
          .channel('live-layouts', { config: { private: true } })
          .on('broadcast', { event: 'units' }, ({ payload }) => {
            // Only well-formed changes to one of our projects (nobody but the database can send; this is the second line).
            const pid = payload?.project_id;
            if (!isProjectId(pid) || !Array.isArray(payload.units)) return;
            const valid = payload.units
              .filter((x) => x && (typeof x.number === 'string' || typeof x.number === 'number') && isStatus(x.status))
              .map((x) => ({ number: String(x.number), status: x.status, from: isStatus(x.from) ? x.from : null, date: typeof x.status_date === 'string' ? x.status_date : null, sample: x.sample === true }));
            if (!valid.length) return;
            const changed = new Map(valid.map((x) => [x.number, x]));
            setUnits((all) => {
              const list = all[pid];
              if (!list) return all;
              return {
                ...all,
                [pid]: list.map((u) => {
                  const c = changed.get(u.n);
                  if (!c) return u;
                  const next = { ...u, s: c.status };
                  if (c.date) next.dt = c.date;
                  else delete next.dt;
                  if (c.sample) next.x = true;
                  else delete next.x;
                  return next;
                }),
              };
            });
            // Only plots whose status moved are announced (a corrected date or sample flag is patched quietly).
            const moved = valid.filter((x) => x.from !== x.status);
            const tos = new Set(moved.map((x) => x.status));
            if (moved.length) setLastChange({ project: pid, numbers: moved.map((x) => x.number).sort(byNumber), to: tos.size === 1 ? [...tos][0] : null, at: Date.now() });
            setSyncedAt(Date.now());
            if (reading.current.has(pid)) refresh([pid]); // a read in flight may predate this change
          })
          .on('broadcast', { event: 'units_reset' }, ({ payload }) => {
            if (isProjectId(payload?.project_id)) refresh([payload.project_id]);
          })
          .on('broadcast', { event: 'project' }, ({ payload }) => {
            if (!isProjectId(payload?.id) || typeof payload.published !== 'boolean') return;
            if (!payload.published) setProjects((ps) => ps && ps.filter((x) => x.id !== payload.id));
            listFrom.current = seq.current; // lists already in flight predate this change
            catchUp();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setConn('live');
              catchUp(); // anything missed while connecting
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setConn('offline');
          });
        if (import.meta.env.DEV) window.__liveChannel = channel; // dev-only: lets a test replay a broadcast locally
        cleanup = () => void sb.removeChannel(channel);
      },
      () => {
        if (gone) return;
        setConn('offline');
        const t = window.setTimeout(() => setLinkTry((n) => n + 1), 30_000);
        cleanup = () => window.clearTimeout(t);
      }
    );
    return () => {
      gone = true;
      cleanup();
    };
  }, [refresh, catchUp, linkTry]);

  useEffect(() => {
    if (!BACKEND) return;
    const up = () => {
      setOnline(true);
      catchUp();
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, [catchUp]);

  // Socket down, or the last read failed: poll every 30 s. Tab back after a minute (or while not live): catch up.
  useEffect(() => {
    if (!BACKEND) return;
    const onVisible = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else if (conn !== 'live' || Date.now() - hiddenAt.current > STALE_MS) catchUp();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = conn === 'offline' || error || loadFailed ? window.setInterval(catchUp, 30_000) : undefined;
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [conn, error, loadFailed, catchUp]);

  return {
    projects,
    units,
    conn: conn === 'none' ? conn : online ? conn : 'offline',
    online,
    syncedAt,
    error,
    loadFailed,
    lastChange,
    retry: catchUp,
  };
}
