"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { formatNumber } from "@/lib/format"
import type { ID } from "@/lib/types"
import { cn } from "@/lib/utils"

import { detailsTabId } from "./editor/section-types"

type Tab = { id?: string; href: string; label: string; count?: number; dirty?: boolean }

function TabLinks({ tabs, current }: { tabs: Tab[]; current: string | null }) {
  return (
    <nav aria-label="Project views" className="flex gap-6 border-b">
      {tabs.map((t) => {
        const active = t.href === current
        return (
          <Link
            key={t.href}
            id={t.id}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px inline-flex h-10 items-center gap-2 border-b-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.dirty && (
              <>
                <span aria-hidden className="size-1.5 rounded-full bg-foreground" />
                <span className="sr-only">(unsaved changes)</span>
              </>
            )}
            {t.count !== undefined && (
              <span className="text-xs font-normal text-muted-foreground tabular-nums">{formatNumber(t.count)}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function ActiveTabLinks({ tabs, title }: { tabs: Tab[]; title: string }) {
  const pathname = usePathname()
  const tab = tabs.find((t) => t.href === pathname) ?? tabs[0]
  // The browser tab names the project (the route's static metadata can't know it).
  useEffect(() => {
    document.title = `${title} · ${tab.label} · GIP Admin`
  }, [title, tab.label])
  return <TabLinks tabs={tabs} current={tab.href} />
}

/** Route tabs under the project header (visual-direction §6.2 underline style). Inventory only for types with units. */
export function ProjectTabs({
  projectId,
  projectName,
  showInventory,
  unitCount,
  dirty,
}: {
  projectId: ID
  projectName: string
  showInventory: boolean
  unitCount: number
  /** Unsaved Details edits: a neutral dot on Details, so they're not forgotten from Inventory. */
  dirty?: boolean
}) {
  const base = `/projects/${projectId}`
  const tabs: Tab[] = [{ id: detailsTabId(projectId), href: base, label: "Details", dirty }]
  if (showInventory) tabs.push({ href: `${base}/inventory`, label: "Inventory", count: unitCount })
  return (
    <Suspense fallback={<TabLinks tabs={tabs} current={null} />}>
      <ActiveTabLinks tabs={tabs} title={projectName} />
    </Suspense>
  )
}
