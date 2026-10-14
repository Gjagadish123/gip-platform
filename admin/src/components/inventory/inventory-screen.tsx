"use client"
// Inventory body for /projects/[id]/inventory (the project header and tabs come from the [id] layout).
// One state for every view: filters, selection, cursor, sheet and bulk changes are shared by Grid, Table and
// Layout, so a plot selected on the map is selected in the table too (inventory-ux §4).
import {
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { getProjectType, UNIT_STATUS_META } from "@/lib/constants"
import { canTransition, compressRanges, isGuarded, naturalCompare, statusCounts } from "@/lib/inventory"
import { GC6_PROJECT_ID } from "@/lib/mock"
import { todayIso, useDemo, useProject, useUnits, type StatusChangeOptions } from "@/lib/store"
import type { Project, ProjectType, Unit, UnitStatus } from "@/lib/types"

import { BulkBar, RemoveUnitsDialog } from "./bulk-bar"
import { GenerateDialog, InventoryEmpty } from "./generate"
import { hasDigitalLayout, LayoutView, NoLayout } from "./layout-view"
import {
  activeFilterCount,
  countLabel,
  describeFilters,
  isTowerType,
  matchesFilters,
  NO_FILTERS,
  rowDomId,
  tileDomId,
  unitName,
  type InventoryView,
  type UnitFilters,
} from "./model"
import { PlotGrid, TowerMatrix, TowerTabs, towersOf } from "./plot-grid"
import { StatusChangeDialog, type StatusRequest } from "./status-change"
import type { TileGridHandlers } from "./tile-grid"
import { FiltersPopover, InventorySummary, SelectMenu, UnitSearch, ViewSwitch } from "./toolbar"
import { UnitSheet, type UnitSheetHandle } from "./unit-sheet"
import { sortRows, UnitTable, type TableSort } from "./unit-table"
import { useInventoryView, useSelection } from "./use-selection"

export function InventoryScreen({ projectId }: { projectId: string }) {
  const project = useProject(projectId)
  const units = useUnits(projectId)

  if (!project) return null // ProjectFrame (the [id] layout) shows "Project not found"
  const type = getProjectType(project.typeId)
  if (!type.hasInventory) {
    return (
      <Empty className="border border-solid py-12">
        <EmptyHeader>
          <EmptyTitle className="text-base font-semibold">No inventory for {type.name}</EmptyTitle>
          <EmptyDescription>This project type has a listing and a detail page, but no units to track.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  return <InventoryBody key={project.id} project={project} type={type} units={units} />
}

function sampleNoteFor(project: Project, units: Unit[]): string | undefined {
  if (project.sample) return "Sample project: every unit and status here is generated for the demo."
  if (!units.some((u) => u.sample)) return undefined
  if (project.id === GC6_PROJECT_ID) {
    return "Sold plots from the brochure scan of 21 Sep 2026; Registered/Mortgaged split is sample data."
  }
  return "The unit count is real; sizes and statuses are sample data for this demo."
}

interface UndoRecord {
  batchId: string
  message: string
}

/** Undo toasts sit at the top so they never cover the bulk bar at the bottom of the screen. */
const TOAST_AT = { position: "top-center" } as const

function InventoryBody({ project, type, units }: { project: Project; type: ProjectType; units: Unit[] }) {
  const { actions, hydrated } = useDemo()
  const [savedView, setSavedView] = useInventoryView()
  const [viewPicked, setViewPicked] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ReadonlySet<UnitStatus>>(() => new Set())
  const [filters, setFilters] = useState<UnitFilters>(NO_FILTERS)
  const [query, setQuery] = useState("")
  const [sel, api] = useSelection()
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [request, setRequest] = useState<StatusRequest | null>(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [removeIds, setRemoveIds] = useState<string[] | null>(null)
  const [tower, setTower] = useState("")
  const [tableSort, setTableSort] = useState<TableSort>(null)
  const [announcement, setAnnouncement] = useState("")
  const undoStack = useRef<UndoRecord[]>([])
  const requestKey = useRef(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const sheetRef = useRef<UnitSheetHandle>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const dialogReturn = useRef<HTMLElement | null>(null)

  /* ---------- derived ---------- */

  // The view choice is shared by every project. "Layout" saved on Global City VI shows Grid on a project
  // without plot outlines, without overwriting the saved choice; picking a view here is honoured as is.
  const view: InventoryView =
    !viewPicked && savedView === "layout" && !hasDigitalLayout(project.id) ? "grid" : savedView
  const towerMode = isTowerType(type)
  const sorted = useMemo(() => [...units].sort((a, b) => naturalCompare(a.number, b.number)), [units])
  const byId = useMemo(() => new Map(units.map((u) => [u.id, u])), [units])
  const filtered = useMemo(() => sorted.filter((u) => matchesFilters(u, filters)), [sorted, filters])
  const counts = useMemo(() => statusCounts(filtered), [filtered])
  const matching = useMemo(
    () => (statusFilter.size ? filtered.filter((u) => statusFilter.has(u.status)) : filtered),
    [filtered, statusFilter],
  )
  const filtering = statusFilter.size > 0 || activeFilterCount(filters) > 0
  const matchIds = useMemo(() => (filtering ? new Set(matching.map((u) => u.id)) : null), [filtering, matching])
  const eligible = useMemo(() => (matchIds ? (id: string) => matchIds.has(id) : null), [matchIds])

  const towers = useMemo(() => (towerMode ? towersOf(sorted) : []), [towerMode, sorted])
  const currentTower = towers.some((t) => t.name === tower) ? tower : (towers[0]?.name ?? "")
  const towerUnits = useMemo(() => towers.find((t) => t.name === currentTower)?.units ?? [], [towers, currentTower])

  const tableRows = useMemo(() => sortRows(matching, tableSort, type, project), [matching, tableSort, type, project])
  const tableOrder = useMemo(() => tableRows.map((u) => u.id), [tableRows])

  // What the current view shows, in its own order: "Select all shown", sheet ‹ › and Save & next use it.
  const shown = useMemo(() => {
    if (view === "table") return tableRows
    if (towerMode && view === "grid") {
      return towerUnits
        .filter((u) => !matchIds || matchIds.has(u.id))
        .sort((a, b) => (b.floor ?? 0) - (a.floor ?? 0) || naturalCompare(a.number, b.number))
    }
    return matching
  }, [view, tableRows, towerMode, towerUnits, matchIds, matching])
  const shownIds = useMemo(() => shown.map((u) => u.id), [shown])
  const shownCounts = useMemo(() => statusCounts(shown), [shown])

  const selectedUnits = useMemo(() => sorted.filter((u) => sel.selected.has(u.id)), [sorted, sel.selected])
  const searchHit = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? (sorted.find((u) => u.number.toLowerCase() === q) ?? null) : null
  }, [query, sorted])
  const blocks = useMemo(() => {
    if (!units.some((u) => u.block)) return []
    const m = new Map<string, number>()
    for (const u of shown) m.set(u.block ?? "", (m.get(u.block ?? "") ?? 0) + 1)
    return [...new Set(sorted.map((u) => u.block ?? ""))].map((name) => ({ name, count: m.get(name) ?? 0 }))
  }, [units, shown, sorted])

  /* ---------- focus: never drop to <body> when the control that had it unmounts ---------- */

  /** The current view's own focus target: the grid listbox, the map, or the table's first control. */
  const focusView = useCallback(() => {
    viewRef.current?.querySelector<HTMLElement>('[tabindex="0"], button:not(:disabled), a[href]')?.focus({ preventScroll: true })
  }, [])
  const refocus = useCallback(
    // A connected trigger can still refuse focus (the bulk bar's "Sold Out" disables once every pick is Sold Out).
    (el: HTMLElement | null) => {
      el?.focus({ preventScroll: true }) // the bulk bar is sticky: a plain focus() scrolls to its in-flow spot
      if (!el || document.activeElement !== el) focusView()
    },
    [focusView],
  )

  /* ---------- feedback, undo. Toasted messages are spoken by sonner's own live region. ---------- */

  const announce = useCallback((msg: string) => setAnnouncement((a) => (a === msg ? `${msg} ` : msg)), [])

  const undo = useCallback((batchId?: string) => {
    const stack = undoStack.current
    const rec = batchId ? stack.find((r) => r.batchId === batchId) : stack[stack.length - 1]
    if (!rec) {
      announce("Nothing to undo.")
      return
    }
    undoStack.current = stack.filter((r) => r !== rec)
    if (actions.undoBatch(rec.batchId)) toast(`Undone: ${rec.message}`, TOAST_AT)
  }, [actions, announce])

  const remember = useCallback((batchId: string, message: string) => {
    if (!batchId) return
    undoStack.current = [...undoStack.current.slice(-19), { batchId, message }]
    toast(message, { ...TOAST_AT, duration: 10_000, action: { label: "Undo", onClick: () => undo(batchId) } })
  }, [undo])

  // One message per selection change (debounced, so a Shift+arrow run speaks once), including Clear.
  const selSize = sel.selected.size
  const lastSize = useRef(selSize)
  useEffect(() => {
    if (lastSize.current === selSize) return
    lastSize.current = selSize
    const t = setTimeout(() => announce(selSize ? `${countLabel(type, selSize)} selected` : "Selection cleared"), 300)
    return () => clearTimeout(t)
  }, [selSize, type, announce])

  /* ---------- status changes ---------- */

  function apply(ids: string[], to: UnitStatus, opts: StatusChangeOptions) {
    if (!ids.length) return
    const batchId = actions.setUnitStatuses(project.id, ids, to, opts)
    const one = ids.length === 1 ? byId.get(ids[0]) : undefined
    remember(batchId, `${one ? unitName(type, one) : countLabel(type, ids.length)} marked ${UNIT_STATUS_META[to].label}`)
  }

  function requestStatus(to: UnitStatus) {
    const ids = selectedUnits.length ? selectedUnits.map((u) => u.id) : sel.active ? [sel.active] : []
    const targets = ids.map((id) => byId.get(id)).filter((u): u is Unit => !!u)
    if (!targets.length) return
    const changing = targets.filter((u) => u.status !== to)
    if (!changing.length) {
      const who = targets.length === 1 ? unitName(type, targets[0]) : `All ${countLabel(type, targets.length)}`
      toast(`${who} already ${UNIT_STATUS_META[to].label}. Nothing changed.`)
      return
    }
    // ≤ 10 plain changes apply at once (undo toast); more, or any guarded/flagged transition, confirm first.
    const confirm = changing.length > 10 || changing.some((u) => {
      const c = canTransition(u.status, to, type)
      return isGuarded(c) || !!c.warn
    })
    if (confirm) {
      dialogReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setRequest({ key: ++requestKey.current, to, ids: targets.map((u) => u.id), today: todayIso() })
    }
    else apply(changing.map((u) => u.id), to, {})
  }

  /* ---------- add / remove units ---------- */

  function openGenerate() {
    dialogReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setGenerateOpen(true)
  }

  function requestRemove() {
    dialogReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setRemoveIds(selectedUnits.map((u) => u.id))
  }

  function remove(ids: string[]) {
    const drop = new Set(ids)
    const numbers = units.filter((u) => drop.has(u.id)).map((u) => u.number)
    setRemoveIds(null)
    if (sheetId && drop.has(sheetId)) setSheetId(null)
    api.clear()
    const batchId = actions.replaceUnits(project.id, units.filter((u) => !drop.has(u.id)))
    remember(batchId, `Removed ${countLabel(type, numbers.length)}: ${compressRanges(numbers)}`)
  }

  /* ---------- sheet ---------- */

  const scrollToUnit = useCallback((id: string, block: ScrollLogicalPosition = "nearest") => {
    requestAnimationFrame(() => {
      const el = document.getElementById(tileDomId(id)) ?? document.getElementById(rowDomId(id))
      el?.scrollIntoView({ block, inline: "nearest" })
    })
  }, [])

  const openSheet = useCallback((id: string) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    api.activate(id)
    setSheetId(id)
  }, [api])

  function navigateSheet(id: string | null) {
    if (!id) {
      setSheetId(null)
      // Clear a ?unit= deep link so the same link opens the sheet again next time.
      if (new URLSearchParams(window.location.search).has("unit")) {
        window.history.replaceState(null, "", window.location.pathname)
      }
      return
    }
    const u = byId.get(id)
    if (u?.tower && towerMode) setTower(u.tower)
    api.activate(id)
    setSheetId(id)
    scrollToUnit(id)
  }

  function openByNumber(number: string) {
    // Consume the deep link: Back to this page (or a repeat of the same link) must not reopen or re-prompt.
    window.history.replaceState(null, "", window.location.pathname)
    const u = sorted.find((x) => x.number.toLowerCase() === number.trim().toLowerCase())
    if (!u) {
      announce(`${type.unitNoun} ${number} not found.`)
      return
    }
    // Unsaved edits in the open sheet: the sheet asks Save / Discard / Stay before switching.
    const sheet = sheetRef.current
    if (sheet?.dirty && sheetId !== u.id) {
      sheet.leave(u.id)
      return
    }
    if (u.tower && towerMode) setTower(u.tower)
    returnFocus.current = null
    api.activate(u.id)
    setSheetId(u.id)
    scrollToUnit(u.id, "center")
  }

  /* ---------- page-level keys, hidden-route cleanup ---------- */

  const onUndoKey = useEffectEvent(() => undo())
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null
      const typing = t?.closest("input, textarea, select, [contenteditable=true], [role=combobox]")
      const overlay = t?.closest("[role=dialog], [role=alertdialog], [role=menu]")
      if (typing || overlay || e.altKey) return
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault()
        onUndoKey()
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Next keeps this route mounted (hidden) after navigating away: close transient overlays when it hides. A sheet
  // with unsaved edits stays open (hidden with the route) so Back returns to it instead of dropping the edits.
  const onHide = useEffectEvent(() => {
    if (!sheetRef.current?.dirty) setSheetId(null)
    setRequest(null)
    setGenerateOpen(false)
    setRemoveIds(null)
  })
  useLayoutEffect(() => () => onHide(), [])

  /* ---------- handlers handed to the views ---------- */

  const gridHandlers: TileGridHandlers = {
    onClickTile: (id, mode, order) => api.click(id, mode, order, eligible),
    onMove: (id, extend, order) => api.move(id, extend, order, eligible),
    onToggle: api.toggle,
    onOpen: openSheet,
    onStatusKey: requestStatus,
    onClear: api.clear,
    onSelectAll: () => api.replace(shownIds),
  }
  const onSelectGroup = useCallback(
    (ids: string[], additive: boolean) => {
      const keep = eligible ? ids.filter(eligible) : ids
      if (additive) api.add(keep)
      else api.replace(keep)
    },
    [api, eligible],
  )
  const onTableCheck = useCallback(
    (id: string, shift: boolean) => api.click(id, shift ? "range" : "toggle", tableOrder, null),
    [api, tableOrder],
  )

  function onToggleStatus(s: UnitStatus, only: boolean) {
    let next: Set<UnitStatus>
    if (only) next = statusFilter.size === 1 && statusFilter.has(s) ? new Set() : new Set([s])
    else {
      next = new Set(statusFilter)
      if (next.has(s)) next.delete(s)
      else next.add(s)
    }
    setStatusFilter(next)
    const label = UNIT_STATUS_META[s].label
    announce(next.has(s) ? `${label}: ${countLabel(type, counts[s])}` : next.size ? `${label} filter off` : "Showing all statuses")
  }

  function onSearch(v: string) {
    setQuery(v)
    const q = v.trim().toLowerCase()
    const hit = q ? sorted.find((u) => u.number.toLowerCase() === q) : undefined
    if (!hit) return
    if (hit.tower && towerMode) setTower(hit.tower)
    api.activate(hit.id)
    scrollToUnit(hit.id, "center")
  }

  const sheetUnit = sheetId ? (byId.get(sheetId) ?? null) : null
  const openId = sheetUnit ? sheetUnit.id : null
  const filtersText = describeFilters(filters, type.areaUnit)
  const unitsNoun = type.unitNounPlural.toLowerCase()

  /* ---------- render ---------- */

  const deepLink = (
    <Suspense fallback={null}>
      <UnitParam ready={hydrated} onUnit={openByNumber} />
    </Suspense>
  )

  const generate = (
    <GenerateDialog
      open={generateOpen}
      onOpenChange={setGenerateOpen}
      project={project}
      type={type}
      units={units}
      // The empty state's button unmounts once units exist: land on the new grid instead of <body>.
      onCloseAutoFocus={() => refocus(dialogReturn.current)}
      onDone={(batchId, message) => {
        setGenerateOpen(false)
        remember(batchId, message)
      }}
    />
  )

  if (!units.length) {
    return (
      <>
        <h2 className="sr-only">Inventory</h2>
        <InventoryEmpty type={type} onGenerate={openGenerate} />
        {generate}
        <div aria-live="polite" className="sr-only">{announcement}</div>
      </>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <h2 className="sr-only">Inventory</h2>
      <InventorySummary
        type={type}
        total={units.length}
        counts={counts}
        statusFilter={statusFilter}
        onToggleStatus={onToggleStatus}
        onClearStatus={() => {
          focusView() // "Show all statuses" unmounts with the filter
          setStatusFilter(new Set())
          announce("Showing all statuses")
        }}
        onSelectShown={() => api.replace(shownIds)}
        shownCount={shown.length}
        filtersText={filtersText}
        onClearFilters={() => setFilters(NO_FILTERS)}
        updatedAt={project.inventoryUpdatedAt}
        sampleNote={sampleNoteFor(project, units)}
      />

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Inventory tools" className="flex flex-wrap items-center gap-3">
          <UnitSearch
            ref={searchRef}
            type={type}
            value={query}
            onChange={onSearch}
            onSubmit={() => searchHit && openSheet(searchHit.id)}
            notFound={!!query.trim() && !searchHit}
          />
          <FiltersPopover type={type} units={units} filters={filters} onChange={setFilters} />
          <SelectMenu
            shownCount={shown.length}
            shownCounts={shownCounts}
            blocks={blocks}
            hasSelection={selectedUnits.length > 0}
            onSelectShown={() => api.replace(shownIds)}
            onSelectStatus={(s) => api.replace(shown.filter((u) => u.status === s).map((u) => u.id))}
            onSelectBlock={(b) => api.replace(shown.filter((u) => (u.block ?? "") === b).map((u) => u.id))}
            onInvert={() => api.invert(shownIds)}
            onClear={api.clear}
          />
          <div className="ml-auto flex items-center gap-2">
            {towerMode ? null : (
              <Button variant="ghost" onClick={openGenerate} aria-label={`Add ${unitsNoun}`} title={`Add ${unitsNoun}`}>
                <Plus data-icon="inline-start" />
                <span className="hidden sm:inline">Add {unitsNoun}</span>
              </Button>
            )}
            <ViewSwitch
              value={view}
              onChange={(v) => {
                setViewPicked(true)
                setSavedView(v)
              }}
            />
          </div>
        </div>

        {towerMode && view === "grid" ? (
          <div className="flex flex-wrap items-center gap-3">
            <TowerTabs towers={towers} value={currentTower} onChange={setTower} />
            <Button variant="ghost" onClick={openGenerate}>
              <Plus data-icon="inline-start" />
              Add tower
            </Button>
          </div>
        ) : null}
      </div>

      <div ref={viewRef} className="min-w-0">
        {view === "table" ? (
          <UnitTable
            rows={tableRows}
            total={units.length}
            type={type}
            project={project}
            sort={tableSort}
            onSortChange={setTableSort}
            selected={sel.selected}
            highlight={searchHit?.id ?? null}
            onCheck={onTableCheck}
            onCheckAll={(checked) => (checked ? api.add(tableOrder) : api.remove(tableOrder))}
            onOpen={openSheet}
            onResetFilters={filtering ? () => {
              setFilters(NO_FILTERS)
              setStatusFilter(new Set())
            } : undefined}
          />
        ) : view === "layout" ? (
          hasDigitalLayout(project.id) ? (
            <LayoutView
              units={sorted}
              type={type}
              project={project}
              selected={sel.selected}
              active={sel.active}
              matchIds={matchIds}
              onClickUnit={(id, mode, order) => api.click(id, mode, order, eligible)}
              onOpen={openSheet}
              onStatusKey={requestStatus}
              onClear={api.clear}
              onSelectAll={() => api.replace(shownIds)}
            />
          ) : (
            <NoLayout project={project} type={type} />
          )
        ) : (
          <div className="flex flex-col gap-3">
            {towerMode ? (
              <TowerMatrix
                units={towerUnits}
                tower={currentTower}
                type={type}
                project={project}
                selected={sel.selected}
                active={sel.active}
                openId={openId}
                highlight={searchHit?.id ?? null}
                matchIds={matchIds}
                handlers={gridHandlers}
                onSelectGroup={onSelectGroup}
              />
            ) : (
              <PlotGrid
                units={sorted}
                type={type}
                project={project}
                selected={sel.selected}
                active={sel.active}
                openId={openId}
                highlight={searchHit?.id ?? null}
                matchIds={matchIds}
                handlers={gridHandlers}
                onSelectGroup={onSelectGroup}
              />
            )}
            <p className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:flex">
              <span>Click selects, <Kbd>Ctrl</Kbd> adds, <Kbd>Shift</Kbd> selects a range, double-click opens.</span>
              <span>
                With the grid focused: arrows move, <Kbd>Space</Kbd> selects, <Kbd>Enter</Kbd> opens,{" "}
                <Kbd>1</Kbd>–<Kbd>4</Kbd> set status, <Kbd>Esc</Kbd> clears, <Kbd>Ctrl Z</Kbd> undoes.
              </span>
            </p>
          </div>
        )}
      </div>

      {selectedUnits.length ? (
        <BulkBar
          units={selectedUnits}
          type={type}
          onStatus={requestStatus}
          onOpen={() => openSheet(selectedUnits[0].id)}
          onRemove={requestRemove}
          onClear={() => {
            focusView() // the bar unmounts with the selection
            api.clear()
          }}
        />
      ) : null}

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <UnitSheet
        ref={sheetRef}
        unit={sheetUnit}
        units={units}
        project={project}
        type={type}
        order={shownIds.includes(sheetId ?? "") ? shownIds : sorted.map((u) => u.id)}
        onNavigate={navigateSheet}
        onSaved={(u, closed) => {
          const msg = `${unitName(type, u)} saved`
          if (closed) toast(msg)
          else announce(msg)
        }}
        onCloseAutoFocus={() => refocus(returnFocus.current)}
      />

      <StatusChangeDialog
        request={request}
        units={request ? request.ids.map((id) => byId.get(id)).filter((u): u is Unit => !!u) : []}
        type={type}
        onCancel={() => setRequest(null)}
        onCloseAutoFocus={() => refocus(dialogReturn.current)}
        onConfirm={(ids, to, opts) => {
          setRequest(null)
          apply(ids, to, opts)
        }}
      />

      <RemoveUnitsDialog
        units={removeIds ? units.filter((u) => removeIds.includes(u.id)) : null}
        type={type}
        onCancel={() => setRemoveIds(null)}
        onConfirm={remove}
        onCloseAutoFocus={() => refocus(dialogReturn.current)}
      />

      {generate}
      {deepLink}
    </div>
  )
}

/** ?unit=142 (command menu deep link) opens that unit's sheet once the saved data has loaded. */
function UnitParam({ ready, onUnit }: { ready: boolean; onUnit: (number: string) => void }) {
  const unit = useSearchParams().get("unit")
  const open = useEffectEvent(onUnit)
  useEffect(() => {
    if (ready && unit) open(unit)
  }, [ready, unit])
  return null
}
