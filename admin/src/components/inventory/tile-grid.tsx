// Adapted from 21st.dev: lavikatiyar/seat-selection (demo 7757)
// Kept: rows of numbered cells with muted row labels, a legend whose swatches match the cells, multi-select.
// Dropped: framer-motion per seat (springs on 1000 tiles), disabled "occupied" seats (admins edit every status),
// per-seat buttons. Here: one listbox with aria-activedescendant, plain <div role="option"> tiles styled by
// .tile[data-s] in globals.css, delegated events, one shared detail card (inventory-ux §6, §7).
"use client"

import {
  Fragment,
  memo,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react"

import type { Project, ProjectType, Unit, UnitStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

import { STATUS_BY_KEY, tileDomId, unitAriaLabel } from "./model"
import { UnitCard } from "./unit-card"
import type { ClickMode } from "./use-selection"

export interface TileRow {
  key: string
  /** Muted label in the first column (first plot number of the row, "Flr 12"). */
  label: ReactNode
  /** Mouse shortcut on the label (select this floor). Keyboard users have Shift+Home/End. */
  onLabelClick?: (e: MouseEvent) => void
  labelTitle?: string
  cells: (Unit | null)[]
}

export interface TileSection {
  key: string
  /** Accessible group name ("Block A"). Omit for a single unnamed section. */
  label?: string
  header?: ReactNode
  /** Extra first row inside the grid (the matrix's stack headers). Must be aria-hidden. */
  columnHeader?: ReactNode
  rows: TileRow[]
}

export interface TileGridHandlers {
  onClickTile: (id: string, mode: ClickMode, order: readonly string[]) => void
  onMove: (id: string, extend: boolean, order: readonly string[]) => void
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  onStatusKey: (status: UnitStatus) => void
  onClear: () => void
  onSelectAll: () => void
}

interface CardState {
  id: string
  left: number
  top: number
  above: boolean
}

const CARD_W = 256
const CARD_H = 190 // estimate, only decides whether the card flips above the tile
const HOVER_DELAY = 250

const Tile = memo(function Tile({
  unit,
  type,
  selected,
  active,
  open,
  dim,
  tileClass,
}: {
  unit: Unit
  type: ProjectType
  selected: boolean
  active: boolean
  open: boolean
  dim: boolean
  tileClass: string
}) {
  const label = unitAriaLabel(type, unit)
  return (
    <div
      id={tileDomId(unit.id)}
      role="option"
      aria-selected={selected}
      aria-label={dim ? `${label}, outside filter` : label}
      data-id={unit.id}
      data-s={unit.status}
      data-active={active || undefined}
      data-open={open || undefined}
      data-dim={dim || undefined}
      className={cn(
        "tile flex min-w-0 cursor-pointer flex-col items-center justify-center leading-none font-semibold tabular-nums select-none font-condensed",
        tileClass,
      )}
    >
      <span className="max-w-full truncate px-0.5">{unit.number}</span>
    </div>
  )
})

export function TileGrid({
  ariaLabel,
  sections,
  template,
  tileClass,
  type,
  project,
  selected,
  active,
  openId,
  highlight,
  matchIds,
  handlers,
  className,
}: {
  ariaLabel: string
  sections: TileSection[]
  /** CSS grid-template-columns: label column + one per tile column. */
  template: string
  tileClass: string
  type: ProjectType
  project: Project
  selected: ReadonlySet<string>
  active: string | null
  /** The unit open in the sheet (outlined like the cursor). */
  openId: string | null
  /** Shows the cursor outline without focus (search jump). */
  highlight: string | null
  /** null = no filter; otherwise non-members are dimmed. */
  matchIds: ReadonlySet<string> | null
  handlers: TileGridHandlers
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerType = useRef("mouse")
  const [card, setCard] = useState<CardState | null>(null)
  const [focusMode, setFocusMode] = useState<"none" | "pointer" | "keyboard">("none")

  // Geometry for arrow keys: rows across all sections, column index per tile, display order.
  const geo = useMemo(() => {
    const rows: (string | null)[][] = []
    const pos = new Map<string, { r: number; c: number; i: number }>()
    const order: string[] = []
    const byId = new Map<string, Unit>()
    for (const s of sections) {
      for (const row of s.rows) {
        const r = rows.length
        rows.push(row.cells.map((u, c) => {
          if (!u) return null
          pos.set(u.id, { r, c, i: order.length })
          order.push(u.id)
          byId.set(u.id, u)
          return u.id
        }))
      }
    }
    return { rows, pos, order, byId }
  }, [sections])

  const cellAt = (r: number, c: number): string | null => {
    const row = geo.rows[Math.max(0, Math.min(geo.rows.length - 1, r))]
    if (!row) return null
    if (row[c]) return row[c]
    for (let k = Math.min(c, row.length - 1); k >= 0; k--) if (row[k]) return row[k]
    return row.find(Boolean) ?? null
  }
  const rowEdge = (r: number, end: boolean) => {
    const ids = geo.rows[r].filter(Boolean) as string[]
    return end ? ids[ids.length - 1] : ids[0]
  }

  function showCard(id: string, el: Element | null) {
    const box = ref.current?.getBoundingClientRect()
    if (!el || !box) return
    const t = el.getBoundingClientRect()
    const left = Math.max(0, Math.min(t.left - box.left, box.width - CARD_W))
    const roomBelow = Math.min(box.bottom, window.innerHeight) - t.bottom
    const above = roomBelow < CARD_H + 8 && t.top - Math.max(box.top, 0) > CARD_H + 8
    setCard({ id, left, top: above ? t.top - box.top - 6 : t.bottom - box.top + 6, above })
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (focusMode !== "keyboard") setFocusMode("keyboard")
    const k = e.key
    const mod = e.ctrlKey || e.metaKey
    const cur = active && geo.pos.has(active) ? active : null
    const p = cur ? geo.pos.get(cur)! : null

    let next: string | null | undefined
    switch (k) {
      case "ArrowLeft": next = p ? geo.order[Math.max(0, p.i - 1)] : geo.order[0]; break
      case "ArrowRight": next = p ? geo.order[Math.min(geo.order.length - 1, p.i + 1)] : geo.order[0]; break
      case "ArrowUp": next = p ? cellAt(p.r - 1, p.c) : geo.order[0]; break
      case "ArrowDown": next = p ? cellAt(p.r + 1, p.c) : geo.order[0]; break
      case "PageUp": next = p ? cellAt(p.r - 10, p.c) : geo.order[0]; break
      case "PageDown": next = p ? cellAt(p.r + 10, p.c) : geo.order[0]; break
      case "Home": next = mod || !p ? geo.order[0] : rowEdge(p.r, false); break
      case "End": next = mod || !p ? geo.order[geo.order.length - 1] : rowEdge(p.r, true); break
    }
    if (next !== undefined) {
      e.preventDefault()
      if (!next) return
      handlers.onMove(next, e.shiftKey, geo.order)
      const el = document.getElementById(tileDomId(next))
      el?.scrollIntoView({ block: "nearest", inline: "nearest" })
      showCard(next, el)
      return
    }
    if (mod && (k === "a" || k === "A")) {
      e.preventDefault()
      handlers.onSelectAll()
      return
    }
    if (mod || e.altKey) return // Ctrl+Z and friends bubble to the page listener
    if (STATUS_BY_KEY[k]) {
      e.preventDefault()
      handlers.onStatusKey(STATUS_BY_KEY[k])
    } else if (k === " ") {
      e.preventDefault()
      if (cur) handlers.onToggle(cur)
    } else if (k === "Enter") {
      if (cur) {
        e.preventDefault()
        handlers.onOpen(cur)
      }
    } else if (k === "Escape") {
      if (selected.size) {
        e.preventDefault()
        handlers.onClear()
      }
      setCard(null)
    }
  }

  const idFrom = (e: { target: EventTarget }) =>
    (e.target as Element).closest<HTMLElement>("[data-id]")?.dataset.id ?? null

  function onPointerOver(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") return
    const id = idFrom(e)
    if (!id || card?.id === id) return
    clearTimeout(timer.current)
    const el = e.target as Element
    if (card) showCard(id, el.closest("[data-id]"))
    else timer.current = setTimeout(() => showCard(id, el.closest("[data-id]")), HOVER_DELAY)
  }

  const cardUnit = card ? geo.byId.get(card.id) : undefined
  const showActive = focusMode === "keyboard"

  return (
    <div
      ref={ref}
      role="listbox"
      aria-multiselectable="true"
      aria-label={ariaLabel}
      aria-activedescendant={active && geo.pos.has(active) ? tileDomId(active) : undefined}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        if (e.target !== e.currentTarget) return
        setFocusMode(e.currentTarget.matches(":focus-visible") ? "keyboard" : "pointer")
        if (!active || !geo.pos.has(active)) {
          const first = geo.order.find((id) => selected.has(id)) ?? geo.order[0]
          if (first) handlers.onMove(first, false, geo.order)
        }
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setFocusMode("none")
        setCard(null)
      }}
      onPointerDown={(e) => {
        pointerType.current = e.pointerType
        if (focusMode === "keyboard") setFocusMode("pointer")
      }}
      onPointerOver={onPointerOver}
      onPointerLeave={() => {
        clearTimeout(timer.current)
        setCard(null)
      }}
      onClick={(e) => {
        const id = idFrom(e)
        if (!id) return
        const mode: ClickMode = e.shiftKey ? "range"
          : e.ctrlKey || e.metaKey || pointerType.current === "touch" ? "toggle" : "replace"
        handlers.onClickTile(id, mode, geo.order)
      }}
      onDoubleClick={(e) => {
        const id = idFrom(e)
        if (id) handlers.onOpen(id)
      }}
      className={cn(
        "relative flex min-w-max flex-col gap-6 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:min-w-0",
        className,
      )}
    >
      {sections.map((s) => (
        <div
          key={s.key}
          role="group"
          aria-label={s.label}
          className={cn(sections.length > 1 && "[contain-intrinsic-size:auto_480px] [content-visibility:auto]")}
        >
          {s.header}
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: template }}>
            {s.columnHeader}
            {s.rows.map((row) => (
              <Fragment key={row.key}>
                <div
                  aria-hidden
                  title={row.labelTitle}
                  onClick={row.onLabelClick}
                  className={cn(
                    "flex items-center justify-end pr-2 text-xs text-muted-foreground tabular-nums select-none",
                    row.onLabelClick && "cursor-pointer rounded-md hover:bg-muted hover:text-foreground",
                  )}
                >
                  {row.label}
                </div>
                {row.cells.map((u, i) =>
                  u ? (
                    <Tile
                      key={u.id}
                      unit={u}
                      type={type}
                      selected={selected.has(u.id)}
                      active={u.id === highlight || (showActive && u.id === active)}
                      open={u.id === openId}
                      dim={!!matchIds && !matchIds.has(u.id)}
                      tileClass={tileClass}
                    />
                  ) : (
                    <div key={`gap-${i}`} aria-hidden />
                  ),
                )}
              </Fragment>
            ))}
          </div>
        </div>
      ))}

      {card && cardUnit ? (
        <UnitCard
          unit={cardUnit}
          type={type}
          project={project}
          style={{ left: card.left, top: card.top, transform: card.above ? "translateY(-100%)" : undefined }}
        />
      ) : null}
    </div>
  )
}
