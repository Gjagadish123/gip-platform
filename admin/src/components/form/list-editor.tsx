// Adapted from 21st.dev: felipemenezes098/rhf-advanced-01 (demo 25057), reorder via ReUI Sortable (demo 29834)
"use client"

import * as React from "react"
import { GripVertical, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Sortable, SortableItem } from "./sortable"

export type ListItemHelpers<T> = {
  index: number
  /** Shallow-merge a patch into this item. */
  update: (patch: Partial<T>) => void
  remove: () => void
}

/** This list's own rows (not those of a list nested inside a row). */
const rowsOf = (root: HTMLElement) =>
  root.querySelectorAll<HTMLElement>(':scope > [data-slot="sortable"] > * > [data-list-row]')
const handleOf = (row: HTMLElement | undefined) => row?.querySelector<HTMLElement>(":scope > [data-list-handle]")
const addOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>(root.dataset.slot === "empty" ? "[data-list-add]" : ":scope > [data-list-add]")

/** A new row's first text field (its name), else its first other control. */
function focusRow(row: HTMLElement | undefined) {
  const field =
    row?.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="file"]), textarea') ??
    row?.querySelector<HTMLElement>("button:not([data-list-handle])")
  field?.focus()
}

/**
 * Controlled sortable repeater. Rows: drag handle (pointer or keyboard), your fields, remove.
 * `create` runs inside the Add click, so it may mint ids. Focus follows the action: Add focuses the new row's
 * first field; Remove focuses the next row's handle, else the Add button.
 */
export function ListEditor<T extends { id: string }>({
  value,
  onChange,
  create,
  renderItem,
  itemLabel,
  noun = "item",
  addLabel,
  hideAdd,
  emptyTitle,
  emptyDescription,
  max,
  className,
}: {
  value: T[]
  onChange: (next: T[]) => void
  create: () => T
  renderItem: (item: T, helpers: ListItemHelpers<T>) => React.ReactNode
  /** Names a row for screen readers ("Clubhouse"); empty falls back to "<noun> 3". */
  itemLabel?: (item: T, index: number) => string | undefined
  /** Singular noun for labels and announcements: "place", "approval". */
  noun?: string
  addLabel?: string
  /** No Add button (rows come from elsewhere, e.g. a dropzone). */
  hideAdd?: boolean
  emptyTitle?: string
  emptyDescription?: React.ReactNode
  max?: number
  className?: string
}) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const getId = React.useCallback((item: T) => item.id, [])
  const full = max !== undefined && value.length >= max
  const add = addLabel ?? `Add ${noun}`
  const labelOf = (item: T, i: number) => itemLabel?.(item, i)?.trim() || `${noun} ${i + 1}`
  const labelById = (id: string) => {
    const i = value.findIndex((v) => v.id === id)
    return i < 0 ? undefined : labelOf(value[i], i)
  }

  /** Runs after React has committed the change (the click's update renders synchronously). */
  const afterCommit = (fn: (root: HTMLElement) => void) =>
    requestAnimationFrame(() => rootRef.current && fn(rootRef.current))

  function addRow() {
    onChange([...value, create()])
    afterCommit((root) => focusRow([...rowsOf(root)].at(-1)))
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index))
    afterCommit((root) => {
      const rows = rowsOf(root)
      const target =
        handleOf(rows[index]) ??
        (hideAdd ? handleOf(rows[index - 1]) : addOf(root))
      target?.focus()
    })
  }

  if (value.length === 0) {
    return (
      <Empty ref={rootRef} className={cn("border border-solid p-8", className)}>
        <EmptyHeader>
          <EmptyTitle>{emptyTitle ?? `No ${noun}s yet`}</EmptyTitle>
          {emptyDescription && <EmptyDescription>{emptyDescription}</EmptyDescription>}
        </EmptyHeader>
        {!hideAdd && (
          <EmptyContent>
            <Button type="button" variant="outline" data-list-add onClick={addRow}>
              <Plus aria-hidden />
              {add}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <div ref={rootRef} className={cn("flex flex-col gap-2", className)}>
      <Sortable
        items={value}
        getId={getId}
        onReorder={onChange}
        noun={noun}
        label={labelById}
        className="divide-y rounded-xl border bg-card"
      >
        {value.map((item, index) => {
          const label = labelOf(item, index)
          const helpers: ListItemHelpers<T> = {
            index,
            update: (patch) => onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v))),
            remove: () => removeRow(index),
          }
          return (
            <SortableItem
              key={item.id}
              id={item.id}
              className="data-dragging:rounded-xl data-dragging:border data-dragging:bg-card data-dragging:shadow-overlay"
            >
              {(handle) => (
                <div data-list-row role="group" aria-label={label} className="flex items-start gap-2 p-3">
                  <button
                    type="button"
                    data-list-handle
                    {...handle}
                    aria-label={`Reorder ${label}`}
                    className="mt-1.5 inline-flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                  >
                    <GripVertical aria-hidden className="size-4" />
                  </button>
                  <div className="min-w-0 flex-1">{renderItem(item, helpers)}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${label}`}
                    onClick={helpers.remove}
                    className="mt-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              )}
            </SortableItem>
          )
        })}
      </Sortable>
      {!hideAdd && (
        <Button type="button" variant="outline" data-list-add className="w-fit" disabled={full} onClick={addRow}>
          <Plus aria-hidden />
          {full ? `Limit of ${max} reached` : add}
        </Button>
      )}
    </div>
  )
}
