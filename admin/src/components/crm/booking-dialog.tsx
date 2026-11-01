"use client"

import { useId, useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UNIT_STATUS_META } from "@/lib/constants"
import { CHANNEL_LABEL, formatPhone, personKey, saveBooking, toE164, type Booking, type BookingInput, type Channel } from "@/lib/crm"
import { formatINR, formatNumber } from "@/lib/format"
import { naturalCompare } from "@/lib/inventory"
import { useDemo, useProjects, useUnits } from "@/lib/store"
import type { Db } from "@/lib/supabase/client"

type Errors = Partial<Record<"project" | "plot" | "customerName" | "customerPhone" | "agentName" | "price" | "bookedOn", string>>

const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10) // IST

/** The database's refusals in the admin's words. */
function saveError(e: unknown, plot: string): string {
  const code = (e as { code?: string })?.code
  if (code === "23505") return `Plot ${plot} already has a booking. Open that booking to change it.`
  if (code === "40001") return "Someone changed this booking or the plot meanwhile. Close this, and open it again."
  if (code === "23503") return `There is no plot ${plot} in this project.`
  return (e as { message?: string })?.message || "The booking could not be saved. Try again."
}

/**
 * Add or edit one booking. A new booking picks the project and plot; an edit keeps them (delete and add again to move
 * a sale to another plot). "Mark Sold Out" puts an Available or Hold plot to Sold Out with the booking.
 */
