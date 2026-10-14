"use client"

import * as React from "react"
import { Building2, Check, Clock, FileText, Paperclip, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ICONS } from "@/lib/constants"
import type { Approval, ApprovalAuthority, ApprovalStatus, LegalDocument } from "@/lib/types"
import { hasDetailPage, reraNumber } from "@/lib/validate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FieldGrid, FieldRow, ListEditor, PdfField, TEXTAREA_3_ROWS, type ListItemHelpers } from "@/components/form"
import { fieldIssues, newId, type SectionProps } from "../section-types"
import { ContentSection, FieldGroup, FieldMessages, FixedRow, SubField, ariaFor } from "./media-section"

const AUTHORITIES: { value: ApprovalAuthority; label: string; icon: LucideIcon; title: string; ref: string }[] = [
  { value: "HMDA", label: "HMDA", icon: ICONS.hmda, title: "HMDA Layout Approval", ref: "LP number" },
  { value: "DTCP", label: "DTCP", icon: ICONS.dtcp, title: "DTCP Layout Approval", ref: "LP number" },
  { value: "RERA", label: "RERA", icon: ICONS.rera, title: "RERA Registration", ref: "e.g. P01100009270" },
  { value: "GramPanchayat", label: "Gram Panchayat", icon: Building2, title: "Gram Panchayat Approval", ref: "Permit number" },
  { value: "Bank", label: "Bank", icon: ICONS.bank, title: "Bank Approved", ref: "Bank name" },
  { value: "Title", label: "Clear title", icon: ICONS.clearTitle, title: "Clear Title", ref: "Reference" },
  { value: "Other", label: "Other", icon: FileText, title: "", ref: "Reference" },
]
const AUTHORITY = Object.fromEntries(AUTHORITIES.map((a) => [a.value, a])) as Record<
  ApprovalAuthority,
  (typeof AUTHORITIES)[number]
>

// Neutral on purpose: inventory status colours belong to plots. Done = filled + check, waiting = outline + clock.
const STATUSES: { value: ApprovalStatus; label: string; done: boolean }[] = [
  { value: "approved", label: "Approved", done: true },
  { value: "registered", label: "Registered", done: true },
  { value: "verified", label: "Verified", done: true },
  { value: "applied", label: "Applied", done: false },
  { value: "pending", label: "Pending", done: false },
]

function StatusPill({ status }: { status: (typeof STATUSES)[number] }) {
  const Icon = status.done ? Check : Clock
  return (
    <span
      className={cn(
        "inline-flex h-5.5 w-fit items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        status.done ? "bg-secondary text-secondary-foreground" : "border border-border text-muted-foreground",
      )}
    >
      <Icon aria-hidden className="size-3 shrink-0 text-muted-foreground" />
      {status.label}
    </span>
  )
}

export function LegalSection({ draft, issues, update }: SectionProps) {
  const l = draft.legal
  const base = `${draft.id}--legal`
  const description = fieldIssues(issues, "legal.description")
  const approvals = fieldIssues(issues, "legal.approvals")
  const rera = reraNumber(draft)

  function newApproval(): Approval {
    const hasRera = l.approvals.some((a) => a.authority === "RERA")
    const authority: ApprovalAuthority = hasRera ? "HMDA" : "RERA"
    return {
      id: newId("ap"),
      authority,
      title: AUTHORITY[authority].title,
      status: authority === "RERA" ? "registered" : "approved",
    }
  }

  return (
    <ContentSection
      draft={draft}
      section="legal"
      title="Legal"
      description={
        hasDetailPage(draft)
          ? "Approvals and documents buyers check before they invest."
          : "Approvals drive the Approved badge on the listing card."
      }
      issues={issues}
      shown={["legal.title", "legal.description", "legal.approvals", "legal.documents"]}
    >
      <FieldGrid>
        <FieldRow label="Title" optional htmlFor={`${base}-title`} description="Leave empty to use the default.">
          <Input
            id={`${base}-title`}
            className="h-9"
            value={l.title}
            placeholder="Legal Approvals & Documentation"
            onChange={(e) =>
              update((d) => {
                d.legal.title = e.target.value
              })
            }
            {...ariaFor(`${base}-title`, { description: true })}
          />
        </FieldRow>
        <FixedRow label="Label above the title">Legal</FixedRow>
      </FieldGrid>

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
          value={l.description}
          placeholder="Complete peace of mind with all necessary approvals and legal documentation in place. Invest with confidence."
          onChange={(e) =>
            update((d) => {
              d.legal.description = e.target.value
            })
          }
          {...ariaFor(`${base}-description`, { description: true, ...description })}
        />
      </FieldRow>

      <FieldGroup
        id={`${base}-approvals`}
        label="Approvals"
        level={draft.lifecycle === "ongoing" ? "R" : "W"}
        count={l.approvals.length ? l.approvals.length : undefined}
        description={
          <>
            The RERA number in the website hero comes from the RERA approval
            {rera ? (
              <>
                : <span className="text-foreground tabular-nums">{rera}</span>.
              </>
            ) : (
              ". None is listed yet."
            )}
          </>
        }
        {...approvals}
      >
        <ListEditor
          value={l.approvals}
          itemLabel={(a) => a.title || AUTHORITY[a.authority].label}
          onChange={(next) =>
            update((d) => {
              d.legal.approvals = next
            })
          }
          create={newApproval}
          noun="approval"
          emptyTitle="No approvals yet"
          emptyDescription="Add the HMDA or DTCP layout approval and the RERA registration."
          renderItem={(item, helpers) => (
            <ApprovalRow
              baseId={`${base}-a-${item.id}`}
              item={item}
              helpers={helpers}
              issue={fieldIssues(issues, `legal.approvals.${item.id}`)}
            />
          )}
        />
      </FieldGroup>

      <FieldGroup
        id={`${base}-documents`}
        label="Documents"
        level="O"
        count={l.documents.length ? l.documents.length : undefined}
        description="Listed by name. Attach a PDF if buyers should be able to download it."
      >
        <ListEditor
          value={l.documents}
          itemLabel={(d) => d.name}
          onChange={(next) =>
            update((d) => {
              d.legal.documents = next
            })
          }
          create={() => ({ id: newId("doc"), name: "", available: true })}
          noun="document"
          emptyTitle="No documents yet"
          emptyDescription="For example the layout approval, RERA certificate, layout copy and link documents."
          renderItem={(item, helpers) => (
            <DocumentRow baseId={`${base}-d-${item.id}`} item={item} helpers={helpers} />
          )}
        />
      </FieldGroup>

      <FixedRow label="Documents heading">Available Legal Documents</FixedRow>
    </ContentSection>
  )
}

