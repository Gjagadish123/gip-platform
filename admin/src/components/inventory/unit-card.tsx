import type { CSSProperties } from "react"

import { StatusBadge } from "@/components/form"
import type { Project, ProjectType, Unit } from "@/lib/types"
import { cn } from "@/lib/utils"

import { unitFacts, unitName } from "./model"

/**
 * The one shared detail card (hover in grid/layout, keyboard cursor in the grid). Plain positioned div, never a
 * per-tile tooltip. Everything on it is also in the sheet and the table, so hover-only users lose nothing.
 */
export function UnitCard({
  unit,
  type,
  project,
  style,
  className,
}: {
  unit: Unit
  type: ProjectType
  project: Project
  style?: CSSProperties
  className?: string
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        "pointer-events-none absolute z-20 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-overlay",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold tabular-nums">{unitName(type, unit)}</p>
        <StatusBadge status={unit.status} />
      </div>
      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
        {unitFacts(unit, type, project).map((f) => (
          <div key={f.label} className="contents">
            <dt className="text-muted-foreground">{f.label}</dt>
            <dd className="tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
