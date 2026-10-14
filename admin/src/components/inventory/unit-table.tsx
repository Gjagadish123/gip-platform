// Adapted from 21st.dev: uvain/data-table-bulk-actions (demo 33506)
// Kept: native <button> sort headers with aria-sort and a three-step cycle, checkbox column whose header selects
// what is shown, selected rows in bg-accent, dense rows. Dropped: TanStack (no new deps), the bundled mini
// design system, pagination (1000 rows render fine; inventory-ux §7). Sticky header and number column.
"use client"

import { memo, useMemo, type ReactNode } from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { StatusBadge } from "@/components/form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AREA_UNIT_LABEL, UNIT_STATUSES } from "@/lib/constants"
import { formatDate, formatFacing, formatINR, formatINRCompact, formatNumber } from "@/lib/format"
import { naturalCompare, unitPrice } from "@/lib/inventory"
import type { Project, ProjectType, Unit } from "@/lib/types"
import { cn } from "@/lib/utils"

import { floorLabel, rowDomId, unitName } from "./model"

interface Column {
  key: string
  label: string
  numeric?: boolean
  sort: (u: Unit) => string | number
  cell: (u: Unit) => ReactNode
}

const dash = <span className="text-muted-foreground">–</span>

function buildColumns(type: ProjectType, project: Project): Column[] {
  const f = new Set(type.unitFields)
  const cols: Column[] = []
  if (f.has("tower")) cols.push({ key: "tower", label: "Tower", sort: (u) => u.tower ?? "", cell: (u) => u.tower || dash })
  if (f.has("floor")) {
    cols.push({ key: "floor", label: "Floor", numeric: true, sort: (u) => u.floor ?? -1, cell: (u) => (u.floor == null ? dash : floorLabel(u.floor)) })
  }
  if (f.has("block")) cols.push({ key: "block", label: "Block", sort: (u) => u.block ?? "", cell: (u) => u.block || dash })
  cols.push({
    key: "area", label: `${type.areaLabel} (${AREA_UNIT_LABEL[type.areaUnit]})`, numeric: true,
    sort: (u) => u.area, cell: (u) => formatNumber(u.area),
  })
  if (f.has("carpetArea")) {
    cols.push({ key: "carpet", label: "Carpet (sq ft)", numeric: true, sort: (u) => u.carpetAreaSqFt ?? 0, cell: (u) => (u.carpetAreaSqFt ? formatNumber(u.carpetAreaSqFt) : dash) })
  }
  if (f.has("bhk")) cols.push({ key: "bhk", label: "BHK", numeric: true, sort: (u) => u.bhk ?? 0, cell: (u) => u.bhk ?? dash })
  if (f.has("dimensions")) {
    cols.push({
      key: "dims", label: "Size (ft)", numeric: true, sort: (u) => (u.widthFt ?? 0) * 1000 + (u.depthFt ?? 0),
      cell: (u) => (u.widthFt && u.depthFt ? `${formatNumber(u.widthFt)} × ${formatNumber(u.depthFt)}` : dash),
    })
  }
  if (f.has("builtUpArea")) {
    cols.push({ key: "builtUp", label: "Built-up (sq ft)", numeric: true, sort: (u) => u.builtUpAreaSqFt ?? 0, cell: (u) => (u.builtUpAreaSqFt ? formatNumber(u.builtUpAreaSqFt) : dash) })
  }
  if (f.has("bedrooms")) cols.push({ key: "beds", label: "Bedrooms", numeric: true, sort: (u) => u.bedrooms ?? 0, cell: (u) => u.bedrooms ?? dash })
  if (f.has("facing")) {
    cols.push({
      key: "facing", label: "Facing", sort: (u) => u.facing ?? "",
      cell: (u) => (u.facing ? [u.facing, u.facing2].filter(Boolean).map((x) => formatFacing(x, true)).join(" / ") : dash),
    })
  }
  if (f.has("roadWidth")) {
    cols.push({
      key: "road", label: "Road (ft)", numeric: true, sort: (u) => u.roadWidthFt ?? 0,
      cell: (u) => (u.roadWidthFt ? [u.roadWidthFt, u.roadWidth2Ft].filter(Boolean).join(" / ") : dash),
    })
  }
  if (f.has("corner")) cols.push({ key: "corner", label: "Corner", sort: (u) => (u.corner ? 1 : 0), cell: (u) => (u.corner ? "Yes" : dash) })
  cols.push({
    key: "price", label: "Price", numeric: true, sort: (u) => unitPrice(u, project) ?? 0,
    cell: (u) => {
      const n = unitPrice(u, project)
      return n == null ? dash : <span title={formatINR(n)}>{formatINRCompact(n)}</span>
    },
  })
  cols.push({ key: "status", label: "Status", sort: (u) => UNIT_STATUSES.indexOf(u.status), cell: (u) => <StatusBadge status={u.status} /> })
  cols.push({
    key: "date", label: "Status date", numeric: true, sort: (u) => u.statusDate ?? "",
    cell: (u) => (u.statusDate ? formatDate(u.statusDate) : dash),
  })
  return cols
}

