// Adapted from 21st.dev: ddoemonn/filter-grid (demo 23525)
// Kept: filters that show live per-option counts and a "n of total match" line, aria-pressed chips.
// Dropped: motion cell list (positions must stay stable on a spatial grid), the stone/#4568FF palette.
"use client"

import { useId, useMemo, type Ref } from "react"
import { ChevronDown, LayoutGrid, ListFilter, Map as MapIcon, Rows3, Search } from "lucide-react"

import { StatusBar, StatusLegend, StatusSwatch } from "@/components/form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AREA_UNIT_LABEL, UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants"
import { formatDate, formatNumber } from "@/lib/format"
import type { StatusCounts } from "@/lib/inventory"
import type { Facing, ProjectType, Unit, UnitStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

import { FACINGS, activeFilterCount, matchesFilters, NO_FILTERS, type InventoryView, type UnitFilters } from "./model"

/* ---------- summary: totals, stacked bar, legend that filters ---------- */

export function InventorySummary({
  type,
  total,
  counts,
  statusFilter,
  onToggleStatus,
  onClearStatus,
  onSelectShown,
  shownCount,
  filtersText,
  onClearFilters,
  updatedAt,
  sampleNote,
  liveHref,
}: {
  type: ProjectType
  /** All units in the project. */
  total: number
  /** Counts after block/facing/corner/area filters (status filter not applied). */
  counts: StatusCounts
  statusFilter: ReadonlySet<UnitStatus>
  onToggleStatus: (s: UnitStatus, only: boolean) => void
  onClearStatus: () => void
  onSelectShown: () => void
  shownCount: number
  /** Human summary of the other filters, empty when none. */
  filtersText: string
  onClearFilters: () => void
  updatedAt?: string
  sampleNote?: string
  /** The live layouts app for this project: status changes show there within seconds. */
  liveHref?: string
}) {
  const noun = type.unitNounPlural.toLowerCase()
  const counted = UNIT_STATUSES.reduce((n, s) => n + counts[s], 0)
  const sold = counts.sold_out + counts.registered
  return (
    <section aria-label="Status summary" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-sm text-muted-foreground">
          <span className="text-base font-semibold text-foreground tabular-nums">{formatNumber(total)}</span>{" "}
          <span className="text-foreground">{noun}</span>
          {updatedAt ? <> · status as of {formatDate(updatedAt)}</> : null}
          {liveHref ? (
            <>
              {" · "}
              <a
                href={liveHref}
                target="_blank"
                rel="noopener noreferrer"
                title="Status changes show on the live layouts page within seconds"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Live layout ↗
              </a>
            </>
          ) : null}
        </p>
        {/* Available is in the legend; on phones the legend carries the counts on its own. */}
        <p className="hidden text-sm text-muted-foreground tabular-nums sm:block">
          Sold <span className="font-medium text-foreground">{formatNumber(sold)}</span>
          {sold ? ` (${formatNumber(counts.sold_out)} Sold Out + ${formatNumber(counts.registered)} Registered)` : ""}
        </p>
      </div>
      <StatusBar counts={counts} height={8} noun={noun} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusLegend
          counts={counts}
          active={statusFilter}
          onToggle={(s, { only }) => onToggleStatus(s, only)}
          className="max-sm:-m-1 max-sm:w-[calc(100%+0.5rem)] max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:p-1"
        />
        {statusFilter.size ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onSelectShown}>
              Select these ({formatNumber(shownCount)})
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClearStatus}>
              Show all statuses
            </Button>
          </div>
        ) : null}
      </div>
      {filtersText ? (
        <p className="text-xs text-muted-foreground tabular-nums">
          Counts for {formatNumber(counted)} of {formatNumber(total)} {noun}: {filtersText}.{" "}
          <button type="button" onClick={onClearFilters} className="font-medium text-foreground underline-offset-4 hover:underline">
            Clear filters
          </button>
        </p>
      ) : null}
      {/* The project header carries the "Sample" badge; on phones its title holds this sentence. */}
      {sampleNote ? <p className="hidden text-xs text-muted-foreground sm:block">{sampleNote}</p> : null}
    </section>
  )
}

/* ---------- search ---------- */

