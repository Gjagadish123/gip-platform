"use client" // Error boundaries must be Client Components

import { useEffect } from "react"
import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { STORAGE_KEY } from "@/lib/store"
import { BACKEND } from "@/lib/supabase/client"

/** Demo: most crashes come from demo data saved in this browser; resetting it is the way out. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage blocked: the reload still starts from the seed */
    }
    location.reload()
  }

  return (
    <main className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-start justify-center gap-4 px-4 py-12">
      <TriangleAlert aria-hidden className="size-5 text-muted-foreground" />
      <div className="grid gap-1.5">
        <h1 className="text-xl font-semibold tracking-[-0.01em]">This page couldn&rsquo;t load</h1>
        <p className="text-sm text-muted-foreground">
          {BACKEND
            ? "Something went wrong showing this page. Your saved data is safe. Try again, or reload the page."
            : "Something in the demo data saved in this browser doesn’t fit the page. Try again, or reset the demo data to start over from the original projects."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <Button variant="outline" onClick={BACKEND ? () => location.reload() : reset}>
          {BACKEND ? "Reload page" : "Reset demo data"}
        </Button>
      </div>
    </main>
  )
}