const Row = memo(function Row({
  unit,
  columns,
  name,
  selected,
  highlight,
  onCheck,
  onOpen,
}: {
  unit: Unit
  columns: Column[]
  name: string
  selected: boolean
  highlight: boolean
  onCheck: (id: string, shift: boolean) => void
  onOpen: (id: string) => void
}) {
  return (
    <tr
      id={rowDomId(unit.id)}
      data-selected={selected || undefined}
      data-active={highlight || undefined}
      onClick={() => onOpen(unit.id)}
      className={cn(
        "h-8 cursor-pointer border-b bg-background text-[13px]/5 transition-colors last:border-b-0 hover:bg-muted",
        "data-selected:bg-accent data-active:[&>td:first-child]:shadow-[inset_3px_0_0_var(--ring)]",
      )}
    >
      <td className="sticky left-0 z-[1] w-10 bg-inherit pl-4">
        <Checkbox
          checked={selected}
          aria-label={`Select ${name}`}
          className="align-middle"
          onClick={(e) => {
            e.stopPropagation()
            onCheck(unit.id, e.shiftKey)
          }}
        />
      </td>
      {/* Row header: a screen reader on any cell of the row also hears the unit number. */}
      <th scope="row" className="sticky left-10 z-[1] bg-inherit px-3 text-left font-medium whitespace-nowrap">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(unit.id)
          }}
          className="rounded-sm tabular-nums underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open ${name}`}
        >
          {unit.number}
        </button>
      </th>
      {columns.map((c) => (
        <td key={c.key} className={cn("px-3 whitespace-nowrap", c.numeric && "text-right tabular-nums")}>
          {c.cell(unit)}
        </td>
      ))}
    </tr>
  )
})

export type TableSort = { key: string; dir: "asc" | "desc" } | null

function numberColumn(type: ProjectType): Column {
  return { key: "number", label: `${type.unitNoun} no.`, sort: (u) => u.number, cell: () => null }
}

/** Rows in table order. Ties (and "no sort") fall back to natural unit-number order. */
export function sortRows(units: Unit[], sort: TableSort, type: ProjectType, project: Project): Unit[] {
  if (!sort) return units
  const col = [numberColumn(type), ...buildColumns(type, project)].find((c) => c.key === sort.key)
  if (!col) return units
  const dir = sort.dir === "asc" ? 1 : -1
  return [...units].sort((a, b) => {
    const x = col.sort(a)
    const y = col.sort(b)
    const d = typeof x === "number" && typeof y === "number" ? x - y : naturalCompare(String(x), String(y))
    return d * dir || naturalCompare(a.number, b.number)
  })
}

