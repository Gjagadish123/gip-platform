// Inventory tab. The [id] layout renders the container, project header and tabs; this page renders the body.
// Project ids live in the client store, so params are unknown at build: they are awaited inside <Suspense>.
// The ?unit= deep link is read inside InventoryScreen, in its own <Suspense>.
import { Suspense } from "react"
import type { Metadata } from "next"

import { InventoryScreen } from "@/components/inventory/inventory-screen"

export const metadata: Metadata = { title: "Inventory" }

async function Inventory({ params }: Pick<PageProps<"/projects/[id]/inventory">, "params">) {
  const { id } = await params
  return <InventoryScreen projectId={id} />
}

function InventorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading inventory" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-6 w-72 max-w-full rounded-md bg-muted" />
        <div className="h-2 rounded-[2px] bg-muted" />
        <div className="h-8 w-[32rem] max-w-full rounded-md bg-muted" />
      </div>
      <div className="h-8 w-96 max-w-full rounded-md bg-muted" />
      <div className="h-96 rounded-xl border bg-muted/40" />
    </div>
  )
}

export default function InventoryPage({ params }: PageProps<"/projects/[id]/inventory">) {
  return (
    <Suspense fallback={<InventorySkeleton />}>
      <Inventory params={params} />
    </Suspense>
  )
}
