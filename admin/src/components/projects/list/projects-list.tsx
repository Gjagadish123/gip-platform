"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowUpDown, Building2, LayoutGrid, Plus, Rows3, Search, SearchX, X } from "lucide-react"

import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DEFAULT_PROJECT_TYPES, PUBLISH_META, PUBLISH_STATES } from "@/lib/constants"
import { formatNumber, plural } from "@/lib/format"
import { useDemo, useProjects } from "@/lib/store"
import type { Project, PublishState } from "@/lib/types"
import { cn } from "@/lib/utils"

import { FacetedFilter } from "./faceted-filter"
import {
  SORT_LABEL, VIEWS, VIEW_LABEL, countBy, inView, matchesFacets, matchesQuery, parseView, sortRows, toRows,
  type ProjectRow, type SortKey, type View,
} from "./list-model"
import { DeleteProjectDialog, ProjectMenu } from "./project-actions"
import { ProjectCards } from "./project-cards"
import { ProjectsTable } from "./projects-table"

/* ---------- header (no URL reads, so it sits outside the page's Suspense) ---------- */

export function ProjectsHeader() {
  const projects = useProjects().filter((p) => p.publishing.state !== "archived")
  const count = (l: Project["lifecycle"]) => projects.filter((p) => p.lifecycle === l).length
  return (
    <PageHeader
      title="Projects"
      description={
        <>
          <span className="tabular-nums">{plural(projects.length, "project", "projects")}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{formatNumber(count("ongoing"))} ongoing</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{formatNumber(count("completed"))} completed</span>
        </>
      }
      actions={
        <Button asChild size="lg">
          <Link href="/projects/new">
            <Plus />
            New project
          </Link>
        </Button>
      }
    />
  )
}

/* ---------- Table | Cards preference (per browser, survives reloads) ---------- */

type Layout = "table" | "cards"
const LAYOUT_KEY = "gip-admin:projects-layout"
let memLayout: Layout = "table" // used when storage is blocked
const layoutListeners = new Set<() => void>()

function readLayout(): Layout {
  try {
    const v = localStorage.getItem(LAYOUT_KEY)
    return v === "cards" || v === "table" ? v : memLayout
  } catch {
    return memLayout
  }
}
function subscribeLayout(l: () => void) {
  layoutListeners.add(l)
  window.addEventListener("storage", l)
  return () => {
    layoutListeners.delete(l)
    window.removeEventListener("storage", l)
  }
}
function setLayout(l: Layout) {
  memLayout = l
  try {
    localStorage.setItem(LAYOUT_KEY, l)
  } catch {
    /* private mode: memLayout keeps it for this tab */
  }
  layoutListeners.forEach((f) => f())
}
const useLayout = () => React.useSyncExternalStore(subscribeLayout, readLayout, () => "table" as Layout)

/* ---------- browser: tabs, toolbar, table / cards ---------- */

export function ProjectsBrowserSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading projects" className="flex flex-col gap-4">
      <div className="h-8 w-full max-w-[440px] rounded-lg bg-muted" />
      <div className="h-8 w-full max-w-[640px] rounded-lg bg-muted" />
      <div className="h-96 rounded-xl border bg-muted/40" />
    </div>
  )
}

