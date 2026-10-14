"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AREA_UNIT_LABEL, DEFAULT_PROJECT_TYPES, LIFECYCLE_META, LIFECYCLES, MAX_NAME } from "@/lib/constants"
import { SEED } from "@/lib/mock"
import { useDemo } from "@/lib/store"
import type { Lifecycle, ProjectType, UnitField } from "@/lib/types"
import { cn } from "@/lib/utils"

const FIELD_LABEL: Record<UnitField, string> = {
  block: "Block",
  dimensions: "Dimensions",
  facing: "Facing",
  roadWidth: "Road width",
  corner: "Corner",
  builtUpArea: "Built-up area",
  bedrooms: "Bedrooms",
  tower: "Tower",
  floor: "Floor",
  bhk: "BHK",
  carpetArea: "Carpet area",
}

/** First real (non-sample) seed project of each type, ongoing before completed: "Like Global City VI". */
const EXAMPLE: Record<string, string | undefined> = Object.fromEntries(
  DEFAULT_PROJECT_TYPES.map((t) => [
    t.id,
    SEED.projects
      .filter((p) => p.typeId === t.id && !p.sample)
      .sort((a, b) => Number(a.lifecycle !== "ongoing") - Number(b.lifecycle !== "ongoing") || a.publishing.sortOrder - b.publishing.sortOrder)[0]
      ?.name,
  ]),
)

/** Neutral selected state (bg-accent + ring), never the primary fill: primary navy reads as "Registered". */
const OPTION =
  "relative flex cursor-pointer gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 has-data-checked:border-ring has-data-checked:bg-accent has-data-checked:ring-1 has-data-checked:ring-ring has-focus-visible:border-ring has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background"

function TypeOption({ type }: { type: ProjectType }) {
  const id = `new-project-type-${type.id}`
  const example = EXAMPLE[type.id]
  const chips = type.hasInventory
    ? [`${type.areaLabel} (${AREA_UNIT_LABEL[type.areaUnit]})`, ...type.unitFields.map((f) => FIELD_LABEL[f]), ...(type.hasConfigurations ? ["Configurations"] : [])]
    : []
  return (
    <label htmlFor={id} className={OPTION}>
      <RadioGroupItem id={id} value={type.id} aria-labelledby={`${id}-name`} aria-describedby={`${id}-desc`} className="mt-0.5" />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-col">
          <span id={`${id}-name`} className="text-sm font-semibold">
            {type.name}
          </span>
          <span id={`${id}-desc`} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {type.hasInventory ? `Sold as ${type.unitNounPlural.toLowerCase()}` : "Listing and detail page"}
            </span>
            <span className="text-[13px]/5">{type.description}</span>
          </span>
        </span>
        {chips.length > 0 && <span className="text-xs text-muted-foreground">{chips.join(" · ")}</span>}
        <span className="mt-auto text-xs text-muted-foreground">
          {example ? (
            <>
              Like <span className="font-medium text-foreground">{example}</span>
            </>
          ) : (
            "No GIP project of this type yet"
          )}
        </span>
      </span>
    </label>
  )
}

export function CreateProjectForm() {
  const router = useRouter()
  const { state, actions } = useDemo()
  const [name, setName] = React.useState("")
  const [typeId, setTypeId] = React.useState("")
  const [lifecycle, setLifecycle] = React.useState<Lifecycle>("ongoing")
  const [submitted, setSubmitted] = React.useState(false)
  const nameRef = React.useRef<HTMLInputElement>(null)
  const typesRef = React.useRef<HTMLDivElement>(null)

  const trimmed = name.trim()
  const clash = state.projects.find((p) => p.name.trim().toLowerCase() === trimmed.toLowerCase())
  const nameError = !trimmed
    ? "Enter a project name."
    : trimmed.length > MAX_NAME
      ? `Keep the name under ${MAX_NAME} characters.`
      : clash
        ? `There is already a project called ${clash.name}. Use a different name.`
        : ""
  const typeError = typeId ? "" : "Choose a project type."
  const showName = submitted && nameError
  const showType = submitted && typeError

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (nameError) return nameRef.current?.focus()
    if (typeError) return typesRef.current?.querySelector<HTMLButtonElement>("button[role=radio]")?.focus()
    const id = actions.createProject({ name: trimmed, typeId, lifecycle })
    toast.success("Draft created", { description: trimmed })
    // Next keeps this route mounted while hidden; start clean next time.
    setName("")
    setTypeId("")
    setLifecycle("ongoing")
    setSubmitted(false)
    router.push(`/projects/${id}`)
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-[1040px] flex-col gap-8">
      <div className="grid max-w-md gap-1.5">
        <Label htmlFor="new-project-name">Project name</Label>
        <Input
          ref={nameRef}
          id="new-project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          aria-required
          aria-invalid={!!showName}
          aria-describedby="new-project-name-help"
          placeholder="e.g. Global City VI"
          className="h-9"
        />
        <p id="new-project-name-help" className={cn("text-xs", showName ? "text-destructive" : "text-muted-foreground")}>
          {showName || "As buyers see it. You can change it later."}
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        {/* A rendered legend sits outside the fieldset's flex gap, so it carries its helper text and its own margin. */}
        <legend className="mb-1.5 block">
          <span id="new-project-type-legend" className="block text-sm font-medium">
            Project type
          </span>
          <span id="new-project-type-help" className="mt-1 block text-xs text-muted-foreground">
            Sets the unit fields, the area unit and how prices are entered.
          </span>
        </legend>
        <RadioGroup
          ref={typesRef}
          value={typeId}
          onValueChange={setTypeId}
          aria-labelledby="new-project-type-legend"
          aria-describedby={showType ? "new-project-type-error" : "new-project-type-help"}
          aria-required
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {DEFAULT_PROJECT_TYPES.map((t) => (
            <TypeOption key={t.id} type={t} />
          ))}
        </RadioGroup>
        {showType && (
          <p id="new-project-type-error" className="text-xs text-destructive">
            {typeError}
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend id="new-project-lifecycle-legend" className="mb-1.5 block text-sm font-medium">
          Lifecycle
        </legend>
        <RadioGroup
          value={lifecycle}
          onValueChange={(v) => setLifecycle(v as Lifecycle)}
          aria-labelledby="new-project-lifecycle-legend"
          className="grid gap-3 sm:grid-cols-3"
        >
          {LIFECYCLES.map((l) => (
            <label key={l} htmlFor={`new-project-lifecycle-${l}`} className={cn(OPTION, "p-3")}>
              <RadioGroupItem
                id={`new-project-lifecycle-${l}`}
                value={l}
                aria-describedby={`new-project-lifecycle-${l}-desc`}
                className="mt-0.5"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{LIFECYCLE_META[l].label}</span>
                <span id={`new-project-lifecycle-${l}-desc`} className="text-xs text-muted-foreground">
                  {LIFECYCLE_META[l].description}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-6">
        <p className="mr-auto text-xs text-muted-foreground">Starts as a draft. Nothing goes on the website until you publish.</p>
        <Button variant="outline" size="lg" asChild>
          <Link href="/projects">Cancel</Link>
        </Button>
        <Button type="submit" size="lg">
          Create draft
        </Button>
      </div>
    </form>
  )
}
