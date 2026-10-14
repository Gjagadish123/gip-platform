"use client"

import * as React from "react"
import { ListPlus } from "lucide-react"

import { AREA_UNIT_LABEL, ICONS } from "@/lib/constants"
import { formatLandArea, formatNumber } from "@/lib/format"
import { sizeRange } from "@/lib/inventory"
import type { IconKey, LayoutStat, Project, ProjectType, Unit } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldGrid, FieldRow, IconPicker, ListEditor, TEXTAREA_3_ROWS } from "@/components/form"
import { fieldIssues, newId, type SectionProps } from "../section-types"
import { ContentSection, FieldGroup, FixedRow, MediaLink, SubField, ariaFor } from "./media-section"

const MAX_STATS = 4
const STAT_ICONS: IconKey[] = ["plots", "totalArea", "roads", "greenSpaces"]
type ProposedStat = Omit<LayoutStat, "id">

/** Stats the project's own facts support: unit count + size range, land area, internal road widths. */
function proposeStats(p: Project, type: ProjectType, units: Unit[]): ProposedStat[] {
  const out: ProposedStat[] = []
  const count = units.length || p.totalUnits || 0
  const range = units.length ? sizeRange(units, type.areaUnit) : (p.unitSize ?? null)
  const sizes =
    range &&
    (range.label?.trim() ||
      (range.min === range.max
        ? formatNumber(range.min)
        : `${formatNumber(range.min)}–${formatNumber(range.max)}`))
  const per = AREA_UNIT_LABEL[range?.unit ?? type.areaUnit]

  if (count) {
    out.push({
      icon: "plots",
      value: formatNumber(count),
      label: sizes ? `${type.unitNounPlural}, ${sizes} ${per}` : type.unitNounPlural,
    })
  } else if (sizes) {
    out.push({ icon: "plots", value: sizes, label: `${type.unitNoun} sizes (${per})` })
  }
  if (p.landArea?.acres) {
    out.push({ icon: "totalArea", value: formatLandArea(p.landArea), label: "Total project area" })
  }
  const widths = [
    ...new Set(units.flatMap((u) => [u.roadWidthFt, u.roadWidth2Ft]).filter((w): w is number => !!w)),
  ].sort((a, b) => b - a)
  if (widths.length) {
    out.push({
      icon: "roads",
      value: widths.length > 3 ? `${widths[widths.length - 1]}–${widths[0]} ft` : `${widths.join(" / ")} ft`,
      label: "Internal roads",
    })
  }
  return out
}

