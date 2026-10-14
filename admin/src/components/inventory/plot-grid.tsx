"use client"
// The two tile layouts: plots/villas as fixed-column rows (seat-map style, grouped by block) and flats as a
// tower's floor × unit matrix (floors top-down, like the building). Both render through TileGrid.
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"

import { StatusBar } from "@/components/form"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatFacing, formatNumber } from "@/lib/format"
import { statusCounts } from "@/lib/inventory"
import type { Project, ProjectType, Unit } from "@/lib/types"

import { countLabel, floorLabel, groupByBlock } from "./model"
import { TileGrid, type TileGridHandlers, type TileSection } from "./tile-grid"

interface CommonProps {
  type: ProjectType
  project: Project
  selected: ReadonlySet<string>
  active: string | null
  openId: string | null
  highlight: string | null
  matchIds: ReadonlySet<string> | null
  handlers: TileGridHandlers
  /** Select a block / floor / stack (Ctrl, Cmd or Shift adds to the selection). */
  onSelectGroup: (ids: string[], additive: boolean) => void
}

const COMPACT_ABOVE = 400 // units; taller tiles up to here, compact rows above
const additive = (e: MouseEvent) => e.ctrlKey || e.metaKey || e.shiftKey

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

/** Plots and villas: as many columns as fit (5–20), a row label with the row's first number. Columns come from
 *  the measured width, not CSS auto-fill, because row labels and arrow-key rows both need the same count. */
export function PlotGrid({ units, ...common }: CommonProps & { units: Unit[] }) {
  const { type } = common
  const wrapRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(20)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      // 2.75rem label + n × (2.125rem tile + 3px gap) must fit: 44 + 37n ≤ w (3px spare).
      if (w > 0) setCols(Math.max(5, Math.min(20, Math.floor((w - 47) / 37))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const comfortable = units.length <= COMPACT_ABOVE
  const sections = useMemo<TileSection[]>(
    () =>
      groupByBlock(units).map((g) => {
        const name = g.block == null ? undefined : g.block ? `Block ${g.block}` : "No block"
        const counts = statusCounts(g.units)
        return {
          key: g.key,
          label: name,
          header: name ? (
            <div aria-hidden className="mb-2 flex h-8 items-center gap-3">
              <h3 className="text-sm font-semibold">{name}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {countLabel(type, g.units.length)} · {formatNumber(counts.available)} available
              </span>
              <StatusBar counts={counts} height={6} className="w-24" />
            </div>
          ) : undefined,
          rows: chunk(g.units, cols).map((cells, i) => ({ key: `${g.key}-${i}`, label: cells[0].number, cells })),
        }
      }),
    [units, cols, type],
  )

  return (
    <div ref={wrapRef} className="-m-1.5 overflow-x-auto p-1.5">
      <TileGrid
        {...common}
        ariaLabel={`${type.unitNounPlural}, ${common.project.name}`}
        sections={sections}
        template={`2.75rem repeat(${cols}, minmax(2.125rem, 1fr))`}
        tileClass={comfortable ? "h-[42px] text-[13px]" : "h-7 text-xs"}
      />
    </div>
  )
}

/** Towers in natural order with their units. */
export function towersOf(units: Unit[]): { name: string; units: Unit[] }[] {
  const map = new Map<string, Unit[]>()
  for (const u of units) {
    const k = u.tower ?? ""
    const list = map.get(k)
    if (list) list.push(u)
    else map.set(k, [u])
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }))
    .map(([name, list]) => ({ name, units: list }))
}

