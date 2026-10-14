import { LIFECYCLE_META, PUBLISH_META } from "@/lib/constants"
import type { Lifecycle, PublishState } from "@/lib/types"
import { cn } from "@/lib/utils"

const PILL = "inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap"

/** Neutral on purpose: inventory status is the only coloured thing in a row. */
export function LifecycleBadge({ lifecycle, className }: { lifecycle: Lifecycle; className?: string }) {
  return (
    <span title={LIFECYCLE_META[lifecycle].description} className={cn(PILL, "border border-border text-foreground", className)}>
      {LIFECYCLE_META[lifecycle].label}
    </span>
  )
}

/** Filled dot = live, hollow dot = draft, no dot = archived. Solid edges: dashed is for dropzones only. */
export function PublishBadge({ state, className }: { state: PublishState; className?: string }) {
  return (
    <span
      title={PUBLISH_META[state].description}
      className={cn(
        PILL,
        state === "published" && "bg-secondary text-secondary-foreground",
        state === "draft" && "border border-border text-foreground",
        state === "archived" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {state !== "archived" && (
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            state === "published" ? "bg-foreground" : "border border-muted-foreground",
          )}
        />
      )}
      {PUBLISH_META[state].label}
    </span>
  )
}
