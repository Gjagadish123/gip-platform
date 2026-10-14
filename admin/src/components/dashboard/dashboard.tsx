// Adapted from 21st.dev: uvain/revenue-charts-kpi (demo 33507) — calm figures and block headers only; the KPI cards,
// deltas and sparklines are replaced by the stat strip from visual-direction §6.6.
"use client"

import { useId, useMemo, type ReactNode } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/app/page-header"
import { inventorySummary } from "@/components/dashboard/dashboard-data"
import { NeedsAttention } from "@/components/dashboard/needs-attention"
import { ProjectsTable } from "@/components/dashboard/projects-table"
import { RecentChanges } from "@/components/dashboard/recent-changes"
import { StatusChangesChart } from "@/components/dashboard/status-changes-chart"
import { SampleBadge } from "@/components/form/hints"
import { StatusBar, StatusSwatch } from "@/components/form/status"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants"
import { formatNumber, pct, plural } from "@/lib/format"
import { useDemo } from "@/lib/store"
import type { ID, Project, Unit, UnitStatus } from "@/lib/types"

export function Dashboard() {
  const { state, hydrated } = useDemo()
  const { projects, units, activity } = state

  const listed = useMemo(() => projects.filter((p) => p.publishing.state !== "archived"), [projects])

  if (!hydrated) return <DashboardSkeleton />

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Inventory and listings across ${plural(listed.length, "project", "projects")}`}
        actions={
          <Button asChild size="lg">
            <Link href="/projects/new">
              <Plus data-icon="inline-start" />
              New project
            </Link>
          </Button>
        }
      />

      <div className="grid gap-8">
        <StatStrip projects={listed} units={units} />

        <Block
          title="Ongoing projects"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">All projects</Link>
            </Button>
          }
        >
          <ProjectsTable projects={listed} units={units} />
        </Block>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="grid gap-6">
            <Block title="Recent status changes">
              <RecentChanges activity={activity} projects={listed} />
            </Block>
            <Block title="Status changes, last 6 months" action={<SampleBadge label="Sample activity" />}>
              <StatusChangesChart activity={activity} />
            </Block>
          </div>
          <Block title="Needs attention">
            <NeedsAttention projects={projects} units={units} />
          </Block>
        </div>
      </div>
    </PageContainer>
  )
}

/** Card for one dashboard block (visual-direction §6.3): 48px header with the title and one quiet action. */
function Block({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="min-w-0 overflow-hidden rounded-xl border bg-card text-card-foreground">
      <div className="flex h-12 items-center justify-between gap-3 border-b px-4">
        <h2 id={id} className="truncate text-base font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/* ---------- stat strip ---------- */

function StatStrip({ projects, units }: { projects: Project[]; units: Record<ID, Unit[]> }) {
  const s = useMemo(() => inventorySummary(projects, units), [projects, units])

  return (
    <section aria-label="Inventory summary">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-end lg:gap-x-10">
        <Stat label="Total units" value={s.total} sub={`in ${plural(s.projects, "project", "projects")}`} />
        {UNIT_STATUSES.map((st, i) => (
          <Stat
            key={st}
            status={st}
            label={UNIT_STATUS_META[st].label}
            value={s.counts[st]}
            sub={s.total ? `${s.percents[i]}% of total` : "–"}
          />
        ))}
        <Stat
          label="Sellable now"
          value={s.sellable}
          // Same number as Available → same (largest-remainder) percent, so 439 never reads 53% and 54% side by side.
          sub={
            s.total
              ? `${s.sellable === s.counts.available ? s.percents[0] : pct(s.sellable, s.total)}% · ongoing, published`
              : "–"
          }
        />
      </dl>
      <div className="mt-5 flex items-center gap-3">
        <StatusBar counts={s.counts} height={8} noun="units" className="flex-1" />
        {s.sample && (
          <Tooltip>
            {/* pointer-events-none on the badge so its own native title doesn't stack on this tooltip */}
            <TooltipTrigger className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring [&>*]:pointer-events-none">
              <SampleBadge />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="max-w-72">
              Most statuses are sample data made for this demo. Real: Global City VI&rsquo;s sold plots, from the
              brochure scan of 21 Sep 2026, and any status changed here.
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value, sub, status }: { label: string; value: number; sub: string; status?: UnitStatus }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {status && <StatusSwatch status={status} />}
        {label}
      </dt>
      <dd className="mt-1 font-condensed text-[2rem]/9 font-semibold tracking-[-0.01em] tabular-nums">
        {formatNumber(value)}
      </dd>
      <dd className="text-xs text-muted-foreground tabular-nums">{sub}</dd>
    </div>
  )
}

/* ---------- loading ---------- */

// ponytail: HydrationGate in (app)/layout already hides pages until the store hydrates; this keeps the dashboard's
// own shape if that gate ever goes. Static blocks, no pulse (visual-direction §6.7).
function DashboardSkeleton() {
  return (
    <PageContainer>
      <div aria-busy="true" aria-label="Loading dashboard">
        <div className="h-8 w-40 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-72 max-w-full rounded-md bg-muted" />
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:flex lg:gap-x-10">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="mt-1 h-9 w-16 rounded bg-muted" />
              <div className="mt-1 h-4 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-5 h-2 rounded-[2px] bg-muted" />
        <div className="mt-8 h-96 rounded-xl border bg-muted/40" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-xl border bg-muted/40" />
          <div className="h-80 rounded-xl border bg-muted/40" />
        </div>
      </div>
    </PageContainer>
  )
}
