// Adapted from 21st.dev: wensity/file-uploader (demo 31348)
"use client"

import * as React from "react"
import { ImageUp, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const MAX_BYTES = 20 * 1024 * 1024

function accepts(file: File, accept: string) {
  return accept.split(",").some((token) => {
    const t = token.trim().toLowerCase()
    if (t.startsWith(".")) return file.name.toLowerCase().endsWith(t)
    if (t.endsWith("/*")) return file.type.startsWith(t.slice(0, -1))
    return file.type === t
  })
}

/** Split picked/dropped files into accepted ones and human-readable rejections. */
export function screenFiles(list: FileList | File[], accept: string) {
  const ok: File[] = []
  const rejected: string[] = []
  for (const file of Array.from(list)) {
    if (!accepts(file, accept)) rejected.push(`${file.name}: file type not supported`)
    else if (file.size > MAX_BYTES) rejected.push(`${file.name}: larger than 20 MB`)
    else ok.push(file)
  }
  return { ok, rejected }
}

export const LOCAL_UPLOAD_HINT = "Uploads stay in this browser until the backend is connected."

/** Why saveUpload failed: a full disk quota is about size; anything else means the browser refuses storage. */
export function uploadErrorMessage(error: unknown, noun = "file") {
  return error instanceof DOMException && error.name === "QuotaExceededError"
    ? `Not enough browser storage for this ${noun}. Try a smaller file.`
    : `This browser blocks storage, so the ${noun} can't be kept. Allow site data for this site, or paste a link instead.`
}

/**
 * Dashed drop target that is also a button (Enter/Space opens the picker).
 */
export function Dropzone({
  accept,
  multiple,
  onFiles,
  busy,
  disabled,
  title,
  hint = LOCAL_UPLOAD_HINT,
  icon,
  ariaLabel,
  id,
  ref,
  invalid,
  "aria-describedby": describedBy,
  className,
}: {
  accept: string
  multiple?: boolean
  onFiles: (files: File[], rejected: string[]) => void
  busy?: boolean
  disabled?: boolean
  title: string
  hint?: React.ReactNode
  icon?: React.ReactNode
  ariaLabel?: string
  id?: string
  ref?: React.Ref<HTMLButtonElement>
  /** Marks the button invalid (a required file is missing and the editor asked for it). */
  invalid?: boolean
  "aria-describedby"?: string
  className?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [over, setOver] = React.useState(false)
  const depth = React.useRef(0)

  function take(list: FileList | null) {
    if (!list?.length || disabled || busy) return
    const { ok, rejected } = screenFiles(multiple ? list : [list[0]], accept)
    onFiles(ok, rejected)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        className="sr-only"
        aria-hidden
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ""
        }}
      />
      <button
        ref={ref}
        id={id}
        type="button"
        disabled={disabled}
        aria-busy={busy || undefined}
        aria-label={ariaLabel}
        // Buttons don't take aria-invalid: the message is in aria-describedby; data-invalid drives the style
        // and lets "focus the first invalid field" find it.
        data-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => !busy && inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          depth.current += 1
          setOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          depth.current = Math.max(0, depth.current - 1)
          if (depth.current === 0) setOver(false)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          depth.current = 0
          setOver(false)
          take(e.dataTransfer.files)
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-input bg-muted/30 px-4 py-6 text-center transition-colors",
          "outline-none hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:opacity-50 data-invalid:border-destructive",
          over && "border-ring bg-accent",
          className,
        )}
      >
        <span aria-hidden className="mb-1 text-muted-foreground [&_svg]:size-5">
          {busy ? <Loader2 className="animate-spin" /> : (icon ?? <ImageUp />)}
        </span>
        <span className="text-sm font-medium text-foreground">
          {busy ? "Saving…" : over ? "Drop to add" : title}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </button>
    </>
  )
}
