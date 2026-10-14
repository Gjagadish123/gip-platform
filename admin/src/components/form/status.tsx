// Adapted from 21st.dev: diceui/status (demo 25395) + ddoemonn/filter-grid legend pattern (demo 23525)
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants"
import { formatNumber } from "@/lib/format"
import { percents, type StatusCounts } from "@/lib/inventory"
import type { UnitStatus } from "@/lib/types"

type Token = (typeof UNIT_STATUS_META)[UnitStatus]["token"]
type Pattern = (typeof UNIT_STATUS_META)[UnitStatus]["pattern"]

// Literal class names so Tailwind can see them. Tokens/patterns live in globals.css.
const TOKEN: Record<Token, { fill: string; fg: string; soft: string; dot: string }> = {
  available: {
    fill: "bg-status-available",
    fg: "text-status-available-fg",
    soft: "bg-status-available-soft",
    dot: "bg-status-available-fg",
  },
  sold: {
    fill: "bg-status-sold",
    fg: "text-status-sold-fg",
    soft: "bg-status-sold-soft",
    dot: "bg-status-sold-fg",
  },
  mortgaged: {
    fill: "bg-status-mortgaged",
    fg: "text-status-mortgaged-fg",
    soft: "bg-status-mortgaged-soft",
    dot: "bg-status-mortgaged-fg",
  },
  registered: {
    fill: "bg-status-registered",
    fg: "text-status-registered-fg",
    soft: "bg-status-registered-soft",
    dot: "bg-status-registered-fg",
  },
}
const PATTERN: Record<Pattern, string> = {
  plain: "",
  hatch: "pattern-sold",
  dots: "pattern-mortgaged",
  corner: "pattern-registered",
}

/** Fill + pattern classes for a status (bars, swatches, map polygons drawn with HTML). */
export function statusFillClass(status: UnitStatus) {
  const meta = UNIT_STATUS_META[status]
  return cn(TOKEN[meta.token].fill, PATTERN[meta.pattern])
}

/** Pill badge: soft background, -fg text, static 6px dot. Label always present. */
export function StatusBadge({ status, className }: { status: UnitStatus; className?: string }) {
  const meta = UNIT_STATUS_META[status]
  const t = TOKEN[meta.token]
  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        "inline-flex h-5.5 w-fit shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        t.soft,
        t.fg,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", t.dot)} />
      {meta.label}
    </span>
  )
}

/**
 * 12px square swatch drawn like the tile it stands for (the legend teaches the tiles): Available is a soft fill
 * with a 1px inset edge in its -fg colour; the others are the saturated fill + pattern.
 */
export function StatusSwatch({ status, className }: { status: UnitStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-3 shrink-0 rounded-[2px]",
        status === "available"
          ? "bg-status-available-soft shadow-[inset_0_0_0_1px_var(--status-available-fg)]"
          : cn("shadow-[inset_0_0_0_1px_var(--tile-edge)]", statusFillClass(status)),
        className,
      )}
    />
  )
}

function total(counts: StatusCounts) {
  return UNIT_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0)
}

/** "288 plots: 211 Available, 30 Sold Out, 38 Mortgaged, 9 Registered" */
export function statusSummary(counts: StatusCounts, noun = "units") {
  const parts = UNIT_STATUSES.map((s) => `${formatNumber(counts[s] ?? 0)} ${UNIT_STATUS_META[s].label}`)
  return `${formatNumber(total(counts))} ${noun}: ${parts.join(", ")}`
}

/** One stacked bar in client order with 2px gaps; non-zero segments keep a 2px minimum. */
export function StatusBar({
  counts,
  height = 8,
  noun,
  className,
}: {
  counts: StatusCounts
  /** px */
  height?: number
  /** Plural unit noun for the accessible label ("plots", "villas"). */
  noun?: string
  className?: string
}) {
  const sum = total(counts)
  return (
    <div
      role="img"
      aria-label={sum ? statusSummary(counts, noun) : `No ${noun ?? "units"} yet`}
      className={cn("flex w-full gap-0.5", className)}
      style={{ height }}
    >
      {sum === 0 ? (
        <span className="flex-1 rounded-[2px] bg-muted" />
      ) : (
        UNIT_STATUSES.map((s) =>
          counts[s] ? (
            <span
              key={s}
              className={cn(
                "min-w-0.5 rounded-[2px] shadow-[inset_0_0_0_1px_var(--tile-edge)] transition-[flex-grow] duration-200 ease-(--ease-standard)",
                // The folded corner is 7px: on a bar under 12px it reads as a stray white tick, so drop it there.
                height < 12 && s === "registered" ? TOKEN.registered.fill : statusFillClass(s),
              )}
              style={{ flex: `${counts[s]} 1 0%` }}
            />
          ) : null,
        )
      )}
    </div>
  )
}

/**
 * Legend with live counts and percents (largest remainder, sums to 100). With `onToggle` each entry is a
 * toggle button (aria-pressed) that filters; Alt+click passes `only: true` to isolate one status.
 * Pressed state is neutral (bg-accent + ring-coloured border), never the primary fill.
 */
export function StatusLegend({
  counts,
  active,
  onToggle,
  className,
}: {
  counts: StatusCounts
  active?: readonly UnitStatus[] | ReadonlySet<UnitStatus>
  onToggle?: (status: UnitStatus, opts: { only: boolean }) => void
  className?: string
}) {
  const on = new Set<UnitStatus>(active ?? [])
  const sum = total(counts)
  const pcts = percents(UNIT_STATUSES.map((s) => counts[s] ?? 0))

  return (
    <div
      role={onToggle ? "group" : "list"}
      aria-label={onToggle ? "Filter by status" : "Status legend"}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {UNIT_STATUSES.map((s, i) => {
        const meta = UNIT_STATUS_META[s]
        const body = (
          <>
            <StatusSwatch status={s} />
            <span className="font-medium text-foreground">{meta.label}</span>
            <span className="text-foreground tabular-nums">{formatNumber(counts[s] ?? 0)}</span>
            <span className="text-muted-foreground tabular-nums">{sum ? `${pcts[i]}%` : "–"}</span>
          </>
        )
        const base =
          "inline-flex h-8 items-center gap-2 rounded-lg border border-transparent px-2.5 text-[13px] whitespace-nowrap pointer-coarse:h-10"
        return onToggle ? (
          <button
            key={s}
            type="button"
            aria-pressed={on.has(s)}
            title="Click to filter. Alt+click to show only this status."
            onClick={(e) => onToggle(s, { only: e.altKey })}
            className={cn(
              base,
              "border-border transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
              "aria-pressed:border-ring aria-pressed:bg-accent",
            )}
          >
            {body}
          </button>
        ) : (
          <span key={s} role="listitem" className={cn(base, "px-1.5")}>
            {body}
          </span>
        )
      })}
    </div>
  )
}
