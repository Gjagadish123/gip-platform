"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

/**
 * Sticky bottom bar while the draft differs from the saved project (visual-direction §6.5). Ctrl/Cmd+S saves.
 * The shortcut is registered in an effect, so a hidden (Activity) editor never hears it.
 * The buttons unmount the bar, so a click first moves focus to `focusTarget` (never to <body>); the shortcut
 * leaves focus where it is.
 */
export function SaveBar({
  dirty,
  required,
  recommended,
  live,
  focusTarget,
  onSave,
  onDiscard,
}: {
  dirty: boolean
  required: number
  recommended: number
  /** Published project: required gaps are "missing on the live page". */
  live?: boolean
  /** Element id that takes focus when Save or Discard is clicked. */
  focusTarget?: string
  onSave: () => void
  onDiscard: () => void
}) {
  const save = React.useEffectEvent(() => {
    if (dirty) onSave()
  })

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault() // also when clean: never the browser's "Save page" dialog
        save()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!dirty) return null

  const checks = [
    required > 0 && `${required} ${live ? "missing on the live page" : "required to publish"}`,
    recommended > 0 && `${recommended} recommended`,
  ].filter(Boolean)
  const click = (action: () => void) => () => {
    if (focusTarget) document.getElementById(focusTarget)?.focus({ preventScroll: true })
    action()
  }

  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      className="sticky bottom-0 z-10 -mx-4 mt-8 border-t bg-background shadow-overlay animate-in fade-in-0 slide-in-from-bottom-2 duration-200 sm:-mx-6 xl:-mx-8"
    >
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 xl:px-8">
        <p className="min-w-0 truncate text-sm">
          <span className="font-medium">Unsaved changes</span>
          {checks.length > 0 && (
            <span className="hidden text-muted-foreground tabular-nums sm:inline"> · {checks.join(" · ")}</span>
          )}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="lg" onClick={click(onDiscard)}>
            Discard
          </Button>
          <Button type="button" size="lg" onClick={click(onSave)} aria-keyshortcuts="Control+S Meta+S">
            Save changes
            <Kbd className="ml-1 hidden bg-primary-foreground/15 text-primary-foreground sm:inline-flex">Ctrl S</Kbd>
          </Button>
        </div>
      </div>
    </div>
  )
}
