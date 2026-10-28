"use client"

import * as React from "react"
import { CircleAlert, CircleDashed, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * One field's validation messages. `todo` is a required gap nobody has been asked to fix yet: red like an error but
 * with its own icon and no aria-invalid, until a publish attempt or a blur turns it into `error`.
 */
export type FieldIssueProps = {
  error?: string | null
  warning?: string | null
  todo?: string | null
  /** Validator field key; blurring the row marks it touched (see FieldTouchContext). */
  issueField?: string
}

/** Provided by the editor: marks a validator field as visited, so its required gap turns red. */
export const FieldTouchContext = React.createContext<((field: string) => void) | null>(null)

/** Ids FieldRow renders for its helper and message lines; pass to the control's aria-describedby. */
export function describedBy(
  id: string,
  opts: { description?: boolean; error?: unknown; todo?: unknown; warning?: unknown },
) {
  const message = opts.error || opts.todo || opts.warning
  return [opts.description && `${id}-description`, message && `${id}-error`].filter(Boolean).join(" ") || undefined
}

const MESSAGE_ICON = { error: CircleAlert, todo: CircleDashed, warning: TriangleAlert }

/** One message line: icon + text, so the kind reads without colour. An unfilled required field (todo) is red too. */
export function FieldMessage({
  id,
  kind,
  className,
  children,
}: {
  id?: string
  kind: "error" | "todo" | "warning"
  className?: string
  children: React.ReactNode
}) {
  const Icon = MESSAGE_ICON[kind]
  return (
    <p
      id={id}
      className={cn(
        "flex gap-1.5 text-xs",
        kind === "warning" ? "text-warning" : "text-destructive",
        className,
      )}
    >
      <Icon aria-hidden className="mt-px size-3.5 shrink-0" />
      <span className="min-w-0">
        {kind === "todo" && "To do before publishing: "}
        {children}
      </span>
    </p>
  )
}

/** The field's most important message (error, then todo, then warning) with id `${id}-error`, or nothing. */
export function FieldMessages({ id, error, todo, warning }: { id?: string } & FieldIssueProps) {
  const kind = error ? "error" : todo ? "todo" : warning ? "warning" : null
  if (!kind) return null
  return (
    <FieldMessage id={id && `${id}-error`} kind={kind}>
      {error || todo || warning}
    </FieldMessage>
  )
}

/** onBlur for a field wrapper: touches `field` once focus leaves the whole wrapper. */
export function useTouchOnBlur(field: string | undefined) {
  const touch = React.useContext(FieldTouchContext)
  if (!touch || !field) return undefined
  return (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) touch(field)
  }
}

/**
 * The requirement after a field's label. "Required" is a red star right after the label (the word stays for screen
 * readers); "Optional" / "Recommended" are muted words. Labels are flex with gap-2, hence the pull-in.
 */
export function LabelMark({ mark }: { mark: React.ReactNode }) {
  if (mark === "Required")
    return (
      <span title="Required" className="-ms-1.5 font-semibold text-destructive">
        <span aria-hidden>*</span>
        <span className="sr-only">Required</span>
      </span>
    )
  return <span className="font-normal text-muted-foreground">{mark}</span>
}

/**
 * Label above the control (6px), helper 12px muted below, then one message line.
 * `required` / `optional` / `mark` sit inline after the label (LabelMark); `aside` sits at the right end of the label row.
 */
export function FieldRow({
  label,
  htmlFor,
  description,
  error,
  warning,
  todo,
  issueField,
  required,
  optional,
  mark,
  aside,
  className,
  children,
}: {
  label: React.ReactNode
  htmlFor?: string
  description?: React.ReactNode
  /** Needed to publish: a red star after the label. */
  required?: boolean
  optional?: boolean
  /** Requirement shown after the label instead of "Optional": "Required", "Recommended". */
  mark?: React.ReactNode
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
} & FieldIssueProps) {
  const onBlur = useTouchOnBlur(issueField)
  const shown = required ? "Required" : mark || (optional && "Optional")
  return (
    <div data-slot="field-row" onBlur={onBlur} className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={htmlFor} className="leading-5">
          {label}
          {shown && <LabelMark mark={shown} />}
        </Label>
        {aside}
      </div>
      {children}
      {description && (
        <p id={htmlFor && `${htmlFor}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <FieldMessages id={htmlFor} error={error} todo={todo} warning={warning} />
    </div>
  )
}

/** Two short fields side by side from `sm` up (price + unit, area + unit). */
export function FieldGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)} {...props} />
}
