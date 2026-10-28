"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import { AssetImage, SampleBadge, StatusBar } from "@/components/form"
import { LIFECYCLE_META, projectTypeLabel } from "@/lib/constants"
import { formatNumber } from "@/lib/format"
import { emptyCounts } from "@/lib/inventory"

import type { ProjectRow } from "./list-model"
import { ActiveToggle } from "./project-actions"

/** Calm bordered cards, no shadows. The name link stretches over the card; the ⋯ menu sits above it. */
export function ProjectCards({ rows, renderActions }: { rows: ProjectRow[]; renderActions: (row: ProjectRow) => ReactNode }) {
  return (
    <ul aria-label="Projects" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((row) => {
        const { project: p, type, counts } = row
        return (
          <li
            key={p.id}
            data-project-row={p.id}
            className="relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/20 has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
          >
            <AssetImage asset={p.media.cover} alt="" className="aspect-[4/3] w-full border-b" />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Link href={`/projects/${p.id}`} data-row-link title={p.name} className="truncate outline-none after:absolute after:inset-0">
                      {p.name}
                    </Link>
                    {p.sample && <SampleBadge className="border-solid" />}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">{p.location.short || "No location yet"}</p>
                </div>
                <div className="relative z-10 -mt-1 -mr-1.5">{renderActions(row)}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                {projectTypeLabel(p)} · {LIFECYCLE_META[p.lifecycle].label}
              </p>
              <div className="flex flex-col gap-1.5">
                <StatusBar counts={counts ?? emptyCounts()} height={6} noun={type.unitNounPlural.toLowerCase()} />
                <p className="text-xs text-muted-foreground tabular-nums">
                  {counts ? (
                    <>
                      <span className="font-medium text-foreground">{formatNumber(counts.available)}</span> /{" "}
                      {formatNumber(row.total)} available
                    </>
                  ) : type.hasInventory ? (
                    `No ${type.unitNounPlural.toLowerCase()} yet`
                  ) : (
                    "No unit inventory"
                  )}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                <ActiveToggle row={row} className="relative z-10" />
                <span className="truncate text-[13px] font-medium tabular-nums">{row.price}</span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
