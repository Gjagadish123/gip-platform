// Field rhythm adapted from 21st.dev: ephraimduncan/form-layout (demo 4348): 6-column field grid, pairs at sm.
"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import {
  AmountInput,
  AreaInput,
  FieldRow,
  ImageField,
  LandAreaInput,
  ListEditor,
  PriceInput,
  describedBy,
} from "@/components/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AREA_UNIT_LABEL } from "@/lib/constants"
import { formatNumber, formatPrice, plural } from "@/lib/format"
import { sizeRange } from "@/lib/inventory"
import type { Configuration, SizeRange } from "@/lib/types"

import { fieldIssues, newId, sectionDomId, type SectionProps } from "../section-types"

const toInt = (v: string) => (v.trim() === "" ? undefined : Math.max(0, Math.trunc(Number(v))) || undefined)

export function PricingSection({ draft, type, units, issues, update }: SectionProps) {
  const sid = sectionDomId(draft.id, "pricing")
  const fid = (f: string) => `${draft.id}-${f}`
  const noun = type.unitNoun.toLowerCase()
  const nouns = type.unitNounPlural.toLowerCase()
  const price = fieldIssues(issues, "price")
  const land = fieldIssues(issues, "landArea")
  const total = fieldIssues(issues, "totalUnits")
  const size = fieldIssues(issues, "unitSize")
  const fromInventory = units.length > 0 ? sizeRange(units, type.areaUnit) : null
  const sizeUnit = draft.unitSize?.unit ?? type.areaUnit
  const range = fromInventory ?? (draft.unitSize?.min || draft.unitSize?.max ? draft.unitSize : null)
  const rangeText =
    range &&
    `${range.min === range.max || !range.max ? formatNumber(range.min || range.max) : `${formatNumber(range.min)}–${formatNumber(range.max)}`} ${AREA_UNIT_LABEL[range.unit]}`

  function setSize(patch: Partial<SizeRange>) {
    update((d) => {
      // With inventory the range comes from the plots, so a size text starts from that range.
      const seed =
        d.unitSize ?? (fromInventory ? { min: fromInventory.min, max: fromInventory.max, unit: fromInventory.unit } : undefined)
      const next: SizeRange = { min: 0, max: 0, unit: sizeUnit, ...seed, ...patch }
      d.unitSize = next.min || next.max || next.label ? next : undefined
    })
  }

  return (
    <section id={sid} aria-labelledby={`${sid}-h`} className="scroll-mt-32 lg:scroll-mt-[72px]">
      <h2 id={`${sid}-h`} className="text-base font-semibold">
        Pricing &amp; size
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Starting price, land area and {nouns}, as shown in the hero and on the listing.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-6">
        <FieldRow className="sm:col-span-6" label="Starting price" htmlFor={fid("price")} {...price}>
          <PriceInput
            id={fid("price")}
            value={draft.price}
            invalid={!!price.error}
            onChange={(next) =>
              update((d) => {
                d.price = next
              })
            }
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-3"
          label="Price text"
          optional
          htmlFor={fid("priceLabel")}
          description="Replaces the formatted price, e.g. Villas from ₹96 L."
        >
          <Input
            id={fid("priceLabel")}
            className="h-9"
            value={draft.priceLabel ?? ""}
            placeholder={formatPrice(draft.price)}
            aria-describedby={`${fid("priceLabel")}-description`}
            onChange={(e) => {
              const v = e.target.value
              update((d) => {
                d.priceLabel = v || undefined
              })
            }}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-3"
          label="Price on website"
          htmlFor={fid("showPrice")}
          description="The price card is hidden on the website today."
        >
          <div className="flex h-9 items-center gap-3">
            <Switch
              id={fid("showPrice")}
              checked={draft.showPrice}
              aria-describedby={`${fid("showPrice")}-description`}
              onCheckedChange={(on) =>
                update((d) => {
                  d.showPrice = on
                })
              }
            />
            <span className="text-sm text-muted-foreground">{draft.showPrice ? "Shown" : "Hidden"}</span>
          </div>
        </FieldRow>

        <FieldRow
          className="sm:col-span-4"
          label="Land area"
          mark={draft.lifecycle === "completed" ? "Recommended" : undefined}
          htmlFor={fid("landArea")}
          {...land}
        >
          <LandAreaInput
            id={fid("landArea")}
            value={draft.landArea}
            onChange={(next) =>
              update((d) => {
                d.landArea = next
              })
            }
          />
        </FieldRow>

        {fromInventory ? (
          <FieldRow
            className="sm:col-span-6"
            label={`${type.unitNounPlural} and sizes`}
            description="Counted from the inventory, so the website always matches it."
          >
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border bg-muted/40 px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">
                From inventory:{" "}
                <span className="font-medium text-foreground tabular-nums">{plural(units.length, noun, nouns)}</span>
                {" · "}
                <span className="text-foreground tabular-nums">
                  {fromInventory.min === fromInventory.max
                    ? formatNumber(fromInventory.min)
                    : `${formatNumber(fromInventory.min)}–${formatNumber(fromInventory.max)}`}{" "}
                  {AREA_UNIT_LABEL[fromInventory.unit]}
                </span>
              </span>
              <Link
                href={`/projects/${draft.id}/inventory`}
                className="inline-flex items-center gap-1 rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open inventory
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </div>
          </FieldRow>
        ) : (
          <>
            <FieldRow
              className="sm:col-span-2"
              label={`Number of ${nouns}`}
              htmlFor={fid("totalUnits")}
              description={type.hasInventory ? `Fills in once ${nouns} are added in Inventory.` : undefined}
              {...total}
            >
              <Input
                id={fid("totalUnits")}
                type="number"
                inputMode="numeric"
                min={0}
                className="h-9 tabular-nums"
                value={draft.totalUnits ?? ""}
                aria-invalid={!!total.error || undefined}
                aria-describedby={describedBy(fid("totalUnits"), { description: type.hasInventory, ...total })}
                onChange={(e) => {
                  const v = toInt(e.target.value)
                  update((d) => {
                    d.totalUnits = v
                  })
                }}
              />
            </FieldRow>

            <FieldRow className="sm:col-span-4" label={`${type.unitNoun} size range`} htmlFor={fid("sizeMin")} {...size}>
              <div className="grid grid-cols-2 gap-2">
                <AreaInput
                  id={fid("sizeMin")}
                  unit={sizeUnit}
                  aria-label="Smallest"
                  placeholder="From"
                  value={draft.unitSize?.min || undefined}
                  invalid={!!size.error}
                  aria-describedby={describedBy(fid("sizeMin"), size)}
                  onChange={(n) => setSize({ min: n ?? 0 })}
                />
                <AreaInput
                  id={fid("sizeMax")}
                  unit={sizeUnit}
                  aria-label="Largest"
                  placeholder="To"
                  value={draft.unitSize?.max || undefined}
                  invalid={!!size.error}
                  aria-describedby={describedBy(fid("sizeMin"), size)}
                  onChange={(n) => setSize({ max: n ?? 0 })}
                />
              </div>
            </FieldRow>
          </>
        )}

        {/* Always editable: uneven sizes such as 200 to 400 and 730 sq yd can't come out of the inventory range. */}
        <FieldRow
          className="sm:col-span-6"
          label="Size text"
          optional
          htmlFor={fid("sizeLabel")}
          description={
            fromInventory
              ? "Replaces the range from inventory on the website."
              : "For uneven sizes, e.g. 166, 200, 217, 222, 266. Replaces the range on the website."
          }
        >
          <Input
            id={fid("sizeLabel")}
            className="h-9"
            value={draft.unitSize?.label ?? ""}
            placeholder={rangeText || undefined}
            aria-describedby={`${fid("sizeLabel")}-description`}
            onChange={(e) => setSize({ label: e.target.value || undefined })}
          />
        </FieldRow>

        {type.hasConfigurations && (
          <FieldRow
            className="sm:col-span-6"
            label="Configurations"
            optional
            description={
              type.id === "apartments"
                ? "Flat types with their own area and price, e.g. 2 BHK."
                : "Villa packages on a plot size, with built-up area and price."
            }
          >
            <ListEditor<Configuration>
              value={draft.configurations}
              noun="configuration"
              itemLabel={(c) => c.label}
              emptyTitle="No configurations yet"
              emptyDescription={type.id === "apartments" ? "Add each BHK type you sell." : "Add each villa package you sell."}
              create={() => ({ id: newId("cfg"), label: "" })}
              onChange={(next) =>
                update((d) => {
                  d.configurations = next
                })
              }
              renderItem={(c, h) => (
                <ConfigurationFields
                  idBase={`${draft.id}-cfg-${c.id}`}
                  config={c}
                  apartments={type.id === "apartments"}
                  onPatch={h.update}
                />
              )}
            />
          </FieldRow>
        )}
      </div>
    </section>
  )
}

