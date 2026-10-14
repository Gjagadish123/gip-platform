// Adapted from 21st.dev: mohammadshehadeh/toc (demo 18113)
// Changes: grouped sections, a completion mark per entry, a "Ready to publish?" summary, a chip row below lg,
// rAF-throttled scroll-spy with a fixed header offset, focus moves to the section after a jump.
"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { SECTION_IDS, SECTION_META, type SectionId } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Issue, SectionState } from "@/lib/validate"

/** `todo`: required gaps on a draft nobody has tried to publish yet (calm, not red). */
export type TocState = SectionState | "todo" | "off"
export type TocEntry = { key: string; label: string; target: string; state: TocState }
export type TocGroup = { label: string | null; entries: TocEntry[] }

const STATE_LABEL: Record<TocState, string> = {
  complete: "Complete",
  warning: "Has recommendations",
  missing: "Missing required fields",
  todo: "Required fields to fill before publishing",
  off: "Not shown on the website",
}

/** Header (56) + breathing room; below lg the sticky chip row adds ~48. */
const offset = () => (window.matchMedia("(min-width: 1024px)").matches ? 72 : 120)

/** Scrolls a section under the sticky header and moves focus to it. False when the element isn't on the page. */
export function scrollToTarget(id: string): boolean {
  const el = document.getElementById(id)
  if (!el || !el.offsetParent) return false // missing, or inside a hidden (Activity) route
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset(), behavior: reduce ? "auto" : "smooth" })
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1")
  el.focus({ preventScroll: true })
  return true
}

/**
 * Scroll-spy: the first target whose bottom is below the header line; the last one at the page end.
 * `refresh` re-measures when the page becomes visible (the hydration gate un-hides it).
 */
