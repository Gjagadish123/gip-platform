"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SectionId } from "@/lib/constants"
import { saveUpload } from "@/lib/media-store"
import type { ID, Project, ProjectMedia } from "@/lib/types"
import { hasDetailPage } from "@/lib/validate"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AssetImage,
  Dropzone,
  FieldMessage,
  FieldMessages,
  FixedOnWebsiteHint,
  GalleryField,
  IMAGE_ACCEPT,
  ImageField,
  LabelMark,
  ListEditor,
  PdfField,
  describedBy,
  uploadErrorMessage,
  useTouchOnBlur,
  type FieldIssueProps,
} from "@/components/form"
import { CardPreview } from "../card-preview"
import { fieldIssues, newId, sectionDomId, type SectionProps, type ShownIssue } from "../section-types"
import { scrollToTarget } from "../toc"

/* ------------------------------------------------------------------------------------------------
 * Shared by the content sections (media, vision, masterplan, amenities, legal, cta).
 * ponytail: lives here because this agent owns only these six files; move to sections/section-kit.tsx if the
 * frame's own sections want the same shell.
 * ---------------------------------------------------------------------------------------------- */

export { FieldMessages }

/** domain §5 legend: R needed to publish, W publishing asks to confirm, O optional. */
export type Level = "R" | "W" | "O"
const LEVEL_LABEL: Record<Level, string> = { R: "Required", W: "Recommended", O: "Optional" }

/** Publish requirement, inline after a field's label, like FieldRow's (R = red star). */
export function Mark({ level }: { level: Level }) {
  return <LabelMark mark={LEVEL_LABEL[level]} />
}

/** aria props for a control whose FieldRow renders `${id}-description` / `${id}-error`. */
export function ariaFor(id: string, opts: { description?: boolean } & FieldIssueProps) {
  return { "aria-invalid": opts.error ? true : undefined, "aria-describedby": describedBy(id, opts) }
}

/** "Photo: in Media" pointer for sections whose image lives in the Media section. */
export function MediaLink({ projectId, label = "Photo: in Media" }: { projectId: ID; label?: string }) {
  const target = sectionDomId(projectId, "media")
  return (
    <a
      href={`#${target}`}
      onClick={(e) => scrollToTarget(target) && e.preventDefault()}
      className="rounded-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
    </a>
  )
}

/** A labelled group of controls (lists, galleries). Requirement after the label, live count at the right. */
export function FieldGroup({
  id,
  label,
  level,
  count,
  description,
  error,
  todo,
  warning,
  issueField,
  children,
}: {
  id: string
  label: React.ReactNode
  level?: Level
  /** "3 of 4", "12 photos". */
  count?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
} & FieldIssueProps) {
  const onBlur = useTouchOnBlur(issueField)
  const hasMessage = !!(error || todo || warning)
  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={[description && `${id}-description`, hasMessage && `${id}-error`].filter(Boolean).join(" ") || undefined}
      onBlur={onBlur}
      className="flex min-w-0 flex-col gap-1.5"
    >
      <div className="flex min-h-5 items-center justify-between gap-3">
        <span id={`${id}-label`} className="flex items-center gap-2 text-sm leading-5 font-medium">
          {label}
          {level && <Mark level={level} />}
        </span>
        {count != null && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
      </div>
      {description && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <FieldMessages id={id} error={error} todo={todo} warning={warning} />
      <div className="mt-1.5 flex min-w-0 flex-col gap-3">{children}</div>
    </div>
  )
}

/** Small label + control inside a list row. */
export function SubField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

/** Copy the public site hard-codes, shown read-only where a field would be. */
export function FixedRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm leading-5 font-medium">{label}</span>
      <FixedOnWebsiteHint>{children}</FixedOnWebsiteHint>
    </div>
  )
}

/** Wraps a kit control that renders its own label (ImageField, PdfField): its messages, and a blur reveals them. */
function Labeled({ id, issue, children }: { id: string; issue: FieldIssueProps; children: React.ReactNode }) {
  const onBlur = useTouchOnBlur(issue.issueField)
  return (
    <div onBlur={onBlur} className="flex min-w-0 flex-col gap-1.5">
      {children}
      <FieldMessages id={id} {...issue} />
    </div>
  )
}

/**
 * Section shell: <section id="{projectId}--{section}"> + h2 + one muted line + fields. The editor frame draws the
 * dividers and collapses page-content sections when there is no detail page. Issues for this section whose field
 * isn't rendered inline (`shown` prefixes) are listed under the heading, so nothing the validator reports is hidden.
 */