export function UnitSearch({
  type,
  value,
  onChange,
  onSubmit,
  notFound,
  ref,
}: {
  type: ProjectType
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  notFound: boolean
  ref?: Ref<HTMLInputElement>
}) {
  const noun = type.unitNoun.toLowerCase()
  const statusId = useId()
  return (
    <InputGroup className="w-full sm:w-56">
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder={`Find ${noun} no.`}
        aria-label={`Find ${noun} by number`}
        aria-describedby={notFound ? statusId : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            onSubmit()
          } else if (e.key === "Escape" && value) {
            e.preventDefault()
            onChange("")
          }
        }}
        className="tabular-nums"
      />
      <InputGroupAddon align="inline-end">
        {notFound ? (
          <InputGroupText id={statusId} role="status" className="text-xs">
            No match
          </InputGroupText>
        ) : (
          <Kbd aria-hidden>/</Kbd>
        )}
      </InputGroupAddon>
    </InputGroup>
  )
}

/* ---------- filters (block, facing, corner, area) ---------- */

const chip =
  "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-ring aria-pressed:bg-accent aria-pressed:text-accent-foreground disabled:opacity-50 pointer-coarse:h-10"

export function FiltersPopover({
  type,
  units,
  filters,
  onChange,
}: {
  type: ProjectType
  units: Unit[]
  filters: UnitFilters
  onChange: (f: UnitFilters) => void
}) {
  const fields = new Set(type.unitFields)
  const n = activeFilterCount(filters)
  const uid = useId()

  // Faceted counts: each facet counts units matching every *other* filter.
  const facets = useMemo(() => {
    const blockBase = units.filter((u) => matchesFilters(u, { ...filters, blocks: [] }))
    const facingBase = units.filter((u) => matchesFilters(u, { ...filters, facings: [] }))
    const blocks = new Map<string, number>()
    for (const u of blockBase) blocks.set(u.block ?? "", (blocks.get(u.block ?? "") ?? 0) + 1)
    const allBlocks = [...new Set(units.map((u) => u.block ?? ""))].sort((a, b) =>
      a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "en", { numeric: true }),
    )
    const facings = new Map<Facing, number>()
    for (const u of facingBase) {
      for (const f of new Set([u.facing, u.facing2])) if (f) facings.set(f, (facings.get(f) ?? 0) + 1)
    }
    const present = new Set(units.flatMap((u) => [u.facing, u.facing2]).filter(Boolean))
    let min = Infinity
    let max = -Infinity
    for (const u of units) {
      if (u.area < min) min = u.area
      if (u.area > max) max = u.area
    }
    return {
      blocks: units.some((u) => u.block) ? allBlocks.map((b) => ({ b, n: blocks.get(b) ?? 0 })) : [],
      facings: FACINGS.filter((f) => present.has(f)).map((f) => ({ f, n: facings.get(f) ?? 0 })),
      matching: units.filter((u) => matchesFilters(u, filters)).length,
      min: Number.isFinite(min) ? min : undefined,
      max: Number.isFinite(max) ? max : undefined,
    }
  }, [units, filters])

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const unit = AREA_UNIT_LABEL[type.areaUnit]
  const areaNum = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? undefined : Number(s))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn(n > 0 && "border-ring bg-accent")}>
          <ListFilter data-icon="inline-start" />
          Filters
          {n ? <span className="rounded-sm bg-background px-1 text-xs tabular-nums">{n}</span> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-4 p-4">
        {facets.blocks.length ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">Block</legend>
            <div className="flex flex-wrap gap-1.5">
              {facets.blocks.map(({ b, n: c }) => (
                <button key={b || "none"} type="button" aria-pressed={filters.blocks.includes(b)} className={chip}
                  onClick={() => onChange({ ...filters, blocks: toggle(filters.blocks, b) })}>
                  {b ? `Block ${b}` : "No block"}
                  <span className="text-muted-foreground tabular-nums">{formatNumber(c)}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {fields.has("facing") && facets.facings.length ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">Facing</legend>
            <div className="flex flex-wrap gap-1.5">
              {facets.facings.map(({ f, n: c }) => (
                <button key={f} type="button" aria-pressed={filters.facings.includes(f)} className={chip}
                  onClick={() => onChange({ ...filters, facings: toggle(filters.facings, f) })}>
                  {f}
                  <span className="text-muted-foreground tabular-nums">{formatNumber(c)}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {fields.has("corner") ? (
          <div className="flex flex-col gap-2">
            <p id={`${uid}-corner`} className="text-xs font-medium text-muted-foreground">Corner</p>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              aria-labelledby={`${uid}-corner`}
              value={filters.corner}
              onValueChange={(v) => v && onChange({ ...filters, corner: v as UnitFilters["corner"] })}
            >
              <ToggleGroupItem value="any">Any</ToggleGroupItem>
              <ToggleGroupItem value="yes">Corner</ToggleGroupItem>
              <ToggleGroupItem value="no">Not corner</ToggleGroupItem>
            </ToggleGroup>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <p id={`${uid}-area`} className="text-xs font-medium text-muted-foreground">
            {type.areaLabel} ({unit})
          </p>
          <div role="group" aria-labelledby={`${uid}-area`} className="flex items-center gap-2">
            <InputGroup className="h-8">
              <InputGroupInput
                type="number"
                inputMode="decimal"
                min={0}
                aria-label="Minimum area"
                placeholder={facets.min != null ? formatNumber(facets.min) : "Min"}
                value={filters.areaMin ?? ""}
                onChange={(e) => onChange({ ...filters, areaMin: areaNum(e.target.value) })}
                className="tabular-nums"
              />
            </InputGroup>
            <span className="text-muted-foreground">to</span>
            <InputGroup className="h-8">
              <InputGroupInput
                type="number"
                inputMode="decimal"
                min={0}
                aria-label="Maximum area"
                placeholder={facets.max != null ? formatNumber(facets.max) : "Max"}
                value={filters.areaMax ?? ""}
                onChange={(e) => onChange({ ...filters, areaMax: areaNum(e.target.value) })}
                className="tabular-nums"
              />
            </InputGroup>
          </div>
        </div>

        <div className="-mx-4 -mb-4 flex items-center justify-between border-t px-4 py-3">
          <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
            {formatNumber(facets.matching)} of {formatNumber(units.length)} match
          </p>
          <Button variant="ghost" size="sm" disabled={!n} onClick={() => onChange(NO_FILTERS)}>
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ---------- "Select…" menu ---------- */

export function SelectMenu({
  shownCount,
  shownCounts,
  blocks,
  hasSelection,
  onSelectShown,
  onSelectStatus,
  onSelectBlock,
  onInvert,
  onClear,
}: {
  shownCount: number
  shownCounts: StatusCounts
  blocks: { name: string; count: number }[]
  hasSelection: boolean
  onSelectShown: () => void
  onSelectStatus: (s: UnitStatus) => void
  onSelectBlock: (block: string) => void
  onInvert: () => void
  onClear: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Select
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuItem onSelect={onSelectShown} disabled={!shownCount}>
          All shown
          <span className="text-muted-foreground tabular-nums">{formatNumber(shownCount)}</span>
          <DropdownMenuShortcut>Ctrl A</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>By status</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            {UNIT_STATUSES.map((s) => (
              <DropdownMenuItem key={s} disabled={!shownCounts[s]} onSelect={() => onSelectStatus(s)}>
                <StatusSwatch status={s} />
                {UNIT_STATUS_META[s].label}
                <span className="ml-auto text-muted-foreground tabular-nums">{formatNumber(shownCounts[s])}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {blocks.length ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>By block</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {blocks.map((b) => (
                <DropdownMenuItem key={b.name || "none"} disabled={!b.count} onSelect={() => onSelectBlock(b.name)}>
                  {b.name ? `Block ${b.name}` : "No block"}
                  <span className="ml-auto text-muted-foreground tabular-nums">{formatNumber(b.count)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onInvert} disabled={!shownCount}>
          Invert selection
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onClear} disabled={!hasSelection}>
          Clear selection
          <DropdownMenuShortcut>Esc</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------- view switch ---------- */

const VIEWS: { value: InventoryView; label: string; icon: typeof LayoutGrid }[] = [
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "table", label: "Table", icon: Rows3 },
  { value: "layout", label: "Layout", icon: MapIcon },
]

/** `layout` false drops the Layout view: only the live-layout projects have one. */
export function ViewSwitch({ value, onChange, layout = true }: { value: InventoryView; onChange: (v: InventoryView) => void; layout?: boolean }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={value}
      onValueChange={(v) => v && onChange(v as InventoryView)}
      aria-label="View"
    >
      {VIEWS.filter((v) => layout || v.value !== "layout").map(({ value: v, label, icon: Icon }) => (
        <ToggleGroupItem key={v} value={v} aria-label={label}>
          <Icon data-icon="inline-start" />
          <span className="hidden sm:inline">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
