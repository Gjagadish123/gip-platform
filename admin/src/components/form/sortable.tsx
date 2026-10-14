// Adapted from 21st.dev: sean0205/c-sortable-7 (ReUI Sortable, demo 29834)
"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"

/**
 * Shared dnd-kit wrapper for ListEditor and GalleryField.
 * Pointer: drag the handle (6px threshold so clicks still work).
 * Keyboard: focus the handle, Space to lift, arrows to move, Space to drop, Esc to cancel.
 */
export function Sortable<T>({
  items,
  getId,
  onReorder,
  strategy = "vertical",
  noun = "item",
  label,
  className,
  children,
}: {
  items: readonly T[]
  getId: (item: T) => string
  onReorder: (next: T[]) => void
  strategy?: "vertical" | "grid"
  /** Used in screen-reader announcements: "Picked up image 2 of 8." */
  noun?: string
  /** Names an item in announcements ("Picked up Clubhouse"); falls back to "<noun> 2". */
  label?: (id: string) => string | undefined
  className?: string
  children: React.ReactNode
}) {
  // Stable id keeps dnd-kit's aria-describedby ids identical on server and client.
  const id = React.useId()
  const ids = React.useMemo(() => items.map(getId), [items, getId])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const pos = (uid: UniqueIdentifier | undefined) => ids.indexOf(String(uid)) + 1
  const name = (uid: UniqueIdentifier) => label?.(String(uid)) ?? `${noun} ${pos(uid)}`
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${name(active.id)}, position ${pos(active.id)} of ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${name(active.id)} moved to position ${pos(over.id)} of ${ids.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${name(active.id)} at position ${pos(over.id)} of ${ids.length}.` : "Dropped.",
    onDragCancel: ({ active }) => `Reorder cancelled. ${name(active.id)} stays at position ${pos(active.id)}.`,
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    onReorder(arrayMove([...items], from, to))
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: `To reorder, press Space to lift the ${noun}, use the arrow keys to move it, then Space to drop or Escape to cancel.`,
        },
      }}
    >
      <SortableContext
        items={ids}
        strategy={strategy === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div data-slot="sortable" className={className}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export type SortableHandleProps = DraggableAttributes &
  NonNullable<DraggableSyntheticListeners> & {
    ref: (el: HTMLElement | null) => void
  }

/** One sortable row/tile. Spread `handle` onto the drag-handle button (it carries focus + keyboard drag). */
export function SortableItem({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: (handle: SortableHandleProps, dragging: boolean) => React.ReactNode
}) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id })
  const handle = { ...attributes, ...listeners, ref: setActivatorNodeRef } as SortableHandleProps
  return (
    <div
      ref={setNodeRef}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10", className)}
    >
      {children(handle, isDragging)}
    </div>
  )
}
