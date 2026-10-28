"use client"
// Empty inventory + the "Generate plots" / "Generate tower" helpers (inventory-ux §4.7, §4.8). Generated units
// start Available with one history event; the whole batch can be undone from the toast.
import { useId, useState, type ReactNode } from "react"
import { Building2, LayoutGrid } from "lucide-react"

import { AreaInput, FieldRow } from "@/components/form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { AREA_UNIT_LABEL, DEMO_NOW, DEMO_TODAY } from "@/lib/constants"
import { formatArea, formatNumber } from "@/lib/format"
import { compressRanges } from "@/lib/inventory"
import { useDemo } from "@/lib/store"
import type { Project, ProjectType, Unit } from "@/lib/types"

import { countLabel, isTowerType } from "./model"

const MAX_GENERATE = 2000 // ponytail: one layout rarely passes 1,000 units; raise if a project needs more

export function InventoryEmpty({ type, onGenerate }: { type: ProjectType; onGenerate: () => void }) {
  const tower = isTowerType(type)
  const noun = type.unitNounPlural.toLowerCase()
  return (
    <Empty className="border border-solid py-12">
      <EmptyHeader>
        <EmptyMedia>
          {tower ? <Building2 aria-hidden className="size-5 text-muted-foreground" /> : <LayoutGrid aria-hidden className="size-5 text-muted-foreground" />}
        </EmptyMedia>
        <EmptyTitle className="text-base font-semibold">No {noun} yet</EmptyTitle>
        <EmptyDescription>
          {tower
            ? `Add each tower once (floors × ${noun} per floor), then update each flat's status as it sells.`
            : `Add the layout's ${noun} once as a number range, then update their status as they sell.`}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="lg" onClick={onGenerate}>
          {tower ? "Generate tower" : `Generate ${noun}`}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

const int = (s: string) => (/^\s*\d+\s*$/.test(s) ? Number(s) : null)
const pos = (s: string) => {
  const n = Number(s)
  return s.trim() !== "" && Number.isFinite(n) && n > 0 ? n : null
}

export function GenerateDialog({
  open,
  onOpenChange,
  project,
  type,
  units,
  onDone,
  onCloseAutoFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  type: ProjectType
  /** Existing units: new ones are added to them, clashes are refused. */
  units: Unit[]
  onDone: (batchId: string, message: string) => void
  /** Where focus goes on close (the empty state's trigger is gone once units exist). */
  onCloseAutoFocus: () => void
}) {
  const tower = isTowerType(type)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          onCloseAutoFocus()
        }}
        className="max-h-[90svh] overflow-y-auto sm:max-w-md"
      >
        {open ? (
          tower ? (
            <TowerForm project={project} type={type} units={units} onDone={onDone} />
          ) : (
            <PlotsForm project={project} type={type} units={units} onDone={onDone} />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

interface FormProps {
  project: Project
  type: ProjectType
  units: Unit[]
  onDone: (batchId: string, message: string) => void
}

function useMakeUnit(project: Project) {
  const { state } = useDemo()
  return (fields: Omit<Unit, "id" | "projectId" | "status" | "statusDate" | "history">, at: string): Unit => ({
    ...fields,
    id: `${project.id}:${fields.number}`,
    projectId: project.id,
    status: "available",
    statusDate: DEMO_TODAY,
    history: [{ from: null, to: "available", at, by: state.session.username || "Admin" }],
  })
}

function PlotsForm({ project, type, units, onDone }: FormProps) {
  const id = useId()
  const { actions } = useDemo()
  const make = useMakeUnit(project)
  // Adding to an existing layout starts after its highest number.
  const last = Math.max(0, ...units.map((u) => int(u.number) ?? 0))
  const [from, setFrom] = useState(String(last + 1))
  const [to, setTo] = useState(!units.length && project.totalUnits ? String(project.totalUnits) : "")
  const [block, setBlock] = useState("")
  const [area, setArea] = useState<number | undefined>(project.unitSize?.min)
  const [width, setWidth] = useState("")
  const [depth, setDepth] = useState("")
  const [tried, setTried] = useState(false)

  const noun = type.unitNounPlural.toLowerCase()
  const lo = int(from)
  const hi = int(to)
  const count = lo != null && hi != null && hi >= lo ? hi - lo + 1 : 0
  const existing = new Set(units.map((u) => u.number))
  const clash = count && count <= MAX_GENERATE
    ? Array.from({ length: count }, (_, k) => String(lo! + k)).filter((n) => existing.has(n))
    : []
  const w = pos(width)
  const d = pos(depth)

  const rangeError =
    lo == null ? "Enter a whole number to start from."
      : hi == null ? `Enter the last ${type.unitNoun.toLowerCase()} number.`
        : hi < lo ? "The last number must be at or after the first."
          : count > MAX_GENERATE ? `Up to ${formatNumber(MAX_GENERATE)} at a time.`
            : clash.length ? `${type.unitNounPlural} ${compressRanges(clash)} already exist.`
              : null
  const areaError = area && area > 0 ? null : `Enter the default ${type.areaLabel.toLowerCase()}.`
  const dimsSqYd = w && d && type.areaUnit === "sq_yd" ? (w * d) / 9 : null

  function submit() {
    setTried(true)
    if (rangeError || areaError || lo == null) return
    const at = DEMO_NOW // demo clock, like the seed history
    const created = Array.from({ length: count }, (_, k) =>
      make({
        number: String(lo + k),
        area: area!,
        ...(block.trim() && { block: block.trim() }),
        ...(w && d && { widthFt: w, depthFt: d }),
      }, at),
    )
    const batchId = actions.replaceUnits(project.id, [...units, ...created])
    onDone(batchId, `Added ${countLabel(type, count)}${block.trim() ? ` in block ${block.trim()}` : ""}: ${lo}–${hi}`)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{units.length ? `Add ${noun}` : `Generate ${noun}`}</DialogTitle>
        <DialogDescription>
          {units.length
            ? `Adds numbered ${noun} to the ${formatNumber(units.length)} already here, all Available. Numbers already in use are refused.`
            : `Creates numbered ${noun}, all Available. Edit any ${type.unitNoun.toLowerCase()} later from the grid or table.`}
        </DialogDescription>
      </DialogHeader>
      <form
        id={`${id}-form`}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <FieldRow label="First number" htmlFor={`${id}-from`}>
            <Input id={`${id}-from`} inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 tabular-nums" aria-invalid={tried && !!rangeError ? true : undefined} />
          </FieldRow>
          <FieldRow label="Last number" htmlFor={`${id}-to`}>
            <Input id={`${id}-to`} inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} placeholder="288" className="h-9 tabular-nums" aria-invalid={tried && !!rangeError ? true : undefined} />
          </FieldRow>
        </div>
        {tried && rangeError ? <p role="alert" className="-mt-2 text-xs text-destructive">{rangeError}</p> : null}
        <FieldRow label="Block / phase" htmlFor={`${id}-block`} optional description="Leave empty if the layout has no blocks.">
          <Input id={`${id}-block`} value={block} onChange={(e) => setBlock(e.target.value)} placeholder="A" className="h-9" />
        </FieldRow>
        <FieldRow label={`Default ${type.areaLabel.toLowerCase()}`} htmlFor={`${id}-area`} error={tried ? areaError : null}>
          <AreaInput id={`${id}-area`} unit={type.areaUnit} value={area} onChange={setArea} invalid={tried && !!areaError} placeholder="200" />
        </FieldRow>
        {type.unitFields.includes("dimensions") ? (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Width" htmlFor={`${id}-w`} optional>
                <Suffixed suffix="ft"><Input id={`${id}-w`} inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="30" className="h-9 pr-9 tabular-nums" /></Suffixed>
              </FieldRow>
              <FieldRow label="Depth" htmlFor={`${id}-d`} optional>
                <Suffixed suffix="ft"><Input id={`${id}-d`} inputMode="decimal" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="60" className="h-9 pr-9 tabular-nums" /></Suffixed>
              </FieldRow>
            </div>
            {dimsSqYd ? (
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatNumber(w!)} × {formatNumber(d!)} ft = {formatNumber(Math.round(dimsSqYd * 100) / 100)} sq yd
              </p>
            ) : null}
          </div>
        ) : null}
        <Preview>
          {count && !rangeError
            ? `Creates ${noun} ${lo}–${hi} (${formatNumber(count)})${block.trim() ? ` in block ${block.trim()}` : ""}${area ? `, ${formatArea(area, type.areaUnit)} each` : ""}, all Available.`
            : `Enter a number range, e.g. ${units.length ? `${last + 1} to ${last + 12}` : "1 to 288"}.`}
        </Preview>
      </form>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" form={`${id}-form`}>
          {count && !rangeError ? `${units.length ? "Add" : "Generate"} ${countLabel(type, count)}` : units.length ? `Add ${noun}` : `Generate ${noun}`}
        </Button>
      </DialogFooter>
    </>
  )
}

function nextTowerName(units: Unit[]) {
  const taken = new Set(units.map((u) => u.tower))
  for (let c = 65; c <= 90; c++) if (!taken.has(String.fromCharCode(c))) return String.fromCharCode(c)
  return ""
}

function TowerForm({ project, type, units, onDone }: FormProps) {
  const id = useId()
  const { actions } = useDemo()
  const make = useMakeUnit(project)
  const [tower, setTower] = useState(() => nextTowerName(units))
  const [floors, setFloors] = useState("12")
  const [perFloor, setPerFloor] = useState("4")
  const [bhk, setBhk] = useState("2")
  const [area, setArea] = useState<number | undefined>(undefined)
  const [carpet, setCarpet] = useState<number | undefined>(undefined)
  const [tried, setTried] = useState(false)

  const name = tower.trim()
  const nf = int(floors)
  const np = int(perFloor)
  const nb = pos(bhk)
  const count = nf && np ? nf * np : 0
  const numberOf = (floor: number, p: number) => `${name}-${floor}${String(p).padStart(2, "0")}`

  // Numbers, not just the tower field: an edited tower name must not let a new tower reuse sold flats' numbers.
  const existing = new Set(units.map((u) => u.number))
  const clash = count && count <= 1200
    ? Array.from({ length: nf! }, (_, f) => Array.from({ length: np! }, (_, p) => numberOf(f + 1, p + 1))).flat().filter((n) => existing.has(n))
    : []
  const errors = {
    tower: !name ? "Name the tower."
      : units.some((u) => u.tower === name) ? `Tower ${name} already exists.`
        : clash.length ? `${type.unitNounPlural} ${compressRanges(clash)} already exist.` : null,
    floors: nf && nf >= 1 && nf <= 60 ? null : "1 to 60 floors.",
    perFloor: np && np >= 1 && np <= 20 ? null : `1 to 20 ${type.unitNounPlural.toLowerCase()} per floor.`,
    bhk: nb ? null : "Enter the BHK.",
    area: area && area > 0 ? null : `Enter the ${type.areaLabel.toLowerCase()}.`,
  }
  const invalid = Object.values(errors).some(Boolean)

  function submit() {
    setTried(true)
    if (invalid || !nf || !np || !nb || !area) return
    const at = DEMO_NOW // demo clock, like the seed history
    const created: Unit[] = []
    for (let floor = 1; floor <= nf; floor++) {
      for (let p = 1; p <= np; p++) {
        created.push(make({
          number: numberOf(floor, p), tower: name, floor, bhk: nb, area,
          ...(carpet && { carpetAreaSqFt: carpet }),
        }, at))
      }
    }
    const batchId = actions.replaceUnits(project.id, [...units, ...created])
    onDone(batchId, `Added tower ${name}: ${countLabel(type, count)}`)
  }

  const err = (k: keyof typeof errors) => (tried ? errors[k] : null)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Generate tower</DialogTitle>
        <DialogDescription>
          Creates every {type.unitNoun.toLowerCase()} on every floor, all Available. Numbers are tower, floor and
          position: {name || "A"}-101, {name || "A"}-102 …
        </DialogDescription>
      </DialogHeader>
      <form
        id={`${id}-form`}
        className="grid grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <FieldRow label="Tower name" htmlFor={`${id}-tower`} error={err("tower")}>
          <Input id={`${id}-tower`} value={tower} onChange={(e) => setTower(e.target.value)} className="h-9" aria-invalid={err("tower") ? true : undefined} />
        </FieldRow>
        <FieldRow label="BHK" htmlFor={`${id}-bhk`} error={err("bhk")}>
          <Input id={`${id}-bhk`} inputMode="decimal" value={bhk} onChange={(e) => setBhk(e.target.value)} className="h-9 tabular-nums" />
        </FieldRow>
        <FieldRow label="Floors" htmlFor={`${id}-floors`} error={err("floors")}>
          <Input id={`${id}-floors`} inputMode="numeric" value={floors} onChange={(e) => setFloors(e.target.value)} className="h-9 tabular-nums" />
        </FieldRow>
        <FieldRow label={`${type.unitNounPlural} per floor`} htmlFor={`${id}-per`} error={err("perFloor")}>
          <Input id={`${id}-per`} inputMode="numeric" value={perFloor} onChange={(e) => setPerFloor(e.target.value)} className="h-9 tabular-nums" />
        </FieldRow>
        <FieldRow label={type.areaLabel} htmlFor={`${id}-area`} error={err("area")}>
          <AreaInput id={`${id}-area`} unit={type.areaUnit} value={area} onChange={setArea} placeholder="1,210" invalid={!!err("area")} />
        </FieldRow>
        <FieldRow label="Carpet area" htmlFor={`${id}-carpet`} optional>
          <AreaInput id={`${id}-carpet`} unit="sq_ft" value={carpet} onChange={setCarpet} placeholder="905" />
        </FieldRow>
        <Preview className="col-span-2">
          {count && name && !errors.tower
            ? `Creates ${countLabel(type, count)} in tower ${name}: ${numberOf(1, 1)} to ${numberOf(nf!, np!)}${area ? `, ${formatNumber(area)} ${AREA_UNIT_LABEL[type.areaUnit]} each` : ""}.`
            : "Enter the tower name, floors and flats per floor."}
        </Preview>
      </form>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" form={`${id}-form`}>
          {name && !errors.tower ? `Add tower ${name}` : "Add tower"}
        </Button>
      </DialogFooter>
    </>
  )
}

function Preview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p aria-live="polite" className={`rounded-lg bg-muted px-3 py-2 text-sm tabular-nums ${className ?? ""}`}>
      {children}
    </p>
  )
}

function Suffixed({ suffix, children }: { suffix: string; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">{suffix}</span>
    </div>
  )
}
