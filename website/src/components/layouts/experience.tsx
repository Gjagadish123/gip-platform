"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Segmented } from "@/components/project/parts";
import { PageEnquiryContext, useEnquiry } from "@/components/site/enquiry-provider";
import { WhatsAppIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { COMPANY, UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants";
import { INTERESTS, WHATSAPP_TEXT, whatsappUrl, type InterestId } from "@/lib/enquiry";
import { countStatuses, isLiveLayout, LIVE_LAYOUT_IDS, loadLayout, type LayoutPlan, type LiveLayoutId, type LiveProject, type LiveUnit } from "@/lib/layouts";
import type { Facing } from "@/lib/types";

import { hasMapsKey, type Maps } from "./google";
import { LayoutMap, siteOrigin } from "./map";
import { driveTo, nearbyLandmarks, type CategoryId, type Drive, type Landmark } from "./nearby";
import {
  Availability,
  NearbyList,
  NO_FILTERS,
  PlanFacts,
  PlotCard,
  PlotFilters,
  PlotList,
  ProjectFacts,
  ProjectSwitcher,
  SIZE_BANDS,
  type DriveState,
  type Filters,
} from "./panel";
import { statusSwatch, type Basemap } from "./plan";
import { useLiveLayouts } from "./use-live";

type Tab = "plots" | "nearby" | "plan";
const TABS: { id: Tab; label: string }[] = [
  { id: "plots", label: "Plots" },
  { id: "nearby", label: "Nearby" },
  { id: "plan", label: "Plan facts" },
];
const byNumber = new Intl.Collator("en", { numeric: true }).compare;
const NO_LANDMARKS: Landmark[] = [];
type LatLng = { lat: number; lng: number };

// Start the open project's drawing while the page hydrates (the map waits for it). Only on a full load of /layouts: on
// a client navigation this module loads before the URL changes, and the page's own effect asks for the right one.
if (typeof window !== "undefined" && /\/layouts\/?$/.test(window.location.pathname)) {
  const id = new URLSearchParams(window.location.search).get("project") ?? LIVE_LAYOUT_IDS[0];
  if (isLiveLayout(id)) void loadLayout(id).catch(() => {});
}

export interface Outline { id: LiveLayoutId; outline: LayoutPlan["outline"]; pending: boolean; plotCount: number; pin: LatLng | null }

/**
 * /layouts: the four approved layouts on one page. The switcher keeps one map; plot colours follow the admin live
 * (./use-live), landmarks and drive routes come from Google, and every map feature has a text twin in the panel.
 */
export function LayoutsExperience({
  projects: initialProjects,
  units: initialUnits,
  outlines,
}: {
  projects: LiveProject[];
  units: Record<string, LiveUnit[]>;
  outlines: Outline[];
}) {
  const uid = useId();
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get("project");
  const plotFromUrl = params.get("plot");
  const urlListed = initialProjects.some((p) => p.id === fromUrl);
  const [active, setActive] = useState<string>(() => (urlListed ? fromUrl! : (initialProjects[0]?.id ?? "")));
  const onNewProject = useCallback(() => router.refresh(), [router]); // published again, and not in this page's data
  const { projects, units: allUnits, conn, syncedAt, error, lastChange } = useLiveLayouts(initialProjects, initialUnits, active, onNewProject);
  const project = projects.find((p) => p.id === active) ?? projects[0];
  const projectId = project?.id;
  const outline = outlines.find((o) => o.id === projectId);
  // By value: refreshed page data brings new objects, and a new pin would re-frame the map and re-ask for a route.
  const pinLat = outline?.pin?.lat, pinLng = outline?.pin?.lng;
  const sitePin = useMemo(() => (pinLat == null || pinLng == null ? null : { lat: pinLat, lng: pinLng }), [pinLat, pinLng]);

  const [plans, setPlans] = useState<Partial<Record<string, LayoutPlan>>>({});
  const [planError, setPlanError] = useState<string | null>(null); // id of the project whose drawing failed to load
  const [planTry, setPlanTry] = useState(0);
  const plan = projectId ? (plans[projectId] ?? null) : null;

  // A plot number means something only in the project it was shared with. A shared plot opens close up.
  const sharedPlot = urlListed && plotFromUrl && (initialUnits[fromUrl!] ?? []).some((u) => u.n === plotFromUrl) ? plotFromUrl : null;
  const [selected, setSelected] = useState<string | null>(sharedPlot);
  const [focus, setFocus] = useState(sharedPlot ? 1 : 0);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const [tab, setTab] = useState<Tab>("plots");
  const [maps, setMaps] = useState<Maps | null>(null);
  const [mapsSettled, setMapsSettled] = useState(false);
  const [landmarks, setLandmarks] = useState<{ id: string; list: Landmark[]; state: "loading" | "ready" | "error" } | null>(null);
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
  const [drive, setDrive] = useState<{ id: string; drive: Drive | null; state: DriveState } | null>(null);
  const [driveTry, setDriveTry] = useState(0);
  const [flashing, setFlashing] = useState<Map<string, number>>(new Map());
  const [announcement, setAnnouncement] = useState<{ text: string; at: number } | null>(null);
  // A shared link that no longer matches says so instead of failing quietly.
  const [notice, setNotice] = useState<string | null>(() => {
    if (fromUrl && !urlListed && initialProjects[0]) return `That project isn't on this page now, so ${initialProjects[0].name} is shown instead.`;
    if (plotFromUrl && urlListed && !sharedPlot) return `Plot ${plotFromUrl} isn't on the ${initialProjects.find((p) => p.id === fromUrl)!.name} layout.`;
    return null;
  });
  const { openEnquiry } = useEnquiry();

  // The project's geometry: one chunk each, kept once loaded. A failure can be retried, and is when the connection
  // comes back.
  useEffect(() => {
    if (!projectId || plans[projectId]) return;
    let live = true;
    loadLayout(projectId as LiveLayoutId).then(
      (p) => {
        if (!live) return;
        setPlans((all) => ({ ...all, [p.id]: p }));
        setPlanError(null);
      },
      () => live && setPlanError(projectId),
    );
    return () => {
      live = false;
    };
  }, [projectId, plans, planTry]);
  const retryPlan = useCallback(() => {
    setPlanError(null);
    setPlanTry((t) => t + 1);
  }, []);
  useEffect(() => {
    if (!planError) return;
    window.addEventListener("online", retryPlan);
    return () => window.removeEventListener("online", retryPlan);
  }, [planError, retryPlan]);

  // Warm the other projects' drawings once the map has settled, so switching is instant (not during the map's load).
  useEffect(() => {
    if (!mapsSettled) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const h = idle(() => projects.forEach((p) => void loadLayout(p.id).catch(() => {})));
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(h as number);
  }, [projects, mapsSettled]);

  // The plot, filters, route and change rings belong to the project (plot numbers repeat): leaving it clears them.
  const leaveProject = () => {
    setSelected(null);
    setFilters(NO_FILTERS);
    setActiveLandmark(null);
    setDrive(null);
    setPlanError(null);
    setFlashing(new Map());
  };
  // The active project was unpublished from the admin while open: move to the next one and say why (adjusted while
  // rendering, the React way to follow derived data).
  if (project && project.id !== active) {
    setNotice(`That project is no longer listed, so ${project.name} is shown instead.`);
    setActive(project.id);
    leaveProject();
  }

  // Shareable URL (?project=…&plot=…) without a server round trip.
  useEffect(() => {
    if (!projectId) return;
    const q = new URLSearchParams(window.location.search);
    q.set("project", projectId);
    if (selected) q.set("plot", selected); else q.delete("plot");
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  }, [projectId, selected]);

  const units = useMemo(() => (projectId ? (allUnits[projectId] ?? []) : []), [allUnits, projectId]);
  const unitMap = useMemo(() => new Map(units.map((u) => [u.n, u])), [units]);
  const counts = useMemo(() => countStatuses(units), [units]);
  const sample = useMemo(() => units.some((u) => u.x), [units]); // live, unlike the project's flag
  // Sizes and facing are shown only where the plots are digitised from the approved drawing; the server already knows
  // which projects are, so the list is right before the drawing itself has loaded.
  const physical = plan ? plan.plots.length > 0 : !!outline && !outline.pending;
  const facings = useMemo(() => [...new Set(units.map((u) => u.f).filter(Boolean) as Facing[])].sort(), [units]);

  const match = useMemo(() => {
    const { statuses, facing, size, q } = filters;
    const band = SIZE_BANDS.find((b) => b.id === size)!;
    if (!statuses.size && facing === "all" && size === "all" && !q) return null;
    return (u: LiveUnit) =>
      (!statuses.size || statuses.has(u.s)) && (facing === "all" || u.f === facing) && band.test(u.a) && (!q || u.n.toLowerCase().startsWith(q.toLowerCase()));
  }, [filters]);
  const listed = useMemo(() => (match ? units.filter(match) : units).toSorted((a, b) => byNumber(a.n, b.n)), [units, match]);
  // Each status chip counts the plots that match the other filters, so it says what choosing it would show.
  const chipCounts = useMemo(() => {
    const { facing, size, q } = filters;
    const band = SIZE_BANDS.find((b) => b.id === size)!;
    return countStatuses(units.filter((u) => (facing === "all" || u.f === facing) && band.test(u.a) && (!q || u.n.toLowerCase().startsWith(q.toLowerCase()))));
  }, [units, filters]);

  // Live changes to the open project: ring the plots on the map and say what changed.
  const [seenChange, setSeenChange] = useState(lastChange);
  const [recent, setRecent] = useState<typeof lastChange>(null); // shown as "Just now: …" for a minute
  if (lastChange !== seenChange) {
    setSeenChange(lastChange);
    if (lastChange && lastChange.project === projectId) {
      const { numbers, to } = lastChange;
      setRecent(lastChange);
      setFlashing(new Map(numbers.map((n) => [n, lastChange.at])));
      setAnnouncement({
        text:
          numbers.length === 1
            ? `Plot ${numbers[0]} is now ${to ? UNIT_STATUS_META[to].label : "updated"}.`
            : `${numbers.length} plots updated${to ? ` to ${UNIT_STATUS_META[to].label}` : ""}.`,
        at: lastChange.at,
      });
    }
  }
  useEffect(() => {
    if (!flashing.size) return;
    const t = window.setTimeout(() => setFlashing(new Map()), 2600);
    return () => window.clearTimeout(t);
  }, [flashing]);
  useEffect(() => {
    if (!recent) return;
    const t = window.setTimeout(() => setRecent(null), 60_000);
    return () => window.clearTimeout(t);
  }, [recent]);

  // Landmarks: asked of Google (a billed search) only once Nearby is opened, per project, around the site's pin.
  const fetchLandmarks = useCallback(
    (id: string, at: LatLng) => {
      if (!maps) return;
      nearbyLandmarks(maps, id, at).then(
        (list) => setLandmarks({ id, list, state: "ready" }),
        () => setLandmarks({ id, list: [], state: "error" }),
      );
    },
    [maps],
  );
  useEffect(() => {
    if (tab === "nearby" && projectId && sitePin && landmarks?.id !== projectId) fetchLandmarks(projectId, sitePin);
  }, [tab, projectId, sitePin, landmarks?.id, fetchLandmarks]);
  const landmarkState = landmarks?.id === projectId ? landmarks.state : "loading";
  const shownLandmarks = landmarks?.id === projectId && landmarks.state === "ready" ? landmarks.list : NO_LANDMARKS;
  // The map shows the places only while Nearby is open, and the same ones its chips list.
  const mapLandmarks = useMemo(
    () => (tab !== "nearby" ? NO_LANDMARKS : category === "all" ? shownLandmarks : shownLandmarks.filter((l) => l.category === category)),
    [tab, category, shownLandmarks],
  );
  const retryLandmarks = () => {
    if (!projectId || !sitePin) return;
    setLandmarks({ id: projectId, list: [], state: "loading" });
    fetchLandmarks(projectId, sitePin);
  };

  // Drive route to the chosen landmark. "none": Google has no road route; "failed": the request failed (retryable).
  useEffect(() => {
    const from = plan ? siteOrigin(plan) : sitePin;
    if (!maps || !from || !activeLandmark) return;
    const id = activeLandmark.id;
    let live = true;
    driveTo(maps, from, activeLandmark).then(
      (d) => live && setDrive({ id, drive: d, state: d ? "idle" : "none" }),
      () => live && setDrive({ id, drive: null, state: "failed" }),
    );
    return () => {
      live = false;
    };
  }, [maps, plan, sitePin, activeLandmark, driveTry]);
  const currentDrive = activeLandmark ? (drive?.id === activeLandmark.id ? drive : { id: activeLandmark.id, drive: null, state: "loading" as const }) : null;
  const retryDrive = () => {
    setDrive(null);
    setDriveTry((t) => t + 1);
  };

  const switchTo = (id: string) => {
    if (id === active) return;
    setActive(id);
    leaveProject();
    setNotice(null);
  };
  // Picked from the list: focus moves to the plot card (announced, its actions next) and comes back on close.
  const cardRef = useRef<HTMLDivElement>(null);
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null); // the list row a card was opened from; null for map picks
  // Phones and tablets: the map sits above the panel, so a pick or a route brings it into view (no scroll animation:
  // the map's own pan follows it).
  const toMap = useCallback(() => {
    if (!window.matchMedia("(min-width: 64rem)").matches) mapBoxRef.current?.scrollIntoView({ block: "start" });
  }, []);
  const pick = useCallback(
    (n: string) => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setSelected(n);
      setFocus((f) => f + 1);
      toMap();
    },
    [toMap],
  );
  const clearFilters = useCallback(() => setFilters(NO_FILTERS), []);
  useEffect(() => {
    if (focus && opener.current) cardRef.current?.focus({ preventScroll: true });
  }, [focus]);
  // A shared plot: phones start with the map in view, or its card would cover the plot.
  const openedShared = useRef(!!sharedPlot);
  useEffect(() => {
    if (openedShared.current) toMap();
  }, [toMap]);
  const closeCard = useCallback(() => {
    if (cardRef.current?.contains(document.activeElement)) {
      if (opener.current?.isConnected) opener.current.focus();
      else mapBoxRef.current?.focus({ preventScroll: true });
    }
    opener.current = null;
    setSelected(null);
  }, []);
  const onMaps = useCallback((m: Maps | null) => {
    setMaps(m);
    setMapsSettled(true);
    if (!m) {
      // No map now: a route on screen (and its announcement) would describe something that isn't there.
      setActiveLandmark(null);
      setDrive(null);
    }
  }, []);

  const selectedUnit = selected ? unitMap.get(selected) : undefined;
  const interest: InterestId = INTERESTS.find((i) => i.id === project?.id)?.id ?? "other";
  const enquire = () => {
    if (!selectedUnit) return;
    openEnquiry({ interest, plot: { project: project?.name, similar: selectedUnit.s !== "available", number: selectedUnit.n, area: selectedUnit.a, facing: physical ? selectedUnit.f : undefined, roadWidthFt: physical ? selectedUnit.rw : undefined } });
  };
  // Escape closes the plot card from anywhere on the page (not while the enquiry drawer is open: Radix owns it then).
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("[role=dialog]")) closeCard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, closeCard]);

  if (!project) {
    return (
      <div className="grid min-h-[60svh] place-items-center px-5 pt-24 text-center">
        <div className="max-w-md">
          <h1 className="text-h2">Live layouts</h1>
          <p className="mt-3 text-body text-text">No layouts are listed right now. Call or WhatsApp us for current availability.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <a href={`tel:${COMPANY.phoneE164}`}>
                <Phone aria-hidden />
                Call {COMPANY.phone}
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a href={whatsappUrl(WHATSAPP_TEXT.home)} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="size-4 text-whatsapp" />
                WhatsApp
              </a>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/projects">All projects</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const switcher = projects.map((p) => {
    const o = outlines.find((x) => x.id === p.id);
    const list = allUnits[p.id] ?? [];
    return {
      project: p,
      outline: o?.outline ?? null,
      pending: !!o?.pending,
      available: list.filter((u) => u.s === "available").length,
      total: list.length || o?.plotCount || 0,
    };
  });
  const asOf = units.reduce((d, u) => (u.dt && u.dt > d ? u.dt : d), project.inventoryUpdatedAt ?? "");
  const tabPanel = `${uid}-tabpanel`;
  const projectPanel = `${uid}-project`;
  const tabs = hasMapsKey ? TABS : TABS.filter((t) => t.id !== "nearby"); // Nearby comes from Google Maps

  return (
    <div data-layouts-app className="grid grid-cols-1 pt-16 lg:h-svh lg:grid-cols-[minmax(23rem,27rem)_1fr] lg:grid-rows-[auto_minmax(0,1fr)] lg:pt-20">
      <PageEnquiryContext projectName={project.name} projectLocation={project.place} interest={interest} />
      {/* Re-keyed per change, so a second identical message is still read out. */}
      <p className="sr-only" aria-live="polite">
        {announcement ? <span key={announcement.at}>{announcement.text}</span> : null}
      </p>

      {/* Top of the panel: title and switcher (stays put on desktop). */}
      <div className="border-line px-5 pt-6 pb-4 sm:px-8 lg:col-start-1 lg:row-start-1 lg:border-r lg:px-6 lg:pt-5">
        <h1 className="text-h2 lg:text-[1.75rem] lg:leading-tight">Live layouts</h1>
        <p className="mt-1 text-small text-muted lg:[@media(max-height:820px)]:hidden">Every plot on the approved layout, coloured by today&rsquo;s status.</p>
        <div className="mt-4">
          <ProjectSwitcher items={switcher} active={project.id} onChange={switchTo} panelId={projectPanel} />
        </div>
        {/* Always mounted, so the notice is announced when it appears. */}
        <p role="status" className={notice ? "mt-3 rounded-md bg-teal-soft px-3 py-2 text-small text-navy" : "sr-only"}>
          {notice}
        </p>
      </div>

      {/* The map. On phones it ends above the call/WhatsApp bar, and a jump to it stops just under the header (the
          page's scroll padding is taller than the header, hence the negative margin). */}
      <div ref={mapBoxRef} tabIndex={-1} className="relative h-[calc(100svh-22rem)] min-h-[22rem] scroll-mt-[-2.5rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto">
        <LayoutMap
          plan={plan}
          projectName={project.name}
          sitePin={sitePin}
          planFailed={planError === project.id}
          onRetryPlan={retryPlan}
          units={unitMap}
          match={match}
          selected={selected}
          focus={focus}
          flashing={flashing}
          basemap={basemap}
          onBasemap={setBasemap}
          onSelect={(n) => {
            opener.current = null;
            setSelected(n);
            if (n) toMap(); // phones: the card needs the map in full view to leave the plot clear above it
          }}
          landmarks={mapLandmarks}
          nearby={tab === "nearby"}
          activeLandmark={activeLandmark}
          onLandmark={(l) => {
            setActiveLandmark(l);
            if (l) setTab("nearby");
          }}
          drive={currentDrive?.drive ?? null}
          onMaps={onMaps}
          legend={<Legend />}
          cardRef={cardRef}
        />
        {/* Outside the map's own stacking context, so on phones it floats above the panel too. Phones keep it under
            half the screen, so the plot it describes stays in view above it. */}
        {selectedUnit ? (
          <div
            ref={cardRef}
            tabIndex={-1}
            role="region"
            aria-label={`Plot ${selectedUnit.n} details`}
            className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 max-h-[min(45svh,calc(100svh_-_8.75rem_-_env(safe-area-inset-bottom)))] overflow-y-auto rounded-lg border border-line bg-white p-4 shadow-overlay motion-safe:animate-rise sm:inset-x-auto sm:right-6 sm:max-h-[min(70svh,calc(100svh_-_8.75rem_-_env(safe-area-inset-bottom)))] sm:w-96 lg:absolute lg:right-4 lg:bottom-9 lg:z-20"
          >
            <PlotCard unit={selectedUnit} projectName={project.name} physical={physical} onClose={closeCard} onEnquire={enquire} />
          </div>
        ) : null}
      </div>

      {/* The rest of the panel: facts, availability and the tabs (scrolls on desktop). */}
      <div
        id={projectPanel}
        role="tabpanel"
        aria-label={project.name}
        // Relative: its screen-reader-only children are positioned (and clipped) here, not against the page.
        className="border-line px-5 pt-6 pb-28 sm:px-8 lg:relative lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:px-6 lg:pt-2 lg:pb-10"
      >
        <ProjectFacts project={project} />
        <div className="mt-8">
          <Availability
            counts={counts}
            total={units.length}
            asOf={asOf || undefined}
            sample={sample}
            conn={conn}
            syncedAt={syncedAt}
            note={
              <>
                {/* Always mounted, so a refresh problem is announced. */}
                <p role="status" className={error ? "text-small text-status-mortgaged" : "sr-only"}>
                  {error ?? ""}
                </p>
                {recent && recent.project === project.id ? (
                  <p key={recent.at} className="flex items-center gap-2 rounded-md bg-teal-soft px-3 py-2 text-small text-navy motion-safe:animate-rise">
                    <span aria-hidden className="size-1.5 rounded-full bg-teal-deep" />
                    Just now:{" "}
                    {recent.numbers.length === 1 ? `plot ${recent.numbers[0]}` : `${recent.numbers.length} plots`}
                    {recent.to ? ` marked ${UNIT_STATUS_META[recent.to].label}` : " updated"}
                  </p>
                ) : null}
              </>
            }
          />
        </div>

        <div className="mt-5">
          <Segmented
            label="Panel"
            options={tabs}
            value={tab}
            onChange={(t) => {
              setTab(t);
              if (t !== "nearby") setActiveLandmark(null); // a route belongs to Nearby
            }}
            idOf={(t) => `${uid}-tab-${t}`}
            panelId={tabPanel}
            className="flex w-full"
          />
          <div id={tabPanel} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className="mt-5">
            {tab === "plots" ? (
              <div className="space-y-4">
                <PlotFilters filters={filters} onChange={setFilters} counts={chipCounts} facings={facings} physical={physical} />
                <PlotList units={listed} total={units.length} selected={selected} onPick={pick} physical={physical} onClear={clearFilters} />
              </div>
            ) : tab === "nearby" ? (
              <NearbyList
                state={!mapsSettled ? "loading" : !maps ? "unavailable" : !sitePin ? "no-drawing" : landmarkState}
                landmarks={shownLandmarks}
                category={category}
                onCategory={setCategory}
                active={activeLandmark}
                onPick={(l) => {
                  setActiveLandmark(l);
                  if (l) toMap();
                }}
                drive={currentDrive?.drive ?? null}
                driveState={currentDrive?.state ?? "idle"}
                onRetry={retryLandmarks}
                onRetryDrive={retryDrive}
              />
            ) : plan ? (
              <PlanFacts plan={plan} sample={sample} />
            ) : planError === project.id ? (
              <div className="rounded-md border border-dashed border-line-strong px-5 py-6 text-center">
                <p className="text-ui font-semibold text-navy">The layout drawing didn&rsquo;t load</p>
                <p className="mt-1 text-small text-muted">Its land use, roads and areas come from the drawing.</p>
                <Button variant="secondary" size="sm" onClick={retryPlan} className="mt-3">
                  Try again
                </Button>
              </div>
            ) : (
              <div className="h-40 animate-pulse rounded-md bg-mist" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * First paint while the page reads the URL: the same frame as the page (title, the switcher as a strip on phones and
 * a list on desktop, the map, the panel), with quiet shapes, so nothing jumps when the content arrives.
 */
export function LayoutsSkeleton() {
  return (
    <div aria-busy className="grid grid-cols-1 pt-16 lg:h-svh lg:grid-cols-[minmax(23rem,27rem)_1fr] lg:grid-rows-[auto_minmax(0,1fr)] lg:pt-20">
      <div className="px-5 pt-6 pb-4 sm:px-8 lg:border-r lg:border-line lg:px-6 lg:pt-5">
        <h1 className="text-h2 lg:text-[1.75rem] lg:leading-tight">Live layouts</h1>
        <p className="mt-1 text-small text-muted lg:[@media(max-height:820px)]:hidden">Every plot on the approved layout, coloured by today&rsquo;s status.</p>
        <div className="mt-4">
          <div className="-mx-5 flex gap-2 overflow-hidden px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:gap-1 lg:rounded-lg lg:bg-mist lg:p-1.5">
            {Array.from({ length: 4 }, (_, i) => (
              // As tall as the real strip on phones, where one project name wraps to two lines.
              <div key={i} className="flex min-h-[5.125rem] w-[16.5rem] shrink-0 items-center gap-3 rounded-md border border-line px-2.5 py-2 lg:min-h-0 lg:w-auto lg:border-transparent lg:[@media(max-height:820px)]:py-1.5">
                <span className="size-11 shrink-0 animate-pulse rounded-sm bg-mist lg:bg-white lg:[@media(max-height:820px)]:hidden" />
                <span className="flex-1 space-y-1.5">
                  <span className="block h-4 w-3/4 animate-pulse rounded bg-mist-2" />
                  <span className="block h-3 w-1/2 animate-pulse rounded bg-mist-2 lg:[@media(max-height:820px)]:hidden" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="h-[calc(100svh-22rem)] min-h-[22rem] animate-pulse bg-[radial-gradient(circle_at_50%_45%,var(--color-teal-soft),var(--color-mist)_62%)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto" />
      <div className="space-y-3 px-5 pt-6 sm:px-8 lg:border-r lg:border-line lg:px-6 lg:pt-2">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="block h-4 animate-pulse rounded bg-mist-2" style={{ width: `${90 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Status key on the map: solid for open plots, hatched for the rest, as drawn. Compact on phones. */
function Legend() {
  return (
    <ul aria-label="Plot colours" className="flex w-max max-w-full flex-wrap gap-x-2.5 gap-y-1 rounded-md border border-white/60 bg-white/88 px-2.5 py-1.5 shadow-raise backdrop-blur-md md:gap-x-3 md:px-3 md:py-2">
      {UNIT_STATUSES.map((s) => (
        <li key={s} className="flex items-center gap-1.5 text-label text-navy">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={statusSwatch(s)} />
          {UNIT_STATUS_META[s].label}
        </li>
      ))}
    </ul>
  );
}
