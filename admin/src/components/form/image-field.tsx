// Adapted from 21st.dev: wensity/file-uploader (demo 31348)
"use client"

import * as React from "react"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { saveUpload } from "@/lib/media-store"
import type { Asset } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AssetImage } from "./asset-image"
import { Dropzone, IMAGE_ACCEPT, LOCAL_UPLOAD_HINT, screenFiles, uploadErrorMessage } from "./dropzone"
import { FieldMessage, FieldRow, LabelMark } from "./field-row"
import { SampleBadge } from "./hints"

const ACCEPT = IMAGE_ACCEPT

/** Focus stays with the field when the control that had it is swapped out (no fall to <body>). */
export function focusLater(ref: React.RefObject<HTMLElement | null>) {
  requestAnimationFrame(() => ref.current?.focus())
}

/** True when focus is inside `root` or nowhere (so moving it won't steal it from another field). */
export const focusIsWithin = (root: HTMLElement | null) =>
  document.activeElement === document.body || !!root?.contains(document.activeElement)

/** Single image: drop or browse when empty; preview + Replace / Remove + alt text when set. */
export function ImageField({
  value,
  onChange,
  label,
  mark,
  description,
  aspect = "4 / 3",
  id,
  invalid,
  "aria-describedby": describedBy,
  className,
}: {
  value: Asset | null
  onChange: (next: Asset | null) => void
  label: string
  /** Muted requirement after the label: "Required", "Optional". */
  mark?: React.ReactNode
  description?: React.ReactNode
  /** CSS aspect-ratio, e.g. "16 / 9". */
  aspect?: string
  id?: string
  /** Forwarded to the drop button (a required image is missing). */
  invalid?: boolean
  "aria-describedby"?: string
  className?: string
}) {
  const autoId = React.useId()
  const baseId = id ?? autoId
  const rootRef = React.useRef<HTMLDivElement>(null)
  const pickerRef = React.useRef<HTMLInputElement>(null)
  const replaceRef = React.useRef<HTMLButtonElement>(null)
  const dropRef = React.useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function upload(files: File[], rejected: string[]) {
    setError(rejected[0] ?? null)
    const file = files[0]
    if (!file) return
    setBusy(true)
    try {
      // ponytail: the replaced upload stays in IndexedDB — Discard can bring it back; GC belongs to save time.
      const asset = await saveUpload(file)
      const keepFocus = focusIsWithin(rootRef.current)
      onChange(asset)
      if (keepFocus) focusLater(replaceRef)
    } catch (e) {
      setError(uploadErrorMessage(e, "image"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={rootRef} className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span id={`${baseId}-label`} className="flex items-center gap-2 text-sm leading-5 font-medium">
          {label}
          {mark && <LabelMark mark={mark} />}
        </span>
        {value?.source === "generated" && <SampleBadge />}
      </div>

      {!value ? (
        <Dropzone
          ref={dropRef}
          accept={ACCEPT}
          busy={busy}
          onFiles={upload}
          title="Drop an image or browse"
          ariaLabel={`${label}: drop an image or browse`}
          invalid={invalid}
          aria-describedby={describedBy}
          className="py-10"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border" style={{ aspectRatio: aspect }}>
            <AssetImage asset={value} alt={value.alt || label} className="size-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={pickerRef}
              type="file"
              accept={ACCEPT}
              tabIndex={-1}
              aria-hidden
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) {
                  const { ok, rejected } = screenFiles([e.target.files[0]], ACCEPT)
                  void upload(ok, rejected)
                }
                e.target.value = ""
              }}
            />
            <Button
              ref={replaceRef}
              type="button"
              variant="outline"
              disabled={busy}
              aria-describedby={describedBy}
              onClick={() => pickerRef.current?.click()}
            >
              {busy ? <Loader2 aria-hidden className="animate-spin" /> : <RefreshCw aria-hidden />}
              {busy ? "Saving…" : "Replace"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                setError(null)
                onChange(null)
                focusLater(dropRef)
              }}
            >
              <Trash2 aria-hidden />
              Remove
            </Button>
            {value.source === "upload" && <span className="text-xs text-muted-foreground">{LOCAL_UPLOAD_HINT}</span>}
          </div>
          <FieldRow className="max-w-md" label="Alt text" optional htmlFor={`${baseId}-alt`}>
            <Input
              id={`${baseId}-alt`}
              className="h-9"
              value={value.alt ?? ""}
              placeholder="Describe the image for screen readers"
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
            />
          </FieldRow>
        </div>
      )}

      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && (
        <div role="alert">
          <FieldMessage kind="error">{error}</FieldMessage>
        </div>
      )}
    </div>
  )
}
