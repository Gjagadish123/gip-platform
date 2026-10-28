"use client"
// Unit side panel (inventory-ux §4.6): status first (most frequent edit, guarded per §2), then the fields the
// project type brings, price, and the status history. Right sheet 440px; bottom sheet on phones.
import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { AmountInput, AreaInput, FieldRow, StatusBadge, StatusSwatch } from "@/components/form"
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
import { Kbd } from "@/components/ui/kbd"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import { AREA_UNIT_LABEL, DEMO_TODAY, MORTGAGEES, UNIT_STATUS_META } from "@/lib/constants"
import { formatArea, formatDate, formatDateTime, formatINR, formatINRCompact, formatNumber } from "@/lib/format"
import { canTransition } from "@/lib/inventory"
import { setLeaveGuard } from "@/lib/leave-guard"
import { todayIso, useDemo } from "@/lib/store"
import type { Facing, MortgagedTo, Project, ProjectType, Unit, UnitStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

import { FACINGS, facingText, nounFor, roadText, unitName } from "./model"
import { GuardNotice, StatusSegmented } from "./status-change"

const EDIT_KEYS = [
  "block", "area", "widthFt", "depthFt", "facing", "facing2", "roadWidthFt", "roadWidth2Ft", "corner",
  "builtUpAreaSqFt", "bedrooms", "tower", "floor", "bhk", "carpetAreaSqFt", "price",
  "status", "statusDate", "statusNote", "mortgagedTo", "documentNo",
] as const satisfies readonly (keyof Unit)[]

const norm = (v: unknown) => (v === undefined || v === null || v === "" || v === false ? "" : v)
const isDirty = (a: Unit, b: Unit) => EDIT_KEYS.some((k) => norm(a[k]) !== norm(b[k]))
const num = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? undefined : Number(s))

/** Trim strings and drop empties so the stored unit stays clean. */
function clean(u: Unit): Unit {
  const t = (s?: string) => s?.trim() || undefined
  return {
    ...u,
    block: t(u.block), tower: t(u.tower), statusNote: t(u.statusNote), documentNo: t(u.documentNo),
    corner: u.corner || undefined,
  }
}

/** What the inventory screen needs from an open sheet: deep links and hidden-route cleanup must not drop edits. */
export interface UnitSheetHandle {
  /** The sheet is open with unsaved edits. */
  dirty: boolean
  /** Go to another unit (or close with null); asks Save / Discard / Stay first when there are unsaved edits. */
  leave: (target: string | null) => void
}

