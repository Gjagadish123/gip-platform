"use client";
// Keeps /layouts in step with the admin. The database broadcasts every status change of a published project on the
// private "live-layouts" channel (supabase/migrations: live layouts; pages may listen, nobody may send); the page
// patches the plot at once, then re-reads from the REST API (RLS decides what is public) whenever it may have missed
// something: on (re)connect, when the browser comes back online, when the tab returns after a while, and every 30 s
// while the socket is down or a re-read failed. Without a backend (the static preview) nothing is fetched.
// supabase-js loads after the page has painted (the server already sent the first data), so it stays off the
// critical path.
import { useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";

import { UNIT_STATUSES } from "@/lib/constants";
import { isLiveLayout, LIVE_LAYOUT_IDS, type LiveProject, type LiveUnit } from "@/lib/layouts";
import type { UnitStatus } from "@/lib/types";

export type Connection = "static" | "connecting" | "live" | "offline";
export interface Change { project: string; numbers: string[]; to: UnitStatus | null; at: number }

// The same test as lib/supabase (inlined at build time), without importing the client up front.
const BACKEND = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const db = () => import("@/lib/supabase").then((m) => m.supabase());

const UNIT_COLS = "number, status, status_date, sample, area, width_ft, depth_ft, facing, facing2, road_width_ft, road_width2_ft, corner";
const STALE_MS = 60_000; // a tab back after longer than this re-reads everything (the server copy is a minute old too)

interface UnitRow {
  number: string; status: UnitStatus; status_date: string | null; sample: boolean; area: number;
  width_ft: number | null; depth_ft: number | null; facing: LiveUnit["f"] | null; facing2: LiveUnit["f"] | null;
  road_width_ft: number | null; road_width2_ft: number | null; corner: boolean | null;
}

const byNumber = new Intl.Collator("en", { numeric: true }).compare;

function rowToLive(r: UnitRow): LiveUnit {
  return {
    n: r.number, s: r.status, a: Number(r.area),
    ...(r.width_ft && r.depth_ft && { w: Number(r.width_ft), d: Number(r.depth_ft) }),
    ...(r.facing && { f: r.facing }), ...(r.facing2 && { f2: r.facing2 }),
    ...(r.road_width_ft && { rw: Number(r.road_width_ft) }), ...(r.road_width2_ft && { rw2: Number(r.road_width2_ft) }),
    ...(r.corner && { c: true as const }), ...(r.status_date && { dt: r.status_date }), ...(r.sample && { x: true as const }),
  };
}

/** Same plots, same public facts: an identical re-read keeps the old array, so nothing re-renders. */
const UNIT_KEYS = ["n", "s", "a", "w", "d", "f", "f2", "rw", "rw2", "c", "dt", "x"] as const satisfies readonly (keyof LiveUnit)[];
const sameUnits = (a: LiveUnit[] | undefined, b: LiveUnit[]) => a?.length === b.length && b.every((u, i) => UNIT_KEYS.every((k) => a[i][k] === u[k]));

// The browser's own idea of the connection, read where it is needed (a page shown again after a client navigation
// must not keep a stale flag).
const onConnectivity = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

async function fetchUnits(projectId: string): Promise<LiveUnit[]> {
  const { data, error } = await (await db()).from("units").select(UNIT_COLS).eq("project_id", projectId);
  if (error) throw error;
  return (data as unknown as UnitRow[]).map(rowToLive).sort((a, b) => byNumber(a.n, b.n));
}

/** id -> the live fields of a project that is still published; ids missing from the answer were unpublished. */
async function fetchProjects() {
  const { data, error } = await (await db())
    .from("projects")
    .select("id, lifecycle, inventory_updated_at, status_sample")
    .in("id", [...LIVE_LAYOUT_IDS]);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.id as string, p as { lifecycle: LiveProject["lifecycle"]; inventory_updated_at: string | null; status_sample: boolean }]));
}

/**
 * `onNewProject`: a project was published that this page has no details of (it was a draft when the page loaded):
 * the caller refreshes the page data. It is called again about once a minute until that data lists the project.
 */
