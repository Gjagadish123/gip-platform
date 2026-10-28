// Field rhythm adapted from 21st.dev: ephraimduncan/form-layout (demo 4348): 6-column field grid, pairs at sm.
"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import {
  FieldMessages,
  FieldRow,
  FixedOnWebsiteHint,
  IconPicker,
  ListEditor,
  TEXTAREA_3_ROWS,
  describedBy,
} from "@/components/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LOCATION_AREAS } from "@/lib/constants"
import type { Distance, LocationCategory, NearbyPlace, Project } from "@/lib/types"
import { hasDetailPage } from "@/lib/validate"

import { fieldIssues, newId, sectionDomId, type SectionProps } from "../section-types"
import { MediaLink } from "./media-section"

const NO_AREA = "__none"

/** "17.535588, 78.145298" → pin; "" → undefined; anything else → null (invalid). */
function parsePin(text: string): Project["location"]["pin"] | null | undefined {
  if (!text.trim()) return undefined
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text)
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
}
const pinText = (pin: Project["location"]["pin"]) => (pin ? `${pin.lat}, ${pin.lng}` : "")

export function LocationSection({ draft, issues, update }: SectionProps) {
  const sid = sectionDomId(draft.id, "location")
  const fid = (f: string) => `${draft.id}-${f}`
  const loc = draft.location
  const adv = draft.locationAdvantages
  const detail = hasDetailPage(draft)
  const iss = (f: string) => fieldIssues(issues, f)

  const text = (field: keyof Pick<Project["location"], "short" | "full" | "village" | "mandal" | "district" | "state">, optional = false) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      update((d) => {
        d.location[field] = (optional ? v || undefined : v) as string
      })
    }

  const short = iss("location.short")
  const full = iss("location.full")
  const district = iss("location.district")
  const state = iss("location.state")
  const area = iss("location.areaId")
  const badge = iss("locationAdvantages.badge")
  const categories = iss("locationAdvantages.categories")

  return (
    <section id={sid} aria-labelledby={`${sid}-h`} className="scroll-mt-32 lg:scroll-mt-[72px]">
      <h2 id={`${sid}-h`} className="text-base font-semibold">
        Location
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Where the project is, and the nearby places that sell it.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-6">
        <FieldRow
          className="sm:col-span-6"
          label="Short location"
          required
          htmlFor={fid("loc-short")}
          description="On listing cards, e.g. Peddapur, Sangareddy District, Hyderabad."
          {...short}
        >
          <Input
            id={fid("loc-short")}
            className="h-9"
            value={loc.short}
            aria-invalid={!!short.error || undefined}
            aria-describedby={describedBy(fid("loc-short"), { description: true, ...short })}
            onChange={text("short")}
          />
        </FieldRow>
        <FieldRow
          className="sm:col-span-6"
          label="Full location"
          required={detail}
          htmlFor={fid("loc-full")}
          description="Under the title in the detail page hero."
          {...full}
        >
          <Input
            id={fid("loc-full")}
            className="h-9"
            value={loc.full}
            placeholder={loc.short}
            aria-invalid={!!full.error || undefined}
            aria-describedby={describedBy(fid("loc-full"), { description: true, ...full })}
            onChange={text("full")}
          />
        </FieldRow>

        <FieldRow className="sm:col-span-3" label="Village" optional htmlFor={fid("loc-village")}>
          <Input id={fid("loc-village")} className="h-9" value={loc.village ?? ""} onChange={text("village", true)} />
        </FieldRow>
        <FieldRow className="sm:col-span-3" label="Mandal" optional htmlFor={fid("loc-mandal")}>
          <Input id={fid("loc-mandal")} className="h-9" value={loc.mandal ?? ""} onChange={text("mandal", true)} />
        </FieldRow>
        <FieldRow className="sm:col-span-3" label="District" required={detail} htmlFor={fid("loc-district")} {...district}>
          <Input
            id={fid("loc-district")}
            className="h-9"
            value={loc.district}
            aria-invalid={!!district.error || undefined}
            aria-describedby={describedBy(fid("loc-district"), district)}
            onChange={text("district")}
          />
        </FieldRow>
        <FieldRow className="sm:col-span-3" label="State" required={detail} htmlFor={fid("loc-state")} {...state}>
          <Input
            id={fid("loc-state")}
            className="h-9"
            value={loc.state}
            placeholder="Telangana"
            aria-invalid={!!state.error || undefined}
            aria-describedby={describedBy(fid("loc-state"), state)}
            onChange={text("state")}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-3"
          label="Filter area"
          mark="Recommended"
          htmlFor={fid("loc-area")}
          description="The location filter on the projects page."
          {...area}
        >
          <Select
            value={loc.areaId ?? NO_AREA}
            onValueChange={(v) =>
              update((d) => {
                d.location.areaId = v === NO_AREA ? undefined : v
              })
            }
          >
            <SelectTrigger
              id={fid("loc-area")}
              className="w-full data-[size=default]:h-9"
              aria-describedby={describedBy(fid("loc-area"), { description: true, ...area })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={NO_AREA}>None</SelectItem>
              {LOCATION_AREAS.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <PinField key={draft.id} idBase={fid("loc-pin")} pin={loc.pin} update={update} />
      </div>

      <h3 className="mt-8 text-sm font-semibold">Location advantages</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Nearby places, grouped by category, beside the location photo. <MediaLink projectId={draft.id} />
      </p>
      <FixedOnWebsiteHint className="mt-2">Locations</FixedOnWebsiteHint>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
        <FieldRow
          className="sm:col-span-3"
          label="Heading"
          optional
          htmlFor={fid("adv-title")}
          description="Empty shows the website default."
        >
          <Input
            id={fid("adv-title")}
            className="h-9"
            value={adv.title}
            placeholder="Strategic Location Advantages"
            aria-describedby={`${fid("adv-title")}-description`}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.locationAdvantages.title = v
              })
            }}
          />
        </FieldRow>
        <FieldRow
          className="sm:col-span-3"
          label="Badge"
          mark="Recommended"
          htmlFor={fid("adv-badge")}
          description="On the photo, under the fixed label “Prime Location”."
          {...badge}
        >
          <Input
            id={fid("adv-badge")}
            className="h-9"
            value={adv.badge}
            placeholder="Near Mumbai Highway"
            aria-describedby={describedBy(fid("adv-badge"), { description: true, ...badge })}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.locationAdvantages.badge = v
              })
            }}
          />
        </FieldRow>
        <FieldRow
          className="sm:col-span-6"
          label="Description"
          optional
          htmlFor={fid("adv-description")}
          description="Empty shows the website default."
          {...iss("locationAdvantages.description")}
        >
          <Textarea
            id={fid("adv-description")}
            rows={3}
            className={TEXTAREA_3_ROWS}
            value={adv.description}
            placeholder="Perfectly positioned at the intersection of growth corridors…"
            aria-describedby={describedBy(fid("adv-description"), {
              description: true,
              ...iss("locationAdvantages.description"),
            })}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.locationAdvantages.description = v
              })
            }}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-6"
          label="Categories"
          mark="Recommended"
          description="Each category becomes a card. A category needs at least one place."
          {...categories}
        >
          <ListEditor<LocationCategory>
            value={adv.categories}
            noun="category"
            itemLabel={(c) => c.title}
            emptyTitle="No categories yet"
            emptyDescription="Start with Connectivity, Education, Employment or Healthcare."
            create={() => ({ id: newId("loc"), icon: "connectivity", title: "", places: [] })}
            onChange={(next) =>
              update((d) => {
                d.locationAdvantages.categories = next
              })
            }
            renderItem={(c, h) => {
              const empty = fieldIssues(issues, `locationAdvantages.categories.${c.id}`)
              const cid = `${draft.id}-cat-${c.id}`
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-end gap-2">
                    <IconPicker
                      compact
                      id={`${cid}-icon`}
                      aria-label="Category icon"
                      value={c.icon}
                      onChange={(icon) => h.update({ icon })}
                    />
                    <FieldRow className="flex-1" label="Category" htmlFor={`${cid}-title`}>
                      <Input
                        id={`${cid}-title`}
                        className="h-9"
                        value={c.title}
                        placeholder="Connectivity"
                        onChange={(e) => h.update({ title: e.target.value })}
                      />
                    </FieldRow>
                  </div>
                  <ListEditor<NearbyPlace>
                    value={c.places}
                    noun="place"
                    itemLabel={(pl) => pl.name}
                    emptyTitle="No places yet"
                    emptyDescription="An empty category shows as an empty card on the website."
                    create={() => ({ id: newId("place"), name: "", distance: { value: 0, unit: "km" } })}
                    onChange={(places) => h.update({ places })}
                    renderItem={(pl, ph) => (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          aria-label="Place"
                          className="h-9 min-w-40 flex-1"
                          value={pl.name}
                          placeholder="GITAM University"
                          onChange={(e) => ph.update({ name: e.target.value })}
                        />
                        <DistanceInput value={pl.distance} onChange={(distance) => ph.update({ distance })} />
                      </div>
                    )}
                  />
                  <FieldMessages id={cid} {...empty} />
                </div>
              )
            }}
          />
        </FieldRow>
      </div>
    </section>
  )
}

