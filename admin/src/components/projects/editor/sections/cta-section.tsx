"use client"

import { COMPANY, PLACEHOLDER_PHONES } from "@/lib/constants"
import type { Cta } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CharCount, FieldGrid, FieldRow, PhoneInput, TEXTAREA_3_ROWS } from "@/components/form"
import { fieldIssues, type SectionProps } from "../section-types"
import { ContentSection, FieldMessages, FixedRow, ariaFor } from "./media-section"

const THANK_YOU_MAX = 160

export function CtaSection({ draft, issues, update }: SectionProps) {
  const c = draft.cta
  const base = `${draft.id}--cta`
  const set =
    <K extends keyof Cta>(key: K) =>
    (next: Cta[K]) =>
      update((d) => {
        d.cta[key] = next
      })
  const subheading = fieldIssues(issues, "cta.subheading")
  const title = fieldIssues(issues, "cta.title")
  const description = fieldIssues(issues, "cta.description")
  const urgency = fieldIssues(issues, "cta.urgency")
  // PhoneInput already explains an empty number and rejects the placeholder, so only other checks show here.
  const phoneDigits = c.phone?.replace(/[\s-]/g, "")
  const phone =
    phoneDigits && !PLACEHOLDER_PHONES.includes(phoneDigits)
      ? fieldIssues(issues, "cta.phone")
      : {}

  return (
    <ContentSection
      draft={draft}
      section="cta"
      title="Call to action"
      description="The closing block before the footer, with the site-visit and brochure buttons."
      issues={issues}
      shown={["cta.subheading", "cta.title", "cta.description", "cta.phone", "cta.whatsapp", "cta.urgency", "cta.thankYou"]}
    >
      <FieldRow
        label="Subheading"
        optional
        htmlFor={`${base}-subheading`}
        description="Shown in capitals above the title. Leave empty to use the default."
        {...subheading}
      >
        <Input
          id={`${base}-subheading`}
          className="h-9"
          value={c.subheading}
          placeholder="Book your plot today"
          onChange={(e) => set("subheading")(e.target.value)}
          {...ariaFor(`${base}-subheading`, { description: true, ...subheading })}
        />
      </FieldRow>

      <FieldRow
        label="Title"
        optional
        htmlFor={`${base}-title`}
        description="Leave empty to use the default."
        {...title}
      >
        <Input
          id={`${base}-title`}
          className="h-9"
          value={c.title}
          placeholder="Ready to Invest in Your Future?"
          onChange={(e) => set("title")(e.target.value)}
          {...ariaFor(`${base}-title`, { description: true, ...title })}
        />
      </FieldRow>

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
          value={c.description}
          placeholder="Limited plots available at pre-launch prices. Connect with our team for exclusive offers, site visits, and personalized assistance."
          onChange={(e) => set("description")(e.target.value)}
          {...ariaFor(`${base}-description`, { description: true, ...description })}
        />
      </FieldRow>

      <FieldGrid>
        <div className="flex min-w-0 flex-col gap-1.5">
          <FieldRow label="Sales phone" mark="Recommended" htmlFor={`${base}-phone`}>
            <PhoneInput
              id={`${base}-phone`}
              value={c.phone || undefined}
              onChange={set("phone")}
              emptyHint={`Uses the company number ${COMPANY.phone} when empty.`}
            />
          </FieldRow>
          <FieldMessages {...phone} />
        </div>
        <FieldRow label="WhatsApp" optional htmlFor={`${base}-whatsapp`}>
          <PhoneInput
            id={`${base}-whatsapp`}
            value={c.whatsapp || undefined}
            onChange={set("whatsapp")}
            emptyHint="Uses the sales phone when empty."
          />
        </FieldRow>
      </FieldGrid>

      <FieldRow
        label="Urgency line"
        optional
        htmlFor={`${base}-urgency`}
        description="Short line next to a clock icon. Keep it true: no prices or dates that will pass."
        {...urgency}
      >
        <Input
          id={`${base}-urgency`}
          className="h-9"
          value={c.urgency ?? ""}
          placeholder="Limited plots remaining • Pre-launch prices ending soon"
          onChange={(e) => set("urgency")(e.target.value)}
          {...ariaFor(`${base}-urgency`, { description: true, ...urgency })}
        />
      </FieldRow>

      <FieldRow
        label="Thank-you message"
        optional
        htmlFor={`${base}-thank-you`}
        description="The band above the footer. Leave empty for the long default; a short line of your own reads better."
      >
        <CharCount
          id={`${base}-thank-you`}
          max={THANK_YOU_MAX}
          value={c.thankYou ?? ""}
          placeholder="Thank you for considering Greater Infra Projects for your real estate needs. We look forward to hearing from you…"
          onChange={set("thankYou")}
          aria-describedby={`${base}-thank-you-description`}
        />
      </FieldRow>

      <FieldGrid>
        <FixedRow label="Site-visit tile">Site Visit · Schedule Today</FixedRow>
        <FixedRow label="Buttons">Schedule Site Visit · Download Brochure</FixedRow>
      </FieldGrid>
    </ContentSection>
  )
}
