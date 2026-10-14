"use client"

import { Plus } from "lucide-react"

import type { Amenity, IconKey } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FieldGrid, FieldMessage, FieldRow, IconPicker, ListEditor, TEXTAREA_3_ROWS } from "@/components/form"
import { fieldIssues, newId, type SectionProps } from "../section-types"
import { ContentSection, FieldGroup, FixedRow, MediaLink, SubField, ariaFor } from "./media-section"

const COMMON: { name: string; icon: IconKey }[] = [
  { name: "Clubhouse", icon: "clubhouse" },
  { name: "Swimming pool", icon: "pool" },
  { name: "CC roads", icon: "roads" },
  { name: "Underground drainage", icon: "drainage" },
  { name: "Avenue plantation", icon: "plantation" },
  { name: "Children’s play area", icon: "play" },
  { name: "24/7 security", icon: "security" },
  { name: "Compound wall", icon: "wall" },
]

const norm = (s: string) => s.trim().toLowerCase().replace(/[’']/g, "'")

export function AmenitiesSection({ draft, issues, update }: SectionProps) {
  const a = draft.amenities
  const base = `${draft.id}--amenities`
  const items = fieldIssues(issues, "amenities.items")
  const featured = a.items.filter((i) => i.featured).length
  const have = new Set(a.items.map((i) => norm(i.name)))
  const missing = COMMON.filter((c) => !have.has(norm(c.name)))

  /** Quick-add: the chip disappears, so focus moves to the new row's name. */
  function add(patch: Partial<Amenity>) {
    const id = newId("am")
    update((d) => {
      d.amenities.items.push({ id, name: "", featured: false, ...patch })
    })
    requestAnimationFrame(() => document.getElementById(`${base}-i-${id}-name`)?.focus())
  }

  return (
    <ContentSection
      draft={draft}
      section="amenities"
      title="Amenities"
      description={
        <>
          Facilities in the project. Featured ones show as cards with an icon and a line of text.{" "}
          <MediaLink projectId={draft.id} />
        </>
      }
      issues={issues}
      shown={["amenities.visible", "amenities.title", "amenities.description", "amenities.items"]}
    >
      <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor={`${base}-visible`} className="leading-5">
            Show amenities section on website
          </Label>
          <p id={`${base}-visible-description`} className="text-xs text-muted-foreground">
            The section exists but is hidden on the live site today.
          </p>
        </div>
        <Switch
          id={`${base}-visible`}
          checked={a.visible}
          aria-describedby={`${base}-visible-description`}
          onCheckedChange={(checked) =>
            update((d) => {
              d.amenities.visible = checked
            })
          }
          className="mt-0.5"
        />
      </div>

      <FieldGrid>
        <FieldRow label="Title" optional htmlFor={`${base}-title`} description="Leave empty to use the default.">
          <Input
            id={`${base}-title`}
            className="h-9"
            value={a.title}
            placeholder="World-Class Amenities"
            onChange={(e) =>
              update((d) => {
                d.amenities.title = e.target.value
              })
            }
            {...ariaFor(`${base}-title`, { description: true })}
          />
        </FieldRow>
        <FixedRow label="Label above the title">Features</FixedRow>
      </FieldGrid>

      <FieldRow label="Description" optional htmlFor={`${base}-description`} description="Leave empty to use the default.">
        <Textarea
          id={`${base}-description`}
          rows={3}
          className={TEXTAREA_3_ROWS}
          value={a.description}
          placeholder="Every detail has been carefully planned to provide residents with a comfortable, secure, and sustainable living environment."
          onChange={(e) =>
            update((d) => {
              d.amenities.description = e.target.value
            })
          }
          {...ariaFor(`${base}-description`, { description: true })}
        />
      </FieldRow>

      <FieldGroup
        id={`${base}-items`}
        label="Amenities"
        level={a.visible ? "W" : "O"}
        count={a.items.length ? `${featured} of ${a.items.length} featured` : undefined}
        {...items}
      >
        <ListEditor
          value={a.items}
          onChange={(next) =>
            update((d) => {
              d.amenities.items = next
            })
          }
          create={(): Amenity => ({ id: newId("am"), name: "", featured: false })}
          itemLabel={(item) => item.name}
          noun="amenity"
          addLabel="Add amenity"
          emptyTitle="No amenities yet"
          emptyDescription="Add one, or pick from the common amenities below."
          renderItem={(item, { index, update: patch }) => {
            const id = `${base}-i-${item.id}`
            // One line (name, Featured); icon and card text only matter for featured amenities.
            return (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <label htmlFor={`${id}-name`} className="sr-only">
                    Name of amenity {index + 1}
                  </label>
                  <Input
                    id={`${id}-name`}
                    className="h-9 min-w-40 flex-1"
                    value={item.name}
                    placeholder="Clubhouse"
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                  <div className="flex h-9 items-center gap-2">
                    <Switch
                      id={`${id}-featured`}
                      checked={item.featured}
                      onCheckedChange={(checked) => patch({ featured: checked })}
                    />
                    <Label htmlFor={`${id}-featured`} className="font-normal">
                      Featured
                    </Label>
                  </div>
                </div>
                {item.featured && (
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                    <SubField label="Icon" htmlFor={`${id}-icon`}>
                      <IconPicker
                        id={`${id}-icon`}
                        compact
                        value={item.icon}
                        onChange={(icon) => patch({ icon })}
                      />
                    </SubField>
                    <SubField label="Description" htmlFor={`${id}-description`}>
                      <Input
                        id={`${id}-description`}
                        className="h-9"
                        value={item.description ?? ""}
                        placeholder="One short line"
                        onChange={(e) => patch({ description: e.target.value })}
                      />
                    </SubField>
                    {!item.icon && (
                      <FieldMessage kind="warning" className="col-span-2">
                        Choose an icon for this card.
                      </FieldMessage>
                    )}
                  </div>
                )}
              </div>
            )
          }}
        />

        {missing.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Common amenities</span>
            <div className="flex flex-wrap gap-2">
              {missing.map((c) => (
                <Button
                  key={c.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Add ${c.name}`}
                  onClick={() => add({ name: c.name, icon: c.icon })}
                >
                  <Plus aria-hidden />
                  {c.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </FieldGroup>
    </ContentSection>
  )
}