/** One box for "lat, lng" (what Google Maps copies). Local text so half-typed numbers aren't rewritten. */
function PinField({
  idBase,
  pin,
  update,
}: {
  idBase: string
  pin: Project["location"]["pin"]
  update: SectionProps["update"]
}) {
  const stored = pinText(pin)
  const [text, setText] = React.useState(stored)
  const [synced, setSynced] = React.useState(stored)
  if (stored !== synced) {
    // Changed outside this box (discard, undo): show the stored value.
    setSynced(stored)
    setText(stored)
  }
  const parsed = parsePin(text)
  const invalid = parsed === null

  return (
    <FieldRow
      className="sm:col-span-3"
      label="Map pin"
      optional
      htmlFor={idBase}
      description={invalid ? undefined : "Latitude, longitude. In Google Maps, right-click the site to copy them."}
      error={invalid ? "Enter latitude and longitude, e.g. 17.535588, 78.145298." : undefined}
      aside={
        pin ? (
          <a
            href={`https://www.google.com/maps?q=${pin.lat},${pin.lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 rounded-sm text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open in Google Maps
            <ArrowUpRight aria-hidden className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null
      }
    >
      <Input
        id={idBase}
        className="h-9 tabular-nums"
        inputMode="decimal"
        value={text}
        placeholder="17.535588, 78.145298"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(idBase, { description: !invalid, error: invalid })}
        onChange={(e) => {
          const v = e.target.value
          setText(v)
          const next = parsePin(v)
          if (next === null) return
          setSynced(pinText(next))
          update((d) => {
            d.location.pin = next
          })
        }}
      />
    </FieldRow>
  )
}

const DISTANCE_UNITS = [
  { value: "km", label: "km" },
  { value: "m", label: "m" },
  { value: "min", label: "min" },
  { value: "text", label: "Text" },
] as const

/** Number + unit, or free text ("Nearby", "Adjacent"). */
function DistanceInput({ value, onChange }: { value: Distance; onChange: (next: Distance) => void }) {
  const mode = "text" in value ? "text" : value.unit
  return (
    <div className="flex gap-2">
      {"text" in value ? (
        <Input
          aria-label="Distance"
          className="h-9 w-28"
          value={value.text}
          placeholder="Nearby"
          onChange={(e) => onChange({ text: e.target.value })}
        />
      ) : (
        <Input
          aria-label={`Distance in ${value.unit === "min" ? "minutes" : value.unit}`}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          className="h-9 w-28 tabular-nums"
          value={value.value || ""}
          placeholder="2.5"
          onChange={(e) => onChange({ value: Number(e.target.value) || 0, unit: value.unit })}
        />
      )}
      <Select
        value={mode}
        onValueChange={(m) =>
          onChange(
            m === "text"
              ? { text: "" }
              : { value: "value" in value ? value.value : 0, unit: m as Exclude<typeof mode, "text"> },
          )
        }
      >
        <SelectTrigger aria-label="Distance unit" className="w-20 data-[size=default]:h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {DISTANCE_UNITS.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
