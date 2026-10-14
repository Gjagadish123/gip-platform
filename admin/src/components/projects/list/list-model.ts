// Projects list: row derivation, tab/search/facet filters and sorts. Plain arrays (≤30 rows), no table library.
import { getProjectType } from "@/lib/constants"
import { formatPrice } from "@/lib/format"
import { naturalCompare, statusCounts, type StatusCounts } from "@/lib/inventory"
import type { ID, Project, ProjectType, PublishState, Unit } from "@/lib/types"
import { reraNumber } from "@/lib/validate"

export const VIEWS = ["all", "ongoing", "completed", "drafts", "archived"] as const
export type View = (typeof VIEWS)[number]
export const VIEW_LABEL: Record<View, string> = {
  all: "All",
  ongoing: "Ongoing",
  completed: "Completed",
  drafts: "Drafts",
  archived: "Archived",
}
export const parseView = (v: string | null): View => (VIEWS as readonly string[]).includes(v ?? "") ? (v as View) : "all"

export const SORT_LABEL = {
  order: "Display order",
  name: "Name",
  updated: "Recently updated",
  available: "Most available",
} as const
export type SortKey = keyof typeof SORT_LABEL

export interface ProjectRow {
  project: Project
  type: ProjectType
  /** null when the type has no inventory or no units exist yet. */
  counts: StatusCounts | null
  total: number
  /** -1 without inventory, so "Most available" puts those last. */
  available: number
  price: string
  /** Later of inventoryUpdatedAt and publishing.updatedAt, same rule as the dashboard. */
  updated: string
  search: string
}

const norm = (s: string) =>
  s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/** '–' (the empty-cell mark everywhere) instead of '₹0 / sq yd' for a fresh draft. */
export function priceText(p: Project) {
  if (!p.priceLabel?.trim() && p.price.mode !== "on_request" && !(p.price.amount > 0)) return "–"
  return formatPrice(p.price, p.priceLabel)
}

export function toRows(projects: Project[], units: Record<ID, Unit[]>): ProjectRow[] {
  return projects.map((project) => {
    const type = getProjectType(project.typeId)
    const list = units[project.id] ?? []
    const counts = type.hasInventory && list.length ? statusCounts(list) : null
    return {
      project,
      type,
      counts,
      total: counts ? list.length : 0,
      available: counts ? counts.available : -1,
      price: priceText(project),
      updated: [project.publishing.updatedAt, project.inventoryUpdatedAt ?? ""].sort().at(-1)!,
      search: norm(
        [project.name, project.displayName, project.location.short, project.location.full, reraNumber(project)]
          .filter(Boolean)
          .join(" "),
      ),
    }
  })
}

/** "All" and the lifecycle tabs leave archived projects out (archived = hidden from lists). */
export function inView(row: ProjectRow, view: View) {
  const { lifecycle, publishing } = row.project
  const archived = publishing.state === "archived"
  switch (view) {
    case "ongoing":
    case "completed":
      return !archived && lifecycle === view
    case "drafts":
      return publishing.state === "draft"
    case "archived":
      return archived
    default:
      return !archived
  }
}

/** Every word must appear in name, display name, location or RERA number. */
export function matchesQuery(row: ProjectRow, query: string) {
  const words = norm(query).split(" ").filter(Boolean)
  return words.every((w) => row.search.includes(w))
}

export const matchesFacets = (row: ProjectRow, types: string[], states: PublishState[]) =>
  (!types.length || types.includes(row.type.id)) && (!states.length || states.includes(row.project.publishing.state))

export function sortRows(rows: ProjectRow[], key: SortKey): ProjectRow[] {
  const order = (a: ProjectRow, b: ProjectRow) => a.project.publishing.sortOrder - b.project.publishing.sortOrder
  const cmp: Record<SortKey, (a: ProjectRow, b: ProjectRow) => number> = {
    order,
    name: (a, b) => naturalCompare(a.project.name, b.project.name),
    updated: (a, b) => b.updated.localeCompare(a.updated) || order(a, b),
    available: (a, b) => b.available - a.available || order(a, b),
  }
  return [...rows].sort(cmp[key])
}

export function countBy<T extends string>(rows: ProjectRow[], key: (r: ProjectRow) => T) {
  const out: Partial<Record<T, number>> = {}
  for (const r of rows) out[key(r)] = (out[key(r)] ?? 0) + 1
  return out
}