function ConfigurationFields({
  idBase,
  config: c,
  apartments,
  onPatch,
}: {
  idBase: string
  config: Configuration
  apartments: boolean
  onPatch: (patch: Partial<Configuration>) => void
}) {
  const amount = c.price && c.price.mode !== "on_request" ? c.price.amount : 0
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      <FieldRow className="sm:col-span-6" label="Name" htmlFor={`${idBase}-label`}>
        <Input
          id={`${idBase}-label`}
          className="h-9"
          value={c.label}
          placeholder={apartments ? "2 BHK" : "Villa on 200 sq yd"}
          onChange={(e) => onPatch({ label: e.target.value })}
        />
      </FieldRow>
      {apartments ? (
        <>
          <FieldRow className="sm:col-span-2" label="BHK" htmlFor={`${idBase}-bhk`}>
            <Input
              id={`${idBase}-bhk`}
              type="number"
              inputMode="numeric"
              min={1}
              className="h-9 tabular-nums"
              value={c.bhk ?? ""}
              onChange={(e) => onPatch({ bhk: toInt(e.target.value) })}
            />
          </FieldRow>
          <FieldRow className="sm:col-span-2" label="Carpet area" htmlFor={`${idBase}-carpet`}>
            <AreaInput
              id={`${idBase}-carpet`}
              unit="sq_ft"
              value={c.carpetAreaSqFt}
              onChange={(n) => onPatch({ carpetAreaSqFt: n })}
            />
          </FieldRow>
        </>
      ) : (
        <FieldRow className="sm:col-span-2" label="Plot area" htmlFor={`${idBase}-plot`}>
          <AreaInput
            id={`${idBase}-plot`}
            unit="sq_yd"
            value={c.plotAreaSqYd}
            onChange={(n) => onPatch({ plotAreaSqYd: n })}
          />
        </FieldRow>
      )}
      <FieldRow className="sm:col-span-2" label="Built-up area" htmlFor={`${idBase}-builtup`}>
        <AreaInput
          id={`${idBase}-builtup`}
          unit="sq_ft"
          value={c.builtUpAreaSqFt}
          onChange={(n) => onPatch({ builtUpAreaSqFt: n })}
        />
      </FieldRow>
      <FieldRow className={apartments ? "sm:col-span-6" : "sm:col-span-2"} label="Price" htmlFor={`${idBase}-price`}>
        <AmountInput
          id={`${idBase}-price`}
          value={amount}
          onChange={(n) => onPatch({ price: n ? { mode: "total", amount: n } : undefined })}
        />
      </FieldRow>
      <ImageField
        className="sm:col-span-6"
        id={`${idBase}-floor-plan`}
        label="Floor plan"
        mark="Optional"
        aspect="4 / 3"
        value={c.floorPlan ?? null}
        onChange={(a) => onPatch({ floorPlan: a ?? undefined })}
      />
    </div>
  )
}
