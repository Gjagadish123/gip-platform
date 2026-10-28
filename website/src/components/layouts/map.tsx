"use client";

import { Layers, LocateFixed, Map as MapIcon, Minus, Plus, RefreshCw, Satellite, X, type LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { UNIT_STATUS_META } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { projector, type LayoutPlan, type LiveUnit } from "@/lib/layouts";
import { cn } from "@/lib/utils";

import { hasMapsKey, loadMaps, mapsFailure, SATELLITE_STYLE, STREET_STYLE, type Maps } from "./google";
import { CATEGORY, type Drive, type Landmark } from "./nearby";
import { PlanSvg, planBox, statusSwatch, type Basemap } from "./plan";

const BASEMAPS: { id: Basemap; label: string; icon: LucideIcon }[] = [
  { id: "satellite", label: "Satellite", icon: Satellite },
  { id: "street", label: "Street map", icon: MapIcon },
  { id: "plan", label: "Plan", icon: Layers },
];

type LatLng = { lat: number; lng: number };

export interface MapProps {
  plan: LayoutPlan | null;
  projectName: string;
  sitePin: LatLng | null; // from the server: where the site is before its drawing has loaded
  planFailed: boolean; // the drawing didn't load
  onRetryPlan: () => void;
  units: ReadonlyMap<string, LiveUnit>;
  match: ((u: LiveUnit) => boolean) | null;
  selected: string | null;
  focus: number; // bumps when a plot is picked from the list or a shared link: bring it into view, close up
  flashing: ReadonlyMap<string, number>;
  basemap: Basemap;
  onBasemap: (b: Basemap) => void;
  onSelect: (n: string | null) => void;
  landmarks: Landmark[]; // only while the Nearby tab is open, already filtered by its chips
  nearby: boolean; // the Nearby tab is open: frame the site with its landmarks
  activeLandmark: Landmark | null;
  onLandmark: (l: Landmark | null) => void;
  drive: Drive | null;
  onMaps: (maps: Maps | null) => void;
  legend?: ReactNode;
  cardRef: RefObject<HTMLDivElement | null>; // the plot card: a picked plot is kept out from under it
}

/** The site's entrance when the layout marks one, else its pin: where drive routes start. */
export function siteOrigin(plan: LayoutPlan) {
  const gate = plan.points.find((p) => p.id === "gate");
  return gate ? projector(plan.origin).toLatLng(gate.at) : { lat: plan.pin.lat, lng: plan.pin.lng };
}

/** Where a picked plot should sit so the plot card doesn't cover it: the middle of the part of the map left open. */
function clearOfCard(box: DOMRect, card: HTMLElement | null) {
  const mid = { x: box.width / 2, y: box.height / 2 };
  const c = card?.getBoundingClientRect();
  if (!c?.width) return mid;
  const left = c.left - box.left, top = c.top - box.top;
  if (c.width < box.width * 0.6 && left > box.width / 3) return { x: Math.max(48, left - 8) / 2, y: mid.y }; // card on the right
  if (top > 0 && top < box.height) return { x: mid.x, y: Math.max(48, top - 8) / 2 }; // card along the bottom: the strip above it
  return mid;
}

/** True when a point of the map box (box pixels) is under the card or outside the box. */
function hidden(pt: { x: number; y: number }, box: DOMRect, card: HTMLElement | null) {
  if (pt.x < 0 || pt.y < 0 || pt.x > box.width || pt.y > box.height) return true;
  const c = card?.getBoundingClientRect();
  if (!c?.width) return false;
  const x = pt.x + box.left, y = pt.y + box.top;
  return x > c.left - 12 && x < c.right + 12 && y > c.top - 12 && y < c.bottom + 12;
}

/* ---------- hover card ---------- */

// Placed once per plot where the pointer entered it (it doesn't chase the pointer), hoverable, and Escape hides it.
function PlotTip({ unit, n, x, y, w, h, onClose }: { unit?: LiveUnit; n: string; x: number; y: number; w: number; h: number; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const meta = unit ? UNIT_STATUS_META[unit.s] : null;
  return (
    <div
      data-tip
      role="presentation"
      onPointerLeave={(e) => {
        if (!(e.relatedTarget as Element | null)?.closest?.("[data-n]")) onClose();
      }}
      className="absolute z-20 w-max max-w-60 rounded-md border border-line bg-white/95 px-3 py-2 shadow-overlay backdrop-blur-sm"
      style={{ left: Math.max(8, Math.min(x + 14, w - 228)), top: y > h / 2 ? y - 74 : y + 16 }}
    >
      <p className="flex items-center gap-2 text-ui font-semibold text-navy">
        Plot {n}
        {meta ? (
          <span className="inline-flex items-center gap-1.5 text-label font-medium text-text">
            <span aria-hidden className="size-2.5 rounded-[3px]" style={statusSwatch(unit!.s)} />
            {meta.label}
          </span>
        ) : null}
      </p>
      {unit ? (
        <p className="mt-0.5 text-small text-muted tabular-nums">
          {formatNumber(unit.a)} sq yd{unit.f ? ` · ${unit.f}` : ""}
          {unit.rw ? ` · ${unit.rw} ft road` : ""}
        </p>
      ) : null}
    </div>
  );
}

type Tip = { n: string; x: number; y: number; w: number; h: number };

/** The hover card's state: it changes only when the pointer moves onto another plot (or off the drawing). */
function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const clear = useCallback(() => setTip(null), []);
  const move = useCallback((e: ReactPointerEvent, box: DOMRect | undefined) => {
    if (e.pointerType !== "mouse") return;
    const t = e.target as Element | null;
    if (t?.closest?.("[data-tip]")) return; // over the card itself: keep it
    const n = t?.closest?.("[data-n]")?.getAttribute("data-n") ?? null;
    if (!n || !box) return setTip(null);
    setTip((cur) => (cur?.n === n ? cur : { n, x: e.clientX - box.left, y: e.clientY - box.top, w: box.width, h: box.height }));
  }, []);
  return { tip, move, clear };
}

/* ---------- landmark markers (HTML buttons positioned in the map's overlay pane) ---------- */

function Marker({ l, active, onClick, x, y }: { l: Landmark; active: boolean; onClick: () => void; x: number; y: number }) {
  const c = CATEGORY[l.category];
  const Icon = c.icon;
  return (
    <button
      type="button"
      tabIndex={-1} // mostly outside the visible frame; the Nearby list is the keyboard way to the same routes
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={`${l.name}, ${c.label.toLowerCase()}`}
      aria-pressed={active}
      className={cn(
        "group/marker absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-2 border-white text-white shadow-raise transition-[transform,box-shadow] duration-300 ease-(--ease-out) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        active ? "z-10 scale-110 py-1 pr-3 pl-1 shadow-overlay" : "size-8 justify-center hover:z-10 hover:scale-110",
      )}
      style={{ left: x, top: y, background: c.tone }}
    >
      <span className={cn("grid place-items-center", active && "size-6")}>
        <Icon aria-hidden className="size-4" />
      </span>
      {active ? <span className="max-w-48 truncate text-label">{l.name}</span> : null}
    </button>
  );
}

/* ---------- the map ---------- */

type Status = "loading" | "ready" | "failed";

export function LayoutMap(props: MapProps) {
  const { plan, basemap, onMaps } = props;
  const [maps, setMaps] = useState<Maps | null>(null);
  // No key (the Pages preview): the plan alone from the start, with no error and no Google controls.
  const [status, setStatus] = useState<Status>(hasMapsKey ? "loading" : "failed");
  const [attempt, setAttempt] = useState(0);
  const [refused, setRefused] = useState(!hasMapsKey); // no key, or the key was rejected: retrying cannot help
  const [dismissed, setDismissed] = useState(false);
  const [late, setLate] = useState(false); // a slow load arrived after the fallback: say so when it replaces the plan

  useEffect(() => {
    let live = true;
    loadMaps().then((m) => {
      if (!live) return;
      setMaps(m);
      setStatus(m ? "ready" : "failed");
      onMaps(m);
    });
    const onAuth = () => {
      if (!live) return;
      setStatus("failed");
      setRefused(true);
      onMaps(null); // the namespace loaded but the key is refused: nothing else may use it
    };
    const onLate = () => {
      if (!live) return; // a slow load finally arrived: use it now
      setLate(true);
      setAttempt((a) => a + 1);
    };
    window.addEventListener("gip:maps-auth-failure", onAuth);
    window.addEventListener("gip:maps-late", onLate);
    return () => {
      live = false;
      window.removeEventListener("gip:maps-auth-failure", onAuth);
      window.removeEventListener("gip:maps-late", onLate);
    };
  }, [attempt, onMaps]);

  const failed = status === "failed";
  // The plan view stands in until the Google map is ready (with "Loading the map…"), when Google failed, and while the
  // drawing loads or if it failed, so the map area is never blank or showing a stale site.
  const showPlan = basemap === "plan" || status !== "ready" || !plan;
  const slow = failed && mapsFailure === "timeout";

  return (
    <div className="relative isolate h-full min-h-[22rem] overflow-hidden bg-mist" role="region" aria-label={`Map of ${props.projectName}`}>
      {/* First in the DOM, as on screen: the style switch is the first thing to reach by keyboard. */}
      {refused ? null : (
        <div className="absolute top-3 left-3 z-10 flex gap-1 rounded-md border border-white/60 bg-white/88 p-1 shadow-raise backdrop-blur-md" role="group" aria-label="Map style">
          {BASEMAPS.map((b) => {
            const on = (failed ? "plan" : basemap) === b.id;
            const disabled = failed && b.id !== "plan";
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={on}
                aria-label={b.label}
                disabled={disabled}
                onClick={() => props.onBasemap(b.id)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-label transition-[background-color,color,box-shadow] duration-300 ease-(--ease-out) focus-visible:-outline-offset-2 disabled:opacity-40 sm:px-3 pointer-coarse:h-11 pointer-coarse:min-w-11",
                  on ? "bg-brand text-white shadow-raise" : "text-navy hover:bg-mist",
                )}
              >
                <b.icon aria-hidden className="size-4" />
                <span className={cn(b.id !== "satellite" && "max-sm:sr-only")}>{b.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {status !== "failed" && maps ? <GoogleStage {...props} maps={maps} hidden={showPlan} /> : null}
      {showPlan ? <PlanStage {...props} loading={status === "loading" && basemap !== "plan" && !!plan} /> : null}

      {/* Always mounted, so the change is announced. */}
      <p role="status" className="sr-only">
        {failed && !refused
          ? slow
            ? "Google Maps is slow to load, so the layout is shown on its own for now."
            : "Google Maps isn't available right now, so the layout is shown on its own."
          : late && status === "ready"
            ? "The Google map has loaded."
            : ""}
      </p>

      {/* Bottom-left stack: notices above the colour key, clear of Google's logo row. */}
      <div className={cn("pointer-events-none absolute inset-x-3 z-10 flex flex-col items-start gap-2 sm:right-auto sm:max-w-md", showPlan ? "bottom-3" : "bottom-9")}>
        {failed && !refused && !dismissed ? (
          <div className="pointer-events-auto flex items-start gap-3 rounded-md border border-line bg-white/95 py-2.5 pr-2 pl-4 shadow-overlay backdrop-blur-md">
            <p className="min-w-0 flex-1 py-1 text-small text-text">
              {slow
                ? "Google Maps is slow to load, so the approved layout is shown on its own for now. The map appears as soon as it arrives."
                : "Google Maps couldn’t load, so the approved layout is shown on its own. Availability is still live."}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.closest<HTMLElement>("[tabindex='-1']")?.focus({ preventScroll: true }); // this button goes away
                setMaps(null);
                setStatus("loading");
                setAttempt((a) => a + 1);
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-line-strong px-3 text-label text-navy hover:bg-mist pointer-coarse:h-11"
            >
              <RefreshCw aria-hidden className="size-3.5" />
              Try again
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss this notice"
              className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-mist hover:text-navy pointer-coarse:size-11"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ) : null}
        {plan && !plan.plots.length && plan.source.pending ? (
          <div className="pointer-events-auto rounded-md border border-line bg-white/95 px-4 py-3 shadow-overlay backdrop-blur-md">
            <p className="text-ui font-semibold text-navy">Plot drawing coming soon</p>
            <p className="mt-1 text-small text-text">
              The pin marks the site ({plan.pin.source}). Plot outlines go on the map once the {plan.source.title}
              {plan.source.reference ? ` (${plan.source.reference})` : ""} is digitised; availability in the panel is live meanwhile.
            </p>
          </div>
        ) : null}
        {plan?.plots.length ? props.legend : null}
      </div>
    </div>
  );
}

function GoogleStage(props: MapProps & { maps: Maps; hidden: boolean }) {
  const { maps, plan, sitePin, basemap, hidden: isHidden, units, match, selected, flashing, onSelect, landmarks, nearby, activeLandmark, onLandmark, drive, focus, cardRef } = props;
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const routeRef = useRef<google.maps.Polyline[]>([]);
  // Two layers in the map's overlay pane: the drawing (placed on the project's extent) and the markers (pane origin).
  // Only ever created in the browser: this stage renders once the Maps script has loaded.
  const [els] = useState(() => {
    const plan = document.createElement("div");
    plan.style.position = "absolute";
    const marks = document.createElement("div");
    Object.assign(marks.style, { position: "absolute", left: "0", top: "0" });
    return { plan, marks };
  });
  const [pxPerM, setPxPerM] = useState(1);
  const [zoom, setZoom] = useState(16);
  const [pos, setPos] = useState<Record<string, [number, number]>>({});
  const { tip, move, clear } = useTip();
  const down = useRef<{ x: number; y: number } | null>(null);
  const drawn = useRef(false); // the new map has settled once: until then Google still owes it the first fitBounds

  const proj = useMemo(() => (plan ? projector(plan.origin) : null), [plan]);
  const bounds = useMemo(() => {
    if (!plan?.extent || !proj) return null;
    const e = plan.extent;
    return { sw: proj.toLatLng([e.minX, e.minY]), ne: proj.toLatLng([e.maxX, e.maxY]) };
  }, [plan, proj]);
  const site = plan ? { lat: plan.pin.lat, lng: plan.pin.lng } : sitePin;

  // Position the drawing and the markers for the current projection (Google calls draw() on every pan and zoom
  // frame, so state is set only when something actually moved).
  const layout = useEffectEvent(() => {
    const p = overlayRef.current?.getProjection();
    if (!p) return;
    if (bounds && plan?.extent) {
      const sw = p.fromLatLngToDivPixel(new maps.LatLng(bounds.sw))!;
      const ne = p.fromLatLngToDivPixel(new maps.LatLng(bounds.ne))!;
      Object.assign(els.plan.style, { left: `${sw.x}px`, top: `${ne.y}px`, width: `${ne.x - sw.x}px`, height: `${sw.y - ne.y}px`, display: "" });
      setPxPerM(Math.round(((ne.x - sw.x) / (plan.extent.maxX - plan.extent.minX)) * 100) / 100);
    } else {
      els.plan.style.display = "none";
    }
    const next: Record<string, [number, number]> = {};
    // Markers that would land on one another are nudged apart (the chosen one keeps its true place).
    const placed: [number, number][] = [];
    const order = activeLandmark ? [activeLandmark, ...landmarks.filter((l) => l.id !== activeLandmark.id)] : landmarks;
    for (const l of order) {
      const q = p.fromLatLngToDivPixel(new maps.LatLng(l.at));
      if (!q) continue;
      let x = q.x, y = q.y;
      for (let i = 0; i < 12 && placed.some(([a, b]) => Math.abs(a - x) < 30 && Math.abs(b - y) < 30); i++) {
        const ang = (i * Math.PI) / 4, r = 32 * (1 + Math.floor(i / 8));
        x = q.x + Math.cos(ang) * r;
        y = q.y + Math.sin(ang) * r;
      }
      placed.push([x, y]);
      next[l.id] = [x, y];
    }
    if (site) {
      const q = p.fromLatLngToDivPixel(new maps.LatLng(site));
      if (q) next.__site = [q.x, q.y];
    }
    setPos((prev) => {
      const k = Object.keys(next);
      return k.length === Object.keys(prev).length && k.every((id) => prev[id]?.[0] === next[id][0] && prev[id]?.[1] === next[id][1]) ? prev : next;
    });
    setZoom(mapRef.current?.getZoom() ?? 16);
  });

  const deselect = useEffectEvent(() => onSelect(null));

  // Create the map and the overlay once.
  useEffect(() => {
    if (!boxRef.current || mapRef.current) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const map = new maps.Map(boxRef.current, {
      center: sitePin ?? { lat: 17.5, lng: 78.14 },
      zoom: 15,
      mapTypeId: "hybrid",
      styles: SATELLITE_STYLE,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: fine ? "greedy" : "cooperative",
      minZoom: 10,
      maxZoom: 21,
      tilt: 0,
      backgroundColor: "#f4faf9",
    });
    mapRef.current = map;
    maps.event.addListenerOnce(map, "idle", () => (drawn.current = true));
    class Overlay extends maps.OverlayView {
      onAdd() {
        this.getPanes()!.overlayMouseTarget.append(els.plan, els.marks);
      }
      draw() {
        layout();
      }
      onRemove() {
        els.plan.remove();
        els.marks.remove();
      }
    }
    // Markers are buttons: a press on one must not start a map drag.
    maps.OverlayView.preventMapHitsAndGesturesFrom(els.marks);
    const overlay = new Overlay();
    overlay.setMap(map);
    overlayRef.current = overlay;
    // A click on open ground clears the selection; clicks on the drawing are handled by the drawing.
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      const t = e.domEvent?.target;
      if (!(t instanceof Node && (els.plan.contains(t) || els.marks.contains(t)))) deselect();
    });
    // Back online: Google doesn't re-ask for tiles that failed, so nudge the zoom to fetch them again.
    const onOnline = () => {
      const z = map.getZoom() ?? 16;
      map.setZoom(z + 1);
      maps.event.addListenerOnce(map, "idle", () => map.setZoom(z));
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      overlay.setMap(null);
      maps.event.clearInstanceListeners(map);
      mapRef.current = null;
      drawn.current = false;
    };
  }, [maps, els]); // eslint-disable-line react-hooks/exhaustive-deps -- created once; sitePin only seeds the first view

  // Base map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || basemap === "plan") return;
    map.setOptions(basemap === "street" ? { mapTypeId: "roadmap", styles: STREET_STYLE } : { mapTypeId: "hybrid", styles: SATELLITE_STYLE });
  }, [basemap]);

  // The project's frame: its drawing, or its pin while the drawing loads.
  const frameProject = useEffectEvent(() => {
    const map = mapRef.current;
    if (!map) return;
    if (bounds) map.fitBounds(new maps.LatLngBounds(bounds.sw, bounds.ne), { top: 64, right: 24, bottom: 88, left: 24 });
    else if (site) {
      map.setCenter(site);
      map.setZoom(16);
    }
  });
  useEffect(() => {
    frameProject();
    layout();
  }, [plan, bounds, sitePin, maps]);

  // Markers moved or changed: re-place them.
  useEffect(() => {
    layout();
  }, [landmarks, activeLandmark]);

  // A picked plot: from the list or a shared link, bring it close and centre it in the part of the map the card leaves
  // open; from a tap on the map, move it only if the card now covers it.
  const handledFocus = useRef(0);
  const reveal = useEffectEvent((closeUp: boolean) => {
    const map = mapRef.current, box = boxRef.current?.getBoundingClientRect();
    const p = plan && selected ? plan.plots.find((q) => q.n === selected) : undefined;
    if (!map || !box || !proj || !p) return;
    const at = proj.toLatLng(p.c);
    const goal = clearOfCard(box, cardRef.current);
    if (closeUp) {
      if ((map.getZoom() ?? 0) < 19) map.setZoom(19);
      map.setCenter(at);
      maps.event.addListenerOnce(map, "idle", () => map.panBy(box.width / 2 - goal.x, box.height / 2 - goal.y));
      return;
    }
    const px = overlayRef.current?.getProjection()?.fromLatLngToContainerPixel(new maps.LatLng(at));
    if (px && hidden(px, box, cardRef.current)) map.panBy(px.x - goal.x, px.y - goal.y);
  });
  useEffect(() => {
    if (!plan || !selected) return;
    const closeUp = focus > 0 && focus !== handledFocus.current;
    let wait: google.maps.MapsEventListener | undefined;
    // After the card has laid out; marked handled only once it runs (StrictMode's re-run cancels the first frame).
    const raf = requestAnimationFrame(() => {
      handledFocus.current = focus;
      const map = mapRef.current;
      // A map made moments ago (a shared link) still applies its first fit, which would undo the close-up.
      if (map && !drawn.current) wait = maps.event.addListenerOnce(map, "idle", () => reveal(closeUp));
      else reveal(closeUp);
    });
    return () => {
      cancelAnimationFrame(raf);
      wait?.remove();
    };
  }, [plan, selected, focus, maps]);

  // Drive route: Google's road geometry, a navy line on a white casing; framed with the site. Hidden again: back to
  // what was framed before (the landmarks while Nearby is open, else the project).
  const hadRoute = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    routeRef.current.forEach((l) => l.setMap(null));
    routeRef.current = [];
    if (!map) return;
    if (!drive) {
      if (hadRoute.current) {
        hadRoute.current = false;
        if (!frameNearby()) frameProject();
      }
      return;
    }
    hadRoute.current = true;
    const path = drive.path;
    routeRef.current = [
      new maps.Polyline({ map, path, strokeColor: "#ffffff", strokeOpacity: 0.95, strokeWeight: 9, zIndex: 1, clickable: false }),
      new maps.Polyline({ map, path, strokeColor: "#1d5a92", strokeOpacity: 1, strokeWeight: 5, zIndex: 2, clickable: false }),
    ];
    const b = new maps.LatLngBounds();
    path.forEach((q) => b.extend(q));
    map.fitBounds(b, { top: 72, right: 48, bottom: 104, left: 48 });
  }, [drive, maps]);

  // Nearby open: the site and the places listed; closed again: back to the project.
  const framedNearby = useRef(false);
  const frameNearby = useEffectEvent(() => {
    const map = mapRef.current;
    if (!map || !nearby || !landmarks.length || !site) return false;
    const b = new maps.LatLngBounds();
    b.extend(site);
    landmarks.forEach((l) => b.extend(l.at));
    map.fitBounds(b, { top: 72, right: 48, bottom: 104, left: 48 });
    framedNearby.current = true;
    return true;
  });
  useEffect(() => {
    if (drive) return; // a route frames itself
    if (!frameNearby() && framedNearby.current) {
      framedNearby.current = false;
      frameProject();
    }
  }, [nearby, landmarks]); // eslint-disable-line react-hooks/exhaustive-deps -- reframe on what is listed, not on each route

  const plotAt = (target: EventTarget | null) => (target as Element | null)?.closest?.("[data-n]")?.getAttribute("data-n") ?? null;
  const showSite = !!site && (!plan?.extent || zoom <= 15);
  const svgBox = plan?.extent ? planBox(plan) : null;

  return (
    <div className={cn("absolute inset-0 transition-opacity duration-500", isHidden ? "pointer-events-none invisible opacity-0" : "opacity-100")}>
      {/* Before the map in the DOM, so they come before Google's own tab stops. */}
      <div className="absolute top-3 right-3 z-10 flex flex-col overflow-hidden rounded-md border border-white/60 bg-white/88 shadow-raise backdrop-blur-md">
        <MapButton label="Zoom in" onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 16) + 1)} icon={Plus} />
        <MapButton label="Zoom out" onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 16) - 1)} icon={Minus} />
        <MapButton
          label={`Show all of ${plan?.name ?? "the project"}`}
          onClick={() => {
            const map = mapRef.current;
            if (map && bounds) map.fitBounds(new maps.LatLngBounds(bounds.sw, bounds.ne), { top: 64, right: 24, bottom: 88, left: 24 });
            else if (map && site) {
              map.setCenter(site);
              map.setZoom(16);
            }
          }}
          icon={LocateFixed}
        />
      </div>
      <div ref={boxRef} className="size-full" />
      {plan && svgBox && !isHidden
        ? createPortal(
            <div
              className="size-full"
              onPointerDown={(e) => (down.current = { x: e.clientX, y: e.clientY })}
              onPointerMove={(e) => move(e, boxRef.current?.getBoundingClientRect())}
              onPointerLeave={(e) => !(e.relatedTarget as Element | null)?.closest?.("[data-tip]") && clear()}
              onClick={(e) => {
                const d = down.current;
                if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return; // that was a drag
                const n = plotAt(e.target);
                if (n) {
                  e.stopPropagation();
                  onSelect(n);
                }
              }}
            >
              <PlanSvg
                plan={plan}
                units={units}
                match={match}
                selected={selected}
                flashing={flashing}
                mode={basemap === "street" ? "street" : "satellite"}
                pxPerM={pxPerM}
                viewBox={`${svgBox.x} ${svgBox.y} ${svgBox.w} ${svgBox.h}`}
                className="block size-full"
              />
            </div>,
            els.plan,
          )
        : null}
      {createPortal(
        <>
          {showSite && pos.__site ? (
            <span
              className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
              style={{ left: pos.__site[0], top: pos.__site[1] }}
            >
              <span className="rounded-md bg-brand px-2.5 py-1.5 text-label whitespace-nowrap text-white shadow-overlay">{plan?.name ?? props.projectName}</span>
              <span aria-hidden className="h-3 w-0.5 bg-brand" />
              <span aria-hidden className="size-3 rounded-full border-2 border-white bg-teal shadow-raise" />
            </span>
          ) : null}
          {landmarks.map((l) =>
            pos[l.id] ? (
              <Marker
                key={l.id}
                l={l}
                active={activeLandmark?.id === l.id}
                onClick={() => onLandmark(activeLandmark?.id === l.id ? null : l)}
                x={pos[l.id][0]}
                y={pos[l.id][1]}
              />
            ) : null,
          )}
        </>,
        els.marks,
      )}

      {tip && !isHidden ? <PlotTip {...tip} unit={units.get(tip.n)} onClose={clear} /> : null}
    </div>
  );
}

