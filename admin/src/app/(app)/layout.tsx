import type { ReactNode } from "react"

import { AppSidebar } from "@/components/app/app-sidebar"
import { HydrationGate } from "@/components/app/hydration-gate"
import { SiteHeader } from "@/components/app/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// DemoStoreProvider lives in the root layout (shared with /login).
// URL-reading pieces (nav active state, breadcrumb) sit in their own <Suspense> inside AppSidebar/SiteHeader,
// so /projects/[id] (ids live in the client store, unknown at build) keeps a prerendered shell.
// ponytail: sidebar open state starts expanded; reading the sidebar_state cookie here would make the shell dynamic.
// AppSidebar folds it to the icon rail on first load below 1280px.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <a
        href="#content"
        className="sr-only rounded-md bg-background px-3 py-2 text-sm font-medium shadow-overlay ring-2 ring-ring outline-none focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to content
      </a>
      <AppSidebar />
      {/* min-w-0: wide tables (min-w-[1000px]) must scroll inside their card, not widen the page. */}
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div id="content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          <HydrationGate>{children}</HydrationGate>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
