"use client"
// Status-change building blocks: the segmented status picker (sheet), guard notices (inventory-ux §2) and the
// bulk confirm dialog listing every from → to count (inventory-ux §4.5).
import { useId, useState } from "react"
import { ArrowRight, TriangleAlert } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MORTGAGEES, UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants"
import { formatNumber } from "@/lib/format"
import { canTransition, compressRanges, type TransitionCheck } from "@/lib/inventory"
import type { StatusChangeOptions } from "@/lib/store"
import type { MortgagedTo, ProjectType, Unit, UnitStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

import { countLabel } from "./model"

/** One option per status, in client order, each with its swatch and pattern. Native radios: arrow keys work for free. */
export function StatusSegmented({
  value,
  onChange,
  labelledBy,
}: {
  value: UnitStatus
  onChange: (s: UnitStatus) => void
  labelledBy: string
}) {
  const name = useId()
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-5 gap-1 rounded-lg border p-1">
      {UNIT_STATUSES.map((s) => (
        <label
          key={s}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-md px-1 py-2 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            "has-checked:bg-accent has-checked:text-foreground has-checked:ring-1 has-checked:ring-ring has-focus-visible:ring-2 has-focus-visible:ring-ring",
          )}
        >
          <input
            type="radio"
            name={name}
            value={s}
            checked={value === s}
            onChange={() => onChange(s)}
            className="sr-only"
          />
          <StatusSwatch status={s} className="size-4" />
          {UNIT_STATUS_META[s].label}
        </label>
      ))}
    </div>
  )
}

/** Warning for a guarded transition. Red when a note is required (corrections), amber otherwise. */
export function GuardNotice({ check, prefix, className }: { check: TransitionCheck; prefix?: string; className?: string }) {
  if (!check.warn) return null
  return (
    <p
      className={cn(
        "flex gap-2 rounded-lg border p-3 text-sm",
        check.needsNote ? "border-destructive/30 bg-destructive/5" : "border-status-mortgaged-fg/30 bg-status-mortgaged-soft",
        className,
      )}
    >
      <TriangleAlert
        aria-hidden
        className={cn("mt-0.5 size-4 shrink-0", check.needsNote ? "text-destructive" : "text-status-mortgaged-fg")}
      />
      <span>
        {prefix ? <span className="font-medium">{prefix}: </span> : null}
        {check.warn}
        {check.needsNote ? " A note is required." : ""}
      </span>
    </p>
  )
}

export interface StatusRequest {
  key: number
  to: UnitStatus
  ids: string[]
  /** Latest selectable date, read when the change was requested (todayIso, handler time). */
  today: string
}