function MapButton({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      // The ring is drawn inside: the group clips anything outside its rounded corners.
      className="grid size-10 place-items-center text-navy transition-colors hover:bg-mist focus-visible:-outline-offset-2 pointer-coarse:size-11 [&+&]:border-t [&+&]:border-line"
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}

/* ---------- the plan on its own (the "Plan" style, the loading state and the fallback without Google) ---------- */

const MAX_ZOOM = 8;
const INSET = 56; // px kept clear above (style switch, zoom) and below (colour key) when the plan is fitted
type Box = { x: number; y: number; w: number; h: number };

function PlanStage(props: MapProps & { loading: boolean }) {
  const { plan, projectName, units, match, selected, flashing, onSelect, focus, loading, planFailed, onRetryPlan, cardRef } = props;
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const base = useMemo<Box | null>(() => (plan?.extent ? planBox(plan, 14) : null), [plan]);
  const [view, setView] = useState<{ plan: string; box: Box } | null>(null);
  const vb = view && plan && view.plan === plan.id ? view.box : base;
  const drag = useRef<{ x: number; y: number; vb: Box; k: number; moved: boolean; touch: boolean } | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>()); // pointers down on the stage (two = pinch and pan)
  const { tip, move, clear } = useTip();

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e.contentRect.width > 0 && setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit the plan into the box minus the bands the overlays sit in (the viewBox keeps its aspect, so widen whichever
  // side is short, then add the bands back as metres above and below).
  const fitted = useMemo(() => {
    if (!vb || !size) return vb;
    const h = Math.max(size.h - 2 * INSET, size.h * 0.5);
    const k = size.w / h;
    const f = vb.w / vb.h > k ? { ...vb, y: vb.y - (vb.w / k - vb.h) / 2, h: vb.w / k } : { ...vb, x: vb.x - (vb.h * k - vb.w) / 2, w: vb.h * k };
    const pad = (f.h / h) * ((size.h - h) / 2);
    return { ...f, y: f.y - pad, h: f.h + 2 * pad };
  }, [vb, size]);

  const setBox = useCallback(
    (f: (b: Box) => Box) => {
      if (!plan || !base) return;
      setView((v) => {
        const cur = v && v.plan === plan.id ? v.box : base;
        const next = f(cur);
        const w = Math.min(base.w, Math.max(base.w / MAX_ZOOM, next.w));
        const h = (w / next.w) * next.h;
        const cx = Math.min(base.x + base.w, Math.max(base.x, next.x + next.w / 2));
        const cy = Math.min(base.y + base.h, Math.max(base.y, next.y + next.h / 2));
        return { plan: plan.id, box: { x: cx - w / 2, y: cy - h / 2, w, h } };
      });
    },
    [plan, base],
  );
  const zoomBy = useCallback((k: number, at?: { x: number; y: number }) => setBox((b) => {
    const p = at ?? { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    return { x: p.x - (p.x - b.x) / k, y: p.y - (p.y - b.y) / k, w: b.w / k, h: b.h / k };
  }), [setBox]);
  const toPlan = (clientX: number, clientY: number) => {
    const m = boxRef.current?.querySelector("svg")?.getScreenCTM();
    if (!m) return undefined;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const m = el.querySelector("svg")?.getScreenCTM();
      const at = m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : undefined;
      zoomBy(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)), at ? { x: at.x, y: at.y } : undefined);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // A picked plot: from the list or a shared link, centre it close up in the part of the map the card leaves open;
  // from a tap on the plan, move it only if the card now covers it.
  const handledFocus = useRef(0);
  useEffect(() => {
    if (!plan || !base || !size || !selected) return;
    const p = plan.plots.find((q) => q.n === selected);
    if (!p) return;
    const closeUp = focus > 0 && focus !== handledFocus.current;
    const raf = requestAnimationFrame(() => {
      handledFocus.current = focus;
      const box = boxRef.current?.getBoundingClientRect();
      if (!box) return;
      const el = boxRef.current?.querySelector(`[data-n="${CSS.escape(p.n)}"]`)?.getBoundingClientRect();
      const at = el ? { x: el.left + el.width / 2 - box.left, y: el.top + el.height / 2 - box.top } : null;
      if (!closeUp && (!at || !hidden(at, box, cardRef.current))) return;
      const goal = clearOfCard(box, cardRef.current);
      setBox((b) => {
        const w = closeUp ? Math.min(b.w, base.w / 3) : b.w;
        const h = (w / b.w) * b.h;
        const s = Math.max(w / size.w, h / Math.max(size.h - 2 * INSET, size.h * 0.5)); // metres per screen px
        const cx = p.c[0] - (goal.x - size.w / 2) * s;
        const cy = -p.c[1] - (goal.y - size.h / 2) * s;
        return { x: cx - w / 2, y: cy - h / 2, w, h };
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [plan, base, size, selected, focus, setBox, cardRef]);

  // The box is always mounted so the ResizeObserver sees it from the first render.
  if (!plan?.extent || !fitted || !size) {
    return (
      <div ref={boxRef} className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_45%,var(--color-teal-soft),var(--color-mist)_62%)] px-4">
        {planFailed ? (
          <div role="alert" className="max-w-sm rounded-md border border-line bg-white/95 px-5 py-4 text-center shadow-overlay">
            <p className="text-ui font-semibold text-navy">The layout drawing didn&rsquo;t load</p>
            <p className="mt-1 text-small text-text">Check the connection and try again. Availability in the panel is still live.</p>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.closest<HTMLElement>("[tabindex='-1']")?.focus({ preventScroll: true }); // this button goes away
                onRetryPlan();
              }}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 text-label text-navy hover:bg-mist pointer-coarse:h-11"
            >
              <RefreshCw aria-hidden className="size-3.5" />
              Try again
            </button>
          </div>
        ) : plan ? null : (
          <p role="status" className="inline-flex items-center gap-2 rounded-md bg-white/92 px-3 py-1.5 text-label text-navy shadow-raise">
            <span aria-hidden className="size-2 rounded-full bg-teal motion-safe:animate-pulse" />
            Loading the layout…
          </p>
        )}
      </div>
    );
  }
  const pxPerM = size.w / fitted.w;
  const plotAt = (t: EventTarget | null) => (t as Element | null)?.closest?.("[data-n]")?.getAttribute("data-n") ?? null;

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      role="group"
      aria-roledescription="map"
      aria-label={`Plan of ${projectName}. Arrow keys move it, plus and minus zoom, 0 shows all of it.`}
      // One finger scrolls the page on touch screens (two fingers move and zoom the plan), as on the Google map.
      className={cn(
        "absolute inset-0 touch-none bg-mist focus-visible:-outline-offset-4 pointer-coarse:touch-pan-y",
        loading && "after:pointer-events-none after:absolute after:inset-0 after:animate-pulse after:bg-white/30",
      )}
      onKeyDown={(e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return; // the browser's own zoom and history shortcuts
        const d = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[e.key];
        if (d) {
          e.preventDefault();
          setBox((b) => ({ ...b, x: b.x + d[0] * b.w * 0.15, y: b.y + d[1] * b.h * 0.15 }));
        } else if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          zoomBy(1.5);
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          zoomBy(1 / 1.5);
        } else if (e.key === "0") {
          e.preventDefault();
          setView(null);
        }
      }}
      onDoubleClick={(e) => {
        if ((e.target as Element).closest("button, [data-tip]")) return; // two quick presses of a zoom button
        zoomBy(2, toPlan(e.clientX, e.clientY));
      }}
      onPointerDown={(e) => {
        if (e.button !== 0 || (e.target as Element).closest("button, [data-tip]")) return;
        touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.current.size > 1) {
          drag.current = null; // a second finger: pinch and pan, not a tap
          return;
        }
        // The stored box, not the fitted one: they share a centre, and setBox caps the width for zooming only.
        // A touch leaves the page to scroll only where the CSS allows it (phones); touch laptops pan like a mouse.
        const scrolls = e.pointerType === "touch" && window.matchMedia("(pointer: coarse)").matches;
        drag.current = { x: e.clientX, y: e.clientY, vb: vb ?? fitted, k: fitted.w / size.w, moved: false, touch: scrolls };
      }}
      onPointerMove={(e) => {
        const t = touches.current;
        if (t.size === 2 && t.has(e.pointerId)) {
          const [a, b] = [...t.values()];
          const before = Math.hypot(a.x - b.x, a.y - b.y);
          const m0 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          t.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const [c, d] = [...t.values()];
          const after = Math.hypot(c.x - d.x, c.y - d.y);
          const m1 = { x: (c.x + d.x) / 2, y: (c.y + d.y) / 2 };
          const k = fitted.w / size.w;
          setBox((bx) => ({ ...bx, x: bx.x - (m1.x - m0.x) * k, y: bx.y - (m1.y - m0.y) * k }));
          if (before > 0 && after > 0) zoomBy(after / before, toPlan(m1.x, m1.y));
          return;
        }
        if (t.has(e.pointerId)) t.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const d = drag.current;
        if (d) {
          const dx = e.clientX - d.x, dy = e.clientY - d.y;
          if (!d.moved && Math.hypot(dx, dy) > 4) {
            d.moved = true;
            if (!d.touch) e.currentTarget.setPointerCapture(e.pointerId);
            clear();
          }
          if (d.moved && !d.touch) setBox(() => ({ ...d.vb, x: d.vb.x - dx * d.k, y: d.vb.y - dy * d.k }));
          return;
        }
        move(e, boxRef.current?.getBoundingClientRect());
      }}
      onPointerUp={(e) => {
        touches.current.delete(e.pointerId);
        const d = drag.current;
        drag.current = null;
        if (!d || d.moved) return;
        onSelect(plotAt(e.target));
      }}
      onPointerCancel={(e) => {
        touches.current.delete(e.pointerId);
        drag.current = null;
      }}
      onPointerLeave={(e) => {
        if (!(e.relatedTarget as Element | null)?.closest?.("[data-tip]")) clear();
        // Released outside before it became a drag: forget the press (a drag holds the pointer, so it never leaves).
        if (!drag.current?.moved) {
          touches.current.delete(e.pointerId);
          drag.current = null;
        }
      }}
    >
      <PlanSvg
        plan={plan}
        units={units}
        match={match}
        selected={selected}
        flashing={flashing}
        mode="plan"
        pxPerM={pxPerM}
        viewBox={`${fitted.x} ${fitted.y} ${fitted.w} ${fitted.h}`}
        className="block size-full"
      />
      {tip ? <PlotTip {...tip} unit={units.get(tip.n)} onClose={clear} /> : null}
      {loading ? (
        <p className="pointer-events-none absolute top-16 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-md bg-white/95 px-3 py-1.5 text-label text-navy shadow-raise" role="status">
          <span aria-hidden className="size-2 rounded-full bg-teal motion-safe:animate-pulse" />
          Loading the map…
        </p>
      ) : (
        <div className="absolute top-3 right-3 z-10 flex flex-col overflow-hidden rounded-md border border-line bg-white/92 shadow-raise backdrop-blur-md">
          <MapButton label="Zoom in" onClick={() => zoomBy(1.5)} icon={Plus} />
          <MapButton label="Zoom out" onClick={() => zoomBy(1 / 1.5)} icon={Minus} />
          <MapButton label="Show the whole layout" onClick={() => setView(null)} icon={LocateFixed} />
        </div>
      )}
    </div>
  );
}
