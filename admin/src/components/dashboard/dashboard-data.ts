// Pure derivations for the dashboard: every figure on the page comes from the demo store through these.
// Self-check: scratchpad dash/check.sh (compiles this file + src/lib, asserts over the seed).
import { DEMO_NOW, UNIT_STATUSES, getProjectType } from "@/lib/constants"
import { formatDate, toIsoDate } from "@/lib/format"
import { naturalCompare, percents, statusCounts, type StatusCounts } from "@/lib/inventory"
import type { ActivityEvent, ID, Project, ProjectType, Unit, UnitStatus } from "@/lib/types"
import { validateProject, type Issue } from "@/lib/validate"

type Units = Record<ID, Unit[]>

/* ---------- stat strip ---------- */

export function inventorySummary(projects: Project[], units: Units) {
  // Sample projects (Skyline's 96 flats) aren't the client's stock, so they stay out of every total.
  const tracked = projects.filter((p) => !p.sample && units[p.id]?.length)
  const counts = statusCounts(tracked.flatMap((p) => units[p.id]))
  const total = UNIT_STATUSES.reduce((n, s) => n + counts[s], 0)
  // Sellable = Available in projects buyers can act on today: ongoing and published.
  const sellable = tracked
    .filter((p) => p.lifecycle === "ongoing" && p.publishing.state === "published")
    .reduce((n, p) => n + units[p.id].filter((u) => u.status === "available").length, 0)
  return {
    projects: tracked.length,
    counts,
    total,
    sellable,
    percents: percents(UNIT_STATUSES.map((s) => counts[s])),
    sample: tracked.some((p) => p.statusSample),
  }
}

/* ---------- ongoing projects table ---------- */

export interface ProjectRow {
  p: Project
  type: ProjectType
  counts: StatusCounts | null // null = no units yet
  total: number
  /** -1 without inventory, so those rows sort below "0 available". */
  available: number
  /** Later of inventoryUpdatedAt and publishing.updatedAt ('YYYY-MM-DD'). */
  updated: string
}

export function ongoingRows(projects: Project[], units: Units): ProjectRow[] {
  return projects
    .filter((p) => p.lifecycle === "ongoing")
    .sort((a, b) => a.publishing.sortOrder - b.publishing.sortOrder)
    .map((p) => {
      const own = units[p.id] ?? []
      const counts = own.length ? statusCounts(own) : null
      const inv = p.inventoryUpdatedAt ?? ""
      return {
        p,
        type: getProjectType(p.typeId),
        counts,
        total: own.length,
        available: counts?.available ?? -1,
        updated: inv > p.publishing.updatedAt ? inv : p.publishing.updatedAt,
      }
    })
}

/* ---------- recent status changes ---------- */

export interface ChangeGroup { key: string; at: string; project: Project; to: UnitStatus; numbers: string[] }

/**
 * Status changes, newest first. Changes to the same project and status on the same (IST) day merge into one
 * entry; numbers are de-duplicated and naturally sorted so compressRanges() can print "41–44".
 */
export function groupStatusChanges(activity: ActivityEvent[], projects: Project[], limit: number): ChangeGroup[] {
  const byId = new Map(projects.map((p) => [p.id, p]))
  const groups = new Map<string, ChangeGroup>()
  for (const a of activity) {
    const project = byId.get(a.projectId)
    if (a.kind !== "status" || !a.to || !a.unitNumbers?.length || !project) continue
    const key = `${toIsoDate(a.at)}|${a.projectId}|${a.to}`
    const g = groups.get(key)
    if (g) g.numbers.push(...a.unitNumbers)
    else if (groups.size < limit) groups.set(key, { key, at: a.at, project, to: a.to, numbers: [...a.unitNumbers] })
  }
  return [...groups.values()].map((g) => ({ ...g, numbers: [...new Set(g.numbers)].sort(naturalCompare) }))
}

/* ---------- chart: units changed per month, by target status ---------- */

export type MonthRow = { month: string; label: string } & Record<UnitStatus, number>

/**
 * The last `months` calendar months (IST) ending at the demo clock, or at the newest event if the demo has been
 * used past it. One row per month; each status counts units moved into it.
 */
export function monthlyStatusChanges(activity: ActivityEvent[], months = 6): MonthRow[] {
  const newest = activity[0]?.at
  const end = toIsoDate(newest && Date.parse(newest) > Date.parse(DEMO_NOW) ? newest : DEMO_NOW)
  const [y, m] = end.split("-").map(Number)
  const rows: MonthRow[] = Array.from({ length: months }, (_, i) => {
    const month = new Date(Date.UTC(y, m - months + i, 1)).toISOString().slice(0, 7) // fixed date, not the clock
    return { month, label: formatDate(`${month}-01`).replace(/^\d+ /, ""), available: 0, sold_out: 0, mortgaged: 0, registered: 0 }
  })
  const byMonth = new Map(rows.map((r) => [r.month, r]))
  for (const a of activity) {
    const row = a.kind === "status" && a.to ? byMonth.get(toIsoDate(a.at).slice(0, 7)) : undefined
    if (row && a.to) row[a.to] += a.unitNumbers?.length ?? 0
  }
  return rows
}

/* ---------- needs attention ---------- */

/**
 * What a completed project's card shows (it has no detail page): name, cover, short location, the "Approved" badge
 * (legal.approvals, including each approval's LP / RERA number: legal.approvals.<id>), plus publishing.
 */
const CARD_FIELDS = new Set(["name", "media.cover", "location.short"])
const isCardLevel = (i: Issue) =>
  CARD_FIELDS.has(i.field) || i.field.startsWith("legal.approvals") || i.field.startsWith("publishing.")
const LIFECYCLE_RANK = { ongoing: 0, upcoming: 1, completed: 2 } as const

export interface Attention { project: Project; issues: Issue[]; required: number; recommended: number }

/** Every listed project with open issues: required first, ongoing before upcoming before completed. */
export function attentionList(projects: Project[], units: Units): Attention[] {
  return projects
    .filter((p) => p.publishing.state !== "archived")
    .map((p) => {
      let issues = validateProject(p, getProjectType(p.typeId), units[p.id] ?? [], projects)
      if (p.lifecycle === "completed") issues = issues.filter(isCardLevel)
      issues = [...issues.filter((i) => i.level === "required"), ...issues.filter((i) => i.level !== "required")]
      const required = issues.filter((i) => i.level === "required").length
      return { project: p, issues, required, recommended: issues.length - required }
    })
    .filter((a) => a.issues.length)
    .sort(
      (a, b) =>
        b.required - a.required ||
        LIFECYCLE_RANK[a.project.lifecycle] - LIFECYCLE_RANK[b.project.lifecycle] ||
        b.recommended - a.recommended ||
        a.project.publishing.sortOrder - b.project.publishing.sortOrder,
    )
}