export function UnitSheet({
  ref,
  unit,
  units,
  project,
  type,
  order,
  onNavigate,
  onSaved,
  onCloseAutoFocus,
}: {
  ref?: Ref<UnitSheetHandle>
  /** null = closed. */
  unit: Unit | null
  /** All of the project's units (for "with 38 other plots"). */
  units: Unit[]
  project: Project
  type: ProjectType
  /** Current view order, filters applied: ‹ › and Save & next follow it. */
  order: readonly string[]
  /** Go to another unit, or close with null. */
  onNavigate: (id: string | null) => void
  onSaved: (u: Unit, closed: boolean) => void
  onCloseAutoFocus: () => void
}) {
  const { actions } = useDemo()
  const isMobile = useIsMobile()
  const id = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  // Latest selectable date, read when the sheet opens (the real date once it passes DEMO_TODAY).
  const [today, setToday] = useState(DEMO_TODAY)

  // Draft follows the open unit (and the stored copy after a save). Kept while closing so the exit animation
  // still has content.
  const [base, setBase] = useState<Unit | null>(unit)
  const [draft, setDraft] = useState<Unit | null>(unit)
  const [confirmed, setConfirmed] = useState(false)
  const [tried, setTried] = useState(false)
  const [leaveTo, setLeaveTo] = useState<string | null | undefined>(undefined) // undefined = no prompt
  const [after, setAfter] = useState<{ go: () => void } | null>(null) // an app-level leave (sign out) on hold
  if (unit && unit !== base) {
    // A reload (Supabase mode) hands back an equal unit as a new object: keep unsaved edits unless the unit changed.
    const keep = !!base && !!draft && unit.id === base.id && !isDirty(unit, base) && isDirty(clean(draft), base)
    setBase(unit)
    if (!keep) {
      setDraft(unit)
      setConfirmed(false)
      setTried(false)
    }
  }

  // Hidden route (Next keeps it mounted): don't come back to a stale "Save changes?" prompt.
  useLayoutEffect(() => () => setLeaveTo(undefined), [])

  const dirty = !!draft && !!base && isDirty(draft, base)
  function leave(target: string | null) {
    setAfter(null)
    if (dirty) setLeaveTo(target)
    else onNavigate(target)
  }
  useImperativeHandle(ref, () => ({ dirty: !!unit && dirty, leave }))

  // Leaving the app's way (sign out, command menu) asks too; Save or Discard then carries on. In Supabase mode sign out
  // would otherwise drop the open sheet with the data.
  const guarded = !!unit && dirty
  useEffect(() => {
    if (!guarded) return
    return setLeaveGuard((_href, go) => {
      setAfter({ go })
      setLeaveTo(null)
      return false
    })
  }, [guarded])
  const carryOn = () => {
    setAfter(null)
    after?.go()
  }
  const stay = () => {
    setLeaveTo(undefined)
    setAfter(null)
  }

  const batchSizes = useMemo(() => {
    const ids = new Set(base?.history.map((e) => e.batchId).filter(Boolean))
    const sizes = new Map<string, number>()
    if (!ids.size) return sizes
    for (const u of units) {
      for (const e of u.history) if (e.batchId && ids.has(e.batchId)) sizes.set(e.batchId, (sizes.get(e.batchId) ?? 0) + 1)
    }
    return sizes
  }, [base, units])

  if (!draft || !base) return null

  const f = new Set(type.unitFields)
  const statusChanged = draft.status !== base.status
  const check = statusChanged ? canTransition(base.status, draft.status, type) : null
  const noteMissing = !!check?.needsNote && !draft.statusNote?.trim()
  const confirmMissing = !!check?.confirm && !confirmed
  const areaMissing = !(draft.area > 0)
  const invalid = noteMissing || confirmMissing || areaMissing

  const i = order.indexOf(base.id)
  const prevId = i > 0 ? order[i - 1] : null
  const nextId = i >= 0 && i < order.length - 1 ? order[i + 1] : null
  const name = unitName(type, base)

  const set = (patch: Partial<Unit>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  function setStatus(s: UnitStatus) {
    if (s === base!.status) {
      set({ status: s, statusDate: base!.statusDate, statusNote: base!.statusNote, mortgagedTo: base!.mortgagedTo, documentNo: base!.documentNo })
    } else {
      set({
        status: s, statusDate: todayIso(), statusNote: "",
        mortgagedTo: s === "mortgaged" ? (base!.mortgagedTo ?? "HMDA") : undefined,
        documentNo: s === "registered" ? base!.documentNo : undefined,
      })
    }
    setConfirmed(false)
  }

  function save(): boolean {
    setTried(true)
    if (invalid || !draft) return false
    if (dirty) actions.saveUnit(project.id, clean(draft))
    return true
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const typing = (e.target as Element).closest(
      "input:not([type=radio]):not([type=checkbox]), textarea, select, [role=combobox], [contenteditable=true]",
    )
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault()
      if (dirty && save()) onSaved(draft!, false)
      return
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === "[" && prevId) {
      e.preventDefault()
      leave(prevId)
    } else if (e.key === "]" && nextId) {
      e.preventDefault()
      leave(nextId)
    }
  }

  // Price: per-area projects derive it (area × project rate) unless overridden; package projects store it.
  const rate = project.price.mode === "per_area" && project.price.amount > 0 ? project.price : null
  const derived = rate ? Math.round(draft.area * rate.amount) : undefined
  const dimsSqYd = draft.widthFt && draft.depthFt && type.areaUnit === "sq_yd" ? (draft.widthFt * draft.depthFt) / 9 : undefined
  const dimsOff = dimsSqYd != null && draft.area > 0 && Math.abs(dimsSqYd - draft.area) / draft.area > 0.02
  const meta = UNIT_STATUS_META[draft.status]

  const numberField = (label: string, key: keyof Unit, suffix?: string, opts?: { min?: number; step?: number }) => (
    <FieldRow label={label} htmlFor={`${id}-${key}`}>
      <div className="relative">
        <Input
          id={`${id}-${key}`}
          type="number"
          inputMode="decimal"
          min={opts?.min ?? 0}
          step={opts?.step ?? "any"}
          value={(draft[key] as number | undefined) ?? ""}
          onChange={(e) => set({ [key]: num(e.target.value) } as Partial<Unit>)}
          className={cn("h-9 tabular-nums", suffix && "pr-14")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldRow>
  )

  const facingSelect = (label: string, key: "facing" | "facing2") => (
    <FieldRow label={label} htmlFor={`${id}-${key}`}>
      <Select value={draft[key] ?? ""} onValueChange={(v) => set({ [key]: v as Facing })}>
        <SelectTrigger id={`${id}-${key}`} className="w-full data-[size=default]:h-9">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent position="popper">
          {FACINGS.map((x) => (
            <SelectItem key={x} value={x}>
              {x}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  )

  return (
    <>
      <Sheet open={!!unit} onOpenChange={(o) => !o && leave(null)}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          onKeyDown={onKeyDown}
          // Start on the unit's name (read first), not on the "Previous" button.
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            setToday(todayIso())
            titleRef.current?.focus()
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            onCloseAutoFocus()
          }}
          className={cn(
            "gap-0 p-0",
            "data-[side=right]:w-full data-[side=right]:sm:max-w-[440px]",
            "data-[side=bottom]:h-[90svh] data-[side=bottom]:rounded-t-xl",
          )}
        >
          <SheetHeader className="border-b p-4 pr-12">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle ref={titleRef} tabIndex={-1} className="text-xl font-semibold tabular-nums outline-none">
                    {name}
                  </SheetTitle>
                  <StatusBadge status={base.status} />
                </div>
                <SheetDescription className="mt-1 tabular-nums">
                  {[
                    base.tower && `Tower ${base.tower}`,
                    base.block && `Block ${base.block}`,
                    formatArea(base.area, type.areaUnit),
                    facingText(base),
                    roadText(base) && `${roadText(base)} road`,
                  ].filter(Boolean).join(" · ")}
                </SheetDescription>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon-sm" disabled={!prevId} onClick={() => prevId && leave(prevId)} aria-label={`Previous ${type.unitNoun.toLowerCase()}`} title="Previous ([)">
                  <ChevronLeft />
                </Button>
                <Button variant="ghost" size="icon-sm" disabled={!nextId} onClick={() => nextId && leave(nextId)} aria-label={`Next ${type.unitNoun.toLowerCase()}`} title="Next (])">
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-4">
            <Section title="Status" id={`${id}-status`}>
              <StatusSegmented value={draft.status} onChange={setStatus} labelledBy={`${id}-status`} />
              {check ? <GuardNotice check={check} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow label={meta.dateLabel} htmlFor={`${id}-date`}>
                  <Input
                    id={`${id}-date`}
                    type="date"
                    max={today}
                    value={draft.statusDate ?? ""}
                    onChange={(e) => set({ statusDate: e.target.value || undefined })}
                    className="h-9 tabular-nums"
                  />
                </FieldRow>
                {draft.status === "mortgaged" ? (
                  <FieldRow label="Mortgaged to" htmlFor={`${id}-mortgagee`}>
                    <Select value={draft.mortgagedTo ?? ""} onValueChange={(v) => set({ mortgagedTo: v as MortgagedTo })}>
                      <SelectTrigger id={`${id}-mortgagee`} className="w-full data-[size=default]:h-9">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {MORTGAGEES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                ) : null}
                {draft.status === "registered" ? (
                  <FieldRow label="Document no." htmlFor={`${id}-doc`} optional>
                    <Input
                      id={`${id}-doc`}
                      value={draft.documentNo ?? ""}
                      onChange={(e) => set({ documentNo: e.target.value })}
                      placeholder="Sale deed no."
                      className="h-9 tabular-nums"
                    />
                  </FieldRow>
                ) : null}
              </div>
              <FieldRow
                label="Note"
                htmlFor={`${id}-note`}
                optional={!check?.needsNote}
                error={tried && noteMissing ? "Add a note saying why. It is kept in the history." : null}
                description={statusChanged ? "Saved with this status change in the history." : undefined}
              >
                <Textarea
                  id={`${id}-note`}
                  rows={2}
                  value={draft.statusNote ?? ""}
                  onChange={(e) => set({ statusNote: e.target.value })}
                  aria-invalid={tried && noteMissing ? true : undefined}
                  aria-describedby={tried && noteMissing ? `${id}-note-error` : undefined}
                />
              </FieldRow>
              {check?.confirm ? (
                <div className="flex flex-col gap-1.5">
                  <label className="flex w-fit items-center gap-2 text-sm">
                    <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(c === true)} />
                    {check.confirm}
                  </label>
                  {tried && confirmMissing ? (
                    <p role="alert" className="text-xs text-destructive">Tick this to confirm the release.</p>
                  ) : null}
                </div>
              ) : null}
            </Section>

            <Section title="Details">
              <div className="grid gap-4 sm:grid-cols-2">
                {f.has("tower") ? (
                  <FieldRow label="Tower" htmlFor={`${id}-tower`}>
                    <Input id={`${id}-tower`} value={draft.tower ?? ""} onChange={(e) => set({ tower: e.target.value })} className="h-9" />
                  </FieldRow>
                ) : null}
                {f.has("floor") ? numberField("Floor", "floor", undefined, { step: 1 }) : null}
                {f.has("block") ? (
                  <FieldRow label="Block / phase" htmlFor={`${id}-block`} optional>
                    <Input id={`${id}-block`} value={draft.block ?? ""} onChange={(e) => set({ block: e.target.value })} className="h-9" />
                  </FieldRow>
                ) : null}
                {f.has("bhk") ? numberField("BHK", "bhk", undefined, { step: 0.5 }) : null}
                <FieldRow
                  label={type.areaLabel}
                  htmlFor={`${id}-area`}
                  error={tried && areaMissing ? "Enter the area." : null}
                  className={f.has("dimensions") ? "sm:col-span-2" : undefined}
                >
                  <AreaInput id={`${id}-area`} unit={type.areaUnit} value={draft.area || undefined} onChange={(n) => set({ area: n ?? 0 })} invalid={tried && areaMissing} />
                </FieldRow>
                {f.has("carpetArea") ? numberField("Carpet area", "carpetAreaSqFt", "sq ft") : null}
                {f.has("dimensions") ? (
                  <>
                    {numberField("Width", "widthFt", "ft")}
                    {numberField("Depth", "depthFt", "ft")}
                    {dimsSqYd != null ? (
                      <p className={cn("-mt-2 text-xs tabular-nums sm:col-span-2", dimsOff ? "text-status-mortgaged-fg" : "text-muted-foreground")}>
                        {formatNumber(draft.widthFt!)} × {formatNumber(draft.depthFt!)} ft = {formatNumber(Math.round(dimsSqYd * 100) / 100)} sq yd
                        {dimsOff ? `, area says ${formatNumber(draft.area)}. Check one of them.` : ", matches the area."}
                      </p>
                    ) : null}
                  </>
                ) : null}
                {f.has("builtUpArea") ? numberField("Built-up area", "builtUpAreaSqFt", "sq ft") : null}
                {f.has("bedrooms") ? numberField("Bedrooms", "bedrooms", undefined, { step: 1 }) : null}
                {f.has("facing") ? facingSelect("Facing", "facing") : null}
                {f.has("roadWidth") ? numberField("Road width", "roadWidthFt", "ft") : null}
                {f.has("corner") ? (
                  <label className="flex items-center gap-3 text-sm font-medium sm:col-span-2">
                    <Switch checked={!!draft.corner} onCheckedChange={(c) => set({ corner: c })} />
                    Corner {type.unitNoun.toLowerCase()}
                    <span className="font-normal text-muted-foreground">Adds a second facing and road</span>
                  </label>
                ) : null}
                {f.has("facing") && (draft.corner || draft.facing2) ? facingSelect("Second facing", "facing2") : null}
                {f.has("roadWidth") && (draft.corner || draft.roadWidth2Ft) ? numberField("Second road", "roadWidth2Ft", "ft") : null}
              </div>
            </Section>

            <Section title="Price">
              {rate ? (
                <>
                  <p className="text-sm tabular-nums">
                    <span className="text-base font-semibold">{formatINR(draft.price ?? derived ?? 0)}</span>
                    {(draft.price ?? derived ?? 0) >= 1e5 ? (
                      <span className="text-muted-foreground"> ({formatINRCompact(draft.price ?? derived ?? 0)})</span>
                    ) : null}
                  </p>
                  <p className="-mt-2 text-xs text-muted-foreground tabular-nums">
                    {draft.price != null
                      ? `Own price for this ${type.unitNoun.toLowerCase()}. Project rate would give ${formatINR(derived ?? 0)}.`
                      : `${formatArea(draft.area, type.areaUnit)} × ${formatINR(rate.amount)} / ${AREA_UNIT_LABEL[rate.per]}, the project rate.`}
                  </p>
                  <label className="flex w-fit items-center gap-3 text-sm font-medium">
                    <Switch
                      checked={draft.price != null}
                      onCheckedChange={(c) => set({ price: c ? (derived ?? 0) : undefined })}
                    />
                    Set a different price
                  </label>
                  {draft.price != null ? (
                    <AmountInput value={draft.price} onChange={(n) => set({ price: n || 0 })} aria-label={`Price of ${name}`} />
                  ) : null}
                </>
              ) : (
                <FieldRow label="Total price" htmlFor={`${id}-price`} description="Shown for this unit; leave empty if it follows the project price.">
                  <AmountInput id={`${id}-price`} value={draft.price ?? 0} onChange={(n) => set({ price: n || undefined })} />
                </FieldRow>
              )}
            </Section>

            <Section title="History">
              <History unit={base} type={type} batchSizes={batchSizes} />
            </Section>
          </div>

          <SheetFooter className="flex-row items-center justify-between gap-2 border-t p-3">
            <p className="hidden text-xs text-muted-foreground sm:block">
              <Kbd>[</Kbd> <Kbd>]</Kbd> step · <Kbd>Ctrl S</Kbd> save
            </p>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                disabled={!nextId}
                onClick={() => {
                  if (!nextId) return
                  if (!dirty) return onNavigate(nextId)
                  if (save()) {
                    onSaved(draft, false)
                    onNavigate(nextId)
                  }
                }}
              >
                {dirty ? "Save & next" : "Next"}
              </Button>
              <Button
                disabled={!dirty}
                onClick={() => {
                  if (save()) {
                    onSaved(draft, true)
                    onNavigate(null)
                  }
                }}
              >
                Save
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={leaveTo !== undefined}
        onOpenChange={(o) => !o && stay()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes to {name}?</AlertDialogTitle>
            <AlertDialogDescription>Your edits to this {type.unitNoun.toLowerCase()} aren&rsquo;t saved yet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                const target = leaveTo ?? null
                setLeaveTo(undefined)
                setDraft(base)
                onNavigate(target)
                carryOn()
              }}
            >
              Discard
            </Button>
            <Button
              onClick={() => {
                const target = leaveTo ?? null
                setLeaveTo(undefined)
                if (save()) {
                  onSaved(draft, target === null)
                  onNavigate(target)
                  carryOn()
                }
              }}
            >
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 id={id} className="text-sm font-semibold">
        {title}
      </h3>
      {children}
    </section>
  )
}

function History({ unit, type, batchSizes }: { unit: Unit; type: ProjectType; batchSizes: Map<string, number> }) {
  if (!unit.history.length) return <p className="text-sm text-muted-foreground">No status changes recorded.</p>
  const events = [...unit.history].reverse()
  return (
    <ol className="flex flex-col">
      {events.map((e, k) => {
        const others = e.batchId ? (batchSizes.get(e.batchId) ?? 1) - 1 : 0
        return (
          <li key={`${e.at}-${k}`} className="relative pb-4 pl-6 last:pb-0">
            {k < events.length - 1 ? <span aria-hidden className="absolute top-4 bottom-0 left-[5px] w-px bg-border" /> : null}
            <StatusSwatch status={e.to} className="absolute top-1 left-0 size-[11px]" />
            <p className="flex flex-wrap items-center gap-1.5 text-sm">
              {e.from ? (
                <>
                  {UNIT_STATUS_META[e.from].label}
                  <ChevronRight aria-label="to" className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">{UNIT_STATUS_META[e.to].label}</span>
                </>
              ) : (
                <>
                  Added as <span className="font-medium">{UNIT_STATUS_META[e.to].label}</span>
                </>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {formatDateTime(e.at) || formatDate(e.at)} · {e.by}
              {others > 0 ? ` · with ${formatNumber(others)} other ${nounFor(type, others)}` : ""}
            </p>
            {e.note ? <p className="mt-1 text-xs">{e.note}</p> : null}
          </li>
        )
      })}
    </ol>
  )
}
