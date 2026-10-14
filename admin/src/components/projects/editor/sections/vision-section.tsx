"use client"

import type { IconCard, IconKey } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldGrid, FieldRow, IconPicker, ListEditor, TEXTAREA_3_ROWS } from "@/components/form"
import { fieldIssues, newId, type SectionProps } from "../section-types"
import { ContentSection, FieldGroup, FixedRow, SubField, ariaFor } from "./media-section"

const MAX_FEATURES = 4
const VISION_ICONS: IconKey[] = ["target", "trending", "shield", "leaf"]

export function VisionSection({ draft, issues, update }: SectionProps) {
  const v = draft.vision
  const base = `${draft.id}--vision`
  const description = fieldIssues(issues, "vision.description")
  const features = fieldIssues(issues, "vision.features")
  const n = v.features.length

  function newFeature(): IconCard {
    const used = new Set(v.features.map((f) => f.icon))
    return {
      id: newId("vf"),
      icon: VISION_ICONS.find((k) => !used.has(k)) ?? "target",
      title: "",
      description: "",
    }
  }

  return (
    <ContentSection
      draft={draft}
      section="vision"
      title="Vision"
      description="The block under the hero: a title, one paragraph and up to 4 feature cards."
      issues={issues}
      shown={["vision.title", "vision.description", "vision.features"]}
    >
      <FieldGrid>
        <FieldRow label="Title" optional htmlFor={`${base}-title`} description="Leave empty to use the default.">
          <Input
            id={`${base}-title`}
            className="h-9"
            value={v.title}
            placeholder="Building Tomorrow’s Premier Address"
            onChange={(e) =>
              update((d) => {
                d.vision.title = e.target.value
              })
            }
            {...ariaFor(`${base}-title`, { description: true })}
          />
        </FieldRow>
        <FixedRow label="Label above the title">Our Vision</FixedRow>
      </FieldGrid>

      <FieldRow label="Description" mark="Required" htmlFor={`${base}-description`} {...description}>
        <Textarea
          id={`${base}-description`}
          rows={3}
          className={TEXTAREA_3_ROWS}
          value={v.description}
          placeholder="Why this project, in two or three sentences."
          onChange={(e) =>
            update((d) => {
              d.vision.description = e.target.value
            })
          }
          {...ariaFor(`${base}-description`, description)}
        />
      </FieldRow>

      <FieldGroup
        id={`${base}-features`}
        label="Feature cards"
        level="R"
        count={`${n} of ${MAX_FEATURES}`}
        description="Shown in one row of 4 on the website. Each card has an icon, a short title and one line."
        {...features}
      >
        <ListEditor
          value={v.features}
          itemLabel={(f) => f.title}
          onChange={(next) =>
            update((d) => {
              d.vision.features = next
            })
          }
          create={newFeature}
          max={MAX_FEATURES}
          noun="feature card"
          emptyTitle="No feature cards yet"
          emptyDescription="Add up to 4, such as the location, growth, approvals and green spaces."
          renderItem={(item, { update: patch }) => {
            const id = `${base}-f-${item.id}`
            return (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <SubField label="Icon" htmlFor={`${id}-icon`}>
                    <IconPicker id={`${id}-icon`} compact value={item.icon} onChange={(icon) => patch({ icon })} />
                  </SubField>
                  <SubField label="Title" htmlFor={`${id}-title`}>
                    <Input
                      id={`${id}-title`}
                      className="h-9"
                      value={item.title}
                      placeholder="Prime corridor"
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </SubField>
                </div>
                <SubField label="Description" htmlFor={`${id}-description`}>
                  <Input
                    id={`${id}-description`}
                    className="h-9"
                    value={item.description}
                    placeholder="One short line"
                    onChange={(e) => patch({ description: e.target.value })}
                  />
                </SubField>
              </div>
            )
          }}
        />
      </FieldGroup>
    </ContentSection>
  )
}
