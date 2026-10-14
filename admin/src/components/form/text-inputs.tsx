"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { COMPANY, PLACEHOLDER_PHONES } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { FieldMessage } from "./field-row"
import { useDigitCaret } from "./use-digit-caret"

const join = (...ids: (string | false | null | undefined)[]) => ids.filter(Boolean).join(" ") || undefined

/* ---------------- Phone ---------------- */

/** National digits from anything pasted: "+91 97001 23900", "09700123900", "919700123900". */
function nationalDigits(raw: string) {
  let d = raw.replace(/\D/g, "")
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2)
  if (d.length > 10 && d.startsWith("0")) d = d.slice(1)
  return d.slice(0, 10)
}

export function phoneError(digits: string, finished: boolean): string | null {
  if (!digits) return null
  if (PLACEHOLDER_PHONES.includes(`+91${digits}`)) return "+91 98765 43210 is the placeholder from the old website. Enter the real number."
  if (/^[01]/.test(digits)) return "Leave out the leading 0 and the country code."
  if (finished && digits.length < 10) return "Enter all 10 digits."
  return null
}

/** Indian number stored as E.164 ("+919700123900"); shown "+91 97001 23900". Empty → undefined. */
export function PhoneInput({
  value,
  onChange,
  id,
  emptyHint = `Leave empty to use the company number ${COMPANY.phone}.`,
}: {
  value: string | undefined
  onChange: (next: string | undefined) => void
  id?: string
  emptyHint?: React.ReactNode
}) {
  const autoId = React.useId()
  const baseId = id ?? autoId
  const { ref, remember } = useDigitCaret()
  const [blurred, setBlurred] = React.useState(false)
  const digits = value?.startsWith("+91") ? value.slice(3).replace(/\D/g, "") : nationalDigits(value ?? "")
  const error = phoneError(digits, blurred)
  const shown = digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits

  return (
    <div className="flex flex-col gap-1.5">
      <InputGroup className="h-9 max-w-xs">
        <InputGroupAddon>
          <InputGroupText className="text-foreground tabular-nums">+91</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          ref={ref}
          id={baseId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="tabular-nums"
          value={shown}
          placeholder="97001 23900"
          aria-invalid={!!error || undefined}
          aria-describedby={join(error ? `${baseId}-error` : `${baseId}-hint`)}
          onChange={(e) => {
            remember(e)
            setBlurred(false)
            const d = nationalDigits(e.target.value)
            onChange(d ? `+91${d}` : undefined)
          }}
          onBlur={() => setBlurred(true)}
        />
      </InputGroup>
      {error ? (
        <FieldMessage id={`${baseId}-error`} kind="error">
          {error}
        </FieldMessage>
      ) : (
        !digits &&
        emptyHint && (
          <p id={`${baseId}-hint`} className="text-xs text-muted-foreground">
            {emptyHint}
          </p>
        )
      )}
    </div>
  )
}

/* ---------------- Slug ---------------- */

/** "Western County – Shankarpalli" → "western-county-shankarpalli" */
export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** While typing: same rules, but keep a trailing dash so "global-" can become "global-city". */
function slugDraft(input: string) {
  return input
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
}

export function SlugInput({
  value,
  onChange,
  source,
  taken = [],
  originalSlug,
  id,
}: {
  value: string
  onChange: (next: string) => void
  /** Text to generate from (the project name). */
  source?: string
  /** Slugs other projects already use. */
  taken?: readonly string[]
  /** The published slug; changing it breaks the old link. */
  originalSlug?: string
  id?: string
}) {
  const autoId = React.useId()
  const baseId = id ?? autoId
  const generated = source ? slugify(source) : ""
  const error = !value
    ? null
    : taken.includes(value)
      ? "Another project already uses this address."
      : null
  const warn = originalSlug && value && value !== originalSlug

  return (
    <div className="flex flex-col gap-1.5">
      <InputGroup className="h-9">
        <InputGroupAddon>
          <InputGroupText>/property/</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={baseId}
          value={value}
          spellCheck={false}
          autoComplete="off"
          className="pl-0.5"
          placeholder={generated || "global-city-vi"}
          aria-invalid={!!error || undefined}
          aria-describedby={join(`${baseId}-preview`, error && `${baseId}-error`)}
          onChange={(e) => onChange(slugDraft(e.target.value))}
          onBlur={() => value !== slugify(value) && onChange(slugify(value))}
        />
        {generated && generated !== value && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={() => onChange(generated)}>
              <RefreshCw aria-hidden />
              From name
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      <p id={`${baseId}-preview`} className="truncate text-xs text-muted-foreground">
        {COMPANY.website.replace(/^https?:\/\/(www\.)?/, "")}/property/<span className="text-foreground">{value || generated || "…"}</span>
      </p>
      {error && (
        <FieldMessage id={`${baseId}-error`} kind="error">
          {error}
        </FieldMessage>
      )}
      {!error && warn && (
        <FieldMessage kind="warning">Changing the address breaks links to /property/{originalSlug}.</FieldMessage>
      )}
    </div>
  )
}

/* ---------------- Text with counter ---------------- */

/** Min height of a 3-row textarea (the kit's Textarea grows with its content, so `rows` alone doesn't size it). */
export const TEXTAREA_3_ROWS = "min-h-[calc(3lh+1.125rem)]"

/**
 * Textarea (or single-line input) with a "212 / 320" counter. Soft limit: going over is allowed but flagged.
 * Full field width; the textarea is at least `rows` lines tall and grows with its content.
 */
export function CharCount({
  value,
  onChange,
  max,
  id,
  rows = 3,
  multiline = true,
  placeholder,
  invalid,
  className,
  "aria-describedby": describedBy,
}: {
  value: string
  onChange: (next: string) => void
  max: number
  id?: string
  rows?: number
  multiline?: boolean
  placeholder?: string
  invalid?: boolean
  className?: string
  "aria-describedby"?: string
}) {
  const autoId = React.useId()
  const baseId = id ?? autoId
  const over = value.length - max
  const common = {
    id: baseId,
    value,
    placeholder,
    "aria-invalid": invalid || over > 0 || undefined,
    "aria-describedby": join(describedBy, `${baseId}-count`),
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {multiline ? (
        <Textarea
          {...common}
          rows={rows}
          style={{ minHeight: `calc(${rows}lh + 1.125rem)` }}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input {...common} className="h-9" onChange={(e) => onChange(e.target.value)} />
      )}
      <p
        id={`${baseId}-count`}
        className={cn("self-end text-xs tabular-nums", over > 0 ? "text-destructive" : "text-muted-foreground")}
      >
        {over > 0 ? `${over} over the ${max} limit` : `${value.length} / ${max}`}
      </p>
    </div>
  )
}
