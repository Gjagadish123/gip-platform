import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Content wrapper for every (app) page (visual-direction §6.1). */
export function PageContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 xl:px-8", className)}>{children}</div>
}

/**
 * Page header (visual-direction §6.2): title, one line of fact, at most one primary + two secondary actions.
 * `titleAside` sits beside the title (badges); `children` renders under the header row (route tabs, filters).
 * Long titles wrap to two lines (and break inside long words) rather than truncate; the full title is its tooltip.
 */
export function PageHeader({
  title,
  titleAside,
  description,
  actions,
  children,
}: {
  title: ReactNode
  titleAside?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1
              title={typeof title === "string" ? title : undefined}
              className="line-clamp-2 min-w-0 text-2xl font-semibold tracking-[-0.015em] [overflow-wrap:anywhere]"
            >
              {title}
            </h1>
            {titleAside ? <div className="flex flex-wrap items-center gap-1.5">{titleAside}</div> : null}
          </div>
          {description ? (
            <div className="mt-1 flex flex-wrap gap-x-2 text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}
