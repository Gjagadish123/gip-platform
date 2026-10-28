// Field rhythm adapted from 21st.dev: ephraimduncan/form-layout (demo 4348): 6-column field grid, pairs at sm.
"use client"

import * as React from "react"

import { CharCount, FieldRow, TagInput, describedBy } from "@/components/form"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AREA_UNIT_LABEL, DEFAULT_PROJECT_TYPES, LIFECYCLES, LIFECYCLE_META, MAX_NAME } from "@/lib/constants"
import { plural } from "@/lib/format"
import type { Lifecycle, ProjectType, UnitField } from "@/lib/types"
import { hasDetailPage } from "@/lib/validate"

import { fieldIssues, sectionDomId, type SectionProps } from "../section-types"

const UNIT_FIELD_LABEL: Record<UnitField, string> = {
  block: "block",
  dimensions: "dimensions",
  facing: "facing",
  roadWidth: "road width",
  corner: "corner",
  builtUpArea: "built-up area",
  bedrooms: "bedrooms",
  tower: "tower",
  floor: "floor",
  bhk: "BHK",
  carpetArea: "carpet area",
}

const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`)

/** What changes when the project type changes (shown before the change is applied). */
function typeChangeNotes(from: ProjectType, to: ProjectType, unitCount: number): string[] {
  const units = plural(unitCount, from.unitNoun.toLowerCase(), from.unitNounPlural.toLowerCase())
  const notes: string[] = []
  if (!to.hasInventory) {
    notes.push(
      unitCount
        ? `${to.name} has no inventory, so the Inventory tab is hidden. The ${units} are kept, not deleted.`
        : `${to.name} has no inventory, so the Inventory tab is hidden.`,
    )
  } else {
    const added = to.unitFields.filter((f) => !from.unitFields.includes(f)).map((f) => UNIT_FIELD_LABEL[f])
    const removed = from.unitFields.filter((f) => !to.unitFields.includes(f)).map((f) => UNIT_FIELD_LABEL[f])
    if (!from.hasInventory) notes.push("The Inventory tab appears.")
    if (added.length) notes.push(`Inventory adds ${list(added)}.`)
    if (removed.length) notes.push(`Inventory hides ${list(removed)}${unitCount ? "; values already entered are kept" : ""}.`)
    if (from.unitNounPlural !== to.unitNounPlural) {
      notes.push(`Units are called ${to.unitNounPlural.toLowerCase()} instead of ${from.unitNounPlural.toLowerCase()}.`)
    }
    if (from.areaUnit !== to.areaUnit) {
      notes.push(`${to.areaLabel} is in ${AREA_UNIT_LABEL[to.areaUnit]}. Existing areas are not converted.`)
    }
  }
  if (from.hasConfigurations !== to.hasConfigurations) {
    notes.push(to.hasConfigurations ? "Pricing gains a configurations list." : "Pricing hides the configurations list.")
  }
  if (from.priceMode !== to.priceMode) {
    notes.push(`${to.name} are usually priced ${to.priceMode === "total" ? "as a total" : `per ${AREA_UNIT_LABEL[to.areaUnit]}`}. Check Pricing.`)
  }
  return notes
}

const toYear = (v: string) => (v.trim() === "" ? undefined : Math.trunc(Number(v)) || undefined)

export function OverviewSection({ draft, type, units, issues, update }: SectionProps) {
  const sid = sectionDomId(draft.id, "overview")
  const fid = (f: string) => `${draft.id}-${f}`
  const [pendingType, setPendingType] = React.useState<ProjectType | null>(null)
  React.useEffect(() => () => setPendingType(null), []) // close when the route is hidden

  const name = fieldIssues(issues, "name")
  const description = fieldIssues(issues, "description")
  const highlights = fieldIssues(issues, "highlights")
  const completion = fieldIssues(issues, "completionYear")
  const completed = draft.lifecycle === "completed"
  const detail = hasDetailPage(draft)

  return (
    <section id={sid} aria-labelledby={`${sid}-h`} className="scroll-mt-32 lg:scroll-mt-[72px]">
      <h2 id={`${sid}-h`} className="text-base font-semibold">
        Overview
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">What the project is called, what it sells, and the story in its hero.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-6">
        <FieldRow
          className="sm:col-span-3"
          label="Name"
          required
          htmlFor={fid("name")}
          description="Natural case, e.g. Global City VI. Cards show it in capitals."
          {...name}
        >
          <Input
            id={fid("name")}
            className="h-9"
            value={draft.name}
            maxLength={MAX_NAME}
            aria-invalid={!!name.error || undefined}
            aria-describedby={describedBy(fid("name"), { description: true, ...name })}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.name = v
              })
            }}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-3"
          label="Hero title"
          optional
          htmlFor={fid("displayName")}
          description="Detail page heading. Leave empty to use the name."
        >
          <Input
            id={fid("displayName")}
            className="h-9"
            value={draft.displayName ?? ""}
            placeholder={draft.name}
            aria-describedby={`${fid("displayName")}-description`}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.displayName = v || undefined
              })
            }}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-3"
          label="Project type"
          required
          htmlFor={fid("type")}
          description={`${type.description ?? ""} ${type.hasInventory ? `Inventory of ${type.unitNounPlural.toLowerCase()}.` : "No inventory."} Website category: ${type.category}.`.trim()}
        >
          <Select
            value={draft.typeId}
            onValueChange={(v) => {
              const next = DEFAULT_PROJECT_TYPES.find((t) => t.id === v)
              if (next && next.id !== draft.typeId) setPendingType(next)
            }}
          >
            <SelectTrigger id={fid("type")} className="w-full data-[size=default]:h-9" aria-describedby={`${fid("type")}-description`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {DEFAULT_PROJECT_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow
          className="sm:col-span-3"
          label="Type label"
          optional
          htmlFor={fid("typeLabel")}
          description="Badge on the listing card. Leave empty to use the type name."
        >
          <Input
            id={fid("typeLabel")}
            className="h-9"
            value={draft.typeLabel ?? ""}
            placeholder={type.name}
            aria-describedby={`${fid("typeLabel")}-description`}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.typeLabel = v || undefined
              })
            }}
          />
        </FieldRow>

        <FieldRow className="sm:col-span-6" label="Lifecycle" required description={
            draft.lifecycle === "ongoing" && draft.publishing.externalUrl
              ? "Selling now. The card opens the external website, so there is no detail page."
              : LIFECYCLE_META[draft.lifecycle].description
          }>
          <ToggleGroup
            type="single"
            variant="outline"
            size="lg"
            spacing={0}
            aria-label="Lifecycle"
            value={draft.lifecycle}
            onValueChange={(v) => v && update((d) => {
              d.lifecycle = v as Lifecycle
            })}
          >
            {LIFECYCLES.map((l) => (
              <ToggleGroupItem key={l} value={l} className="px-4">
                {LIFECYCLE_META[l].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldRow>

        <FieldRow
          className="sm:col-span-6"
          label="Description"
          required={detail}
          htmlFor={fid("description")}
          description="Hero paragraph and search-result text. Keep prices out of it; they live in Pricing."
          {...description}
        >
          <CharCount
            id={fid("description")}
            max={320}
            value={draft.description}
            invalid={!!description.error}
            aria-describedby={describedBy(fid("description"), { description: true, ...description })}
            onChange={(v) => update((d) => {
              d.description = v
            })}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-6"
          label="Highlights"
          mark="Recommended"
          htmlFor={fid("highlights")}
          description="3 to 8 short points, e.g. 100 ft road facing. Enter or comma adds one."
          {...highlights}
        >
          <TagInput
            id={fid("highlights")}
            value={draft.highlights}
            maxTags={8}
            placeholder="Add a highlight"
            aria-describedby={describedBy(fid("highlights"), { description: true, ...highlights })}
            onChange={(next) => update((d) => {
              d.highlights = next
            })}
          />
        </FieldRow>

        <FieldRow className="sm:col-span-3" label="Launch year" optional htmlFor={fid("launchYear")}>
          <Input
            id={fid("launchYear")}
            type="number"
            inputMode="numeric"
            min={1990}
            max={2100}
            className="h-9 max-w-40 tabular-nums"
            value={draft.launchYear ?? ""}
            placeholder="2024"
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.launchYear = toYear(v)
              })
            }}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-3"
          label="Completion year"
          mark={completed ? "Recommended" : "Optional"}
          htmlFor={fid("completionYear")}
          {...completion}
        >
          <Input
            id={fid("completionYear")}
            type="number"
            inputMode="numeric"
            min={1990}
            max={2100}
            className="h-9 max-w-40 tabular-nums"
            aria-describedby={describedBy(fid("completionYear"), completion)}
            value={draft.completionYear ?? ""}
            placeholder={completed ? "2022" : "Expected"}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.completionYear = toYear(v)
              })
            }}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-6"
          label="Progress note"
          optional
          htmlFor={fid("progressNote")}
          description="One line on construction progress, e.g. 6 villas under construction."
        >
          <Input
            id={fid("progressNote")}
            className="h-9"
            value={draft.progressNote ?? ""}
            aria-describedby={`${fid("progressNote")}-description`}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.progressNote = v || undefined
              })
            }}
          />
        </FieldRow>
      </div>

      <AlertDialog open={pendingType !== null} onOpenChange={(o) => !o && setPendingType(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Change type to {pendingType?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Applies when you save. Nothing is deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          {pendingType && (
            <ul className="flex list-disc flex-col gap-1 ps-5 text-sm">
              {typeChangeNotes(type, pendingType, units.length).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep {type.name}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const next = pendingType
                if (next) update((d) => {
                  d.typeId = next.id
                })
              }}
            >
              Change type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
