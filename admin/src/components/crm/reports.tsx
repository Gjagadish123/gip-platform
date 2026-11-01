"use client"

import { Fragment, useMemo, useState } from "react"
import { ChartColumn, Download } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/app/page-header"
import { CrmFilters, CrmNotice, LoadError, TableSkeleton, useProjectNames } from "@/components/crm/parts"
import { useCrm } from "@/components/crm/use-crm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CHANNEL_LABEL, downloadCsv, formatPhone, loadBookings, personKey, phoneCell, type Booking, type Channel } from "@/lib/crm"
import { formatDate, formatINR, formatNumber, plural } from "@/lib/format"

interface Group {
  key: string
  name: string // as first written
  channel: Channel
  rows: Booking[]
  area: number
  value: number
}

/** Bookings by salesperson (Direct) or associate: who sold what, to whom, for how much. */
export function groupByAgent(rows: Booking[]): Group[] {
  const groups = new Map<string, Group>()
  for (const b of [...rows].sort((a, z) => a.bookedOn.localeCompare(z.bookedOn))) {
    const key = `${b.channel}:${personKey(b.agentName)}`
    const g = groups.get(key) ?? { key, name: b.agentName.trim(), channel: b.channel, rows: [], area: 0, value: 0 }
    g.rows.push(b)
    g.area += b.area
    g.value += b.price
    groups.set(key, g)
  }
  return [...groups.values()].sort((a, z) => z.value - a.value || a.name.localeCompare(z.name))
}

export function Reports() {
  const { db, rows, error, reload } = useCrm(loadBookings)
  const names = useProjectNames()
  const [query, setQuery] = useState("")
  const [project, setProject] = useState("all")
  const [channel, setChannel] = useState<"all" | Channel>("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groupByAgent(
      (rows ?? []).filter(
        (b) =>
          (project === "all" || b.projectId === project) &&
          (channel === "all" || b.channel === channel) &&
          (!from || b.bookedOn >= from) &&
          (!to || b.bookedOn <= to) &&
          (!q || b.agentName.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q)),
      ),
    )
  }, [rows, query, project, channel, from, to])
  const total = groups.reduce((t, g) => ({ n: t.n + g.rows.length, area: t.area + g.area, value: t.value + g.value }), { n: 0, area: 0, value: 0 })

  if (!db) return <CrmNotice title="Reports" />

  const period = from || to ? `${from ? formatDate(from) : "the start"} to ${to ? formatDate(to) : "today"}` : "all time"
  const download = () => {
    const out: (string | number | ReturnType<typeof phoneCell> | undefined)[][] = [
      [`Associate / salesperson-wise bookings, ${period}${project === "all" ? "" : `, ${names(project)}`}`],
      [],
      ["Salesperson / associate", "Sold by", "Project", "Customer", "Contact number", "Plot", "Plot area (sq yd)", "Final sold price (₹)", "Booked on"],
    ]
    for (const g of groups) {
      for (const b of g.rows)
        out.push([g.name, CHANNEL_LABEL[g.channel], names(b.projectId), b.customerName, phoneCell(b.customerPhone), b.plotNumber, b.area, b.price, b.bookedOn])
      out.push([`Total: ${g.name}`, CHANNEL_LABEL[g.channel], plural(g.rows.length, "booking", "bookings"), "", "", "", g.area, g.value, ""])
      out.push([])
    }
    out.push(["Grand total", "", plural(total.n, "booking", "bookings"), "", "", "", total.area, total.value, ""])
    downloadCsv(`bookings-by-salesperson-${new Date().toISOString().slice(0, 10)}.csv`, out)
  }

  const dateField = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">
        {label}
      </Label>
      <Input id={id} type="date" value={value} onChange={(e) => set(e.target.value)} className="w-40" />
    </div>
  )

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description={
          rows ? (
            <span>
              {plural(total.n, "booking", "bookings")} · {formatNumber(total.area)} sq yd · {formatINR(total.value)} · {period}
            </span>
          ) : (
            "Bookings by salesperson and associate"
          )
        }
        actions={
          <Button onClick={download} disabled={!groups.length}>
            <Download data-icon="inline-start" />
            Download report
          </Button>
        }
      >
        <CrmFilters
          query={query}
          onQuery={setQuery}
          placeholder="Salesperson, associate or customer"
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
        >
          {dateField("report-from", "From", from, setFrom)}
          {dateField("report-to", "To", to, setTo)}
        </CrmFilters>
      </PageHeader>

      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {!rows ? (
        <TableSkeleton />
      ) : !groups.length ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border px-4 py-14 text-center">
          <ChartColumn aria-hidden className="size-5 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {rows.length ? "No bookings in this period or with these filters." : "No bookings yet. They appear here once recorded under Bookings."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact number</TableHead>
                <TableHead className="text-right">Plot area</TableHead>
                <TableHead className="text-right">Final sold price</TableHead>
                <TableHead>Booked on</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <Fragment key={g.key}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={3} className="py-2.5">
                      <span className="font-semibold">{g.name}</span>
                      <Badge variant={g.channel === "direct" ? "secondary" : "outline"} className="ml-2">
                        {g.channel === "direct" ? "Salesperson" : "Associate"}
                      </Badge>
                      <span className="ml-2 text-sm text-muted-foreground">{plural(g.rows.length, "booking", "bookings")}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatNumber(g.area)} sq yd</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatINR(g.value)}</TableCell>
                    <TableCell />
                  </TableRow>
                  {g.rows.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="whitespace-nowrap">
                        {names(b.projectId)} <span className="text-muted-foreground">· Plot {b.plotNumber}</span>
                      </TableCell>
                      <TableCell>{b.customerName}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">{formatPhone(b.customerPhone)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">{formatNumber(b.area)} sq yd</TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">{formatINR(b.price)}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">{formatDate(b.bookedOn)}</TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
              <TableRow className="border-t-2 font-semibold hover:bg-transparent">
                <TableCell colSpan={3}>Grand total · {plural(total.n, "booking", "bookings")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(total.area)} sq yd</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(total.value)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  )
}
