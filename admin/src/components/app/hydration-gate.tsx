"use client"

import type { ReactNode } from "react"

import { PageContainer } from "@/components/app/page-header"
import { useDemo } from "@/lib/store"

/**
 * The server renders the seed; the client then loads the browser's saved edits. Pages stay hidden (but rendered,
 * so Next's instant-navigation validation still sees the segment) until that happens, so they never flash seed
 * data. The skeleton is static, no pulse: it is gone before a pulse would read.
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const { hydrated } = useDemo()
  return (
    <>
      {!hydrated && (
        <PageContainer>
          <div aria-busy="true" aria-label="Loading">
            <div className="h-8 w-56 rounded-md bg-muted" />
            <div className="mt-2 h-4 w-80 max-w-full rounded-md bg-muted" />
            <div className="mt-8 h-64 rounded-xl border bg-muted/40" />
          </div>
        </PageContainer>
      )}
      <div hidden={!hydrated} className="flex flex-1 flex-col">
        {children}
      </div>
    </>
  )
}