/** Confirm for > 10 units or any guarded transition. Lists every from → to group with its numbers. */
export function StatusChangeDialog({
  request,
  units,
  type,
  onCancel,
  onConfirm,
  onCloseAutoFocus,
}: {
  request: StatusRequest | null
  /** The requested units (unchanged ones are counted, not changed). */
  units: Unit[]
  type: ProjectType
  onCancel: () => void
  onConfirm: (ids: string[], to: UnitStatus, opts: StatusChangeOptions) => void
  /** Focus goes back where the change started (the grid), not to <body>. */
  onCloseAutoFocus: () => void
}) {
  return (
    <AlertDialog open={!!request} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          onCloseAutoFocus()
        }}
        className="max-h-[90svh] overflow-y-auto data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-lg">
        {request ? <DialogBody key={request.key} to={request.to} today={request.today} units={units} type={type} onConfirm={onConfirm} /> : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DialogBody({
  to,
  today,
  units,
  type,
  onConfirm,
}: {
  to: UnitStatus
  today: string
  units: Unit[]
  type: ProjectType
  onConfirm: (ids: string[], to: UnitStatus, opts: StatusChangeOptions) => void
}) {
  const id = useId()
  const meta = UNIT_STATUS_META[to]
  const [date, setDate] = useState(today)
  const [note, setNote] = useState("")
  const [mortgagedTo, setMortgagedTo] = useState<MortgagedTo>("HMDA")
  const [confirmed, setConfirmed] = useState(false)
  const [tried, setTried] = useState(false)

  const changing = units.filter((u) => u.status !== to)
  const unchanged = units.length - changing.length
  const groups = UNIT_STATUSES.filter((s) => s !== to)
    .map((from) => ({ from, units: changing.filter((u) => u.status === from), check: canTransition(from, to, type) }))
    .filter((g) => g.units.length)
  const needsNote = groups.some((g) => g.check.needsNote)
  const confirmLabel = groups.find((g) => g.check.confirm)?.check.confirm
  const noteMissing = needsNote && !note.trim()
  const confirmMissing = !!confirmLabel && !confirmed
  const n = changing.length

  function submit() {
    setTried(true)
    if (noteMissing || confirmMissing || !date) return
    onConfirm(changing.map((u) => u.id), to, {
      date,
      note: note.trim() || undefined,
      ...(to === "mortgaged" && { mortgagedTo }),
    })
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Mark {countLabel(type, n)} as {meta.label}?
        </AlertDialogTitle>
        <AlertDialogDescription>
          The date and note go into each {type.unitNoun.toLowerCase()}&rsquo;s history. You can undo this right after.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex min-w-0 flex-col gap-4 text-left">
        <ul className="divide-y rounded-lg border">
          {groups.map((g) => (
            <li key={g.from} className="flex flex-col gap-1 px-3 py-2">
              <p className="flex flex-wrap items-center gap-1.5 text-sm tabular-nums">
                <StatusSwatch status={g.from} />
                <span className="font-medium">{formatNumber(g.units.length)}</span>
                {UNIT_STATUS_META[g.from].label}
                <ArrowRight aria-label="to" className="size-3.5 text-muted-foreground" />
                <StatusSwatch status={to} />
                {meta.label}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground tabular-nums">
                {compressRanges(g.units.map((u) => u.number))}
              </p>
            </li>
          ))}
        </ul>
        {unchanged > 0 ? (
          <p className="-mt-2 text-xs text-muted-foreground">
            {countLabel(type, unchanged)} already {meta.label}, unchanged.
          </p>
        ) : null}

        {groups.map((g) =>
          g.check.warn ? (
            <GuardNotice key={g.from} check={g.check} prefix={`${UNIT_STATUS_META[g.from].label} → ${meta.label}`} />
          ) : null,
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-date`}>{meta.dateLabel}</Label>
            <Input
              id={`${id}-date`}
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={tried && !date ? true : undefined}
              className="h-9 tabular-nums"
            />
          </div>
          {to === "mortgaged" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-to`}>Mortgaged to</Label>
              <Select value={mortgagedTo} onValueChange={(v) => setMortgagedTo(v as MortgagedTo)}>
                <SelectTrigger id={`${id}-to`} className="w-full data-[size=default]:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {MORTGAGEES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-note`}>
            Note
            <span className="font-normal text-muted-foreground">{needsNote ? "Required" : "Optional"}</span>
          </Label>
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={
              to === "available" ? "Booking cancelled, refund issued"
                : to === "mortgaged" ? "LP letter number"
                  : to === "registered" ? "Registered at SRO Sangareddy"
                    : to === "hold" ? "Token paid, held for the buyer till 30 Oct"
                      : "Booked by agreement of sale"
            }
            aria-invalid={tried && noteMissing ? true : undefined}
            aria-describedby={tried && noteMissing ? `${id}-note-error` : undefined}
          />
          {tried && noteMissing ? (
            <p id={`${id}-note-error`} role="alert" className="text-xs text-destructive">
              Add a note saying why. It is kept in the history.
            </p>
          ) : null}
        </div>

        {confirmLabel ? (
          <div className="flex flex-col gap-1.5">
            <label className="flex w-fit items-center gap-2 text-sm">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(c) => setConfirmed(c === true)}
                aria-invalid={tried && confirmMissing ? true : undefined}
              />
              {confirmLabel}
            </label>
            {tried && confirmMissing ? (
              <p role="alert" className="text-xs text-destructive">
                Tick this to confirm the authority released these {type.unitNounPlural.toLowerCase()}.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button variant={needsNote ? "destructive" : "default"} onClick={submit} disabled={n === 0}>
          Mark {formatNumber(n)} as {meta.label}
        </Button>
      </AlertDialogFooter>
    </>
  )
}
