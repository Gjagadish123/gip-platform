"use client"

import type { FaqItem, PageSection } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldRow, ListEditor, TEXTAREA_3_ROWS } from "@/components/form"
import { newId, type SectionProps } from "../section-types"
import { AmenityGallery, ContentSection, FieldGroup, SubField } from "./media-section"

type Point = PageSection["points"][number]

/** Free blocks on the project page (entrance arch, clubhouse, villa designs…), in order. */
export function PageSectionsSection({ draft, issues, update }: SectionProps) {
  const base = `${draft.id}--pagesections`
  const sections = draft.sections ?? []
  const set = (next: PageSection[]) =>
    update((d) => {
      d.sections = next
    })

  return (
    <ContentSection
      draft={draft}
      section="pagesections"
      title="Page sections"
      description="Blocks between the specification and the amenities, e.g. the entrance arch, the clubhouse, villa designs. No photo: text and points. One photo: shown wide with the points beside it. Two or more: tabs named by the captions."
      issues={issues}
      shown={["sections"]}
    >
      <ListEditor<PageSection>
        value={sections}
        onChange={set}
        noun="section"
        itemLabel={(s) => s.title}
        emptyTitle="No page sections yet"
        emptyDescription="The project page goes from the specification straight to the amenities."
        create={() => ({ id: newId("sec"), title: "", text: "", images: [], points: [] })}
        renderItem={(s, h) => {
          const id = `${base}-${s.id}`
          return (
            <div className="flex flex-col gap-4">
              <FieldRow label="Title" htmlFor={`${id}-title`}>
                <Input
                  id={`${id}-title`}
                  className="h-9"
                  value={s.title}
                  placeholder="e.g. The clubhouse"
                  onChange={(e) => h.update({ title: e.target.value })}
                />
              </FieldRow>
              <FieldRow label="Text" optional htmlFor={`${id}-text`}>
                <Textarea
                  id={`${id}-text`}
                  rows={3}
                  className={TEXTAREA_3_ROWS}
                  value={s.text}
                  onChange={(e) => h.update({ text: e.target.value })}
                />
              </FieldRow>
              <FieldGroup id={`${id}-images`} label="Photos" level="O" count={s.images.length ? `${s.images.length} photos` : undefined}>
                <AmenityGallery
                  baseId={`${id}-images`}
                  value={s.images}
                  onChange={(images) => h.update({ images })}
                  onAdd={(items) => h.update({ images: [...s.images, ...items] })}
                />
              </FieldGroup>
              <FieldGroup id={`${id}-points`} label="Points" level="O">
                <ListEditor<Point>
                  value={s.points}
                  noun="point"
                  itemLabel={(p) => p.title}
                  emptyTitle="No points yet"
                  create={() => ({ id: newId("pt"), title: "", text: "" })}
                  onChange={(points) => h.update({ points })}
                  renderItem={(p, ph) => (
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                      <SubField label="Point" htmlFor={`${id}-${p.id}-t`}>
                        <Input id={`${id}-${p.id}-t`} className="h-9" value={p.title} onChange={(e) => ph.update({ title: e.target.value })} />
                      </SubField>
                      <SubField label="Detail" htmlFor={`${id}-${p.id}-x`}>
                        <Input id={`${id}-${p.id}-x`} className="h-9" value={p.text} onChange={(e) => ph.update({ text: e.target.value })} />
                      </SubField>
                    </div>
                  )}
                />
              </FieldGroup>
              <FieldRow
                label="Enquire button"
                optional
                htmlFor={`${id}-enquire`}
                description="A button under the section that opens the enquiry form. Leave empty for none."
              >
                <Input
                  id={`${id}-enquire`}
                  className="h-9"
                  value={s.enquireLabel ?? ""}
                  placeholder="e.g. Ask about villa construction"
                  onChange={(e) => h.update({ enquireLabel: e.target.value || undefined })}
                />
              </FieldRow>
            </div>
          )
        }}
      />
    </ContentSection>
  )
}

/** Questions and answers near the bottom of the project page. */
export function FaqSection({ draft, issues, update }: SectionProps) {
  const base = `${draft.id}--faq`
  return (
    <ContentSection
      draft={draft}
      section="faq"
      title="FAQ"
      description="Questions buyers ask, with plain answers. Hidden on the website when empty."
      issues={issues}
      shown={["faq"]}
    >
      <ListEditor<FaqItem>
        value={draft.faq ?? []}
        onChange={(next) =>
          update((d) => {
            d.faq = next
          })
        }
        noun="question"
        itemLabel={(f) => f.q}
        emptyTitle="No questions yet"
        create={() => ({ id: newId("faq"), q: "", a: "" })}
        renderItem={(f, h) => (
          <div className="flex flex-col gap-3">
            <SubField label="Question" htmlFor={`${base}-${f.id}-q`}>
              <Input id={`${base}-${f.id}-q`} className="h-9" value={f.q} onChange={(e) => h.update({ q: e.target.value })} />
            </SubField>
            <SubField label="Answer" htmlFor={`${base}-${f.id}-a`}>
              <Textarea
                id={`${base}-${f.id}-a`}
                rows={3}
                className={TEXTAREA_3_ROWS}
                value={f.a}
                onChange={(e) => h.update({ a: e.target.value })}
              />
            </SubField>
          </div>
        )}
      />
    </ContentSection>
  )
}
