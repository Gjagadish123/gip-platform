"use client"

import { useCallback, type ReactNode } from "react"
import { CloudOff, Search } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useProjects } from "@/lib/store"
import type { ID } from "@/lib/types"

/** id -> project name (the id itself for a project that is gone). */
export function useProjectNames() {
  const projects = useProjects()
  return useCallback((id: ID | undefined) => (id ? (projects.find((p) => p.id === id)?.name ?? id) : ""), [projects])
}

/** Search, project and one row of source/channel toggles: the filter bar of the CRM pages. */
export function CrmFilters({
  query,
  onQuery,
  placeholder,
  project,
  onProject,
  sourceLabel,
  source,
  onSource,
  sources,
  children,
}: {
  query: string
  onQuery: (v: string) => void
  placeholder: string
  project: string
  onProject: (v: string) => void
  sourceLabel: string
  source: string
  onSource: (v: string) => void
  sources: [value: string, label: string][]
  children?: ReactNode
}) {
  const projects = useProjects().filter((p) => p.publishing.state !== "archived")
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" aria-label="Search" placeholder={placeholder} value={query} onChange={(e) => onQuery(e.target.value)} className="pl-8" />
      </div>
      <Select value={project} onValueChange={onProject}>
        <SelectTrigger aria-label="Project" className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All projects</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ToggleGroup
        type="single"
        variant="outline"
        aria-label={sourceLabel}
        value={source}
        onValueChange={(v) => v && onSource(v)}
        className="flex-wrap"
      >
        {sources.map(([v, label]) => (
          <ToggleGroupItem key={v} value={v} className="px-3">
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {children}
    </div>
  )
}

/** The demo build has no database: these pages need it. */
export function CrmNotice({ title }: { title: string }) {
  return (
    <PageContainer>
      <PageHeader title={title} />
      <div className="flex flex-col items-center gap-3 rounded-lg border px-4 py-14 text-center">
        <CloudOff aria-hidden className="size-5 text-muted-foreground" />
        <p className="max-w-md text-sm text-muted-foreground">
          Bookings, the common sheet and the reports work on the live database. This copy of the admin is the offline demo.
        </p>
      </div>
    </PageContainer>
  )
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
      <span>Could not load: {message}</span>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="grid gap-2 rounded-lg border p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}
