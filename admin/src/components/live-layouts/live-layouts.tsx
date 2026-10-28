"use client"
// /live-layouts: the admin side of the website's live layouts page, and only its four projects (LIVE_LAYOUT_IDS).
// Their inventory is what that page shows: a status change reaches open pages within a second (supabase migration
// live_layouts), so this screen says per project what visitors see now and opens the place to change it.
import { useId } from "react"
import Link from "next/link"
import { ArrowUpRight, Map as MapIcon, Rows3 } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/app/page-header"
import { SampleBadge } from "@/components/form/hints"
import { StatusBar, StatusSwatch } from "@/components/form/status"
import { setInventoryView } from "@/components/inventory/use-selection"
import { LifecycleBadge, PublishBadge } from "@/components/projects/list/project-badges"
import { Button } from "@/components/ui/button"
import { getProjectType, UNIT_STATUSES, UNIT_STATUS_META, WEBSITE_URL } from "@/lib/constants"
import { formatDate, formatNumber } from "@/lib/format"
import { statusCounts } from "@/lib/inventory"
import { layoutInfo, LIVE_LAYOUT_IDS } from "@/lib/layouts"
import { useDemo } from "@/lib/store"
import type { Project, Unit } from "@/lib/types"

export function LiveLayouts() {
  const { state } = useDemo()
  const projects = LIVE_LAYOUT_IDS.map((id) => state.projects.find((p) => p.id === id)).filter((p): p is Project => !!p)
  const listed = projects.filter((p) => p.publishing.state === "published").length

  return (
    <PageContainer>
      <PageHeader
        title="Live layouts"
        description={`The approved layouts on the website, plot by plot, coloured by status · ${listed} of ${LIVE_LAYOUT_IDS.length} on the page now`}
        actions={
          WEBSITE_URL ? (
            <Button asChild variant="outline">
              <a href={`${WEBSITE_URL}/layouts`} target="_blank" rel="noopener noreferrer">
                Open the live page
                <ArrowUpRight data-icon="inline-end" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          ) : null
        }
      />

      <ul className="grid gap-4 xl:grid-cols-2">
        {projects.map((p) => (
          <li key={p.id} className="min-w-0">
            <LayoutCard project={p} units={state.units[p.id] ?? []} />
          </li>
        ))}
      </ul>

      <section aria-label="How the live page follows the admin" className="mt-6 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <ul className="grid gap-1.5 sm:grid-cols-2 sm:gap-x-8">
          <li>A status changed in a project&rsquo;s inventory shows on the live page within a second.</li>
          <li>Undoing a registration, or putting a sold plot back on sale, needs a note: the database refuses it without one.</li>
          <li>Only published projects are on the page; unpublishing one takes it off for every visitor at once.</li>
          <li>Plot numbers, sizes and facing come from the approved layout; Sample statuses are placeholders until sales confirms them.</li>
        </ul>
      </section>
    </PageContainer>
  )
}

function LayoutCard({ project, units }: { project: Project; units: Unit[] }) {
  const id = useId()
  const info = layoutInfo(project.id)
  const type = getProjectType(project.typeId)
  const nouns = type.unitNounPlural.toLowerCase()
  const counts = statusCounts(units)
  const sample = units.some((u) => u.sample)
  const listed = project.publishing.state === "published"
  const drawn = !!info?.plots
  const liveHref = WEBSITE_URL && listed ? `${WEBSITE_URL}/layouts?project=${project.id}` : null

  return (
    <article aria-labelledby={id} className="flex h-full flex-col rounded-xl border bg-card text-card-foreground">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold">
            <Link href={`/projects/${project.id}`} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              {project.name}
            </Link>
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{project.location.short}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PublishBadge state={project.publishing.state} />
          <LifecycleBadge lifecycle={project.lifecycle} />
        </div>
      </header>

      <dl className="grid gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">On the live page</dt>
          <dd className="mt-0.5">{listed ? "Listed: visitors see it now" : "Not listed: publish the project to show it"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Drawing</dt>
          <dd className="mt-0.5">
            {drawn && info
              ? `${formatNumber(info.plots)} ${nouns} from the ${info.source.title}${info.fit ? `, on the map within about ${Math.max(1, Math.round(info.fit))} m` : ""}`
              : `Pending: the ${info?.source.title ?? "approved layout"} isn't digitised, so the page shows the site pin and the ${nouns} as a list`}
          </dd>
        </div>
      </dl>

      <div className="px-4 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p>
            <span className="font-semibold tabular-nums">{formatNumber(counts.available)}</span>
            <span className="text-muted-foreground"> available of {formatNumber(units.length)} {nouns}</span>
          </p>
          {sample ? <SampleBadge /> : null}
        </div>
        <StatusBar counts={counts} noun={nouns} className="mt-2" />
        <ul aria-hidden className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
          {UNIT_STATUSES.map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <StatusSwatch status={s} />
              {UNIT_STATUS_META[s].label} {formatNumber(counts[s])}
            </li>
          ))}
        </ul>
        {project.inventoryUpdatedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">Statuses as of {formatDate(project.inventoryUpdatedAt)}</p>
        ) : null}
      </div>

      <footer className="mt-auto flex flex-wrap gap-2 border-t p-3">
        <Button asChild size="sm">
          <Link href={`/projects/${project.id}/inventory`} onClick={() => setInventoryView(drawn ? "layout" : "grid")}>
            {drawn ? <MapIcon data-icon="inline-start" /> : <Rows3 data-icon="inline-start" />}
            {drawn ? "Change statuses on the layout" : "Change statuses"}
          </Link>
        </Button>
        {liveHref ? (
          <Button asChild size="sm" variant="ghost">
            <a href={liveHref} target="_blank" rel="noopener noreferrer">
              View on the live page
              <ArrowUpRight data-icon="inline-end" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        ) : null}
      </footer>
    </article>
  )
}