export function useActiveSection(targets: string[], refresh?: unknown): string | null {
  const [active, setActive] = React.useState<string | null>(null)
  const key = targets.join("|")

  React.useEffect(() => {
    const ids = key.split("|").filter(Boolean)
    let raf = 0
    const update = () => {
      raf = 0
      const line = offset() + 8
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      let current: string | null = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el || !el.offsetParent) continue
        current = id
        if (!atEnd && el.getBoundingClientRect().bottom > line) break
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [key, refresh])

  return active
}

/**
 * Completion mark. Each state has its own shape, so it reads in grayscale too: check = complete, hollow ring =
 * recommendations, filled dot = required (red once publishing was attempted, muted before), dashed ring = not shown.
 */
export function StateDot({ state, className }: { state: TocState; className?: string }) {
  return (
    <span aria-hidden title={STATE_LABEL[state]} className={cn("inline-flex size-3 shrink-0 items-center justify-center", className)}>
      {state === "complete" ? (
        <Check className="size-3 text-muted-foreground" />
      ) : (
        <span
          className={cn(
            "size-2 rounded-full",
            state === "warning" && "border-[1.5px] border-muted-foreground",
            state === "missing" && "bg-destructive",
            state === "todo" && "bg-muted-foreground",
            state === "off" && "border-[1.5px] border-dashed border-border",
          )}
        />
      )}
    </span>
  )
}

function jump(e: React.MouseEvent, target: string) {
  if (scrollToTarget(target)) e.preventDefault()
}

/** Sticky left nav (lg+). On a live project the summary speaks about the live page. */
export function EditorToc({
  groups,
  activeId,
  required,
  recommended,
  live,
}: {
  groups: TocGroup[]
  activeId: string | null
  /** Issue counts, the first section target holding each kind, and the mark for required ("missing" or "todo"). */
  required: { count: number; target?: string; state: TocState }
  recommended: { count: number; target?: string }
  live?: boolean
}) {
  const baseId = React.useId()
  return (
    <nav aria-label="Project sections" className="flex flex-col gap-6">
      <ul className="flex flex-col gap-3 border-s">
        {groups.map((g, gi) => (
          <li key={g.label ?? g.entries[0]?.key}>
            {g.label && (
              <p id={`${baseId}-g${gi}`} className="ps-4 pb-1 text-xs text-muted-foreground">
                {g.label}
              </p>
            )}
            <ul aria-labelledby={g.label ? `${baseId}-g${gi}` : undefined}>
              {g.entries.map((e) => {
                const active = activeId === e.target
                return (
                  <li key={e.key}>
                    <a
                      href={`#${e.target}`}
                      aria-current={active ? "location" : undefined}
                      onClick={(ev) => jump(ev, e.target)}
                      className={cn(
                        "-ms-px flex h-8 items-center justify-between gap-3 rounded-e-md border-s ps-4 pe-1 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-foreground font-medium text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{e.label}</span>
                      <StateDot state={e.state} />
                      <span className="sr-only">, {STATE_LABEL[e.state]}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>

      <div className="border-t pt-4">
        <p className="text-xs font-medium">{live ? "Live page checks" : "Ready to publish?"}</p>
        <ul className="mt-2 flex flex-col gap-0.5 text-[13px]">
          {required.count === 0 && recommended.count === 0 && (
            <li className="flex h-7 items-center gap-2 text-muted-foreground">
              <StateDot state="complete" />
              All checks pass
            </li>
          )}
          {[
            { n: required, state: required.state, label: live ? "missing on the live page" : "required" },
            { n: recommended, state: "warning" as const, label: "recommended" },
          ].map(({ n, state, label }) =>
            n.count > 0 ? (
              <li key={label}>
                <a
                  href={n.target ? `#${n.target}` : undefined}
                  onClick={(ev) => n.target && jump(ev, n.target)}
                  className="flex min-h-7 w-fit items-center gap-2 rounded-md pe-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <StateDot state={state} />
                  <span>
                    <span className="font-medium text-foreground tabular-nums">{n.count}</span> {label}
                  </span>
                </a>
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </nav>
  )
}

/** Horizontal chip row below lg, sticky under the app header. */
export function EditorTocChips({ groups, activeId }: { groups: TocGroup[]; activeId: string | null }) {
  const rowRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const row = rowRef.current
    const chip = row?.querySelector<HTMLElement>("[aria-current]")
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - 16, behavior: "auto" })
  }, [activeId])

  return (
    <nav
      aria-label="Project sections"
      className="sticky top-14 z-10 -mx-4 mb-6 border-b bg-background px-4 py-2 sm:-mx-6 sm:px-6 lg:hidden"
    >
      <div ref={rowRef} className="relative flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {groups.flatMap((g) => g.entries).map((e) => {
          const active = activeId === e.target
          return (
            <a
              key={e.key}
              href={`#${e.target}`}
              aria-current={active ? "location" : undefined}
              onClick={(ev) => jump(ev, e.target)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border px-3 text-[13px] whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10",
                active ? "border-ring bg-accent font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {e.label}
              <StateDot state={e.state} />
              <span className="sr-only">, {STATE_LABEL[e.state]}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}

/** Issues grouped by section, each section a jump button. Used by the publish check and the live-save check. */
export function IssueList({
  issues,
  state,
  onJump,
}: {
  issues: Issue[]
  state: TocState
  onJump: (section: SectionId) => void
}) {
  return (
    <div className="-mx-4 max-h-[50vh] divide-y overflow-y-auto border-t px-4">
      {SECTION_IDS.filter((s) => issues.some((i) => i.section === s)).map((s) => (
        <div key={s} className="py-3">
          <button
            type="button"
            className="rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onJump(s)}
          >
            {SECTION_META[s].label}
          </button>
          <ul className="mt-1.5 flex flex-col gap-1">
            {issues
              .filter((i) => i.section === s)
              .map((i) => (
                <li key={`${i.field}:${i.message}`} className="flex gap-2 text-sm text-muted-foreground">
                  <StateDot state={state} className="mt-1" />
                  {i.message}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
