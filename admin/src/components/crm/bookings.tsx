"use client"

import { useMemo, useState } from "react"
import { Download, Handshake, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PageContainer, PageHeader } from "@/components/app/page-header"
import { BookingDialog } from "@/components/crm/booking-dialog"
import { CrmFilters, CrmNotice, LoadError, TableSkeleton, useProjectNames } from "@/components/crm/parts"
import { useCrm } from "@/components/crm/use-crm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CHANNEL_LABEL, deleteBooking, downloadCsv, formatPhone, loadBookings, phoneCell, type Booking, type Channel } from "@/lib/crm"
import { formatDate, formatINR, formatNumber, plural } from "@/lib/format"

/** Every sale the admin records, Direct or through an Associate. */
export function Bookings() {
  const { db, rows, error, reload } = useCrm(loadBookings)
  const names = useProjectNames()
  const [query, setQuery] = useState("")
  const [project, setProject] = useState("all")
  const [channel, setChannel] = useState<"all" | Channel>("all")
  const [editing, setEditing] = useState<Booking | "new" | null>(null)
  const [removing, setRemoving] = useState<Booking | null>(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, "")
    return (rows ?? []).filter(
      (b) =>
        (project === "all" || b.projectId === project) &&
        (channel === "all" || b.channel === channel) &&
        (!q ||
          [b.customerName, b.agentName, b.plotNumber, names(b.projectId)].some((t) => t.toLowerCase().includes(q)) ||
          (digits.length >= 3 && b.customerPhone.includes(digits))),
    )
  }, [rows, query, project, channel, names])
  const total = shown.reduce((s, b) => s + b.price, 0)
  const agents = useMemo(() => (rows ?? []).map((b) => ({ name: b.agentName, channel: b.channel })), [rows])

  if (!db) return <CrmNotice title="Bookings" />

  const download = () =>
    downloadCsv(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Booked on", "Project", "Plot", "Plot area (sq yd)", "Customer", "Contact number", "Sold by", "Salesperson / associate", "Final sold price (₹)", "Note", "Recorded by"],
      ...shown.map((b) => [
        b.bookedOn, names(b.projectId), b.plotNumber, b.area, b.customerName, phoneCell(b.customerPhone), CHANNEL_LABEL[b.channel],
        b.agentName, b.price, b.note, b.createdByName,
      ]),
    ])

  const remove = async () => {
    if (!removing) return
    try {
      await deleteBooking(db, removing.id)
      toast.success(`Booking for plot ${removing.plotNumber} deleted`)
      void reload()
    } catch (e) {
      toast.error((e as { message?: string })?.message || "The booking could not be deleted.")
    } finally {
      setRemoving(null)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Bookings"
        description={
          rows ? (
            <span>
              {plural(shown.length, "booking", "bookings")} · {formatINR(total)}
            </span>
          ) : (
            "Sales made directly or through associates"
          )
        }
        actions={
          <>
            <Button variant="outline" onClick={download} disabled={!shown.length}>
              <Download data-icon="inline-start" />
              Download
            </Button>
            <Button onClick={() => setEditing("new")}>
              <Plus data-icon="inline-start" />
              New booking
            </Button>
          </>
        }
      >
        <CrmFilters
          query={query}
          onQuery={setQuery}
          placeholder="Customer, phone, plot or salesperson"
          project={project}
          onProject={setProject}
          sourceLabel="Sold by"
          source={channel}
          onSource={(v) => setChannel(v as "all" | Channel)}
          sources={[
            ["all", "All"],
            ["direct", "Direct"],
            ["associate", "Associate"],
          ]}
        />
      </PageHeader>

      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {!rows ? (
        <TableSkeleton />
      ) : !shown.length ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border px-4 py-14 text-center">
          <Handshake aria-hidden className="size-5 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {rows.length ? "No bookings match these filters." : "No bookings yet. Record a sale with New booking."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Booked on</TableHead>
                <TableHead>Project · plot</TableHead>
                <TableHead className="text-right">Area</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sold by</TableHead>
                <TableHead className="text-right">Final price</TableHead>
                <TableHead className="w-[1%]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">{formatDate(b.bookedOn)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-medium">{names(b.projectId)}</span>
                    <span className="text-muted-foreground"> · Plot {b.plotNumber}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{formatNumber(b.area)} sq yd</TableCell>
                  <TableCell>
                    <div className="font-medium">{b.customerName}</div>
                    <a href={`tel:${b.customerPhone}`} className="text-xs text-muted-foreground tabular-nums hover:underline">
                      {formatPhone(b.customerPhone)}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div>{b.agentName}</div>
                    <Badge variant={b.channel === "direct" ? "secondary" : "outline"} className="mt-0.5">
                      {CHANNEL_LABEL[b.channel]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{formatINR(b.price)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button variant="ghost" size="icon" aria-label={`Edit the booking for plot ${b.plotNumber}`} onClick={() => setEditing(b)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete the booking for plot ${b.plotNumber}`} onClick={() => setRemoving(b)}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing ? (
        <BookingDialog
          key={editing === "new" ? "new" : editing.id}
          db={db}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          booking={editing === "new" ? undefined : editing}
          agents={agents}
          onSaved={reload}
        />
      ) : null}

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the booking for plot {removing?.plotNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.customerName}, {removing ? formatINR(removing.price) : ""}. It leaves the common sheet and the reports. The plot&rsquo;s
              status stays as it is: put it back on sale from the inventory if the sale fell through.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
              Delete booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
