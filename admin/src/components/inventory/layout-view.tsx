"use client"
// Layout view: the project's real plot outlines from its approved layout (src/lib/layouts, metres east/north; y is
// flipped for SVG), filled by status with the same patterns as the tiles. Offered for the projects drawn on the
// live layouts app. Shares selection, filters, bulk bar and sheet with the other views. Zoom and pan are
// plain viewBox math (no deps). A tall plan in a wide box is turned a quarter (north to the right) when that draws it
// larger. A live-layout project whose drawing isn't digitised yet says what the live layouts app shows.
import { memo, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { ArrowUpRight, Map as MapIcon, Maximize, Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { liveLayoutUrl } from "@/lib/constants"
import { hasDigitalLayout, layoutInfo, loadLayout, type LayoutPlan, type PlanRing } from "@/lib/layouts"
import { useAssetUrl } from "@/lib/media-store"
import type { Project, ProjectType, Unit, UnitStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

import { STATUS_BY_KEY } from "./model"
import { UnitCard } from "./unit-card"
import type { ClickMode } from "./use-selection"

export { hasDigitalLayout }

/* ---------- geometry ---------- */

const PAD = 12
const MAX_ZOOM = 8
const LABEL_ZOOM = 1.5

const pathOf = (xy: number[][]) => `M${xy.map(([x, y]) => `${x},${-y}`).join("L")}Z`
const ringsPath = (rings: PlanRing[]) => rings.map((r) => [r.outer, ...r.holes].map(pathOf).join("")).join("")

function geometryOf(plan: LayoutPlan) {
  const e = plan.extent!
  const base = { x: e.minX - PAD, y: -e.maxY - PAD, w: e.maxX - e.minX + 2 * PAD, h: e.maxY - e.minY + 2 * PAD }
  return {
    base,
    // The same box after rotate(90), which maps (x, y) to (−y, x).
    baseR: { x: -(base.y + base.h), y: base.x, w: base.h, h: base.w },
    plots: plan.plots.map((p) => ({ number: p.n, d: pathOf(p.xy), cx: p.c[0], cy: -p.c[1] })),
    boundary: plan.boundary ? pathOf(plan.boundary) : "",
    roads: ringsPath([...plan.roads, ...plan.access.map((a) => ({ outer: a.xy, holes: [] }))]),
    greens: ringsPath(plan.greens),
    zones: plan.zones.map((z) => ({ key: z.id, name: z.name, d: pathOf(z.xy), label: { x: z.c[0], y: -z.c[1] } })),
  }
}
type Plot = ReturnType<typeof geometryOf>["plots"][number]

// Literal class names so Tailwind generates them.
const FILL: Record<UnitStatus, string> = {
  available: "fill-status-available-soft",
  sold_out: "fill-status-sold",
  mortgaged: "fill-status-mortgaged",
  registered: "fill-status-registered",
  hold: "fill-status-hold",
}
const INK: Record<UnitStatus, string> = {
  available: "fill-status-available-fg",
  sold_out: "fill-status-sold-on",
  mortgaged: "fill-status-mortgaged-on",
  registered: "fill-status-registered-on",
  hold: "fill-status-hold-on",
}
const PATTERN: Partial<Record<UnitStatus, string>> = { sold_out: "hatch", mortgaged: "dots", registered: "corner", hold: "stripes" }

type ViewBox = { x: number; y: number; w: number; h: number }

function clampBox(v: ViewBox, base: ViewBox): ViewBox {
  const w = Math.min(base.w, Math.max(base.w / MAX_ZOOM, v.w))
  const h = (w / v.w) * v.h
  // Keep the view's centre over the site.
  const cx = Math.min(base.x + base.w, Math.max(base.x, v.x + v.w / 2))
  const cy = Math.min(base.y + base.h, Math.max(base.y, v.y + v.h / 2))
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

/** Zoom by `factor`, keeping point `at` (default: the centre) where it is. */
function zoomAt(v: ViewBox, factor: number, base: ViewBox, at?: { x: number; y: number }): ViewBox {
  const p = at ?? { x: v.x + v.w / 2, y: v.y + v.h / 2 }
  const w = Math.min(base.w, Math.max(base.w / MAX_ZOOM, v.w / factor))
  const k = w / v.w
  return clampBox({ x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k, w, h: v.h * k }, base)
}

/** Counter-rotation that keeps a label upright when the plan is turned. */
const upright = (rot: boolean, x: number, y: number) => (rot ? `rotate(-90 ${x} ${y})` : undefined)

/* ---------- layers (memoised: hover and pan don't re-render 288 paths) ---------- */

const PlotsLayer = memo(function PlotsLayer({
  plots,
  byNumber,
  matchIds,
  uid,
}: {
  plots: Plot[]
  byNumber: Map<string, Unit>
  matchIds: ReadonlySet<string> | null
  uid: string
}) {
  return (
    <g>
      {plots.map((p) => {
        const u = byNumber.get(p.number)
        if (!u) return <path key={p.number} d={p.d} className="fill-muted stroke-background" strokeWidth={0.35} />
        // Outside the filter: flat muted, no pattern (not faded, so it can't pass for a soft Available plot).
        if (matchIds && !matchIds.has(u.id)) {
          return <path key={p.number} data-id={u.id} d={p.d} className="cursor-pointer fill-muted stroke-background" strokeWidth={0.35} />
        }
        // Available: soft fill with an -fg edge, like the tiles.
        if (u.status === "available") {
          return (
            <path
              key={p.number}
              data-id={u.id}
              d={p.d}
              className="cursor-pointer fill-status-available-soft stroke-status-available-fg"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )
        }
        const pattern = PATTERN[u.status]
        return (
          <g key={p.number} data-id={u.id} className="cursor-pointer">
            <path d={p.d} className={cn(FILL[u.status], "stroke-background")} strokeWidth={0.35} />
            {pattern ? <path d={p.d} fill={`url(#${uid}-${pattern})`} pointerEvents="none" /> : null}
          </g>
        )
      })}
    </g>
  )
})

const LabelsLayer = memo(function LabelsLayer({
  plots,
  byNumber,
  matchIds,
  rot,
}: {
  plots: Plot[]
  byNumber: Map<string, Unit>
  matchIds: ReadonlySet<string> | null
  rot: boolean
}) {
  return (
    <g pointerEvents="none" className="font-condensed" fontSize={4.2} fontWeight={600} textAnchor="middle" dominantBaseline="central">
      {plots.map((p) => {
        const u = byNumber.get(p.number)
        const ink = !u || (matchIds && !matchIds.has(u.id)) ? "fill-muted-foreground" : INK[u.status]
        return (
          <text key={p.number} x={p.cx} y={p.cy} transform={upright(rot, p.cx, p.cy)} className={ink}>
            {p.number}
          </text>
        )
      })}
    </g>
  )
})

/* ---------- the map ---------- */

export function LayoutView({
  plan,
  units,
  type,
  project,
  selected,
  active,
  matchIds,
  onClickUnit,
  onOpen,
  onStatusKey,
  onClear,
  onSelectAll,
}: {
  plan: LayoutPlan
  units: Unit[]
  type: ProjectType
  project: Project
  selected: ReadonlySet<string>
  active: string | null
  matchIds: ReadonlySet<string> | null
  onClickUnit: (id: string, mode: ClickMode, order: readonly string[]) => void
  onOpen: (id: string) => void
  onStatusKey: (status: UnitStatus) => void
  onClear: () => void
  onSelectAll: () => void
}) {
  const uid = useId().replace(/[^\w-]/g, "")
  const boxRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; vb: ViewBox; id: string | null; moved: boolean } | null>(null)
  const geo = useMemo(() => geometryOf(plan), [plan])
  const BASE = geo.base
  const PLOTS = geo.plots
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [vb, setVb] = useState<ViewBox>(BASE)
  const [vbRot, setVbRot] = useState(false)
  const [hover, setHover] = useState<{ id: string; x: number; y: number; w: number; h: number } | null>(null)

  // Fit: turn the plan a quarter when that draws it larger in this box. A new orientation starts fitted.
  const rot = !!size && Math.min(size.w / BASE.h, size.h / BASE.w) > Math.min(size.w / BASE.w, size.h / BASE.h)
  const base = rot ? geo.baseR : BASE
  if (vbRot !== rot) {
    setVbRot(rot)
    setVb(base)
  }

  const byNumber = useMemo(() => new Map(units.map((u) => [u.number, u])), [units])
  const byId = useMemo(() => new Map(units.map((u) => [u.id, u])), [units])
  const order = useMemo(
    () => PLOTS.map((p) => byNumber.get(p.number)?.id).filter((id): id is string => !!id),
    [byNumber, PLOTS],
  )
  const zoom = base.w / vb.w
  // Patterns are sized in screen pixels, as on the tiles, so they read at any zoom. px = map units per pixel.
  const px = size ? 1 / Math.min(size.w / vb.w, size.h / vb.h) : 0.6

  const zoomBy = (factor: number) => setVb((v) => zoomAt(v, factor, base))

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      if (w > 0 && h > 0) setSize({ w, h }) // 0 × 0 while the route is hidden: keep the last size
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Ctrl + wheel (a trackpad pinch sends ctrlKey too) zooms; a plain wheel scrolls the page. Non-passive so the
  // zoom can stop the browser zooming the whole page.
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const m = svgRef.current?.getScreenCTM()
      const at = m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : null
      const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015))
      setVb((v) => zoomAt(v, factor, base, at ? { x: at.x, y: at.y } : undefined))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [base])

  const unitIdAt = (target: EventTarget) => (target as Element).closest<SVGElement>("[data-id]")?.dataset.id ?? null

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, vb, id: unitIdAt(e.target), moved: false }
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const d = drag.current
    if (d) {
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.moved && Math.hypot(dx, dy) > 4) {
        d.moved = true
        e.currentTarget.setPointerCapture(e.pointerId)
        setHover(null)
      }
      if (d.moved) {
        const r = e.currentTarget.getBoundingClientRect()
        const perPx = Math.max(d.vb.w / r.width, d.vb.h / r.height)
        setVb(clampBox({ ...d.vb, x: d.vb.x - dx * perPx, y: d.vb.y - dy * perPx }, base))
      }
      return
    }
    if (e.pointerType === "touch") return
    const id = unitIdAt(e.target)
    const box = boxRef.current?.getBoundingClientRect()
    if (!id || !box) return setHover(null)
    if (hover?.id !== id) setHover({ id, x: e.clientX - box.left, y: e.clientY - box.top, w: box.width, h: box.height })
  }

  function onPointerUp(e: PointerEvent<SVGSVGElement>) {
    const d = drag.current
    drag.current = null
    if (!d || d.moved || !d.id) return
    const mode: ClickMode = e.shiftKey ? "range"
      : e.ctrlKey || e.metaKey || e.pointerType === "touch" ? "toggle" : "replace"
    onClickUnit(d.id, mode, order)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const k = e.key
    const mod = e.ctrlKey || e.metaKey
    const cur = active && byId.has(active) ? active : null // the plot found with / (dashed outline)
    const pan = (fx: number, fy: number) => setVb((v) => clampBox({ ...v, x: v.x + fx * v.w, y: v.y + fy * v.h }, base))
    if (mod && (k === "a" || k === "A")) onSelectAll()
    else if (mod || e.altKey) return
    else if (k === " " && cur) onClickUnit(cur, "toggle", order)
    else if (k === "Enter" && cur) onOpen(cur)
    else if (k === "+" || k === "=") zoomBy(1.5)
    else if (k === "-" || k === "_") zoomBy(1 / 1.5)
    else if (k === "0") setVb(base)
    else if (k === "ArrowLeft") pan(-0.15, 0)
    else if (k === "ArrowRight") pan(0.15, 0)
    else if (k === "ArrowUp") pan(0, -0.15)
    else if (k === "ArrowDown") pan(0, 0.15)
    else if (STATUS_BY_KEY[k]) onStatusKey(STATUS_BY_KEY[k])
    else if (k === "Escape" && selected.size) onClear()
    else return
    e.preventDefault()
  }

  const hoverUnit = hover ? byId.get(hover.id) : undefined
  const selectedPlots = PLOTS.filter((p) => {
    const u = byNumber.get(p.number)
    return u && selected.has(u.id)
  })
  const activePlot = active ? PLOTS.find((p) => byNumber.get(p.number)?.id === active) : undefined
  const noun = type.unitNoun.toLowerCase()

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={boxRef}
        tabIndex={0}
        role="group"
        aria-roledescription="map"
        aria-label={`Master plan, ${project.name}`}
        aria-describedby={`${uid}-help`}
        onKeyDown={onKeyDown}
        className="relative h-[min(56svh,760px)] min-h-80 touch-none overflow-hidden rounded-xl border bg-card outline-none select-none pointer-coarse:touch-pan-y focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring md:h-[min(72svh,760px)]"
      >
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="size-full"
          aria-hidden
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null
          }}
          onPointerLeave={() => setHover(null)}
          onDoubleClick={(e) => {
            const id = unitIdAt(e.target)
            if (id) onOpen(id)
          }}
        >
          <defs>
            {/* Same on-screen size and angle as the tile patterns: 2px stripe every 6px "/", 1.1px dots every 5px. */}
            <pattern id={`${uid}-hatch`} width={6 * px} height={6 * px} patternUnits="userSpaceOnUse" patternTransform={`rotate(${rot ? -45 : 45})`}>
              <rect width={2 * px} height={6 * px} style={{ fill: "oklch(0 0 0 / 0.18)" }} />
            </pattern>
            <pattern id={`${uid}-dots`} width={5 * px} height={5 * px} patternUnits="userSpaceOnUse">
              <circle cx={2.5 * px} cy={2.5 * px} r={1.1 * px} style={{ fill: "oklch(0.3 0.07 55 / 0.3)" }} />
            </pattern>
            {/* Hold: 1.5px dark stripe every 5px, level on screen like the tiles. */}
            <pattern id={`${uid}-stripes`} width={5 * px} height={5 * px} patternUnits="userSpaceOnUse" patternTransform={rot ? "rotate(-90)" : undefined}>
              <rect width={5 * px} height={1.5 * px} style={{ fill: "oklch(0 0 0 / 0.2)" }} />
            </pattern>
            {/* Folded corner of each plot's bounding box, top right on screen like the tiles. */}
            <pattern id={`${uid}-corner`} width={1} height={1} patternContentUnits="objectBoundingBox">
              <path d={rot ? "M0,0 L0.34,0 L0,0.34 Z" : "M0.66,0 L1,0 L1,0.34 Z"} style={{ fill: "oklch(1 0 0 / 0.9)" }} />
            </pattern>
          </defs>

          <g transform={rot ? "rotate(90)" : undefined}>
            {geo.boundary ? <path d={geo.boundary} className="fill-muted stroke-border" strokeWidth={0.6} /> : null}
            {geo.zones.map((z) => (
              <path key={z.key} d={z.d} className="fill-muted-foreground/10" />
            ))}
            <path d={geo.greens} className="fill-muted-foreground/15" />
            <path d={geo.roads} className="fill-background" fillRule="evenodd" />

            <PlotsLayer plots={PLOTS} byNumber={byNumber} matchIds={matchIds} uid={uid} />

            {zoom >= LABEL_ZOOM ? <LabelsLayer plots={PLOTS} byNumber={byNumber} matchIds={matchIds} rot={rot} /> : null}

            <g pointerEvents="none" className="fill-muted-foreground font-medium" textAnchor="middle">
              {geo.zones.map((z) =>
                z.label && z.name && z.key !== "clubhouse" ? (
                  <text key={z.key} x={z.label.x} y={z.label.y} transform={upright(rot, z.label.x, z.label.y)} fontSize={zoom >= LABEL_ZOOM ? 4 : 6}>
                    {z.name}
                  </text>
                ) : null,
              )}
            </g>

            {/* Selection: background gap + foreground ring, as on the tiles. Drawn last so it sits on top. */}
            <g pointerEvents="none" fill="none">
              {selectedPlots.map((p) => (
                <path key={`g${p.number}`} d={p.d} className="stroke-background" strokeWidth={4} vectorEffect="non-scaling-stroke" />
              ))}
              {selectedPlots.map((p) => (
                <path key={`r${p.number}`} d={p.d} className="stroke-foreground" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              ))}
              {activePlot ? (
                <path d={activePlot.d} className="stroke-ring" strokeWidth={2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
              ) : null}
            </g>
          </g>
        </svg>

        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <Button variant="outline" size="icon-sm" className="pointer-coarse:size-10" aria-label="Zoom in" title="Zoom in (+)" onClick={() => zoomBy(1.5)} disabled={zoom >= MAX_ZOOM - 0.01}>
            <Plus />
          </Button>
          <Button variant="outline" size="icon-sm" className="pointer-coarse:size-10" aria-label="Zoom out" title="Zoom out (-)" onClick={() => zoomBy(1 / 1.5)} disabled={zoom <= 1.01}>
            <Minus />
          </Button>
          <Button variant="outline" size="icon-sm" className="pointer-coarse:size-10" aria-label="Fit to screen" title="Fit to screen (0)" onClick={() => setVb(base)} disabled={zoom <= 1.01}>
            <Maximize />
          </Button>
        </div>
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground tabular-nums">
          {rot ? "North → · " : ""}
          {Math.round(zoom * 100)}%
        </p>

        {hover && hoverUnit ? (
          <UnitCard
            unit={hoverUnit}
            type={type}
            project={project}
            style={{
              left: Math.max(8, Math.min(hover.x + 14, hover.w - 264)),
              top: hover.y + 14,
              transform: hover.y > hover.h / 2 ? "translateY(calc(-100% - 28px))" : undefined,
            }}
          />
        ) : null}
      </div>
      <p id={`${uid}-help`} className="text-xs text-muted-foreground">
        {type.unitNoun} outlines from the {plan.source.title}{rot ? ", turned so north is to the right" : ""}. Drag to pan,
        Ctrl + scroll to zoom, or use + and −. Click to select, Shift or Ctrl to add, double-click for details. Find
        a {noun} with /, Space to select, Enter to open. Keys 1–5 set the status of the selection.
      </p>
    </div>
  )
}

