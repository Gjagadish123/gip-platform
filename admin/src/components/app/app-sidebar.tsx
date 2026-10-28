// Structure: shadcn sidebar-07 block on the installed sidebar primitives.
// Visual tokens only from 21st.dev: wensity/sidebar (demo 31454): muted count chip, quiet hover, one active fill.
"use client"

import { Suspense, useEffect, useRef } from "react"
import { ArrowUpRight, Building2, ChevronRight, Globe, LayoutDashboard, Map as MapIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { withBase } from "@/lib/base-path"
import { LIVE_SITE_URL } from "@/lib/constants"
import { LIVE_LAYOUT_IDS } from "@/lib/layouts"
import { useProjects } from "@/lib/store"
import { cn } from "@/lib/utils"

/** true for `/projects/1` and `/projects/1/inventory`, false for `/projects/12`. */
function within(pathname: string | null, base: string) {
  return pathname === base || (pathname?.startsWith(base + "/") ?? false)
}

function ActiveNav() {
  return <NavMain pathname={usePathname()} />
}

/** pathname null = Suspense fallback: same items, nothing highlighted, so the rail never shifts. */
function NavMain({ pathname }: { pathname: string | null }) {
  const projects = useProjects()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const iconOnly = state === "collapsed" && !isMobile
  const close = () => {
    if (isMobile) setOpenMobile(false)
  }

  const listed = projects.filter((p) => p.publishing.state !== "archived")
  // Shortcuts to what's live and selling: drafts (Skyline, fresh duplicates) stay under All projects.
  const ongoing = listed.filter((p) => p.lifecycle === "ongoing" && p.publishing.state === "published")
  const inProjects = within(pathname, "/projects")

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-0.5">
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Dashboard" className="font-medium">
            <Link href="/dashboard" onClick={close}>
              <LayoutDashboard />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {iconOnly ? (
          // Icon rail: sub-items are hidden, so Projects is a plain link that carries the active state.
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={inProjects} tooltip="Projects" className="font-medium">
              <Link href="/projects">
                <Building2 />
                <span>Projects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          <Collapsible asChild defaultOpen className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                {/* Parent of the active leaf: weight only, never a second fill. */}
                <SidebarMenuButton className={cn("font-medium", inProjects && "font-semibold text-sidebar-accent-foreground")}>
                  <Building2 />
                  <span>Projects</span>
                  <span className="ml-auto rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-xs leading-none font-medium tabular-nums text-muted-foreground">
                    {listed.length}
                  </span>
                  <ChevronRight className="text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/projects"}>
                      <Link href="/projects" onClick={close}>
                        <span>All projects</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/projects/new"}>
                      <Link href="/projects/new" onClick={close}>
                        <span>New project</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {ongoing.length > 0 && <li className="px-2 pt-2.5 pb-0.5 text-xs text-muted-foreground">Ongoing</li>}
                  {ongoing.map((p) => (
                    <SidebarMenuSubItem key={p.id}>
                      <SidebarMenuSubButton asChild isActive={within(pathname, `/projects/${p.id}`)}>
                        <Link href={`/projects/${p.id}`} onClick={close} title={p.name}>
                          <span>{p.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        )}

        {/* The four projects on the website's live layouts page (the screen lists them; one fill, no repeats). */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/live-layouts"} tooltip="Live layouts" className="font-medium">
            <Link href="/live-layouts" onClick={close}>
              <MapIcon />
              <span>Live layouts</span>
              <span className="ml-auto rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-xs leading-none font-medium tabular-nums text-muted-foreground">
                {LIVE_LAYOUT_IDS.length}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

/** Once per load: below 1280px the expanded sidebar squeezes the editor, so start on the icon rail. */
function useCompactOnMediumScreens() {
  const { setOpen } = useSidebar()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    if (window.matchMedia("(max-width: 1279px)").matches) setOpen(false)
  }, [setOpen])
}

export function AppSidebar() {
  useCompactOnMediumScreens()
  return (
    <Sidebar collapsible="icon">
      {/* 56px, same as the app header, so the two bottom borders line up. */}
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="h-10" tooltip="Dashboard">
              <Link href="/dashboard">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand">
                  <Image src={withBase("/brand/gip-roof-white.svg")} alt="" width={22} height={9} priority />
                </span>
                <span className="grid min-w-0 leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">Greater Infra Projects</span>
                  <span className="truncate text-xs text-muted-foreground">Admin</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <Suspense fallback={<NavMain pathname={null} />}>
          <ActiveNav />
        </Suspense>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Open live website" className="text-muted-foreground">
              <a href={LIVE_SITE_URL} target="_blank" rel="noopener noreferrer">
                <Globe />
                <span>Open live website</span>
                <ArrowUpRight className="ml-auto" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