export function useLiveLayouts(initialProjects: LiveProject[], initialUnits: Record<string, LiveUnit[]>, active: string, onNewProject?: () => void) {
  const [projects, setProjects] = useState(initialProjects);
  const [units, setUnits] = useState(initialUnits);
  const [conn, setConn] = useState<Connection>(BACKEND ? "connecting" : "static");
  const online = useSyncExternalStore(onConnectivity, () => navigator.onLine, () => true);
  const [linkTry, setLinkTry] = useState(0); // the realtime client didn't load: another go later
  const [awaited, setAwaited] = useState<string | null>(null); // published after the page loaded, not in its data yet
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChange, setLastChange] = useState<Change | null>(null);
  // Reads are numbered: only the newest read of a project may set its plots (and of the list, the list), so an older
  // answer that lands late cannot undo a newer one or a live change.
  const seq = useRef(0);
  const reading = useRef(new Map<string, number>()); // project -> newest read of its plots still in flight
  const listFrom = useRef(0); // reads numbered up to this may not set the project list
  const failed = useRef(new Set<string>()); // projects whose newest read failed: the error and its poll stay until each is re-read
  const caughtUp = useRef(false); // the first catch-up on connect skips the project the mount read just fetched
  const hiddenAt = useRef(0);

  // Re-read these projects' plots (one request each: a single .in() query would hit PostgREST's 1000-row cap
  // without an error) and which projects are still published; state is set when the answers arrive.
  const refresh = useCallback((ids: readonly string[]) => {
    if (!BACKEND || !ids.length) return;
    const id = ++seq.current;
    for (const p of ids) reading.current.set(p, id);
    Promise.all([fetchProjects(), Promise.all(ids.map((p) => fetchUnits(p)))]).then(
      ([list, rows]) => {
        if (id > listFrom.current) {
          listFrom.current = id;
          // From the page's own catalog, so a project published again comes back. (One that was a draft when the page
          // loaded needs fresh page data: onNewProject.)
          setProjects((cur) => {
            const next = initialProjects
              .filter((p) => list.has(p.id))
              .map((p) => {
                const live = list.get(p.id)!;
                return { ...p, lifecycle: live.lifecycle, statusSample: live.status_sample, inventoryUpdatedAt: live.inventory_updated_at ?? p.inventoryUpdatedAt };
              });
            const same = next.length === cur.length && next.every((p, i) => p.id === cur[i].id && p.lifecycle === cur[i].lifecycle && p.statusSample === cur[i].statusSample && p.inventoryUpdatedAt === cur[i].inventoryUpdatedAt);
            return same ? cur : next;
          });
        }
        const fresh = ids.flatMap((p, i) => (reading.current.get(p) === id ? [[p, rows[i]] as const] : []));
        for (const [p] of fresh) {
          reading.current.delete(p);
          failed.current.delete(p);
        }
        if (fresh.length) {
          setUnits((u) => {
            const changed = fresh.filter(([p, r]) => !sameUnits(u[p], r));
            return changed.length ? { ...u, ...Object.fromEntries(changed) } : u;
          });
        }
        setSyncedAt(Date.now());
        if (!failed.current.size) setError(null);
      },
      () => {
        for (const p of ids) {
          if (reading.current.get(p) !== id) continue; // a newer read of it decides
          reading.current.delete(p);
          failed.current.add(p);
        }
        if (failed.current.size) setError("Couldn't refresh availability. Retrying shortly.");
      },
    );
  }, [initialProjects]);

  // Opening a project reads it fresh (the server copy can be a minute old). Catching up reads every listed project,
  // since the switcher shows all their counts; from the catalog, as a project just published again is not back in
  // `projects` yet.
  useEffect(() => refresh([active]), [active, refresh]);
  const catchUp = useEffectEvent((skipActive = false) =>
    refresh([...new Set([...initialProjects.map((p) => p.id), ...failed.current])].filter((p) => !(skipActive && p === active))),
  );
  const newProject = useEffectEvent(() => onNewProject?.());

  useEffect(() => {
    if (!BACKEND) return;
    let gone = false;
    let cleanup = () => {};
    db().then((client) => {
      if (gone) return;
      const channel = client
        .channel("live-layouts", { config: { private: true } })
        .on("broadcast", { event: "units" }, ({ payload }) => {
          const p = payload as { project_id?: string; units?: { number: string; status: UnitStatus; from?: UnitStatus; status_date: string | null; sample: boolean }[] };
          // Only well-formed changes to a listed project (nobody but the database can send, this is the second line).
          const pid = p?.project_id;
          if (!pid || !isLiveLayout(pid) || !Array.isArray(p.units)) return;
          const valid = p.units.filter((x) => typeof x?.number === "string" && UNIT_STATUSES.includes(x.status));
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
                const next: LiveUnit = { ...u, s: c.status };
                if (c.status_date) next.dt = c.status_date; else delete next.dt;
                if (c.sample) next.x = true; else delete next.x;
                return next;
              }),
            };
          });
          // Only plots whose status moved are announced (a corrected date or sample flag is patched quietly).
          const moved = valid.filter((x) => x.from !== x.status);
          const tos = new Set(moved.map((x) => x.status));
          if (moved.length) setLastChange({ project: pid, numbers: moved.map((x) => x.number).sort(byNumber), to: tos.size === 1 ? [...tos][0] : null, at: Date.now() });
          setSyncedAt(Date.now());
          // A read of this project still in flight may have been answered before this change: read it again.
          if (reading.current.has(pid)) refresh([pid]);
        })
        // Plots added or removed (inventory regenerated): re-read that project.
        .on("broadcast", { event: "units_reset" }, ({ payload }) => {
          const id = (payload as { project_id?: string })?.project_id;
          if (id && isLiveLayout(id)) refresh([id]);
        })
        .on("broadcast", { event: "project" }, ({ payload }) => {
          const p = payload as { id?: string; published: boolean; lifecycle: LiveProject["lifecycle"] };
          if (!p?.id || !isLiveLayout(p.id)) return;
          if (p.published && !initialProjects.some((x) => x.id === p.id)) {
            setAwaited(p.id);
            return newProject();
          }
          if (!p.published) {
            setAwaited((a) => (a === p.id ? null : a));
            setProjects((ps) => ps.filter((x) => x.id !== p.id));
          } else setProjects((ps) => ps.map((x) => (x.id === p.id ? { ...x, lifecycle: p.lifecycle } : x)));
          listFrom.current = seq.current; // project lists already in flight predate this change
          catchUp();
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConn("live");
            catchUp(!caughtUp.current); // anything missed while connecting (the open project was just read)
            caughtUp.current = true;
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConn("offline");
          }
        });
      cleanup = () => void client.removeChannel(channel);
    }, () => {
      if (gone) return;
      setConn("offline"); // the reads poll meanwhile (they need the same client, so they fail and retry too)
      const t = window.setTimeout(() => setLinkTry((n) => n + 1), 30_000);
      cleanup = () => window.clearTimeout(t);
    });
    return () => {
      gone = true;
      cleanup();
    };
  }, [refresh, initialProjects, linkTry]);

  // A project published while the page is open: the server's copy of the page data is cached for a minute and then
  // served stale once while it renews, so refresh until it lists the project.
  useEffect(() => {
    if (!awaited || initialProjects.some((p) => p.id === awaited)) return;
    const t = window.setInterval(() => newProject(), 65_000);
    return () => window.clearInterval(t);
  }, [awaited, initialProjects]);

  // Back online: catch up straight away (`online` above shows the drop at once).
  useEffect(() => {
    if (!BACKEND) return;
    const up = () => catchUp();
    window.addEventListener("online", up);
    return () => window.removeEventListener("online", up);
  }, []);

  // Socket down, or the last re-read failed: poll. Tab back in view after a while (or while not live): catch up.
  useEffect(() => {
    if (!BACKEND) return;
    const onVisible = () => {
      if (document.visibilityState === "hidden") hiddenAt.current = Date.now();
      else if (conn !== "live" || Date.now() - hiddenAt.current > STALE_MS) catchUp();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = conn === "offline" || error ? window.setInterval(() => catchUp(), 30_000) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [conn, error]);

  return { projects, units, conn: online ? conn : conn === "static" ? conn : ("offline" as const), syncedAt, error, lastChange };
}
