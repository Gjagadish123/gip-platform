// Field rhythm adapted from 21st.dev: ephraimduncan/form-layout (demo 4348): 6-column field grid; the homepage
// slot uses that component's radio-card pattern.
"use client"

import { ArrowUpRight } from "lucide-react"

import { CharCount, FieldRow, SlugInput, describedBy } from "@/components/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { COMPANY, HOMEPAGE_CAPACITY, PUBLISH_META } from "@/lib/constants"
import { useProject, useProjects } from "@/lib/store"
import type { HomepageSlot, Project } from "@/lib/types"
import { cn } from "@/lib/utils"
import { liveSiteUrl } from "@/lib/validate"

import { PublishBadge } from "../../list/project-badges"
import { fieldIssues, sectionDomId, type SectionProps } from "../section-types"

const NO_SLOT = "none"
const SLOTS: { value: HomepageSlot | typeof NO_SLOT; label: string }[] = [
  { value: NO_SLOT, label: "Not on homepage" },
  { value: "large", label: "Large card" },
  { value: "small", label: "Small card" },
]

export function PublishingSection({ draft, issues, update }: SectionProps) {
  const sid = sectionDomId(draft.id, "publishing")
  const fid = (f: string) => `${draft.id}-${f}`
  const projects = useProjects()
  const saved = useProject(draft.id)
  const pub = draft.publishing
  const others = projects.filter((o) => o.id !== draft.id)
  const taken = others.map((o) => o.publishing.slug)

  const slugIssues = fieldIssues(issues, "publishing.slug")
  const slugError = taken.includes(pub.slug) ? undefined : slugIssues.error // SlugInput shows the clash itself
  const external = fieldIssues(issues, "publishing.externalUrl")
  const live = liveSiteUrl(draft)

  const inRow = (slot: HomepageSlot) =>
    others.filter((o) => o.publishing.state === "published" && o.publishing.homepageSlot === slot)
  const slot = pub.homepageSlot
  const slotPeers = slot ? inRow(slot) : []
  const slotFull = slot ? slotPeers.length >= HOMEPAGE_CAPACITY[slot] : false

  const seoTitleFallback = `${draft.displayName?.trim() || draft.name} | ${COMPANY.name}`
  const seoTitle = pub.seo?.title?.trim() || seoTitleFallback
  const seoDescription = pub.seo?.description?.trim() || draft.description.trim()

  function setSeo(patch: NonNullable<Project["publishing"]["seo"]>) {
    update((d) => {
      const next = { ...d.publishing.seo, ...patch }
      d.publishing.seo = next.title || next.description ? next : undefined
    })
  }

  return (
    <section id={sid} aria-labelledby={`${sid}-h`} className="scroll-mt-32 lg:scroll-mt-[72px]">
      <h2 id={`${sid}-h`} className="text-base font-semibold">
        Publishing
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Web address, homepage placement, ordering and search results.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-6">
        <FieldRow
          className="sm:col-span-6"
          label="Web address"
          required
          htmlFor={fid("slug")}
          error={slugError}
          warning={slugIssues.warning}
        >
          <SlugInput
            id={fid("slug")}
            value={pub.slug}
            source={draft.name}
            taken={taken}
            originalSlug={saved?.publishing.state === "published" ? saved.publishing.slug : undefined}
            onChange={(v) =>
              update((d) => {
                d.publishing.slug = v
              })
            }
          />
        </FieldRow>

        {pub.legacySlug && live && (
          <FieldRow
            className="sm:col-span-6"
            label="Current live URL"
            description="The old website only answers on this address. It is replaced when the new site launches."
          >
            <a
              href={live}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 w-fit max-w-full items-center gap-1 rounded-sm text-sm break-all text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {live.replace(/^https?:\/\/(www\.)?/, "")}
              <ArrowUpRight aria-hidden className="size-3.5 shrink-0" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </FieldRow>
        )}

        <FieldRow
          className="sm:col-span-6"
          label="Status"
          description="Publish and unpublish with the buttons at the top of the page, so the checks run first."
        >
          <div className="flex min-h-9 items-center gap-2 text-sm">
            <PublishBadge state={pub.state} />
            <span className="text-muted-foreground">{PUBLISH_META[pub.state].description}</span>
          </div>
        </FieldRow>

        <FieldRow
          className="sm:col-span-6"
          label="Homepage"
          optional
          description="“Our recent projects” shows 2 large cards above 3 small ones. Counts are for published projects."
          warning={
            slot && slotFull
              ? `The ${slot} row is full (${slotPeers.map((o) => o.name).join(", ")}). Move one of them out first, or this card won't show.`
              : fieldIssues(issues, "publishing.homepageSlot").warning
          }
        >
          <RadioGroup
            aria-label="Homepage placement"
            className="grid-cols-1 sm:grid-cols-3"
            value={slot ?? NO_SLOT}
            onValueChange={(v) =>
              update((d) => {
                d.publishing.homepageSlot = v === NO_SLOT ? null : (v as HomepageSlot)
              })
            }
          >
            {SLOTS.map((s) => {
              const selected = (slot ?? NO_SLOT) === s.value
              const cap = s.value === NO_SLOT ? null : HOMEPAGE_CAPACITY[s.value]
              const used = s.value === NO_SLOT ? 0 : inRow(s.value).length + (selected ? 1 : 0)
              return (
                <label
                  key={s.value}
                  htmlFor={fid(`slot-${s.value}`)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                    selected && "border-ring bg-accent hover:bg-accent",
                  )}
                >
                  <RadioGroupItem id={fid(`slot-${s.value}`)} value={s.value} className="mt-0.5" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{s.label}</span>
                    <span
                      className={cn(
                        "text-xs text-muted-foreground tabular-nums",
                        cap !== null && used > cap && "text-warning",
                      )}
                    >
                      {cap === null ? "Projects page only" : `${used} of ${cap} slots used`}
                    </span>
                  </span>
                </label>
              )
            })}
          </RadioGroup>
        </FieldRow>

        <FieldRow
          className="sm:col-span-2"
          label="Sort order"
          optional
          htmlFor={fid("sortOrder")}
          description="Lower numbers show first."
        >
          <Input
            id={fid("sortOrder")}
            type="number"
            inputMode="numeric"
            className="h-9 tabular-nums"
            value={pub.sortOrder}
            aria-describedby={`${fid("sortOrder")}-description`}
            onChange={(e) => {
              const v = Math.trunc(Number(e.target.value)) || 0
              update((d) => {
                d.publishing.sortOrder = v
              })
            }}
          />
        </FieldRow>

        <FieldRow
          className="sm:col-span-4"
          label="External website"
          optional
          htmlFor={fid("externalUrl")}
          description="The card opens this site in a new tab, and the project gets no detail page."
          {...external}
        >
          <Input
            id={fid("externalUrl")}
            type="url"
            inputMode="url"
            className="h-9"
            value={pub.externalUrl ?? ""}
            placeholder="https://example.com/project"
            aria-invalid={!!external.warning || undefined}
            aria-describedby={describedBy(fid("externalUrl"), { description: true, ...external })}
            onChange={(e) => {
              const v = e.target.value.trim()
              update((d) => {
                d.publishing.externalUrl = v || undefined
              })
            }}
          />
        </FieldRow>
      </div>

      <h3 className="mt-8 text-sm font-semibold">Search results</h3>
      <p className="mt-1 text-sm text-muted-foreground">Empty fields fall back to the name and description.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
        <FieldRow className="sm:col-span-6" label="Page title" optional htmlFor={fid("seo-title")}>
          <CharCount
            id={fid("seo-title")}
            multiline={false}
            max={60}
            value={pub.seo?.title ?? ""}
            placeholder={seoTitleFallback}
            onChange={(v) => setSeo({ title: v || undefined })}
          />
        </FieldRow>
        <FieldRow className="sm:col-span-6" label="Meta description" optional htmlFor={fid("seo-description")}>
          <CharCount
            id={fid("seo-description")}
            rows={3}
            max={160}
            value={pub.seo?.description ?? ""}
            placeholder={draft.description.slice(0, 160)}
            onChange={(v) => setSeo({ description: v || undefined })}
          />
        </FieldRow>

        <figure className="sm:col-span-6">
          <figcaption className="text-xs text-muted-foreground">Search result preview</figcaption>
          <div className="mt-1.5 max-w-[600px] rounded-lg border p-4">
            <p className="truncate text-xs text-muted-foreground">
              {COMPANY.website.replace(/^https?:\/\/(www\.)?/, "")} › property › {pub.slug || "…"}
            </p>
            <p className="mt-1 truncate text-base text-primary">{seoTitle}</p>
            <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
              {seoDescription || "No description yet. Search engines will pick text from the page."}
            </p>
          </div>
        </figure>
      </div>
    </section>
  )
}