export function ContentSection({
  draft,
  section,
  title,
  description,
  issues,
  shown,
  children,
}: {
  draft: Project
  section: SectionId
  title: string
  description: React.ReactNode
  issues: ShownIssue[]
  shown: string[]
  children: React.ReactNode
}) {
  const id = sectionDomId(draft.id, section)
  const leftovers = issues.filter(
    (i) => i.section === section && !shown.some((f) => i.field === f || i.field.startsWith(`${f}.`)),
  )

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-32 lg:scroll-mt-[72px]">
      <h2 id={`${id}-heading`} className="text-base font-semibold text-balance">
        {title}
      </h2>
      <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{description}</p>
      {leftovers.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {leftovers.map((i) => (
            <li key={`${i.field}:${i.message}`}>
              <FieldMessage kind={i.level === "recommended" ? "warning" : i.pending ? "todo" : "error"}>
                {i.message}
              </FieldMessage>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------------------------------------
 * Media
 * ---------------------------------------------------------------------------------------------- */

const MEDIA_FIELDS = [
  "media.cover",
  "media.hero",
  "media.gallery",
  "media.amenityGallery",
  "media.locationImage",
  "media.masterPlan",
  "media.masterPlanPage",
  "media.brochure",
]

export function MediaSection({ draft, issues, update }: SectionProps) {
  const m = draft.media
  const detail = hasDetailPage(draft)
  const base = `${draft.id}--media`
  const set =
    <K extends keyof ProjectMedia>(key: K) =>
    (next: ProjectMedia[K]) =>
      update((d) => {
        d.media[key] = next
      })

  const cover = fieldIssues(issues, "media.cover")
  const hero = fieldIssues(issues, "media.hero")
  const location = fieldIssues(issues, "media.locationImage")
  const planFile = fieldIssues(issues, "media.masterPlan")
  const planPage = fieldIssues(issues, "media.masterPlanPage")
  const plan = { ...planFile, error: planFile.error ?? planPage.error, todo: planFile.todo ?? planPage.todo }
  const brochure = fieldIssues(issues, "media.brochure")
  // ponytail: the validator's duplicate warning is dropped here; GalleryField shows its own banner with a fix.
  const gallery = fieldIssues(
    issues.filter((i) => !/duplicate/i.test(i.message)),
    "media.gallery",
  )
  const n = m.gallery.length
  const image = (id: string, issue: FieldIssueProps) => ({
    id,
    invalid: !!issue.error,
    "aria-describedby": describedBy(id, issue),
  })

  const coverField = (
    <Labeled id={`${base}-cover`} issue={cover}>
      <ImageField
        {...image(`${base}-cover`, cover)}
        label="Cover image"
        mark={LEVEL_LABEL.R}
        aspect="4 / 3"
        value={m.cover}
        onChange={set("cover")}
        description="Used on listing cards and the homepage."
      />
    </Labeled>
  )

  const preview = (
    <div className="flex flex-col gap-3 border-t pt-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Listing card preview</h3>
        <p className="text-xs text-muted-foreground">
          The card on the properties page and the homepage, with your unsaved changes.
        </p>
      </div>
      <CardPreview project={draft} />
    </div>
  )

  const pageMedia = (
    <>
      <Labeled id={`${base}-hero`} issue={hero}>
        <ImageField
          {...image(`${base}-hero`, hero)}
          label="Hero image"
          mark={LEVEL_LABEL.O}
          aspect="16 / 9"
          value={m.hero}
          onChange={set("hero")}
          description="Top of the project page. Uses the cover when empty."
        />
      </Labeled>

      <FieldGroup
        id={`${base}-gallery`}
        label="Gallery"
        level={detail ? "R" : "O"}
        count={n === 1 ? "1 photo" : `${n} photos`}
        description="At least 3 photos for a project page, 6 or more recommended. Shown in this order."
        {...gallery}
      >
        <GalleryField
          value={m.gallery}
          onChange={set("gallery")}
          coverId={m.cover?.id}
          onSetCover={(asset) =>
            update((d) => {
              d.media.cover = asset
            })
          }
          heroId={m.hero?.id}
          onSetHero={(asset) =>
            update((d) => {
              d.media.hero = asset
            })
          }
          noun="photo"
        />
        <FixedOnWebsiteHint>Project Gallery</FixedOnWebsiteHint>
      </FieldGroup>

      <FieldGroup
        id={`${base}-amenity-gallery`}
        label="Amenities gallery"
        level="O"
        count={m.amenityGallery.length ? `${m.amenityGallery.length} photos` : undefined}
        description="Captioned photos shown with the amenities section."
      >
        <AmenityGallery
          baseId={`${base}-amenity-gallery`}
          value={m.amenityGallery}
          onChange={set("amenityGallery")}
          onAdd={(items) =>
            update((d) => {
              d.media.amenityGallery.push(...items)
            })
          }
        />
      </FieldGroup>

      <Labeled id={`${base}-location`} issue={location}>
        <ImageField
          {...image(`${base}-location`, location)}
          label="Location image"
          mark={LEVEL_LABEL[detail ? "W" : "O"]}
          aspect="4 / 3"
          value={m.locationImage}
          onChange={set("locationImage")}
          description="Map or aerial beside the location advantages. Use one made for this project."
        />
      </Labeled>

      <Labeled id={`${base}-plan`} issue={plan}>
        <PdfField
          {...image(`${base}-plan`, plan)}
          label="Master plan"
          mark={LEVEL_LABEL[detail ? "R" : "O"]}
          value={m.masterPlan}
          onChange={set("masterPlan")}
          page={m.masterPlanPage}
          onPageChange={set("masterPlanPage")}
        />
        <p className="text-xs text-muted-foreground">Image or PDF. For a PDF, choose the page that shows the layout.</p>
      </Labeled>

      <Labeled id={`${base}-brochure`} issue={brochure}>
        <PdfField
          {...image(`${base}-brochure`, brochure)}
          label="Brochure"
          mark={LEVEL_LABEL[detail ? "W" : "O"]}
          value={m.brochure}
          onChange={set("brochure")}
        />
        <p className="text-xs text-muted-foreground">
          The Download Brochure buttons in Master plan and Call to action open this file.
        </p>
      </Labeled>
    </>
  )

  return (
    <ContentSection
      draft={draft}
      section="media"
      title="Media"
      description={
        detail
          ? "Photos and files for the listing card and the project page."
          : "This project has a listing card only, so only the cover is shown on the website."
      }
      issues={issues}
      // Card-only: messages for the folded slots are listed under the heading, so the fold hides nothing.
      shown={detail ? MEDIA_FIELDS : ["media.cover"]}
    >
      {detail ? (
        <>
          {coverField}
          {pageMedia}
          {preview}
        </>
      ) : (
        <>
          {coverField}
          {preview}
          <details className="group rounded-xl border">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium outline-none select-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <ChevronRight aria-hidden className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
              Detail-page media
              <span className="font-normal text-muted-foreground">(not shown for this project)</span>
            </summary>
            <div className="flex flex-col gap-6 border-t p-4">{pageMedia}</div>
          </details>
        </>
      )}
    </ContentSection>
  )
}

type AmenityPhoto = ProjectMedia["amenityGallery"][number]

/** Rows of photo + caption (sortable). Photos come in through the dropzone, so a row never lacks an image. */
function AmenityGallery({
  baseId,
  value,
  onChange,
  onAdd,
}: {
  baseId: string
  value: AmenityPhoto[]
  onChange: (next: AmenityPhoto[]) => void
  onAdd: (items: AmenityPhoto[]) => void
}) {
  const [pending, setPending] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const dropRef = React.useRef<HTMLButtonElement>(null)

  async function upload(files: File[], rejected: string[]) {
    setError(rejected.length ? rejected.join(". ") : null)
    if (!files.length) return
    setPending((p) => p + files.length)
    const results = await Promise.allSettled(files.map((f) => saveUpload(f)))
    setPending((p) => p - files.length)
    const saved = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
    const failed = results.find((r) => r.status === "rejected")
    if (failed) setError([...rejected, uploadErrorMessage(failed.reason, "photo")].join(". "))
    if (saved.length) onAdd(saved.map((image) => ({ id: newId("amg"), image, caption: "" })))
  }

  return (
    <>
      {value.length > 0 && (
        <ListEditor
          value={value}
          onChange={(next) => {
            onChange(next)
            // The list unmounts with its last row: keep focus in the field.
            if (!next.length) requestAnimationFrame(() => dropRef.current?.focus())
          }}
          noun="photo"
          itemLabel={(item) => item.caption}
          // A row needs a photo, which only the dropzone provides.
          hideAdd
          create={() => ({ ...value[0], id: newId("amg"), caption: "" })}
          renderItem={(item, { index, update: patch }) => (
            <div className="flex items-center gap-3">
              <AssetImage asset={item.image} alt="" className="h-9 w-12 shrink-0 rounded-md border" />
              <label htmlFor={`${baseId}-${item.id}`} className="sr-only">
                Caption for photo {index + 1}
              </label>
              <Input
                id={`${baseId}-${item.id}`}
                className="h-9"
                value={item.caption}
                placeholder="Caption, e.g. Clubhouse"
                onChange={(e) => patch({ caption: e.target.value })}
              />
            </div>
          )}
        />
      )}
      <Dropzone
        ref={dropRef}
        accept={IMAGE_ACCEPT}
        multiple
        busy={pending > 0}
        onFiles={upload}
        title={value.length ? "Drop more photos or browse" : "Drop amenity photos or browse"}
        ariaLabel="Add amenity photos: drop files or browse"
        className={value.length ? "py-4" : "py-8"}
      />
      {error && (
        <div role="alert">
          <FieldMessage kind="error">{error}</FieldMessage>
        </div>
      )}
    </>
  )
}
