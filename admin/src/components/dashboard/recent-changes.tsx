"use client"

import { useMemo } from "react"
import Link from "next/link"
import { History } from "lucide-react"

import { groupStatusChanges } from "@/components/dashboard/dashboard-data"
import { StatusSwatch } from "@/components/form/status"
import { UNIT_STATUS_META, getProjectType } from "@/lib/constants"
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format"
import { compressRanges } from "@/lib/inventory"
import { useNow } from "@/lib/store"
import type { ActivityEvent, Project } from "@/lib/types"

const SHOWN = 8
const MAX_RANGE_PARTS = 3 // more and the title says "12 plots"; the ranges move to the muted line

/**
 * "Plots 41–44 marked Sold Out" · project · time. Same-day changes to one project and status share a line
 * (dashboard-data groupStatusChanges); each line opens the inventory on its first unit.
 */
export function RecentChanges({ activity, projects }: { activity: ActivityEvent[]; projects: Project[] }) {
  const groups = useMemo(() => groupStatusChanges(activity, projects, SHOWN), [activity, projects])
  const now = useNow()

  if (!groups.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <History aria-hidden className="size-5 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">
          No status changes yet. Changes made in a project&rsquo;s Inventory show up here.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y">
      {groups.map((g) => {
        const type = getProjectType(g.project.typeId)
        const ranges = compressRanges(g.numbers)
        const label = UNIT_STATUS_META[g.to].label
        const one = g.numbers.length === 1
        const counted = ranges.split(", ").length > MAX_RANGE_PARTS
        const what = counted
          ? `${formatNumber(g.numbers.length)} ${type.unitNounPlural.toLowerCase()}`
          : `${one ? type.unitNoun : type.unitNounPlural} ${ranges}`
        return (
          <li key={g.key}>
            <Link
              href={`/projects/${g.project.id}/inventory?unit=${encodeURIComponent(g.numbers[0])}`}
              className="flex items-start gap-3 px-4 py-2.5 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <StatusSwatch status={g.to} className="mt-1" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]/5 font-medium">
                  {what} marked {label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {g.project.name}
                  {counted && <span className="tabular-nums"> · {ranges}</span>}
                </p>
              </div>
              <time
                dateTime={g.at}
                title={formatDateTime(g.at)}
                className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums"
              >
                {formatRelative(g.at, now)}
              </time>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
