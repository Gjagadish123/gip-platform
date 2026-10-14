import type { FieldIssueProps } from "@/components/form"
import type { SectionId } from "@/lib/constants"
import type { ID, Project, ProjectType, Unit } from "@/lib/types"
import type { Issue } from "@/lib/validate"

/**
 * An issue as the form shows it. `pending`: a required gap on a draft nobody has tried to publish and whose field
 * hasn't been visited yet. It renders calm ("To do before publishing") instead of red.
 */
export type ShownIssue = Issue & { pending?: boolean }

/** Props every editor section receives (spec §2). `update` = structuredClone + mutate. */
export type SectionProps = {
  draft: Project
  type: ProjectType
  units: Unit[]
  issues: ShownIssue[]
  update: (recipe: (d: Project) => void) => void
}

/** DOM id of a section. Per project, because Next keeps hidden routes mounted (two editors can coexist). */
export const sectionDomId = (projectId: ID, section: SectionId | "page-content") => `${projectId}--${section}`

/** DOM id of the Details route tab (focus lands there when the save bar unmounts). */
export const detailsTabId = (projectId: ID) => `${projectId}--tab-details`

/**
 * FieldRow props for one field's issues: required → `error` (or `todo` while pending), recommended → `warning`,
 * plus `issueField` so blurring the row reveals its error. `prefix: true` also matches nested fields
 * ("legal.approvals" matches "legal.approvals.<id>").
 */
export function fieldIssues(issues: ShownIssue[], field: string, prefix = false): FieldIssueProps {
  const hits = issues.filter((i) => i.field === field || (prefix && i.field.startsWith(`${field}.`)))
  const pick = (keep: (i: ShownIssue) => boolean) =>
    hits
      .filter(keep)
      .map((i) => i.message)
      .join(" ") || undefined
  return {
    error: pick((i) => i.level === "required" && !i.pending),
    todo: pick((i) => i.level === "required" && !!i.pending),
    warning: pick((i) => i.level === "recommended"),
    issueField: field,
  }
}

/** Ids for rows added in the editor. Call only from event handlers (cacheComponents: no clock/random in render). */
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