function ApprovalRow({
  baseId: id,
  item,
  helpers: { update: patch },
  issue,
}: {
  baseId: string
  item: Approval
  helpers: ListItemHelpers<Approval>
  issue: ReturnType<typeof fieldIssues>
}) {
  const auth = AUTHORITY[item.authority]

  function setAuthority(next: ApprovalAuthority) {
    const change: Partial<Approval> = { authority: next }
    // Keep a typed title; replace an empty one or the previous authority's default.
    if (!item.title.trim() || item.title === auth.title) change.title = AUTHORITY[next].title
    if (next === "RERA" && item.status === "approved") change.status = "registered"
    patch(change)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <SubField label="Authority" htmlFor={`${id}-authority`}>
          <Select value={item.authority} onValueChange={(v) => setAuthority(v as ApprovalAuthority)}>
            <SelectTrigger id={`${id}-authority`} className="w-full data-[size=default]:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTHORITIES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  <a.icon aria-hidden className="text-muted-foreground" />
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SubField>
        <SubField label="Title" htmlFor={`${id}-title`}>
          <Input
            id={`${id}-title`}
            className="h-9"
            value={item.title}
            placeholder={auth.title || "Approval name"}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </SubField>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SubField label="Reference" htmlFor={`${id}-reference`}>
          <Input
            id={`${id}-reference`}
            className="h-9 tabular-nums"
            spellCheck={false}
            autoComplete="off"
            value={item.reference ?? ""}
            placeholder={auth.ref}
            onChange={(e) => patch({ reference: e.target.value || undefined })}
          />
        </SubField>
        <SubField label="Date" htmlFor={`${id}-date`}>
          <Input
            id={`${id}-date`}
            type="date"
            className="h-9 tabular-nums"
            value={item.date ?? ""}
            onChange={(e) => patch({ date: e.target.value || undefined })}
          />
        </SubField>
        <SubField label="Status" htmlFor={`${id}-status`}>
          <Select value={item.status} onValueChange={(v) => patch({ status: v as ApprovalStatus })}>
            <SelectTrigger id={`${id}-status`} className="w-full data-[size=default]:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <StatusPill status={s} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SubField>
      </div>

      <SubField label="Description" htmlFor={`${id}-description`}>
        <Input
          id={`${id}-description`}
          className="h-9"
          value={item.description ?? ""}
          placeholder="e.g. Survey numbers covered"
          onChange={(e) => patch({ description: e.target.value || undefined })}
        />
      </SubField>

      <FieldMessages id={id} {...issue} />
    </div>
  )
}

function DocumentRow({
  baseId: id,
  item,
  helpers: { update: patch },
}: {
  baseId: string
  item: LegalDocument
  helpers: ListItemHelpers<LegalDocument>
}) {
  const [attaching, setAttaching] = React.useState(false)
  const showFile = !!item.file || attaching

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <SubField label="Name" htmlFor={`${id}-name`} className="min-w-48 flex-1">
          <Input
            id={`${id}-name`}
            className="h-9"
            value={item.name}
            placeholder="RERA Registration Certificate"
            onChange={(e) => patch({ name: e.target.value })}
          />
        </SubField>
        <div className="flex h-9 items-center gap-2">
          <Switch
            id={`${id}-available`}
            checked={item.available}
            onCheckedChange={(checked) => patch({ available: checked })}
          />
          <Label htmlFor={`${id}-available`} className="font-normal">
            Listed on page
          </Label>
        </div>
        {!showFile && (
          <Button type="button" variant="ghost" className="h-9" onClick={() => setAttaching(true)}>
            <Paperclip aria-hidden />
            Attach PDF
          </Button>
        )}
      </div>
      {showFile && (
        <div className="flex flex-col gap-1.5">
          <PdfField
            id={`${id}-file`}
            label="File"
            value={item.file ?? null}
            onChange={(file) => {
              patch({ file: file ?? undefined })
              if (!file) setAttaching(false)
            }}
          />
          {!item.file && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit text-muted-foreground"
              onClick={() => setAttaching(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