export function UnitTable({
  rows,
  total,
  type,
  project,
  sort,
  onSortChange,
  selected,
  highlight,
  onCheck,
  onCheckAll,
  onOpen,
  onResetFilters,
}: {
  /** Rows to show: filtered and already in table order (sortRows). */
  rows: Unit[]
  total: number
  type: ProjectType
  project: Project
  sort: TableSort
  onSortChange: (sort: TableSort) => void
  selected: ReadonlySet<string>
  highlight: string | null
  onCheck: (id: string, shift: boolean) => void
  onCheckAll: (checked: boolean) => void
  onOpen: (id: string) => void
  onResetFilters?: () => void
}) {
  const columns = useMemo(() => buildColumns(type, project), [type, project])
  const numberCol = useMemo(() => numberColumn(type), [type])

  const nSelected = rows.reduce((n, u) => n + (selected.has(u.id) ? 1 : 0), 0)
  const headChecked = nSelected === 0 ? false : nSelected === rows.length ? true : "indeterminate"

  function cycle(key: string) {
    onSortChange(!sort || sort.key !== key ? { key, dir: "asc" } : sort.dir === "asc" ? { key, dir: "desc" } : null)
  }

  const th = "h-9 px-3 text-left text-xs font-medium whitespace-nowrap text-muted-foreground"

  function header(c: Column, extra?: string) {
    const dir = sort?.key === c.key ? sort.dir : null
    return (
      <th
        key={c.key}
        scope="col"
        aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
        className={cn(th, c.numeric && "text-right", extra)}
      >
        <button
          type="button"
          onClick={() => cycle(c.key)}
          className={cn(
            "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            dir && "text-foreground",
            c.numeric && "flex-row-reverse",
          )}
        >
          {c.label}
          {dir === "asc" ? <ArrowUp aria-hidden className="size-3.5" />
            : dir === "desc" ? <ArrowDown aria-hidden className="size-3.5" />
              : <ChevronsUpDown aria-hidden className="size-3.5 opacity-50" />}
        </button>
      </th>
    )
  }

  const sortedBy = sort ? [numberCol, ...columns].find((c) => c.key === sort.key)?.label : undefined

  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-[calc(100svh-12rem)] overflow-auto rounded-xl border">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">
            {type.unitNounPlural}, {project.name}. Column headers sort; a row opens its details.
          </caption>
          <thead className="sticky top-0 z-[2]">
            <tr className="bg-muted [&>th]:border-b">
              <th scope="col" className={cn(th, "sticky left-0 z-[1] w-10 bg-muted pl-4")}>
                <Checkbox
                  checked={headChecked}
                  disabled={!rows.length}
                  aria-label={`Select all ${rows.length} shown`}
                  className="align-middle"
                  onCheckedChange={(v) => onCheckAll(v === true)}
                />
              </th>
              {header(numberCol, "sticky left-10 z-[1] bg-muted")}
              {columns.map((c) => header(c))}
            </tr>
          </thead>
          <tbody className="[&>tr>*]:border-b [&>tr:last-child>*]:border-b-0">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="h-40 text-center text-sm text-muted-foreground">
                  No {type.unitNounPlural.toLowerCase()} match these filters.
                  {onResetFilters ? (
                    <Button variant="link" size="sm" onClick={onResetFilters}>
                      Clear filters
                    </Button>
                  ) : null}
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <Row
                  key={u.id}
                  unit={u}
                  columns={columns}
                  name={unitName(type, u)}
                  selected={selected.has(u.id)}
                  highlight={u.id === highlight}
                  onCheck={onCheck}
                  onOpen={onOpen}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing {formatNumber(rows.length)} of {formatNumber(total)} {type.unitNounPlural.toLowerCase()}
        {sortedBy ? ` · sorted by ${sortedBy.toLowerCase()}${sort?.dir === "desc" ? ", descending" : ""}` : ""}
      </p>
    </div>
  )
}