export function BookingDialog({
  db,
  open,
  onOpenChange,
  booking,
  agents,
  onSaved,
}: {
  db: Db
  open: boolean
  onOpenChange: (open: boolean) => void
  booking?: Booking
  agents: { name: string; channel: Channel }[]
  onSaved: () => void
}) {
  const id = useId()
  const projects = useProjects()
  const { actions } = useDemo()
  const [projectId, setProjectId] = useState(booking?.projectId ?? "")
  const [plot, setPlot] = useState(booking?.plotNumber ?? "")
  const [customerName, setCustomerName] = useState(booking?.customerName ?? "")
  const [customerPhone, setCustomerPhone] = useState(booking ? formatPhone(booking.customerPhone) : "")
  const [channel, setChannel] = useState<Channel>(booking?.channel ?? "direct")
  const [agentName, setAgentName] = useState(booking?.agentName ?? "")
  const [price, setPrice] = useState(booking ? String(booking.price) : "")
  const [bookedOn, setBookedOn] = useState(booking?.bookedOn ?? today())
  const [note, setNote] = useState(booking?.note ?? "")
  const [markSold, setMarkSold] = useState(true)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  const units = useUnits(projectId)
  const sorted = useMemo(() => [...units].sort((a, b) => naturalCompare(a.number, b.number)), [units])
  const unit = units.find((u) => u.number === plot.trim().replace(/^0+(?=\d)/, ""))
  const canMark = !booking && unit && (unit.status === "available" || unit.status === "hold")
  const listed = projects.filter((p) => p.publishing.state !== "archived")
  const suggestions = useMemo(() => {
    const seen = new Set<string>()
    return agents.filter((a) => a.channel === channel && !seen.has(personKey(a.name)) && seen.add(personKey(a.name)))
  }, [agents, channel])

  function validate(): Errors {
    const e: Errors = {}
    if (!projectId) e.project = "Choose the project."
    if (!booking && !unit) e.plot = plot.trim() ? `There is no plot ${plot.trim()} in this project.` : "Enter the plot number."
    if (customerName.trim().length < 2 || customerName.trim().length > 80) e.customerName = "Enter the customer's name."
    if (!toE164(customerPhone)) e.customerPhone = "Enter a 10-digit mobile number, or the full number with + and the country code."
    if (agentName.trim().length < 2 || agentName.trim().length > 80)
      e.agentName = channel === "direct" ? "Enter the salesperson's name." : "Enter the associate's name."
    if (!/^\d{1,12}$/.test(price) || Number(price) <= 0) e.price = "Enter the final sold price in rupees."
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookedOn)) e.bookedOn = "Enter the booking date."
    return e
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const input: BookingInput = {
      id: booking?.id,
      updatedAt: booking?.updatedAt,
      projectId,
      plotNumber: booking?.plotNumber ?? unit!.number,
      customerName: customerName.trim().replace(/\s+/g, " "),
      customerPhone: toE164(customerPhone)!,
      channel,
      agentName: agentName.trim().replace(/\s+/g, " "),
      price: Number(price),
      bookedOn,
      note: note.trim() || undefined,
    }
    setSaving(true)
    try {
      await saveBooking(db, input, Boolean(canMark && markSold))
      toast.success(
        booking ? "Booking updated" : canMark && markSold ? `Booked. Plot ${unit!.number} is now Sold Out.` : "Booking saved",
      )
      if (canMark && markSold) actions.reload() // the plot's new status, everywhere in the admin
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(saveError(err, input.plotNumber))
    } finally {
      setSaving(false)
    }
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} className="text-xs text-destructive">
        {errors[k]}
      </p>
    ) : null
  const described = (k: keyof Errors) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${id}-${k}-err` } : {})

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{booking ? "Edit booking" : "New booking"}</DialogTitle>
          <DialogDescription>
            {booking
              ? `Plot ${booking.plotNumber} · ${listed.find((p) => p.id === booking.projectId)?.name ?? booking.projectId}`
              : "A sale made directly or through an associate. It goes to the common sheet and the reports."}
          </DialogDescription>
        </DialogHeader>

        <form id={`${id}-form`} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          {!booking ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-project`}>Project</Label>
                <Select value={projectId} onValueChange={(v) => { setProjectId(v); setPlot("") }}>
                  <SelectTrigger id={`${id}-project`} className="w-full" {...described("project")}>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {listed.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err("project")}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-plot`}>Plot number</Label>
                <Input
                  id={`${id}-plot`}
                  list={`${id}-plots`}
                  autoComplete="off"
                  disabled={!projectId}
                  value={plot}
                  onChange={(e) => setPlot(e.target.value.slice(0, 20))}
                  {...described("plot")}
                />
                <datalist id={`${id}-plots`}>
                  {sorted.map((u) => (
                    <option key={u.id} value={u.number}>
                      {`${UNIT_STATUS_META[u.status].label} · ${formatNumber(u.area)} sq yd`}
                    </option>
                  ))}
                </datalist>
                {err("plot") ??
                  (unit ? (
                    <p className="text-xs text-muted-foreground">
                      {UNIT_STATUS_META[unit.status].label} · {formatNumber(unit.area)} sq yd
                    </p>
                  ) : null)}
              </div>
            </>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-customerName`}>Customer name</Label>
            <Input id={`${id}-customerName`} autoComplete="off" value={customerName} onChange={(e) => setCustomerName(e.target.value)} {...described("customerName")} />
            {err("customerName")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-customerPhone`}>Contact number</Label>
            <Input
              id={`${id}-customerPhone`}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="98765 43210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.slice(0, 20))}
              {...described("customerPhone")}
            />
            {err("customerPhone")}
          </div>

          <fieldset className="grid gap-2 sm:col-span-2">
            <legend className="mb-1 text-sm font-medium">Sold by</legend>
            <RadioGroup value={channel} onValueChange={(v) => setChannel(v as Channel)} className="flex gap-6">
              {(["direct", "associate"] as const).map((c) => (
                <div key={c} className="flex items-center gap-2">
                  <RadioGroupItem id={`${id}-ch-${c}`} value={c} />
                  <Label htmlFor={`${id}-ch-${c}`} className="font-normal">
                    {CHANNEL_LABEL[c]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor={`${id}-agentName`}>{channel === "direct" ? "Salesperson's name" : "Associate's name"}</Label>
            <Input
              id={`${id}-agentName`}
              list={`${id}-agents`}
              autoComplete="off"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              {...described("agentName")}
            />
            <datalist id={`${id}-agents`}>
              {suggestions.map((a) => (
                <option key={a.name} value={a.name} />
              ))}
            </datalist>
            {err("agentName") ?? <p className="text-xs text-muted-foreground">Reports group bookings by this name, so pick it from the list when it&rsquo;s there.</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-price`}>Final sold price (₹)</Label>
            <Input
              id={`${id}-price`}
              inputMode="numeric"
              autoComplete="off"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 12))}
              {...described("price")}
            />
            {err("price") ?? (price ? <p className="text-xs text-muted-foreground">{formatINR(Number(price))}</p> : null)}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-bookedOn`}>Booked on</Label>
            <Input id={`${id}-bookedOn`} type="date" max={today()} value={bookedOn} onChange={(e) => setBookedOn(e.target.value)} {...described("bookedOn")} />
            {err("bookedOn")}
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor={`${id}-note`}>Note (optional)</Label>
            <Textarea id={`${id}-note`} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {canMark ? (
            <div className="flex items-start gap-2.5 rounded-md border bg-muted/40 p-3 sm:col-span-2">
              <Checkbox id={`${id}-mark`} checked={markSold} onCheckedChange={(v) => setMarkSold(v === true)} className="mt-0.5" />
              <Label htmlFor={`${id}-mark`} className="block font-normal leading-snug">
                Mark plot {unit!.number} Sold Out
                <span className="block text-xs text-muted-foreground">
                  It is {UNIT_STATUS_META[unit!.status].label} now. The website and live layouts update at once.
                </span>
              </Label>
            </div>
          ) : !booking && unit ? (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Plot {unit.number} is {UNIT_STATUS_META[unit.status].label}; its status stays as it is.
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`} disabled={saving}>
            {saving ? "Saving…" : booking ? "Save changes" : "Save booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
