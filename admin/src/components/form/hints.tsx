import * as React from "react"
import { Lock } from "lucide-react"

import { cn } from "@/lib/utils"

/** Marks generated / placeholder data so nobody mistakes it for the client's real numbers. One label everywhere. */
export function SampleBadge({
  className,
}: {
  /** @deprecated Ignored: every sample marker reads "Sample data". */
  label?: string
  className?: string
}) {
  return (
    <span
      title="Sample data made for this demo, not your real figures."
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center rounded-full bg-muted px-2 text-xs font-medium whitespace-nowrap text-muted-foreground",
        className,
      )}
    >
      Sample data
    </span>
  )
}

/** Copy the public site hard-codes. Shown instead of a field so editors know it can't be changed here. */
export function FixedOnWebsiteHint({
  children,
  className,
}: {
  /** The fixed copy, e.g. "Prime Location". */
  children?: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Lock aria-hidden className="size-3.5 shrink-0" />
      <span>
        Fixed on website
        {children && (
          <>
            : <span className="text-foreground">&ldquo;{children}&rdquo;</span>
          </>
        )}
      </span>
    </p>
  )
}