export function MasterPlanSection({ draft, type, units, issues, update }: SectionProps) {
  const mp = draft.masterPlan
  const base = `${draft.id}--masterplan`
  const description = fieldIssues(issues, "masterPlan.description")
  const stats = fieldIssues(issues, "masterPlan.stats")
  const n = mp.stats.length
  const [proposing, setProposing] = React.useState(false)
  const proposal = proposing ? proposeStats(draft, type, units) : []
  const hasFacts = units.length > 0 || !!draft.totalUnits || !!draft.unitSize || !!draft.landArea?.acres

  function newStat(): LayoutStat {
    const used = new Set(mp.stats.map((s) => s.icon))
    return { id: newId("st"), icon: STAT_ICONS.find((k) => !used.has(k)) ?? "plots", value: "", label: "" }
  }

  function apply() {
    update((d) => {
      d.masterPlan.stats = proposal.map((s) => ({ ...s, id: newId("st") }))
    })
    setProposing(false)
  }

  return (
    <ContentSection
      draft={draft}
      section="masterplan"
      title="Master plan"
      description={
        <>
          Title, description and key figures above the plan. The plan file and brochure are in{" "}
          <MediaLink projectId={draft.id} label="Media" />.
        </>
      }
      issues={issues}
      shown={["masterPlan.title", "masterPlan.description", "masterPlan.stats"]}
    >
      <FieldGrid>
        <FieldRow label="Title" optional htmlFor={`${base}-title`} description="Leave empty to use the default.">
          <Input
            id={`${base}-title`}
            className="h-9"
            value={mp.title}
            placeholder="Master Plan"
            onChange={(e) =>
              update((d) => {
                d.masterPlan.title = e.target.value
              })
            }
            {...ariaFor(`${base}-title`, { description: true })}
          />
        </FieldRow>
        <FixedRow label="Label above the title">Layout</FixedRow>
      </FieldGrid>

      <FieldRow
        label="Description"
        optional
        htmlFor={`${base}-description`}
        description="Leave empty to use the default."
        {...description}
      >
        <Textarea
          id={`${base}-description`}
          rows={3}
          className={TEXTAREA_3_ROWS}
          value={mp.description}
          placeholder="A thoughtfully designed layout featuring wide roads, ample green spaces, and premium plots optimized for comfortable living."
          onChange={(e) =>
            update((d) => {
              d.masterPlan.description = e.target.value
            })
          }
          {...ariaFor(`${base}-description`, { description: true, ...description })}
        />
      </FieldRow>

      <FieldGroup
        id={`${base}-stats`}
        label="Layout stats"
        level="W"
        count={`${n} of ${MAX_STATS}`}
        description="3–4 tiles. The value is the large text, the label the caption under it."
        {...stats}
      >
        {!proposing && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" disabled={!hasFacts} onClick={() => setProposing(true)}>
              <ListPlus aria-hidden />
              Fill from project facts
            </Button>
            {!hasFacts && (
              <span className="text-xs text-muted-foreground">Add the land area or inventory first.</span>
            )}
          </div>
        )}

        {proposing && (
          <div
            role="region"
            aria-labelledby={`${base}-proposal`}
            className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-4"
          >
            <div className="flex flex-col gap-1">
              <p id={`${base}-proposal`} className="text-sm font-medium">
                From project facts
              </p>
              <p className="text-xs text-muted-foreground">
                {n ? `Replaces the ${n} current ${n === 1 ? "stat" : "stats"}. ` : ""}You can edit them after.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-3">
              {proposal.map((s) => {
                const Icon = ICONS[s.icon]
                return (
                  <li key={s.icon} className="flex min-w-0 items-start gap-2">
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tabular-nums">{s.value}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{s.label}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={apply}>
                {n ? "Replace stats" : "Add stats"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setProposing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <ListEditor
          value={mp.stats}
          onChange={(next) =>
            update((d) => {
              d.masterPlan.stats = next
            })
          }
          create={newStat}
          max={MAX_STATS}
          noun="stat"
          itemLabel={(s) => s.label || s.value}
          emptyTitle="No layout stats yet"
          emptyDescription="Use Fill from project facts, or add plot sizes, total area and road widths yourself."
          renderItem={(item, { update: patch }) => {
            const id = `${base}-s-${item.id}`
            return (
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.5fr)]">
                <SubField label="Icon" htmlFor={`${id}-icon`}>
                  <IconPicker id={`${id}-icon`} compact value={item.icon} onChange={(icon) => patch({ icon })} />
                </SubField>
                <SubField label="Value" htmlFor={`${id}-value`}>
                  <Input
                    id={`${id}-value`}
                    className="h-9 tabular-nums"
                    value={item.value}
                    placeholder="22 acres"
                    onChange={(e) => patch({ value: e.target.value })}
                  />
                </SubField>
                <SubField label="Label" htmlFor={`${id}-label`} className="col-span-2 sm:col-span-1">
                  <Input
                    id={`${id}-label`}
                    className="h-9"
                    value={item.label}
                    placeholder="Total project area"
                    onChange={(e) => patch({ label: e.target.value })}
                  />
                </SubField>
              </div>
            )
          }}
        />
      </FieldGroup>

      <FixedRow label="Button under the plan">Download Brochure</FixedRow>
    </ContentSection>
  )
}
