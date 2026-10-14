"use client"

import { useMemo, useState, type MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Building2, ChevronsUpDown, Plus } from "lucide-react"

import { ongoingRows, type ProjectRow } from "@/components/dashboard/dashboard-data"
import { AssetImage } from "@/components/form/asset-image"
import { StatusBar, statusSummary } from "@/components/form/status"
import { priceText } from "@/components/projects/list/list-model"
import { PublishBadge } from "@/components/projects/list/project-badges"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { projectTypeLabel } from "@/lib/constants"
import { formatDate, formatNumber, formatRelative } from "@/lib/format"
import { naturalCompare } from "@/lib/inventory"
import { useNow } from "@/lib/store"
import type { ID, Project, Unit } from "@/lib/types"
import { cn } from "@/lib/utils"

type SortKey = "name" | "available" | "updated"
type Sort = { key: SortKey; dir: 1 | -1 } | null

/** Ongoing projects, the dashboard's main block (visual-direction §6.4 table rules, §6.6 columns). */
export function ProjectsTable({ projects, units }: { projects: Project[]; units: Record<ID, Unit[]> }) {
  const router = useRouter()
  const now = useNow()
  const [sort, setSort] = useState<Sort>(null)

  const base = useMemo(() => ongoingRows(projects, units), [projects, units])
  const rows = useMemo(() => {
    if (!sort) return base
    const by: Record<SortKey, (a: ProjectRow, b: ProjectRow) => number> = {
      name: (a, b) => naturalCompare(a.p.name, b.p.name),
      available: (a, b) => a.available - b.available,
      updated: (a, b) => a.updated.localeCompare(b.updated),
    }
    return [...base].sort((a, b) => by[sort.key](a, b) * sort.dir || naturalCompare(a.p.name, b.p.name))
  }, [base, sort])

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <Building2 aria-hidden className="size-5 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">
          No ongoing projects. Create one, or set a project&rsquo;s lifecycle to Ongoing.
        </p>
        <Button asChild>
          <Link href="/projects/new">
            <Plus data-icon="inline-start" />
            New project
          </Link>
        </Button>
      </div>
    )
  }

  const toggle = (key: SortKey) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }))

  const sortHead = (key: SortKey, label: string, className?: string) => {
    const on = sort?.key === key
    const Icon = !on ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown
    return (
      <TableHead
        aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
        className={cn("h-9 px-3 text-xs font-medium text-muted-foreground", className)}
      >
        <button
          type="button"
          onClick={() => toggle(key)}
          className={cn(
            "-mx-1 inline-flex h-7 items-center gap-1 rounded-md px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            on && "text-foreground",
          )}
        >
          {label}
          <Icon aria-hidden className={cn("size-3.5", !on && "opacity-60")} />
        </button>
      </TableHead>
    )
  }

  // Row click is a mouse shortcut; the name link is the keyboard / screen-reader path to the same place.
  const openRow = (e: MouseEvent<HTMLTableRowElement>, id: ID) => {
    if ((e.target as HTMLElement).closest("a, button")) return
    router.push(`/projects/${id}`)
  }

  const head = "h-9 px-3 text-xs font-medium text-muted-foreground"
  return (
    // Phones: fixed layout so the name truncates instead of pushing the table sideways; Type, Available, Price
    // and Updated fold away (available moves under the name). Tablets get Available back, Price and Updated return at lg, Type from 1366px (it fits beside the open sidebar from there).
    <Table aria-label="Ongoing projects" className="table-fixed text-[13px]/5 md:table-auto">
      <TableHeader className="bg-muted/60">
        <TableRow className="hover:bg-transparent">
          {sortHead("name", "Project", "pl-4")}
          <TableHead className={cn(head, "hidden min-[1366px]:table-cell")}>Type</TableHead>
          <TableHead className={cn(head, "w-[88px] md:w-auto")}>Inventory</TableHead>
          {sortHead("available", "Available", "hidden text-right md:table-cell")}
          <TableHead className={cn(head, "hidden text-right lg:table-cell")}>Price from</TableHead>
          {sortHead("updated", "Updated", "hidden text-right lg:table-cell")}
          <TableHead className={cn(head, "w-[116px] pr-4 md:w-auto")}>Publishing</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ p, type, counts, total, updated }) => {
          const noun = type.unitNounPlural.toLowerCase()
          return (
            <TableRow key={p.id} className="h-12 cursor-pointer" onClick={(e) => openRow(e, p.id)}>
              <th scope="row" className="py-2 pr-3 pl-4 text-left align-middle font-normal md:max-w-[320px]">
                <div className="flex items-center gap-3">
                  <AssetImage asset={p.media.cover} alt="" className="hidden h-[30px] w-10 shrink-0 rounded-md border sm:block" />
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${p.id}`}
                      className="block truncate rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {p.name}
                    </Link>
                    <div className="truncate text-xs text-muted-foreground">{p.location.short || "No location yet"}</div>
                    {counts && (
                      <div className="truncate text-xs text-muted-foreground tabular-nums md:hidden">
                        <span className="font-medium text-foreground">{formatNumber(counts.available)}</span> /{" "}
                        {formatNumber(total)} available
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <TableCell className="hidden px-3 min-[1366px]:table-cell">{projectTypeLabel(p)}</TableCell>
              <TableCell className="px-3">
                {counts ? (
                  <div title={statusSummary(counts, noun)} className="w-16 md:w-[120px]">
                    <StatusBar counts={counts} height={6} noun={noun} />
                  </div>
                ) : type.hasInventory ? (
                  <Link
                    href={`/projects/${p.id}/inventory`}
                    className="block truncate rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="md:hidden">None yet</span>
                    <span className="hidden md:inline">No inventory yet</span>
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Not tracked</span>
                )}
              </TableCell>
              <TableCell className="hidden px-3 text-right tabular-nums md:table-cell">
                {counts ? (
                  <>
                    {formatNumber(counts.available)}
                    <span className="text-muted-foreground"> / {formatNumber(total)}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">–</span>
                )}
              </TableCell>
              <TableCell className="hidden px-3 text-right tabular-nums lg:table-cell">{priceText(p)}</TableCell>
              <TableCell className="hidden px-3 text-right text-muted-foreground tabular-nums lg:table-cell">
                <time dateTime={updated} title={formatDate(updated)}>
                  {formatRelative(updated, now)}
                </time>
              </TableCell>
              <TableCell className="pr-4 pl-3">
                <PublishBadge state={p.publishing.state} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
