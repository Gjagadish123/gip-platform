// Adapted from 21st.dev: uvain/data-table-bulk-actions (demo 33506)
// Kept: sortable header buttons with aria-sort, clickable rows, right-aligned tabular figures, trailing row actions.
// Dropped: TanStack (≤30 rows, sorting/filtering are plain array ops in list-model), its bundled mini design system,
// selection/bulk bar and pagination. Rendered on the installed shadcn Table, density per visual-direction §6.4.
"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { AssetImage, SampleBadge, StatusBar, statusSummary } from "@/components/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LIFECYCLE_META, projectTypeLabel } from "@/lib/constants"
import { formatDate, formatNumber, formatRelative } from "@/lib/format"
import { useNow } from "@/lib/store"
import { cn } from "@/lib/utils"

import type { ProjectRow, SortKey } from "./list-model"
import { ActiveToggle } from "./project-actions"

/** Header click sets a sort; clicking the active one goes back to display order. */
function SortHead({
  label,
  sortKey,
  dir,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  dir: "ascending" | "descending"
  sort: SortKey
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = sort === sortKey
  const Icon = !active ? ChevronsUpDown : dir === "ascending" ? ArrowUp : ArrowDown
  return (
    <TableHead aria-sort={active ? dir : "none"} className={className}>
      <button
        type="button"
        onClick={() => onSort(active ? "order" : sortKey)}
        className={cn(
          "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon aria-hidden className={cn("size-3.5", !active && "opacity-50")} />
      </button>
    </TableHead>
  )
}

// The ⋯ column stays pinned to the right edge when the table scrolls, so it needs solid fills that match the
// header (muted/60) and the row hover (muted/50) over the page background.
const STICKY = "sticky right-0 z-10"
const HEAD_FILL = "bg-[color-mix(in_oklch,var(--muted)_60%,var(--background))]"
const ROW_FILL =
  "bg-background group-hover/row:bg-[color-mix(in_oklch,var(--muted)_50%,var(--background))] group-has-[[aria-expanded=true]]/row:bg-[color-mix(in_oklch,var(--muted)_50%,var(--background))]"

export function ProjectsTable({
  rows,
  sort,
  onSort,
  renderActions,
}: {
  rows: ProjectRow[]
  sort: SortKey
  onSort: (k: SortKey) => void
  renderActions: (row: ProjectRow) => ReactNode
}) {
  const router = useRouter()
  const now = useNow()
  const head = "h-9 px-3 text-xs font-medium text-muted-foreground"

  return (
    <div className="overflow-hidden rounded-xl border">
      {/* Fixed layout: the name and type truncate instead of pushing ⋯ off the edge (1280px with the sidebar open). */}
      <Table aria-label="Projects" className="min-w-[760px] table-fixed text-[13px]/5">
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            <SortHead label="Project" sortKey="name" dir="ascending" sort={sort} onSort={onSort} className={cn(head, "w-[34%] pl-4")} />
            <TableHead className={head}>Type</TableHead>
            <SortHead label="Inventory" sortKey="available" dir="descending" sort={sort} onSort={onSort} className={cn(head, "w-[150px]")} />
            <TableHead className={cn(head, "w-[120px] text-right")}>Price from</TableHead>
            <TableHead className={cn(head, "w-[120px]")}>On website</TableHead>
            <SortHead label="Updated" sortKey="updated" dir="descending" sort={sort} onSort={onSort} className={cn(head, "w-[110px] text-right")} />
            <TableHead className={cn(head, STICKY, HEAD_FILL, "w-12 pr-3")}>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const { project: p, type, counts } = row
            const href = `/projects/${p.id}`
            const noun = type.unitNounPlural.toLowerCase()
            const typeText = `${projectTypeLabel(p)} · ${LIFECYCLE_META[p.lifecycle].label}`
            const barTitle = counts ? statusSummary(counts, noun) + (p.statusSample ? " (sample statuses)" : "") : ""
            return (
              <TableRow
                key={p.id}
                data-project-row={p.id}
                className="group/row cursor-pointer"
                // The name link is the keyboard path (Tab + Enter); the rest of the row is a mouse convenience.
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest("a, button")) router.push(href)
                }}
              >
                <th scope="row" className="py-2 pr-3 pl-4 text-left align-middle font-normal">
                  <div className="flex items-center gap-3">
                    <AssetImage asset={p.media.cover} alt="" className="h-[30px] w-10 shrink-0 rounded-md border" />
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          href={href}
                          data-row-link
                          title={p.name}
                          className="truncate font-medium outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {p.name}
                        </Link>
                        {p.sample && <SampleBadge className="border-solid" />}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{p.location.short || "No location yet"}</p>
                    </div>
                  </div>
                </th>
                {/* Type over lifecycle, like name over location: every row keeps the same two-line height. */}
                <TableCell className="px-3" title={typeText}>
                  <div className="truncate">{projectTypeLabel(p)}</div>
                  <div className="truncate text-xs text-muted-foreground">{LIFECYCLE_META[p.lifecycle].label}</div>
                </TableCell>
                <TableCell className="px-3">
                  {counts ? (
                    <div className="flex flex-col gap-1.5" title={barTitle}>
                      <div className="w-[120px]">
                        <StatusBar counts={counts} height={6} noun={noun} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        <span className="font-medium text-foreground">{formatNumber(counts.available)}</span> /{" "}
                        {formatNumber(row.total)} available
                        {p.statusSample && <span className="sr-only"> (sample statuses)</span>}
                      </span>
                    </div>
                  ) : (
                    <span
                      className="text-muted-foreground"
                      title={type.hasInventory ? `No ${noun} yet` : "This type has no unit inventory"}
                    >
                      –<span className="sr-only">{type.hasInventory ? `No ${noun} yet` : "No unit inventory"}</span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="truncate px-3 text-right tabular-nums" title={row.price}>
                  {row.price}
                </TableCell>
                <TableCell className="px-3" onClick={(e) => e.stopPropagation()}>
                  <ActiveToggle row={row} />
                </TableCell>
                <TableCell className="px-3 text-right text-muted-foreground tabular-nums">
                  <time dateTime={row.updated} title={formatDate(row.updated)}>
                    {formatRelative(row.updated, now)}
                  </time>
                </TableCell>
                {/* stopPropagation: menu items render in a portal but their clicks still bubble here through React. */}
                <TableCell className={cn(STICKY, ROW_FILL, "pr-3 pl-1 text-right")} onClick={(e) => e.stopPropagation()}>
                  {renderActions(row)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
