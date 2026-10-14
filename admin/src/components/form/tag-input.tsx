// Adapted from 21st.dev: mohammadshehadeh/tag-input (Hirael, MIT) (demo 28488)
"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { FieldMessage } from "./field-row"

const SPLIT = /[,\n\t]+/

/**
 * Chip input. Enter or comma commits, paste "a, b, c" splits, Backspace on an empty draft removes the
 * last chip. Case-insensitive de-dupe, trims whitespace.
 */
export function TagInput({
  value,
  onChange,
  id,
  placeholder = "Type and press Enter",
  maxTags,
  validate,
  invalid,
  disabled,
  className,
  "aria-describedby": describedBy,
}: {
  value: string[]
  onChange: (next: string[]) => void
  id?: string
  placeholder?: string
  maxTags?: number
  /** Return an error message to reject a tag. */
  validate?: (tag: string, current: string[]) => string | null
  invalid?: boolean
  disabled?: boolean
  className?: string
  "aria-describedby"?: string
}) {
  const [draft, setDraft] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const errorId = React.useId()

  function add(raw: string[]) {
    const next = [...value]
    let err: string | null = null
    for (const part of raw) {
      const tag = part.trim().replace(/\s+/g, " ")
      if (!tag) continue
      if (maxTags !== undefined && next.length >= maxTags) {
        err = `Up to ${maxTags} items.`
        break
      }
      if (next.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        err = `"${tag}" is already in the list.`
        continue
      }
      const msg = validate?.(tag, next)
      if (msg) {
        err = msg
        continue
      }
      next.push(tag)
    }
    if (next.length !== value.length) onChange(next)
    setError(err)
    return next.length !== value.length || !err
  }

  function commitDraft() {
    if (draft.trim() && add([draft])) setDraft("")
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        data-slot="tag-input"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault()
            inputRef.current?.focus()
          }
        }}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-1.5 py-1 text-sm transition-colors dark:bg-input/30",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring",
          (invalid || error) && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex h-6 max-w-full items-center gap-1 rounded-md bg-secondary pr-0.5 pl-2 text-[13px] text-secondary-foreground"
          >
            <span className="min-w-0 truncate">{tag}</span>
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => remove(i)}
                className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden className="size-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : undefined}
          aria-invalid={invalid || !!error || undefined}
          aria-describedby={[describedBy, error && errorId].filter(Boolean).join(" ") || undefined}
          onChange={(e) => {
            setDraft(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              if (draft.trim() || e.key === ",") e.preventDefault()
              commitDraft()
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              e.preventDefault()
              remove(value.length - 1)
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text")
            if (!SPLIT.test(text)) return
            e.preventDefault()
            add(text.split(SPLIT))
          }}
          onBlur={commitDraft}
          className="h-7 min-w-24 flex-1 bg-transparent px-1.5 text-base outline-none md:text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      {error && (
        <FieldMessage id={errorId} kind="error">
          {error}
        </FieldMessage>
      )}
    </div>
  )
}
