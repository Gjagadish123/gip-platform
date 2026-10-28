"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { TriangleAlert } from "lucide-react"

import { PageContainer } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { useDemo } from "@/lib/store"

/**
 * The server renders an empty shell (Supabase mode) or the seed (demo); the client then loads the data. Pages stay
 * hidden (but rendered, so Next's instant-navigation validation still sees the segment) until that happens, so they
 * never flash stale data. The skeleton is static, no pulse: it is usually gone before a pulse would read.
 * Signed out (Supabase mode) → /login. RLS is the real lock; this only keeps the screens honest.
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const { hydrated, signedIn, loadError, actions } = useDemo()
  const router = useRouter()
  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/login")
  }, [hydrated, signedIn, router])

  if (loadError) {
    return (
      <PageContainer>
        <div role="alert" className="flex max-w-md flex-col items-start gap-4 py-12">
          <TriangleAlert aria-hidden className="size-5 text-muted-foreground" />
          <div className="grid gap-1.5">
            <h1 className="text-xl font-semibold tracking-[-0.01em]">Couldn&rsquo;t load projects</h1>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
          <Button onClick={() => actions.reload()}>Try again</Button>
        </div>
      </PageContainer>
    )
  }

  const ready = hydrated && signedIn
  return (
    <>
      {!ready && (
        <PageContainer>
          <div aria-busy="true" aria-label="Loading">
            <div className="h-8 w-56 rounded-md bg-muted" />
            <div className="mt-2 h-4 w-80 max-w-full rounded-md bg-muted" />
            <div className="mt-8 h-64 rounded-xl border bg-muted/40" />
          </div>
        </PageContainer>
      )}
      <div hidden={!ready} className="flex flex-1 flex-col">
        {children}
      </div>
    </>
  )
}
