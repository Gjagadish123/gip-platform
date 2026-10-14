"use client"
// One selection model shared by every view (inventory-ux §4.4): selected set, an anchor for ranges, and the
// keyboard cursor (`active`). `base` is the selection when the anchor was set, so Shift-ranges can grow and shrink.
import { useMemo, useState, useSyncExternalStore } from "react"

import type { InventoryView } from "./model"

export interface SelectionState {
  selected: ReadonlySet<string>
  anchor: string | null
  base: ReadonlySet<string>
  active: string | null
}

export type ClickMode = "replace" | "toggle" | "range"
/** Range members must pass this (filtered-out units are skipped); the end point always counts. */
export type Eligible = ((id: string) => boolean) | null

const EMPTY: ReadonlySet<string> = new Set()

/** Units from a to b in display order, keeping only eligible ones (b always). Exported for the self-check. */
export function span(order: readonly string[], a: string, b: string, eligible: Eligible): string[] {
  const i = order.indexOf(a)
  const j = order.indexOf(b)
  if (i < 0 || j < 0) return [b]
  const [lo, hi] = i < j ? [i, j] : [j, i]
  return order.slice(lo, hi + 1).filter((id) => id === b || !eligible || eligible(id))
}

export function useSelection() {
  const [state, setState] = useState<SelectionState>({ selected: EMPTY, anchor: null, base: EMPTY, active: null })

  const api = useMemo(() => {
    const toggle = (s: SelectionState, id: string): SelectionState => {
      const next = new Set(s.selected)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selected: next, anchor: id, base: next, active: id }
    }
    const extend = (s: SelectionState, id: string, order: readonly string[], eligible: Eligible): SelectionState => {
      const anchor = s.anchor ?? s.active ?? id
      const base = s.anchor ? s.base : s.selected
      return { selected: new Set([...base, ...span(order, anchor, id, eligible)]), anchor, base, active: id }
    }
    return {
      click(id: string, mode: ClickMode, order: readonly string[], eligible: Eligible) {
        setState((s) => {
          if (mode === "toggle") return toggle(s, id)
          if (mode === "range") return extend(s, id, order, eligible)
          return { selected: new Set([id]), anchor: id, base: EMPTY, active: id }
        })
      },
      /** Keyboard cursor; with `extendTo` the selection follows from the anchor (Shift+arrows). */
      move(id: string, extendSel: boolean, order: readonly string[], eligible: Eligible) {
        setState((s) => (extendSel ? extend(s, id, order, eligible) : { ...s, active: id }))
      },
      toggle(id: string) {
        setState((s) => toggle(s, id))
      },
      activate(id: string | null) {
        setState((s) => (s.active === id ? s : { ...s, active: id }))
      },
      replace(ids: readonly string[]) {
        const next = new Set(ids)
        setState((s) => ({ ...s, selected: next, anchor: null, base: next }))
      },
      add(ids: readonly string[]) {
        setState((s) => {
          const next = new Set([...s.selected, ...ids])
          return { ...s, selected: next, anchor: null, base: next }
        })
      },
      remove(ids: readonly string[]) {
        const drop = new Set(ids)
        setState((s) => {
          const next = new Set([...s.selected].filter((id) => !drop.has(id)))
          return { ...s, selected: next, anchor: null, base: next }
        })
      },
      invert(ids: readonly string[]) {
        setState((s) => {
          const next = new Set(ids.filter((id) => !s.selected.has(id)))
          return { ...s, selected: next, anchor: null, base: next }
        })
      },
      clear() {
        setState((s) => (s.selected.size ? { ...s, selected: EMPTY, anchor: null, base: EMPTY } : s))
      },
    }
  }, [])

  return [state, api] as const
}

export type SelectionApi = ReturnType<typeof useSelection>[1]

/* ---------- view choice, remembered per browser (try/catch: private mode or blocked storage) ---------- */

const VIEW_KEY = "gip-admin:inventory-view"
const viewListeners = new Set<() => void>()
let cachedView: InventoryView | null = null

function readView(): InventoryView {
  if (cachedView) return cachedView
  let v: string | null = null
  try {
    v = localStorage.getItem(VIEW_KEY)
  } catch {
    /* storage blocked: default view */
  }
  cachedView = v === "table" || v === "layout" ? v : "grid"
  return cachedView
}

function subscribeView(l: () => void) {
  viewListeners.add(l)
  const onStorage = (e: StorageEvent) => {
    if (e.key === VIEW_KEY) {
      cachedView = null
      l()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    viewListeners.delete(l)
    window.removeEventListener("storage", onStorage)
  }
}

export function useInventoryView(): [InventoryView, (v: InventoryView) => void] {
  const view = useSyncExternalStore(subscribeView, readView, () => "grid" as const)
  return [view, setView]
}

function setView(v: InventoryView) {
  cachedView = v
  try {
    localStorage.setItem(VIEW_KEY, v)
  } catch {
    /* kept in memory for this session */
  }
  viewListeners.forEach((l) => l())
}
