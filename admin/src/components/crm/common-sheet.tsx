"use client"

import { useMemo, useState } from "react"
import { Download, Sheet } from "lucide-react"

import { PageContainer, PageHeader } from "@/components/app/page-header"
import { CrmFilters, CrmNotice, LoadError, TableSkeleton } from "@/components/crm/parts"
import { useCrm } from "@/components/crm/use-crm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { downloadCsv, formatPhone, loadSheet, phoneCell, SHEET_LIMIT, type SheetRow } from "@/lib/crm"
import { formatDateTime, formatINR, formatNumber, plural } from "@/lib/format"
import { cn } from "@/lib/utils"

type Source = "all" | "booking" | "website" | "live"
const matches = (r: SheetRow, s: Source) =>
  s === "all" || (s === "booking" ? r.kind === "booking" : r.source.startsWith(s === "website" ? "Website" : "Live layout"))

/** Every booking and every lead from the website and the live layouts, newest first, each with its source. */
export function CommonSheet() {
  const { db, rows, error, reload } = useCrm(loadSheet)
  const [query, setQuery] = useState("")
  const [project, setProject] = useState("all")
  const [source, setSource] = useState<Source>("all")

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, "")
    return (rows ?? []).filter(
      (r) =>
        matches(r, source) &&
        (project === "all" || r.projectId === project) &&
        (!q ||
          [r.name, r.email, r.agent, r.plotNumber, r.projectName, r.details].some((t) => t?.toLowerCase().includes(q)) ||
          (digits.length >= 3 && r.phone.includes(digits))),
    )
  }, [rows, query, project, source])
  const bookings = shown.filter((r) => r.kind === "booking").length

  if (!db) return <CrmNotice title="Common sheet" />

  const download = () =>
    downloadCsv(`common-sheet-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Received", "Source", "Project", "Plot", "Plot area (sq yd)", "Name", "Contact number", "Email", "Salesperson / associate", "Final sold price (₹)", "Booked on", "Details"],
      ...shown.map((r) => [
        formatDateTime(r.at), r.source, r.projectName, r.plotNumber, r.area, r.name, phoneCell(r.phone), r.email, r.agent, r.price, r.bookedOn, r.details,
      ]),
    ])

  return (
    <PageContainer>
      <PageHeader
        title="Common sheet"
        description={
          rows ? (
            <span>
              {plural(bookings, "booking", "bookings")} and {plural(shown.length - bookings, "enquiry", "enquiries")} · new leads appear by themselves
            </span>
          ) : (
            "Every booking and every website and live layout enquiry, in one list"
          )
        }
        actions={
          <Button variant="outline" onClick={download} disabled={!shown.length}>
            <Download data-icon="inline-start" />
            Download
          </Button>
        }
      >
        <CrmFilters
          query={query}
          onQuery={setQuery}
          placeholder="Name, phone, plot or message"
          project={project}
          onProject={setProject}
          sourceLabel="Source"
          source={source}
          onSource={(v) => setSource(v as Source)}
          sources={[
            ["all", "All"],
            ["booking", "Bookings"],
            ["website", "Website"],
            ["live", "Live layout"],
          ]}
        />
      </PageHeader>

      {error ? <LoadError message={error} onRetry={reload} /> : null}
      {rows && rows.length >= SHEET_LIMIT ? (
        <p className="mb-3 text-xs text-muted-foreground">Showing the newest {formatNumber(SHEET_LIMIT)} rows.</p>
      ) : null}
      {!rows ? (
        <TableSkeleton />
      ) : !shown.length ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border px-4 py-14 text-center">
          <Sheet aria-hidden className="size-5 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {rows.length
              ? "Nothing matches these filters."
              : "Nothing yet. Bookings you record and enquiries from the website and the live layouts appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Received</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Project · plot</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sold by</TableHead>
                <TableHead className="text-right">Final price</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={r.id} className="align-top">
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">{formatDateTime(r.at)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-nowrap",
                        r.kind === "booking" && "border-transparent bg-primary text-primary-foreground",
                        r.source.startsWith("Live layout") && "border-amber-500/50 text-amber-700 dark:text-amber-300",
                      )}
                    >
                      {r.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.projectName ?? <span className="text-muted-foreground">General</span>}
                    {r.plotNumber ? <span className="text-muted-foreground"> · Plot {r.plotNumber}</span> : null}
                    {r.area ? <div className="text-xs text-muted-foreground tabular-nums">{formatNumber(r.area)} sq yd</div> : null}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <a href={`tel:${r.phone}`} className="text-xs text-muted-foreground tabular-nums hover:underline">
                      {formatPhone(r.phone)}
                    </a>
                    {r.email ? <div className="text-xs break-all text-muted-foreground">{r.email}</div> : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{r.agent ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{r.price ? formatINR(r.price) : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="min-w-56 max-w-md text-sm text-muted-foreground [overflow-wrap:anywhere]">{r.details ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  )
}
