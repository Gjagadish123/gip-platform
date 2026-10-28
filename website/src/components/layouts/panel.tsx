"use client";

import { ArrowUpRight, Car, CircleAlert, ExternalLink, FileText, MapPin, Route, Search, X } from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { WhatsAppIcon } from "@/components/site/icons";
import { Arrow, Button } from "@/components/ui/button";
import { UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";
import { formatDate, formatNumber, percents } from "@/lib/format";
import type { LayoutPlan, LiveProject, LiveUnit, StatusCounts } from "@/lib/layouts";
import type { Facing, UnitStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CATEGORIES, CATEGORY, formatKm, type CategoryId, type Drive, type Landmark } from "./nearby";
import { STATUS_COLOR, statusSwatch } from "./plan";
import type { Connection } from "./use-live";

/* ---------- small parts ---------- */

export function StatusDot({ s, className }: { s: UnitStatus; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-[3px]", className)} style={statusSwatch(s)} />;
}

export function LiveBadge({ conn, syncedAt }: { conn: Connection; syncedAt: number | null }) {
  const label =
    conn === "live" ? "Live" : conn === "connecting" ? "Connecting…" : conn === "offline" ? (typeof navigator !== "undefined" && !navigator.onLine ? "Offline" : "Reconnecting…") : "Preview data";
  const time = syncedAt ? new Date(syncedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) : null;
  // Announced on a change of connection only (never the ticking time): paused, then back.
  const [seen, setSeen] = useState(conn);
  const [said, setSaid] = useState("");
  if (conn !== seen) {
    setSeen(conn);
    if (conn === "offline") setSaid(`Live updates paused.${time ? ` Showing availability from ${time}.` : ""} Reconnecting.`);
    else if (conn === "live" && seen === "offline") setSaid("Live updates are back on.");
  }
  return (
    <p className="inline-flex items-center gap-2 text-label text-text" title={time ? `Last synced ${time}` : undefined}>
      <span className="relative flex size-2.5" aria-hidden>
        {/* Three pings each time it goes live (it remounts after a drop), then a still dot. */}
        {conn === "live" ? <span className="absolute inset-0 rounded-full bg-teal opacity-60 motion-safe:animate-[ping_1s_cubic-bezier(0,0,0.2,1)_3]" /> : null}
        <span className={cn("relative size-2.5 rounded-full", conn === "live" ? "bg-teal" : conn === "offline" ? "bg-status-mortgaged" : "bg-line-strong")} />
      </span>
      {label}
      {time && conn !== "static" ? (
        <span className="font-normal text-muted tabular-nums">· {conn === "live" ? "synced" : "data from"} {time}</span>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
    </p>
  );
}

/* ---------- project switcher ---------- */

export interface SwitcherItem { project: LiveProject; outline: LayoutPlan["outline"]; available: number; total: number; pending: boolean }

/**
 * The four layouts as tiles on a mist track (GIP's segmented control): each carries the site outline drawn from its
 * approved layout, the place and the plots open today. Arrow keys move between tiles (tablist, automatic activation).
 */
export function ProjectSwitcher({ items, active, onChange, panelId }: { items: SwitcherItem[]; active: string; onChange: (id: string) => void; panelId: string }) {
  const uid = useId();
  const ids: string[] = items.map((i) => i.project.id);
  const idOf = (id: string) => `${uid}-${id}`;
  // Phones: the tiles are a sideways strip, so bring the open project into view (on load from a shared link too).
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !tab) return;
    const l = list.getBoundingClientRect(), t = tab.getBoundingClientRect();
    if (t.left < l.left || t.right > l.right) {
      list.scrollBy({ left: t.left - l.left - 20, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [active]);
  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Projects"
      className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-lg lg:bg-mist lg:p-1.5 [&::-webkit-scrollbar]:hidden"
    >
      {items.map(({ project: p, outline, available, total, pending }) => {
        const on = p.id === active;
        return (
          <button
            key={p.id}
            id={idOf(p.id)}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(p.id)}
            onKeyDown={(e) => {
              const i = ids.indexOf(active);
              const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? ids[(i + 1) % ids.length]
                : e.key === "ArrowLeft" || e.key === "ArrowUp" ? ids[(i - 1 + ids.length) % ids.length]
                : e.key === "Home" ? ids[0] : e.key === "End" ? ids[ids.length - 1] : null;
              if (!next) return;
              e.preventDefault();
              onChange(next);
              document.getElementById(idOf(next))?.focus();
            }}
            className={cn(
              // Short laptop screens (≤820 px tall): compact rows, so the panel below keeps room for the list.
              "group relative flex w-[16.5rem] shrink-0 snap-start items-center gap-3 rounded-md border px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow] duration-300 ease-(--ease-out) lg:w-auto lg:[@media(max-height:820px)]:py-1.5",
              on ? "border-white bg-white shadow-raise" : "border-line bg-white/70 hover:bg-white lg:border-transparent lg:bg-transparent",
            )}
          >
            {on ? <span aria-hidden className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-teal-deep lg:inset-x-auto lg:inset-y-2.5 lg:left-0 lg:h-auto lg:w-0.5" /> : null}
            <span aria-hidden className={cn("grid size-11 shrink-0 place-items-center rounded-sm transition-colors lg:[@media(max-height:820px)]:hidden", on ? "bg-teal-soft" : "bg-mist lg:bg-white")}>
              {outline ? (
                <svg viewBox={`-6 -6 ${outline.w + 12} ${outline.h + 12}`} className="size-9">
                  <path d={outline.d} className={cn("transition-colors", on ? "fill-teal/35 stroke-teal-deep" : "fill-navy/10 stroke-navy/55")} strokeWidth={4} strokeLinejoin="round" />
                </svg>
              ) : (
                <MapPin className={cn("size-5", on ? "text-teal-deep" : "text-navy/55")} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-ui font-semibold text-navy lg:line-clamp-1">{p.name}</span>
              <span className="block truncate text-small text-muted lg:[@media(max-height:820px)]:hidden">
                {p.place.split(",")[0]}
                {pending ? " · drawing pending" : ""}
              </span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="block text-ui font-semibold text-go">{available}</span>
              <span className="block text-label font-normal text-muted">
                of {total}
                <span className="sr-only"> plots available</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- project facts ---------- */

export function ProjectFacts({ project }: { project: LiveProject }) {
  const hmda = project.approvals.find((a) => a.authority === "HMDA" || a.authority === "DTCP");
  const rera = project.approvals.find((a) => a.authority === "RERA");
  // The server fills the drawing's approval number and land area in (lib/projects.ts), so these never change on load.
  const rows: [string, ReactNode][] = [
    ["Location", project.place],
    ...(hmda ? [[`${hmda.authority} layout`, hmda.reference ?? "Approved"] as [string, ReactNode]] : []),
    ...(rera?.reference ? [["TS RERA", rera.reference] as [string, ReactNode]] : []),
    ["Extent", project.landArea ?? "—"],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-h3">{project.name}</h2>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-line px-2 text-label text-navy">
          <span aria-hidden className={cn("size-1.5 rounded-full", project.lifecycle === "ongoing" ? "bg-go" : "bg-navy/50")} />
          {project.lifecycle === "ongoing" ? "Selling now" : project.lifecycle === "upcoming" ? "Upcoming" : "Completed"}
        </span>
      </div>
      <dl className="mt-4 border-t border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-4 border-b border-line py-2.5">
            <dt className="w-28 shrink-0 text-small text-muted">{k}</dt>
            <dd className="min-w-0 text-ui font-medium text-navy wrap-anywhere">{v}</dd>
          </div>
        ))}
      </dl>
      {project.detailHref || project.brochure ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.detailHref ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={project.detailHref}>
                Project details
                <Arrow />
              </Link>
            </Button>
          ) : null}
          {project.brochure ? (
            <Button asChild variant="ghost" size="sm">
              <a href={project.brochure} target="_blank" rel="noreferrer">
                <FileText aria-hidden />
                Brochure
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- availability ---------- */

export function Availability({
  counts,
  total,
  asOf,
  sample,
  conn,
  syncedAt,
  note,
}: {
  counts: StatusCounts;
  total: number;
  asOf?: string;
  sample?: boolean;
  conn: Connection;
  syncedAt: number | null;
  note?: ReactNode;
}) {
  const shares = percents(UNIT_STATUSES.map((s) => counts[s]));
  return (
    <section aria-labelledby="availability-title">
      <div className="flex items-center justify-between gap-4">
        <h3 id="availability-title" className="text-label text-muted">
          Availability
        </h3>
        <LiveBadge conn={conn} syncedAt={syncedAt} />
      </div>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-figure text-navy tabular-nums">{counts.available}</span>
        <span className="text-small text-text">of {total} plots open for booking</span>
      </p>
      {total ? (
        <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={UNIT_STATUSES.map((s, i) => `${UNIT_STATUS_META[s].label} ${shares[i]}%`).join(", ")}>
          {UNIT_STATUSES.map((s) =>
            counts[s] ? (
              <span key={s} className="transition-[flex-grow] duration-700 ease-(--ease-out)" style={{ flexGrow: counts[s], background: STATUS_COLOR[s] }} />
            ) : null,
          )}
        </div>
      ) : null}
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
        {UNIT_STATUSES.map((s, i) => (
          <li key={s} className="flex items-center gap-2 text-small text-text" title={UNIT_STATUS_META[s].description}>
            <StatusDot s={s} />
            <span className="flex-1">{UNIT_STATUS_META[s].label}</span>
            <span className="font-medium text-navy tabular-nums">{counts[s]}</span>
            <span className="w-9 text-right text-muted tabular-nums">{shares[i]}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-small text-muted">
        {asOf ? `Status as of ${formatDate(asOf)}.` : null}
        {sample ? " Some statuses are sample data until sales confirms them." : null}
      </p>
      {/* A fixed slot: a live change or a refresh problem shows here without pushing the tabs and the list down. */}
      <div className="mt-2 min-h-11">{note}</div>
    </section>
  );
}

/* ---------- plots: filters and list ---------- */

export type SizeBand = "all" | "small" | "mid" | "large";
export const SIZE_BANDS: { id: SizeBand; label: string; test: (a: number) => boolean }[] = [
  { id: "all", label: "Any size", test: () => true },
  { id: "small", label: "Up to 200 sq yd", test: (a) => a <= 200 },
  { id: "mid", label: "201–300 sq yd", test: (a) => a > 200 && a <= 300 },
  { id: "large", label: "Over 300 sq yd", test: (a) => a > 300 },
];

export interface Filters { statuses: ReadonlySet<UnitStatus>; facing: Facing | "all"; size: SizeBand; q: string }
export const NO_FILTERS: Filters = { statuses: new Set(), facing: "all", size: "all", q: "" };

/** `counts`: per status, the plots that match the other filters (facing, size, number), so a chip says what it adds. */
export function PlotFilters({
  filters,
  onChange,
  counts,
  facings,
  physical,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  counts: StatusCounts;
  facings: Facing[];
  physical: boolean;
}) {
  const uid = useId();
  const toggle = (s: UnitStatus) => {
    const next = new Set(filters.statuses);
    if (next.has(s)) next.delete(s); else next.add(s);
    onChange({ ...filters, statuses: next });
  };
  const select = "h-10 w-full rounded-md border border-line-strong bg-white px-3 text-small text-navy outline-hidden focus-visible:border-navy focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-ring";
  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Plot number</span>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          inputMode="numeric"
          placeholder="Plot number"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value.replace(/[^\dA-Za-z-]/g, "").slice(0, 8) })}
          className={cn(select, "pl-9 placeholder:text-muted pointer-coarse:h-11")}
        />
      </label>
      <fieldset>
        <legend className="sr-only">Show plots by status</legend>
        <div className="flex flex-wrap gap-1.5">
          {UNIT_STATUSES.map((s) => {
            const on = filters.statuses.has(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s)}
                disabled={!counts[s] && !on}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-label transition-colors duration-200 disabled:opacity-40 pointer-coarse:h-11",
                  on ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-line-strong",
                )}
              >
                <StatusDot s={s} className={cn(on && "ring-1 ring-white/70")} />
                {UNIT_STATUS_META[s].label}
                <span className={cn("tabular-nums", on ? "text-white/75" : "text-muted")}>{counts[s]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      {physical ? (
        <div className="grid grid-cols-2 gap-2">
          <label htmlFor={`${uid}-facing`} className="sr-only">
            Facing
          </label>
          <select id={`${uid}-facing`} value={filters.facing} onChange={(e) => onChange({ ...filters, facing: e.target.value as Filters["facing"] })} className={cn(select, "pointer-coarse:h-11")}>
            <option value="all">Any facing</option>
            {facings.map((f) => (
              <option key={f} value={f}>
                {f} facing
              </option>
            ))}
          </select>
          <label htmlFor={`${uid}-size`} className="sr-only">
            Plot size
          </label>
          <select id={`${uid}-size`} value={filters.size} onChange={(e) => onChange({ ...filters, size: e.target.value as SizeBand })} className={cn(select, "pointer-coarse:h-11")}>
            {SIZE_BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

export function PlotList({
  units,
  total,
  selected,
  onPick,
  physical,
  onClear,
}: {
  units: LiveUnit[];
  total: number;
  selected: string | null;
  onPick: (n: string) => void;
  physical: boolean;
  onClear: () => void;
}) {
  if (!total) {
    return <Empty title="No plots listed yet" text="This project's plots are being added. Call or WhatsApp us for the current list." />;
  }
  return (
    <>
      {/* Always mounted: it is what a screen reader hears when filtering, "0 of N" included. */}
      <p className="mb-2 text-small text-muted" aria-live="polite">
        {units.length === total ? `${total} plots` : `${units.length} of ${total} plots`}
      </p>
      {!units.length ? (
        <Empty title="No plots match" text="Try another plot number, size, facing or status.">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              const panel = e.currentTarget.closest("[role=tabpanel]");
              onClear();
              panel?.querySelector<HTMLElement>("input")?.focus(); // this button goes away: keep focus in the filters
            }}
            className="mt-3"
          >
            Clear filters
          </Button>
        </Empty>
      ) : (
      <ul className="divide-y divide-line border-y border-line">
        {units.map((u) => (
          <PlotRow key={u.n} u={u} on={selected === u.n} physical={physical} onPick={onPick} />
        ))}
      </ul>
      )}
    </>
  );
}

// Memoised: picking a plot re-renders the two rows whose state changed, not the whole list.
const PlotRow = memo(function PlotRow({ u, on, physical, onPick }: { u: LiveUnit; on: boolean; physical: boolean; onPick: (n: string) => void }) {
  return (
    <li className="[content-visibility:auto] [contain-intrinsic-size:auto_52px]">
      <button
        type="button"
        onClick={() => onPick(u.n)}
        aria-current={on ? "true" : undefined}
        className={cn(
          // The ring sits inside: content-visibility clips anything drawn outside the row.
          "flex w-full items-center gap-3 px-2 py-2.5 text-left transition-colors duration-200 hover:bg-mist focus-visible:-outline-offset-2",
          on && "bg-teal-soft/60 hover:bg-teal-soft/60",
        )}
      >
        <span className="w-12 shrink-0 text-ui font-semibold text-navy tabular-nums">
          <span className="sr-only">Plot </span>
          {u.n}
          <span className="sr-only">,</span>
        </span>
        {/* Phones let the details wrap, so the road width and "Corner" aren't cut off. */}
        <span className="min-w-0 flex-1 text-small text-text tabular-nums sm:truncate">
          {physical ? [`${formatNumber(u.a)} sq yd`, u.f, u.rw ? `${u.rw} ft road` : null, u.c ? "Corner" : null].filter(Boolean).join(" · ") : "Plot details on request"}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-label font-medium text-navy">
          <StatusDot s={u.s} />
          {UNIT_STATUS_META[u.s].label}
        </span>
      </button>
    </li>
  );
});

function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong px-5 py-6 text-center">
      <p className="text-ui font-semibold text-navy">{title}</p>
      <p className="mt-1 text-small text-muted">{text}</p>
      {children}
    </div>
  );
}

/* ---------- nearby ---------- */

/** The drive to the chosen place: "none" is Google saying there is no road route; "failed" is the request failing. */
export type DriveState = "idle" | "loading" | "none" | "failed";

export function NearbyList({
  state,
  landmarks,
  category,
  onCategory,
  active,
  onPick,
  drive,
  driveState,
  onRetry,
  onRetryDrive,
}: {
  state: "idle" | "loading" | "ready" | "error" | "unavailable" | "no-drawing";
  landmarks: Landmark[];
  category: CategoryId | "all";
  onCategory: (c: CategoryId | "all") => void;
  active: Landmark | null;
  onPick: (l: Landmark | null) => void;
  drive: Drive | null;
  driveState: DriveState;
  onRetry: () => void;
  onRetryDrive: () => void;
}) {
  const shown = category === "all" ? landmarks : landmarks.filter((l) => l.category === category);
  // The one announcement for this tab: the open route's drive, else what the list shows (checked first, so a map that
  // went away doesn't keep announcing an old route).
  const status =
    state !== "ready"
      ? state === "error" ? "Couldn't load nearby places"
        : state === "unavailable" ? "Nearby places aren't available on this page"
        : state === "no-drawing" ? "Nearby places need the layout, which didn't load"
        : ""
    : active && driveState === "loading" ? `Finding the drive to ${active.name}`
    : active && drive ? `${active.name}: ${drive.min} min, ${formatKm(drive.km)} by road`
    : active && driveState === "none" ? `No road route found to ${active.name}`
    : active && driveState === "failed" ? `Couldn't get the drive time to ${active.name}`
    : shown.length ? `${shown.length} places${category === "all" ? "" : `, ${CATEGORY[category].label}`}` : "Nothing found nearby";
  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kinds of places">
        {[{ id: "all" as const, label: "All" }, ...CATEGORIES].map((c) => {
          const on = category === c.id;
          const Icon = c.id === "all" ? null : CATEGORY[c.id].icon;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onCategory(c.id)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-label transition-colors duration-200 pointer-coarse:h-11",
                on ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-line-strong",
              )}
            >
              {Icon ? <Icon aria-hidden className="size-3.5" /> : null}
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4" aria-busy={state === "loading"}>
        {state === "loading" ? (
          <ul className="space-y-3" aria-label="Loading nearby places">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="size-9 animate-pulse rounded-full bg-mist-2" />
                <span className="flex-1 space-y-1.5">
                  <span className="block h-3.5 w-2/3 animate-pulse rounded bg-mist-2" />
                  <span className="block h-3 w-1/3 animate-pulse rounded bg-mist-2" />
                </span>
              </li>
            ))}
          </ul>
        ) : state === "error" ? (
          <Empty title="Couldn't load nearby places" text="Google didn't answer just now.">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                const panel = e.currentTarget.closest("[role=tabpanel]");
                onRetry();
                panel?.querySelector<HTMLElement>("button")?.focus(); // this button goes away: back to the kinds of places
              }}
              className="mt-3"
            >
              Try again
            </Button>
          </Empty>
        ) : state === "unavailable" ? (
          <Empty title="Nearby places aren&rsquo;t available" text="They come from Google Maps, which isn't available on this page right now." />
        ) : state === "no-drawing" ? (
          <Empty title="Nearby places need the layout" text="The layout drawing didn't load. Try again from the map." />
        ) : !shown.length ? (
          <Empty title="Nothing found nearby" text="Google lists no places of this kind within reach of the site." />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {shown.map((l) => {
              const c = CATEGORY[l.category];
              const on = active?.id === l.id;
              return (
                <li key={l.id}>
                  <div className={cn("flex items-start gap-3 px-1 py-3 transition-colors", on && "bg-mist")}>
                    <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-white" style={{ background: c.tone }}>
                      <c.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-ui font-medium text-navy">{l.name}</span>
                      <span className="mt-0.5 block text-small text-muted">
                        {l.type ?? c.label} · {formatKm(l.km)} away
                      </span>
                      {on ? (
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text">
                          {driveState === "loading" ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Car aria-hidden className="size-3.5 text-muted" />
                              Finding the drive…
                            </span>
                          ) : drive ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-navy">
                              <Car aria-hidden className="size-3.5" />
                              {drive.min} min · {formatKm(drive.km)} by road
                            </span>
                          ) : driveState === "none" ? (
                            <span className="inline-flex items-center gap-1.5 text-muted">
                              <CircleAlert aria-hidden className="size-3.5" />
                              No road route found
                            </span>
                          ) : driveState === "failed" ? (
                            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
                              <span className="inline-flex items-center gap-1.5">
                                <CircleAlert aria-hidden className="size-3.5" />
                                Couldn&rsquo;t get the drive time
                              </span>
                              <button type="button" onClick={onRetryDrive} className="font-medium text-navy underline underline-offset-2 pointer-coarse:py-2">
                                Try again
                              </button>
                            </span>
                          ) : null}
                          {l.url ? (
                            <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-navy-soft underline-offset-2 hover:underline">
                              Open in Google Maps
                              <ExternalLink aria-hidden className="size-3" />
                            </a>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                    {/* A toggle keeps one name; pressed (and the filled style) says the route is shown. */}
                    <Button
                      variant={on ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => onPick(on ? null : l)}
                      aria-pressed={on}
                      aria-label={`Route to ${l.name}`}
                      className="h-8 px-2.5 pointer-coarse:h-11"
                    >
                      <Route aria-hidden />
                      Route
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-3 text-small text-muted">Places, distances and drive times from Google Maps, measured from the site without traffic.</p>
    </div>
  );
}

/* ---------- plan facts ---------- */

export function PlanFacts({ plan, sample }: { plan: LayoutPlan; sample: boolean }) {
  const total = plan.landTotal;
  return (
    <div className="space-y-6">
      {plan.landUse.length && total ? (
        <div>
          <h3 className="text-ui font-semibold text-navy">Land use, as approved</h3>
          <dl className="mt-3 border-t border-line">
            {plan.landUse.map((r) => (
              <div key={r.label} className="flex items-center gap-3 border-b border-line py-2.5">
                <dt className="flex-1 text-small text-text">{r.label}</dt>
                <dd className="text-ui font-medium text-navy tabular-nums">{formatNumber(r.sqyd)} sq yd</dd>
                <dd className="w-14 text-right text-small text-muted tabular-nums">{((r.sqyd / total) * 100).toFixed(1)}%</dd>
              </div>
            ))}
            <div className="flex items-center gap-3 border-b border-line py-3">
              <dt className="flex-1 text-ui font-semibold text-navy">Total</dt>
              <dd className="text-ui font-semibold text-navy tabular-nums">{formatNumber(total)} sq yd</dd>
              <dd className="w-14" />
            </div>
          </dl>
        </div>
      ) : null}
      <OnTheLayout plan={plan} />
      <div>
        <h3 className="text-ui font-semibold text-navy">About this drawing</h3>
        <p className="mt-2 text-small text-text">
          {plan.plots.length ? (
            <>
              {plan.plots.length} plot outlines digitised from the {plan.source.title}
              {plan.source.reference ? ` (${plan.source.reference}${plan.source.date ? `, ${formatDate(plan.source.date)}` : ""})` : ""}, with the printed plot
              numbers and areas, then fitted to Google satellite imagery
              {plan.georef ? ` to within about ${Math.max(1, Math.round(plan.georef.rmsMetres))} m` : ""}. Facing and road widths follow the drawing.
            </>
          ) : (
            <>
              The {plan.source.title}
              {plan.source.reference ? ` (${plan.source.reference})` : ""} hasn&rsquo;t been digitised yet, so the map shows the site&rsquo;s pin
              and the plots as a list. Ask us for the layout copy.
            </>
          )}
        </p>
        <p className="mt-2 text-small text-muted">
          Site pin: {plan.pin.source}. {sample ? "Statuses marked as sample data are placeholders until sales confirms them." : ""}
        </p>
      </div>
    </div>
  );
}

/**
 * What the drawing shows besides the plots, as text: the named areas (parks, amenities, a later phase), the roads in
 * the layout and the roads outside it. The map's twin for anyone who can't see the drawing, and a quick read for all.
 */
function OnTheLayout({ plan }: { plan: LayoutPlan }) {
  const widths = [...new Set(plan.roadLabels.map((l) => l.t).filter((t) => /^\d+ ft road$/.test(t)))]
    .map((t) => Number.parseInt(t, 10))
    .sort((a, b) => a - b);
  const named = plan.roadLabels.map((l) => l.t).filter((t, i, all) => !/^\d+ ft road$/.test(t) && all.indexOf(t) === i);
  const zones = plan.zones.filter((z, i, all) => all.findIndex((x) => x.name === z.name) === i || z.area);
  const outside = plan.access.filter((a, i, all) => a.name !== "Road" && all.findIndex((x) => x.name === a.name) === i);
  if (!zones.length && !widths.length && !outside.length) return null;
  return (
    <div>
      <h3 className="text-ui font-semibold text-navy">On the layout</h3>
      <dl className="mt-3 space-y-3 text-small">
        {widths.length || named.length ? (
          <div>
            <dt className="text-muted">Roads inside</dt>
            <dd className="mt-0.5 text-text">{[widths.length ? `${widths.join(", ")} ft wide` : null, ...named].filter(Boolean).join("; ")}</dd>
          </div>
        ) : null}
        {outside.length ? (
          <div>
            <dt className="text-muted">Roads outside the site</dt>
            <dd className="mt-0.5 text-text">{outside.map((a) => a.name).join("; ")}</dd>
          </div>
        ) : null}
        {zones.length ? (
          <div>
            <dt className="text-muted">Areas</dt>
            <dd className="mt-0.5 text-text">
              {zones.map((z) => (z.area ? `${z.name} (${formatNumber(Math.round(z.area))} sq yd)` : z.name)).join("; ")}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/* ---------- the selected plot ---------- */

export function PlotCard({
  unit,
  projectName,
  physical,
  onClose,
  onEnquire,
}: {
  unit: LiveUnit;
  projectName: string;
  physical: boolean;
  onClose: () => void;
  onEnquire: () => void;
}) {
  const meta = UNIT_STATUS_META[unit.s];
  const rows: [string, string][] = physical
    ? ([
        ["Area", `${formatNumber(unit.a)} sq yd · ${formatNumber(Math.round(unit.a * 9))} sq ft`],
        unit.w && unit.d ? ["Size", `${formatNumber(unit.w)} ft × ${formatNumber(unit.d)} ft`] : null,
        unit.f ? ["Facing", `${unit.f}${unit.rw ? ` · ${unit.rw} ft road` : ""}`] : null,
        unit.f2 ? [unit.c ? "Corner" : "Also faces", `${unit.f2}${unit.rw2 ? ` · ${unit.rw2} ft road` : ""}`] : null,
      ].filter(Boolean) as [string, string][])
    : [];
  const open = unit.s === "available";
  const plot = { similar: !open, number: unit.n, area: unit.a, facing: physical ? unit.f : undefined, roadWidthFt: physical ? unit.rw : undefined };
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-label text-muted">{projectName}</p>
        <h2 className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-h3 text-navy">
          Plot {unit.n}
          <span className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-label text-white" style={{ background: STATUS_COLOR[unit.s] }}>
            {meta.label}
          </span>
        </h2>
        <p className="mt-1 text-small text-muted">
          {meta.description}
          {unit.dt ? ` Since ${formatDate(unit.dt)}.` : ""}
          {unit.x ? " Sample status." : ""}
        </p>
        {rows.length ? (
          <dl className="mt-3 border-t border-line">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-4 border-b border-line py-2">
                <dt className="w-20 shrink-0 text-small text-muted">{k}</dt>
                <dd className="text-small font-medium text-navy tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={onEnquire}>
            {open ? "Enquire about this plot" : "Ask about similar plots"}
            <ArrowUpRight aria-hidden />
          </Button>
          <Button asChild size="sm" variant="secondary">
            <a href={whatsappUrl(WHATSAPP_TEXT.plot(projectName, plot))} target="_blank" rel="noreferrer">
              <WhatsAppIcon className="size-4 text-whatsapp" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label="Close plot details" className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-mist hover:text-navy pointer-coarse:size-11">
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
