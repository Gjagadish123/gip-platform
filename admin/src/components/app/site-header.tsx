"use client"

import { Fragment, Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { CommandMenu, SearchButton } from "@/components/app/command-menu"
import { ThemeToggle } from "@/components/app/theme-toggle"
import { UserMenu } from "@/components/app/user-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useProjects } from "@/lib/store"
import { cn } from "@/lib/utils"

type Crumb = { label: string; href: string; project?: boolean }

function crumbsFor(pathname: string, projectName: (id: string) => string | undefined): Crumb[] {
  const [, section, id, sub] = pathname.split("/")
  if (section === "dashboard") return [{ label: "Dashboard", href: "/dashboard" }]
  if (section !== "projects") return []
  const crumbs: Crumb[] = [{ label: "Projects", href: "/projects" }]
  if (id === "new") crumbs.push({ label: "New project", href: "/projects/new" })
  else if (id) {
    crumbs.push({ label: projectName(id) ?? "Project", href: `/projects/${id}`, project: true })
    if (sub === "inventory") crumbs.push({ label: "Inventory", href: `/projects/${id}/inventory` })
  }
  return crumbs
}

function AppBreadcrumb() {
  const pathname = usePathname()
  const projects = useProjects()
  const crumbs = crumbsFor(pathname, (id) => projects.find((p) => p.id === id)?.name)

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={c.href}>
              {/* Below 1280px only the current page shows, so it never slides under the search button. */}
              <BreadcrumbItem className={last ? "min-w-0" : "hidden xl:inline-flex"}>
                {last ? (
                  <BreadcrumbPage
                    title={c.project ? c.label : undefined}
                    className={cn("truncate font-medium", c.project && "max-w-[32ch]")}
                  >
                    {c.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={c.href}
                      title={c.project ? c.label : undefined}
                      className={cn(c.project && "max-w-[32ch] truncate")}
                    >
                      {c.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator className="hidden xl:block" />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/** 56px app header (visual-direction §6.1). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 sm:px-6 xl:px-8">
      <SidebarTrigger className="-ml-1.5" />
      <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-center" />
      <Suspense fallback={<div className="h-4 w-40 rounded-md bg-muted" />}>
        <AppBreadcrumb />
      </Suspense>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Suspense fallback={<SearchButton />}>
          <CommandMenu />
        </Suspense>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
