// Pure helpers shared by the inventory views (grid, matrix, table, layout, sheet). No React here.
import { AREA_UNIT_LABEL, UNIT_STATUSES, UNIT_STATUS_META } from "@/lib/constants"
import { formatArea, formatDate, formatINR, formatINRCompact, formatNumber } from "@/lib/format"
import { unitPrice } from "@/lib/inventory"
import type { AreaUnit, Facing, Project, ProjectType, Unit, UnitStatus } from "@/lib/types"

export type InventoryView = "grid" | "table" | "layout"

export const FACINGS: Facing[] = [
  "North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West",
]

export const STATUS_BY_KEY: Record<string, UnitStatus> = Object.fromEntries(
  UNIT_STATUSES.map((s) => [UNIT_STATUS_META[s].key, s]),
)

/* ---------- filters (everything except status, which the legend owns) ---------- */

export interface UnitFilters {
  blocks: string[]          // '' = units without a block
  facings: Facing[]         // matches facing or facing2 (a corner plot facing East & South matches South)
  corner: "any" | "yes" | "no"
  areaMin?: number
  areaMax?: number
}

export const NO_FILTERS: UnitFilters = { blocks: [], facings: [], corner: "any" }

export function matchesFilters(u: Unit, f: UnitFilters): boolean {
  if (f.blocks.length && !f.blocks.includes(u.block ?? "")) return false
  if (f.facings.length && !f.facings.some((x) => x === u.facing || x === u.facing2)) return false
  if (f.corner === "yes" && !u.corner) return false
  if (f.corner === "no" && u.corner) return false
  if (f.areaMin != null && u.area < f.areaMin) return false
  if (f.areaMax != null && u.area > f.areaMax) return false
  return true
}

export const activeFilterCount = (f: UnitFilters) =>
  Number(f.blocks.length > 0) + Number(f.facings.length > 0) + Number(f.corner !== "any") +
  Number(f.areaMin != null || f.areaMax != null)

/** "East or South facing · Block A · Corner · 150–200 sq yd" */
export function describeFilters(f: UnitFilters, areaUnit: AreaUnit): string {
  const parts: string[] = []
  if (f.facings.length) parts.push(`${f.facings.join(" or ")} facing`)
  if (f.blocks.length) parts.push(f.blocks.map((b) => (b ? `Block ${b}` : "No block")).join(" or "))
  if (f.corner !== "any") parts.push(f.corner === "yes" ? "Corner" : "Not corner")
  if (f.areaMin != null || f.areaMax != null) {
    const u = AREA_UNIT_LABEL[areaUnit]
    parts.push(
      f.areaMin != null && f.areaMax != null ? `${formatNumber(f.areaMin)}–${formatNumber(f.areaMax)} ${u}`
        : f.areaMin != null ? `${formatNumber(f.areaMin)}+ ${u}` : `Up to ${formatNumber(f.areaMax!)} ${u}`,
    )
  }
  return parts.join(" · ")
}

/* ---------- names, ids, labels ---------- */

/** Unit ids are `${projectId}:${number}`; ids may hold spaces or slashes, which aria-activedescendant can't reference. */
export const tileDomId = (unitId: string) => `u-${unitId.replace(/[^\w:.-]/g, "_")}`
export const rowDomId = (unitId: string) => `r-${unitId.replace(/[^\w:.-]/g, "_")}`

export const unitName = (type: ProjectType, u: Pick<Unit, "number">) => `${type.unitNoun} ${u.number}`
export const nounFor = (type: ProjectType, n: number) =>
  (n === 1 ? type.unitNoun : type.unitNounPlural).toLowerCase()
export const countLabel = (type: ProjectType, n: number) => `${formatNumber(n)} ${nounFor(type, n)}`

export const isTowerType = (type: ProjectType) => type.unitFields.includes("tower")
export const floorLabel = (n: number | undefined) => (n == null ? "" : n === 0 ? "G" : String(n))

const AREA_WORDS: Record<AreaUnit, string> = {
  sq_yd: "square yards", sq_ft: "square feet", acre: "acres", gunta: "guntas",
}

/** "Plot 142, Available, 200 square yards, East facing, corner" */
export function unitAriaLabel(type: ProjectType, u: Unit): string {
  return [
    unitName(type, u),
    UNIT_STATUS_META[u.status].label,
    `${formatNumber(u.area)} ${AREA_WORDS[type.areaUnit]}`,
    u.bhk ? `${u.bhk} BHK` : "",
    u.facing ? `${u.facing} facing` : "",
    u.corner ? "corner" : "",
  ].filter(Boolean).join(", ")
}

/** Facing text: "East", "East & South (corner)". */
export function facingText(u: Unit): string {
  if (!u.facing) return ""
  const two = u.facing2 ? `${u.facing} & ${u.facing2}` : u.facing
  return u.corner ? `${two} (corner)` : two
}

export function roadText(u: Unit): string {
  if (!u.roadWidthFt) return ""
  return u.roadWidth2Ft ? `${u.roadWidthFt} ft & ${u.roadWidth2Ft} ft` : `${u.roadWidthFt} ft`
}

export function priceText(u: Unit, p: Project): string {
  const n = unitPrice(u, p)
  if (n == null) return ""
  return n >= 1e5 ? `${formatINR(n)} (${formatINRCompact(n)})` : formatINR(n)
}

/** Label/value rows for the hover card and the sheet summary. Same facts the table shows. */
export function unitFacts(u: Unit, type: ProjectType, p: Project): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = []
  if (u.tower) rows.push({ label: "Tower", value: `${u.tower} · Floor ${floorLabel(u.floor)}${u.bhk ? ` · ${u.bhk} BHK` : ""}` })
  if (u.block) rows.push({ label: "Block", value: u.block })
  const dims = u.widthFt && u.depthFt ? ` (${formatNumber(u.widthFt)} × ${formatNumber(u.depthFt)} ft)` : ""
  rows.push({
    label: "Area",
    value: u.carpetAreaSqFt
      ? `${formatArea(u.area, type.areaUnit)} SBA · ${formatNumber(u.carpetAreaSqFt)} carpet`
      : `${formatArea(u.area, type.areaUnit)}${dims}`,
  })
  if (u.builtUpAreaSqFt || u.bedrooms) {
    rows.push({
      label: "Villa",
      value: [u.builtUpAreaSqFt && `${formatNumber(u.builtUpAreaSqFt)} sq ft built-up`, u.bedrooms && `${u.bedrooms} bed`]
        .filter(Boolean).join(" · "),
    })
  }
  const facing = facingText(u)
  if (facing) rows.push({ label: "Facing", value: facing })
  const road = roadText(u)
  if (road) rows.push({ label: "Road", value: road })
  const price = priceText(u, p)
  if (price) rows.push({ label: "Price", value: price })
  rows.push({
    label: "Status",
    value: `${UNIT_STATUS_META[u.status].label}${u.statusDate ? ` since ${formatDate(u.statusDate)}` : ""}`,
  })
  return rows
}

/** Units grouped by block in natural order; one unnamed group when the project has no blocks. */
export function groupByBlock(sorted: Unit[]): { key: string; block: string | null; units: Unit[] }[] {
  if (!sorted.some((u) => u.block)) return [{ key: "all", block: null, units: sorted }]
  const map = new Map<string, Unit[]>()
  for (const u of sorted) {
    const k = u.block ?? ""
    const list = map.get(k)
    if (list) list.push(u)
    else map.set(k, [u])
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "en", { numeric: true })))
    .map(([k, units]) => ({ key: k || "none", block: k, units }))
}