/* ---------- loads the project's drawing (one chunk per project), then shows it ---------- */

export function ProjectLayout(props: Omit<Parameters<typeof LayoutView>[0], "plan">) {
  const id = props.project.id
  const [loaded, setLoaded] = useState<{ id: string; plan: LayoutPlan | null } | null>(null)
  useEffect(() => {
    let live = true
    loadLayout(id).then(
      (plan) => live && setLoaded({ id, plan }),
      () => live && setLoaded({ id, plan: null }),
    )
    return () => {
      live = false
    }
  }, [id])
  if (loaded?.id === id && loaded.plan) return <LayoutView {...props} plan={loaded.plan} />
  if (loaded?.id === id) {
    return (
      <Empty className="border border-solid py-12">
        <EmptyHeader>
          <EmptyTitle>Couldn&rsquo;t load the layout drawing</EmptyTitle>
          <EmptyDescription>Check the connection and reload. Grid and Table work meanwhile.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  return <div aria-busy aria-label="Loading the layout" className="h-[min(56svh,760px)] min-h-80 animate-pulse rounded-xl border bg-muted/40 md:h-[min(72svh,760px)]" />
}

/* ---------- projects without plot outlines ---------- */

/** Layout view of a live-layout project whose approved drawing isn't digitised yet. */
export function NoLayout({ project, type }: { project: Project; type: ProjectType }) {
  const plan = project.media.masterPlan
  const url = useAssetUrl(plan)
  const href = url && plan ? (plan.kind === "pdf" ? `${url}#page=${project.media.masterPlanPage || 1}` : url) : null
  const source = layoutInfo(project.id)?.source
  const live = project.publishing.state === "published" ? liveLayoutUrl(project.id) : null
  return (
    <Empty className="border border-solid py-12">
      <EmptyHeader>
        <EmptyMedia>
          <MapIcon aria-hidden className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Drawing pending</EmptyTitle>
        <EmptyDescription>
          {type.unitNoun} outlines go on the map once the {source?.title ?? "approved layout"}
          {source?.reference ? ` (LP ${source.reference})` : ""} is digitised. Until then the live layouts page shows the
          site pin and its status counts, and status changes made in Grid or Table reach it at once.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row flex-wrap justify-center">
        {live ? (
          <Button variant="outline" asChild>
            <a href={live} target="_blank" rel="noopener noreferrer">
              See it on the live page
              <ArrowUpRight data-icon="inline-end" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        ) : null}
        {href && plan ? (
          <Button variant="ghost" asChild>
            <a href={href} target="_blank" rel="noreferrer">
              {plan.kind === "pdf" ? `Open master plan (PDF page ${project.media.masterPlanPage || 1})` : "Open master plan"}
              <ArrowUpRight data-icon="inline-end" />
            </a>
          </Button>
        ) : null}
      </EmptyContent>
    </Empty>
  )
}