/** Tower picker: one segment per tower with its availability and a mini bar. */
export function TowerTabs({
  towers,
  value,
  onChange,
}: {
  towers: { name: string; units: Unit[] }[]
  value: string
  onChange: (tower: string) => void
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={2}
      value={value}
      onValueChange={(v) => v && onChange(v)}
      aria-label="Tower"
      className="flex-wrap"
    >
      {towers.map((t) => {
        const counts = statusCounts(t.units)
        return (
          <ToggleGroupItem
            key={t.name}
            value={t.name}
            className="h-auto flex-col items-stretch gap-1.5 px-3 py-2 data-[state=on]:border-ring"
          >
            <span className="flex items-baseline justify-between gap-4">
              <span className="font-medium">{t.name ? `Tower ${t.name}` : "No tower"}</span>
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {formatNumber(counts.available)}/{formatNumber(t.units.length)} available
              </span>
            </span>
            <StatusBar counts={counts} height={4} />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}

/** Flats: floors descending (rows) × position in the floor (columns). Labels select a floor, stack or tower. */
export function TowerMatrix({ units, tower, ...common }: CommonProps & { units: Unit[]; tower: string }) {
  const { type, onSelectGroup } = common
  const sections = useMemo<TileSection[]>(() => {
    const byFloor = new Map<number, Unit[]>()
    for (const u of units) {
      const f = u.floor ?? 0
      const list = byFloor.get(f)
      if (list) list.push(u)
      else byFloor.set(f, [u])
    }
    const floors = [...byFloor.entries()].sort(([a], [b]) => b - a)
    const cols = Math.max(1, ...floors.map(([, list]) => list.length))
    const stacks = Array.from({ length: cols }, (_, c) => floors.map(([, list]) => list[c]).filter(Boolean) as Unit[])
    const all = units.map((u) => u.id)
    const head = "flex flex-col justify-end rounded-md px-1 pb-1 text-xs leading-4 text-muted-foreground select-none"

    return [{
      key: tower,
      label: tower ? `Tower ${tower}` : undefined,
      columnHeader: (
        <>
          <div
            aria-hidden
            title={`Select all of tower ${tower}`}
            onClick={(e) => onSelectGroup(all, additive(e))}
            className={`${head} cursor-pointer items-end hover:bg-muted hover:text-foreground`}
          >
            All
          </div>
          {stacks.map((stack, c) => {
            const bhks = new Set(stack.map((u) => u.bhk))
            const facings = new Set(stack.map((u) => u.facing))
            const areas = new Set(stack.map((u) => u.area))
            const first = stack[0]
            return (
              <div
                key={c}
                aria-hidden
                title={`Select stack ${String(c + 1).padStart(2, "0")} on every floor`}
                onClick={(e) => onSelectGroup(stack.map((u) => u.id), additive(e))}
                className={`${head} cursor-pointer hover:bg-muted hover:text-foreground`}
              >
                <span className="font-medium text-foreground tabular-nums">
                  {String(c + 1).padStart(2, "0")}
                  {bhks.size === 1 && first?.bhk ? ` · ${first.bhk} BHK` : bhks.size > 1 ? " · mixed" : ""}
                </span>
                {first && facings.size === 1 && areas.size === 1 ? (
                  <span className="tabular-nums">
                    {[formatFacing(first.facing, true), formatNumber(first.area)].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </div>
            )
          })}
        </>
      ),
      rows: floors.map(([floor, list]) => ({
        key: `${tower}-${floor}`,
        label: floor === 0 ? "G" : `Flr ${floorLabel(floor)}`,
        labelTitle: `Select floor ${floorLabel(floor)}`,
        onLabelClick: (e: MouseEvent) => onSelectGroup(list.map((u) => u.id), additive(e)),
        // Pad short floors so the next floor's label starts a new grid row.
        cells: [...list, ...Array<null>(cols - list.length).fill(null)],
      })),
    }]
  }, [units, tower, onSelectGroup])

  const cols = Math.max(1, ...sections[0].rows.map((r) => r.cells.length))

  return (
    <div className="-m-1.5 overflow-x-auto p-1.5">
      <TileGrid
        {...common}
        ariaLabel={`${type.unitNounPlural}${tower ? `, tower ${tower}` : ""}, ${common.project.name}`}
        sections={sections}
        template={`3.5rem repeat(${cols}, minmax(4.5rem, 7.5rem))`}
        tileClass="h-11 text-[13px]"
      />
    </div>
  )
}
