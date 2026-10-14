// Adapted from 21st.dev: uvain/data-table-bulk-actions (demo 33506)
// Kept: the "{n} selected" count beside the bulk actions, ghost buttons.
// Changed: floats at the bottom of the content column (sticky, opaque, shadow-overlay; no blur), actions are
// the four statuses in client order with their 1–4 key hints, plus Open (single unit), Remove and Clear. The
// count is announced by the inventory screen (a live region mounted with its text is never spoken).
"use client"

import { useId, useState } from "react"
import { Trash2, X } from "lucide-react"

import { StatusSwatch } from "@/components/form"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants"
import { formatNumber } from "@/lib/format"
import { compressRanges, statusCounts } from "@/lib/inventory"
import type { ProjectType, Unit, UnitStatus } from "@/lib/types"

import { countLabel } from "./model"

export function BulkBar({
  units,
  type,
  onStatus,
  onOpen,
  onRemove,
  onClear,
}: {
  /** The selected units. */
  units: Unit[]
  type: ProjectType
  onStatus: (status: UnitStatus) => void
  onOpen: () => void
  onRemove: () => void
  onClear: () => void
}) {
  const n = units.length
  const counts = statusCounts(units)
  const mix = UNIT_STATUSES.filter((s) => counts[s])
    .map((s) => `${formatNumber(counts[s])} ${UNIT_STATUS_META[s].label}`)
    .join(", ")

  return (
    <div
      role="group"
      aria-label="Selected units"
      className="sticky bottom-4 z-30 mx-auto flex w-full flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-overlay sm:w-fit sm:max-w-full"
    >
      <p className="order-1 min-w-0 flex-1 pl-1.5 sm:flex-none" title={compressRanges(units.map((u) => u.number))}>
        <span className="text-sm font-medium tabular-nums">{countLabel(type, n)} selected</span>
        <span className="ml-2 hidden text-xs text-muted-foreground tabular-nums xl:inline">{mix}</span>
      </p>

      <Separator orientation="vertical" className="order-2 hidden h-5 sm:block" />

      <div role="group" aria-label="Set status" className="order-4 grid w-full grid-cols-2 gap-1 sm:order-3 sm:flex sm:w-auto">
        {UNIT_STATUSES.map((s) => {
          const meta = UNIT_STATUS_META[s]
          const all = counts[s] === n
          return (
            <Button
              key={s}
              variant="ghost"
              size="sm"
              disabled={all}
              onClick={() => onStatus(s)}
              title={all ? `All already ${meta.label}` : `Mark ${countLabel(type, n)} ${meta.label} (${meta.key})`}
              className="justify-start sm:justify-center"
            >
              <StatusSwatch status={s} />
              {meta.label}
              <Kbd className="ml-0.5 hidden sm:inline-flex">{meta.key}</Kbd>
            </Button>
          )
        })}
      </div>

      <Separator orientation="vertical" className="order-4 hidden h-5 sm:block" />

      <div className="order-3 flex items-center gap-1 sm:order-5">
        {n === 1 ? (
          <Button variant="ghost" size="sm" onClick={onOpen}>
            Open
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" title={`Remove ${countLabel(type, n)} from the inventory`} onClick={onRemove}>
          <Trash2 data-icon="inline-start" />
          Remove
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Clear selection" title="Clear selection (Esc)" onClick={onClear}>
          <X />
        </Button>
      </div>
    </div>
  )
}

/** Type-to-confirm removal of the selected units. The removal is one batch, so the toast can undo it. */
export function RemoveUnitsDialog({
  units,
  type,
  onCancel,
  onConfirm,
  onCloseAutoFocus,
}: {
  /** null = closed. */
  units: Unit[] | null
  type: ProjectType
  onCancel: () => void
  onConfirm: (ids: string[]) => void
  onCloseAutoFocus: () => void
}) {
  return (
    <AlertDialog open={!!units} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent
        // Start in the confirm field rather than on Cancel: the next thing to do is type.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).querySelector("input")?.focus()
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          onCloseAutoFocus()
        }}
      >
        {units ? <RemoveBody units={units} type={type} onConfirm={onConfirm} /> : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RemoveBody({ units, type, onConfirm }: { units: Unit[]; type: ProjectType; onConfirm: (ids: string[]) => void }) {
  const id = useId()
  const [typed, setTyped] = useState("")
  const n = units.length
  const word = String(n)
  const sold = units.filter((u) => u.status !== "available").length
  const ok = typed.trim() === word

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault()
        if (ok) onConfirm(units.map((u) => u.id))
      }}
    >
      <AlertDialogHeader>
        <AlertDialogTitle>Remove {countLabel(type, n)}?</AlertDialogTitle>
        <AlertDialogDescription>
          {compressRanges(units.map((u) => u.number))} and their status history leave the inventory.
          {sold ? ` ${countLabel(type, sold)} of them ${sold === 1 ? "is" : "are"} not Available.` : ""} You can undo
          this right after.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-confirm`}>Type {word} to confirm</Label>
        <Input
          id={`${id}-confirm`}
          inputMode="numeric"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="h-9 tabular-nums"
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
        <Button type="submit" variant="destructive" disabled={!ok}>
          Remove {countLabel(type, n)}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}