export function ProjectsBrowser() {
  const params = useSearchParams()
  const view = parseView(params.get("view"))
  const { state } = useDemo()
  const layout = useLayout()

  const [query, setQuery] = React.useState("")
  const [types, setTypes] = React.useState<string[]>([])
  const [states, setStates] = React.useState<PublishState[]>([])
  const [sort, setSort] = React.useState<SortKey>("order")
  const [deleting, setDeleting] = React.useState<Project | null>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  // Next keeps this route mounted (hidden) after navigating away; don't come back to a half-finished delete.
  React.useLayoutEffect(() => () => setDeleting(null), [])

  const rows = React.useMemo(() => toRows(state.projects, state.units), [state.projects, state.units])
  const tabCounts = React.useMemo(
    () => Object.fromEntries(VIEWS.map((v) => [v, rows.filter((r) => inView(r, v)).length])) as Record<View, number>,
    [rows],
  )
  const inTab = rows.filter((r) => inView(r, view) && matchesQuery(r, query))
  // Each facet counts against the other facet's selection, like shadcn's faceted filter.
  const typeCounts = countBy(inTab.filter((r) => matchesFacets(r, [], states)), (r) => r.type.id)
  const stateCounts = countBy(inTab.filter((r) => matchesFacets(r, types, [])), (r) => r.project.publishing.state)
  const visible = sortRows(inTab.filter((r) => matchesFacets(r, types, states)), sort)
  const filtered = query.trim() !== "" || types.length > 0 || states.length > 0

  const clearFilters = () => {
    setQuery("")
    setTypes([])
    setStates([])
  }
  const setView = (v: string) => {
    // Native history keeps useSearchParams in sync without a server round trip.
    window.history.replaceState(null, "", v === "all" ? "/projects" : `/projects?view=${v}`)
  }

  // "/" focuses search. Effects unmount while Next keeps this route hidden, so the key only works here.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || t.closest("input, textarea, select, [contenteditable=true]"))
        return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const renderActions = (row: ProjectRow) => <ProjectMenu row={row} onDelete={setDeleting} />

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={view} onValueChange={setView}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList aria-label="Project views">
            {VIEWS.map((v) => (
              <TabsTrigger key={v} value={v} className="flex-none px-2.5">
                {VIEW_LABEL[v]}
                <span className="text-xs text-muted-foreground tabular-nums">{formatNumber(tabCounts[v])}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="w-full sm:w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            type="search"
            aria-label="Search projects by name, location or RERA number"
            placeholder="Search name, location, RERA"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault()
                setQuery("")
              }
            }}
            className="[&::-webkit-search-cancel-button]:hidden"
          />
          <InputGroupAddon align="inline-end">
            {query ? (
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQuery("")}>
                <X />
              </InputGroupButton>
            ) : (
              <Kbd className="hidden sm:inline-flex">/</Kbd>
            )}
          </InputGroupAddon>
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2">
          <FacetedFilter
            title="Type"
            options={DEFAULT_PROJECT_TYPES.map((t) => ({ value: t.id, label: t.name, count: typeCounts[t.id] ?? 0 }))}
            selected={types}
            onChange={setTypes}
          />
          <FacetedFilter
            title="Publishing"
            options={PUBLISH_STATES.map((s) => ({ value: s, label: PUBLISH_META[s].label, count: stateCounts[s] ?? 0 }))}
            selected={states}
            onChange={(v) => setStates(v as PublishState[])}
          />
          {(types.length > 0 || states.length > 0) && (
            <Button
              variant="ghost"
              onClick={() => {
                setTypes([])
                setStates([])
              }}
            >
              Reset
              <X />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger aria-label="Sort projects" className="min-w-44">
              <ArrowUpDown className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SORT_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Phones always get cards, so the choice only shows from sm up. */}
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={layout}
            onValueChange={(v) => v && setLayout(v as Layout)}
            aria-label="Layout"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="table" aria-label="Table">
              <Rows3 />
              <span className="hidden md:inline">Table</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="Cards">
              <LayoutGrid />
              <span className="hidden md:inline">Cards</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState view={view} filtered={filtered} noProjects={state.projects.length === 0} onClear={clearFilters} />
      ) : layout === "cards" ? (
        <ProjectCards rows={visible} renderActions={renderActions} />
      ) : (
        <>
          <div className="sm:hidden">
            <ProjectCards rows={visible} renderActions={renderActions} />
          </div>
          <div className="hidden sm:block">
            <ProjectsTable rows={visible} sort={sort} onSort={setSort} renderActions={renderActions} />
          </div>
        </>
      )}

      {/* Always mounted so filter changes are announced, including "none". */}
      <p className={cn("text-xs text-muted-foreground tabular-nums", visible.length === 0 && "sr-only")} aria-live="polite">
        {visible.length === 0 ? (
          "No projects match"
        ) : (
          <>
            Showing {formatNumber(visible.length)} of {plural(tabCounts[view], "project", "projects")}
            {view !== "all" && ` in ${VIEW_LABEL[view]}`}
          </>
        )}
      </p>

      <DeleteProjectDialog project={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}

const VIEW_EMPTY: Record<View, string> = {
  all: "No projects yet. Create one to start adding its page content and inventory.",
  ongoing: "No ongoing projects. Projects that are selling now show up here.",
  completed: "No completed projects yet.",
  drafts: "No drafts. New and duplicated projects start here until you publish them.",
  archived: "Nothing archived. Archived projects are hidden from the website and from these lists.",
}

function EmptyState({
  view,
  filtered,
  noProjects,
  onClear,
}: {
  view: View
  filtered: boolean
  noProjects: boolean
  onClear: () => void
}) {
  return (
    <Empty className="border py-12">
      <EmptyHeader>
        <EmptyMedia className="text-muted-foreground">
          {filtered ? <SearchX className="size-5" /> : <Building2 className="size-5" />}
        </EmptyMedia>
        <EmptyTitle className="sr-only">{filtered ? "No matching projects" : "No projects"}</EmptyTitle>
        <EmptyDescription>{filtered ? "No projects match these filters." : VIEW_EMPTY[noProjects ? "all" : view]}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {filtered ? (
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        ) : (
          (noProjects || view === "all" || view === "drafts") && (
            <Button asChild>
              <Link href="/projects/new">
                <Plus />
                New project
              </Link>
            </Button>
          )
        )}
      </EmptyContent>
    </Empty>
  )
}
