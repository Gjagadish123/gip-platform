// Adapted from 21st.dev: uvain/revenue-charts-kpi (demo 33507) — BarCompare rules: one y-axis, thin bars (≤ 24px),
// hairline grid, no animation, legend for 2+ series, the chart hidden from AT with a visually hidden data table.
"use client"

import { useId, useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { monthlyStatusChanges } from "@/components/dashboard/dashboard-data"
import { StatusSwatch } from "@/components/form/status"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants"
import { formatNumber } from "@/lib/format"
import type { ActivityEvent } from "@/lib/types"

// Inventory charts use the status tokens, never chart-1..5 (visual-direction §3.4).
// ponytail: plain bar fills, no SVG hatch/dot patterns; the legend swatches teach the patterns, and the legend,
// tooltip and hidden table carry the labels. Except Hold: it stacks right on Registered and the two hues are close for
// protanopes, so its bar keeps the tile's stripes (drawn over the fill, so the tooltip dot still gets the colour).
const CONFIG = Object.fromEntries(
  UNIT_STATUSES.map((s) => [s, { label: UNIT_STATUS_META[s].label, color: `var(--status-${UNIT_STATUS_META[s].token})` }]),
) satisfies ChartConfig

type BarShape = { x?: number; y?: number; width?: number; height?: number; fill?: string }

/** Units moved into each status per month, last 6 months, stacked in client order. */
export function StatusChangesChart({ activity }: { activity: ActivityEvent[] }) {
  const stripes = `${useId()}-hold`
  const rows = useMemo(() => monthlyStatusChanges(activity), [activity])
  const totals = UNIT_STATUSES.map((s) => rows.reduce((n, r) => n + r[s], 0))
  const sum = totals.reduce((a, b) => a + b, 0)
  const span = `${rows[0].label} to ${rows.at(-1)!.label}`

  if (!sum) {
    return <p className="px-4 py-12 text-center text-sm text-muted-foreground">No status changes from {span}.</p>
  }

  return (
    <div className="grid gap-3 p-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-hidden>
        {UNIT_STATUSES.map((s, i) => (
          <li key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StatusSwatch status={s} />
            {UNIT_STATUS_META[s].label}
            <span className="text-foreground tabular-nums">{formatNumber(totals[i])}</span>
          </li>
        ))}
      </ul>

      <ChartContainer config={CONFIG} aria-hidden className="aspect-auto h-[220px] w-full">
        <BarChart data={rows} accessibilityLayer={false} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="28%">
          <defs>
            <pattern id={stripes} width={5} height={5} patternUnits="userSpaceOnUse">
              <rect width={5} height={1.5} style={{ fill: "oklch(0 0 0 / 0.2)" }} />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.slice(0, 3)} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent className="min-w-40" />} />
          {UNIT_STATUSES.map((s) => (
            <Bar
              key={s}
              dataKey={s}
              stackId="changes"
              fill={`var(--color-${s})`}
              stroke="var(--card)"
              strokeWidth={1}
              radius={2}
              maxBarSize={24}
              isAnimationActive={false}
              {...(s === "hold" && {
                shape: ({ x = 0, y = 0, width = 0, height = 0, fill }: BarShape) => (
                  <g>
                    <rect x={x} y={y} width={width} height={height} rx={2} fill={fill} stroke="var(--card)" strokeWidth={1} />
                    <rect x={x} y={y} width={width} height={height} rx={2} fill={`url(#${stripes})`} />
                  </g>
                ),
              })}
            />
          ))}
        </BarChart>
      </ChartContainer>

      {/* ponytail: sr-only on <table> itself does not clip (tables size to content) and widened the page on phones. */}
      <div className="sr-only">
        <table>
          <caption>Units changed per month by new status, {span} (sample activity)</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              {UNIT_STATUSES.map((s) => (
                <th key={s} scope="col">
                  {UNIT_STATUS_META[s].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month}>
                <th scope="row">{r.label}</th>
                {UNIT_STATUSES.map((s) => (
                  <td key={s}>{r[s]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
